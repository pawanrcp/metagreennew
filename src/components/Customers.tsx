import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  MapPin, 
  Sun, 
  Zap, 
  Calendar, 
  Edit2, 
  Trash2, 
  ShieldCheck, 
  CheckCircle2, 
  FileText, 
  Download, 
  Filter, 
  UserCheck, 
  Building2, 
  X, 
  Check, 
  Sparkles,
  ExternalLink,
  Archive,
  Eye,
  Calculator,
  Receipt,
  Package,
  Boxes,
  Store,
  Truck,
  Tag,
  Layers
} from 'lucide-react';
import { collection, query, onSnapshot, orderBy, addDoc, serverTimestamp, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { useAuth } from '@/src/context/AuthContext';
import { useToast } from '@/src/context/ToastContext';
import { useLogos } from '@/src/context/LogoContext';
import { cn, formatCurrency } from '@/src/lib/utils';
import { ViewType, GeneratedDocument, CustomerType, CustomerRecord } from '@/src/types';
import { downloadDocumentPDF } from '@/src/services/generatedDocuments.service';

export type { CustomerType, CustomerRecord };

interface CustomersProps {
  onNavigate?: (view: ViewType, filter?: string) => void;
  initialFilter?: string;
}

export default function Customers({ onNavigate, initialFilter }: CustomersProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { logos } = useLogos();

  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState(initialFilter || '');
  const [selectedRoofFilter, setSelectedRoofFilter] = useState('ALL');
  const [selectedStateFilter, setSelectedStateFilter] = useState('ALL');
  const [customerTypeFilter, setCustomerTypeFilter] = useState<'ALL' | 'Normal Customer' | 'Vendor Related Stock'>('ALL');
  const [selectedVendorFilter, setSelectedVendorFilter] = useState(initialFilter || 'ALL');

  useEffect(() => {
    if (initialFilter) {
      setSearchTerm(initialFilter);
      setSelectedVendorFilter(initialFilter);
    }
  }, [initialFilter]);
  const [vendorsList, setVendorsList] = useState<{ id: string; name: string; category?: string }[]>([]);
  const [isCustomVendor, setIsCustomVendor] = useState(false);
  const [customerFilterMode, setCustomerFilterMode] = useState<'all' | 'highest-capacity' | 'highest-value' | 'linked-projects'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [docsList, setDocsList] = useState<GeneratedDocument[]>([]);
  const [selectedCustomerForDocs, setSelectedCustomerForDocs] = useState<CustomerRecord | null>(null);
  const [inspectingDoc, setInspectingDoc] = useState<GeneratedDocument | null>(null);
  const [roofTypes, setRoofTypes] = useState<string[]>([
    'RCC Flat Roof',
    'Tin / Metal Shed',
    'Tiled / Mangalore Roof',
    'Asbestos Sheet',
    'Ground Mount Structure',
    'Elevated Super Structure'
  ]);

  const [formData, setFormData] = useState<Partial<CustomerRecord>>({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    district: '',
    state: 'Andhra Pradesh',
    pincode: '',
    sanctionedLoad: '5',
    roofType: 'RCC Flat Roof',
    systemCapacityKw: 5,
    totalProjectValue: 350000,
    notes: '',
    status: 'Active' as 'Active' | 'Lead' | 'Installed' | 'Archived',
    customerType: 'Normal Customer',
    vendorId: '',
    vendorName: '',
    stockCategory: 'Solar Panels (Mono/Poly PV)',
    vendorStockRef: '',
    vendorStockNotes: ''
  });

  const isGlobalAdmin = !user || user.role === 'Super Admin' || user.role === 'Solar Company Admin';
  const isInstaller = (user?.role as any) === 'Installer' || (user?.role as any) === 'Site Surveyor' || (user?.role as any) === 'Technician' || user?.role === 'Solar Installer' || user?.role === 'Survey Engineer';
  const isVendor = user?.role === 'Vendor';

  // 1. Fetch Customers Collection
  useEffect(() => {
    const qCustomers = query(collection(db, 'customers'), orderBy('createdAt', 'desc'));
    const unsubCustomers = onSnapshot(qCustomers, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CustomerRecord));
      setCustomers(docs);
    });

    // 2. Also listen to Roof Types Master
    const unsubRoofs = onSnapshot(collection(db, 'roofTypes'), (snapshot) => {
      if (!snapshot.empty) {
        const types = snapshot.docs.map(d => d.data().name).filter(Boolean);
        if (types.length > 0) {
          setRoofTypes(Array.from(new Set([...types])));
        }
      }
    });

    // 3. Listen to Projects to show project count
    const unsubProjects = onSnapshot(collection(db, 'projects'), (snapshot) => {
      setProjectsList(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 4. Listen to Generated Documents
    const unsubDocs = onSnapshot(query(collection(db, 'generatedDocuments'), orderBy('createdAt', 'desc')), (snapshot) => {
      setDocsList(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as GeneratedDocument)));
    });

    // 5. Listen to Vendors Collection
    const qVendors = query(collection(db, 'vendors'), orderBy('name', 'asc'));
    const unsubVendors = onSnapshot(qVendors, (snapshot) => {
      const vDocs = snapshot.docs.map(d => ({
        id: d.id,
        name: (d.data().name || 'Vendor').trim(),
        category: d.data().category || d.data().categories?.[0] || 'Solar Supplier'
      }));
      setVendorsList(prev => {
        const existingNames = new Set(vDocs.map(v => v.name.toLowerCase()));
        const preserved = prev.filter(p => !existingNames.has(p.name.toLowerCase()));
        return [...vDocs, ...preserved];
      });
    });

    // 6. Listen to Registered Users with Vendor Roles
    const unsubUsers = onSnapshot(query(collection(db, 'users')), (snapshot) => {
      const regVendors = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() } as any))
        .filter(u => u.role === 'Vendor' || u.role === 'Solar Supplier' || u.role === 'Vendor Employee')
        .map(u => ({
          id: u.id,
          name: (u.companyName || u.name || 'Vendor Partner').trim(),
          category: 'Registered Vendor'
        }));
      setVendorsList(prev => {
        const existingNames = new Set(prev.map(v => v.name.toLowerCase()));
        const newOnes = regVendors.filter(rv => !existingNames.has(rv.name.toLowerCase()));
        return [...prev, ...newOnes];
      });
    });

    return () => {
      unsubCustomers();
      unsubRoofs();
      unsubProjects();
      unsubDocs();
      unsubVendors();
      unsubUsers();
    };
  }, []);

  // Strict Role-Based Customer Filtering
  const roleScopedCustomers = customers.filter(c => {
    if (isGlobalAdmin) return true;

    const uId = user?.uid || '';
    const uEmail = (user?.email || '').toLowerCase();
    const uName = (user?.name || '').toLowerCase();
    const uCompany = (user?.companyName || '').toLowerCase();

    if (isInstaller) {
      return (
        c.creatorId === uId ||
        c.createdBy === uEmail ||
        c.installerId === uId ||
        (c.assignedTo && c.assignedTo.toLowerCase().includes(uName)) ||
        projectsList.some(p => (p.installerId === uId || p.createdBy === uEmail) && p.customerName?.toLowerCase() === c.name.toLowerCase())
      );
    }

    if (isVendor) {
      return (
        c.creatorId === uId ||
        c.createdBy === uEmail ||
        (c.assignedTo && c.assignedTo.toLowerCase().includes(uCompany)) ||
        (c.vendorName && c.vendorName.toLowerCase().includes(uCompany)) ||
        (c.notes && c.notes.toLowerCase().includes(uCompany))
      );
    }

    return (
      c.creatorId === uId ||
      c.createdBy === uEmail ||
      (c.assignedTo && c.assignedTo.toLowerCase().includes(uName))
    );
  });

  const normalCustomersCount = useMemo(() => {
    return roleScopedCustomers.filter(c => (c.customerType || 'Normal Customer') === 'Normal Customer').length;
  }, [roleScopedCustomers]);

  const vendorStockCustomersCount = useMemo(() => {
    return roleScopedCustomers.filter(c => c.customerType === 'Vendor Related Stock').length;
  }, [roleScopedCustomers]);

  const normalCustomersCapacity = useMemo(() => {
    return roleScopedCustomers
      .filter(c => (c.customerType || 'Normal Customer') === 'Normal Customer')
      .reduce((sum, c) => sum + (Number(c.systemCapacityKw) || 0), 0);
  }, [roleScopedCustomers]);

  const vendorStockCapacity = useMemo(() => {
    return roleScopedCustomers
      .filter(c => c.customerType === 'Vendor Related Stock')
      .reduce((sum, c) => sum + (Number(c.systemCapacityKw) || 0), 0);
  }, [roleScopedCustomers]);

  const uniqueVendorsFromCustomers = useMemo(() => {
    const set = new Set<string>();
    customers.forEach(c => {
      if (c.vendorName?.trim()) set.add(c.vendorName.trim());
    });
    vendorsList.forEach(v => {
      if (v.name?.trim()) set.add(v.name.trim());
    });
    return Array.from(set).sort();
  }, [customers, vendorsList]);

  const filteredCustomers = useMemo(() => {
    let list = roleScopedCustomers.filter(c => {
      const cType = c.customerType || 'Normal Customer';

      if (customerTypeFilter !== 'ALL' && cType !== customerTypeFilter) {
        return false;
      }

      if (selectedVendorFilter !== 'ALL') {
        const matchesVendor = (c.vendorName && c.vendorName.toLowerCase() === selectedVendorFilter.toLowerCase()) ||
          (c.vendorId && c.vendorId === selectedVendorFilter);
        if (!matchesVendor) return false;
      }

      const matchesSearch = 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.city || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.address || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.vendorName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.stockCategory || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.vendorStockRef || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        cType.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRoof = selectedRoofFilter === 'ALL' || c.roofType === selectedRoofFilter;
      const matchesState = selectedStateFilter === 'ALL' || c.state === selectedStateFilter;

      if (!matchesSearch || !matchesRoof || !matchesState) return false;

      if (customerFilterMode === 'linked-projects') {
        const hasProject = projectsList.some(p => 
          (p.customerName && p.customerName.toLowerCase() === c.name.toLowerCase()) ||
          (p.phone && c.phone && p.phone.replace(/\D/g, '').endsWith(c.phone.replace(/\D/g, '').slice(-10)))
        );
        if (!hasProject) return false;
      }

      return true;
    });

    if (customerFilterMode === 'highest-capacity') {
      list = [...list].sort((a, b) => (Number(b.systemCapacityKw) || 0) - (Number(a.systemCapacityKw) || 0));
    } else if (customerFilterMode === 'highest-value') {
      list = [...list].sort((a, b) => (Number(b.totalProjectValue) || 0) - (Number(a.totalProjectValue) || 0));
    }

    return list;
  }, [roleScopedCustomers, searchTerm, customerTypeFilter, selectedVendorFilter, selectedRoofFilter, selectedStateFilter, customerFilterMode, projectsList]);

  const handleSubmitCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.phone?.trim()) {
      toast.warning("Customer Name and Phone are required.", "Missing Fields");
      return;
    }

    if (formData.customerType === 'Vendor Related Stock' && !formData.vendorName?.trim()) {
      toast.warning("Please specify the Vendor / Supplier for this vendor stock customer.", "Vendor Required");
      return;
    }

    try {
      const isVendorStock = formData.customerType === 'Vendor Related Stock';
      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email?.trim() || '',
        address: formData.address?.trim() || '',
        city: formData.city?.trim() || '',
        district: formData.district?.trim() || '',
        state: formData.state?.trim() || '',
        pincode: formData.pincode?.trim() || '',
        sanctionedLoad: formData.sanctionedLoad || '5',
        roofType: formData.roofType || 'RCC Flat Roof',
        systemCapacityKw: Number(formData.systemCapacityKw) || 0,
        totalProjectValue: Number(formData.totalProjectValue) || 0,
        notes: formData.notes?.trim() || '',
        status: formData.status || 'Active',
        customerType: formData.customerType || 'Normal Customer',
        vendorId: isVendorStock ? (formData.vendorId || '') : '',
        vendorName: isVendorStock ? (formData.vendorName?.trim() || '') : '',
        stockCategory: isVendorStock ? (formData.stockCategory || '') : '',
        vendorStockRef: isVendorStock ? (formData.vendorStockRef?.trim() || '') : '',
        vendorStockNotes: isVendorStock ? (formData.vendorStockNotes?.trim() || '') : '',
        creatorId: user?.uid || 'admin',
        createdBy: user?.email || 'admin',
        assignedTo: user?.name || user?.companyName || 'Solar Team',
        installerId: isInstaller ? (user?.uid || '') : '',
        updatedAt: serverTimestamp()
      };

      if (editingCustomerId) {
        await updateDoc(doc(db, 'customers', editingCustomerId), payload);
        toast.success(`Customer "${formData.name}" updated successfully!`, "Customer Updated");
      } else {
        await addDoc(collection(db, 'customers'), {
          ...payload,
          createdAt: serverTimestamp()
        });
        toast.success(`Customer "${formData.name}" registered successfully!`, "Customer Created");
      }

      setIsModalOpen(false);
      setEditingCustomerId(null);
      setIsCustomVendor(false);
      setFormData({
        name: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        district: '',
        state: 'Andhra Pradesh',
        pincode: '',
        sanctionedLoad: '5',
        roofType: 'RCC Flat Roof',
        systemCapacityKw: 5,
        totalProjectValue: 350000,
        notes: '',
        status: 'Active',
        customerType: 'Normal Customer',
        vendorId: '',
        vendorName: '',
        stockCategory: 'Solar Panels (Mono/Poly PV)',
        vendorStockRef: '',
        vendorStockNotes: ''
      });
    } catch (err: any) {
      console.error('Error saving customer:', err);
      toast.error('Failed to save customer: ' + (err.message || err));
    }
  };

  const handleEdit = (c: CustomerRecord) => {
    setEditingCustomerId(c.id);
    const isCustom = Boolean(c.vendorName) && !vendorsList.some(v => v.name.toLowerCase() === (c.vendorName || '').toLowerCase());
    setIsCustomVendor(isCustom);
    setFormData({
      name: c.name || '',
      phone: c.phone || '',
      email: c.email || '',
      address: c.address || '',
      city: c.city || '',
      district: c.district || '',
      state: c.state || 'Andhra Pradesh',
      pincode: c.pincode || '',
      sanctionedLoad: c.sanctionedLoad ? String(c.sanctionedLoad) : '5',
      roofType: c.roofType || 'RCC Flat Roof',
      systemCapacityKw: c.systemCapacityKw || 5,
      totalProjectValue: c.totalProjectValue || 350000,
      notes: c.notes || '',
      status: c.status || 'Active',
      customerType: c.customerType || 'Normal Customer',
      vendorId: c.vendorId || '',
      vendorName: c.vendorName || '',
      stockCategory: c.stockCategory || 'Solar Panels (Mono/Poly PV)',
      vendorStockRef: c.vendorStockRef || '',
      vendorStockNotes: c.vendorStockNotes || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete customer "${name}"?`)) {
      try {
        await deleteDoc(doc(db, 'customers', id));
        toast.info(`Customer "${name}" removed.`, "Deleted");
      } catch (err: any) {
        console.error('Error deleting customer:', err);
        toast.error('Failed to delete customer.');
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-sans">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-5 sm:p-6 rounded-3xl shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className={cn(
              "px-3 py-0.5 text-xs font-black rounded-full uppercase tracking-wider flex items-center gap-1.5 border",
              isInstaller ? "bg-teal-500/20 text-teal-300 border-teal-500/40" :
              isVendor ? "bg-amber-500/20 text-amber-300 border-amber-500/40" :
              "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
            )}>
              <ShieldCheck className="w-3.5 h-3.5" />
              {isInstaller ? 'Solar Installer Client Directory' : isVendor ? 'Supplier Customer Scope' : 'Global Customer Database'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <UserCheck className="w-8 h-8 text-emerald-400" /> Customers & Client Accounts
          </h1>
          <p className="text-slate-400 text-xs font-medium mt-1">
            {roleScopedCustomers.length} registered accounts visible to your login ({user?.email || 'admin'})
          </p>
        </div>

        <button
          onClick={() => {
            setEditingCustomerId(null);
            setFormData({
              name: '',
              phone: '',
              email: '',
              address: '',
              city: '',
              district: '',
              state: 'Andhra Pradesh',
              pincode: '',
              sanctionedLoad: '5',
              roofType: roofTypes[0] || 'RCC Flat Roof',
              systemCapacityKw: 5,
              totalProjectValue: 350000,
              notes: '',
              status: 'Active'
            });
            setIsModalOpen(true);
          }}
          className="px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" /> Add New Customer
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* 1. Total Customers */}
        <button
          type="button"
          onClick={() => {
            setCustomerTypeFilter('ALL');
            setSelectedVendorFilter('ALL');
            setCustomerFilterMode('all');
            setSearchTerm('');
            setSelectedRoofFilter('ALL');
            setSelectedStateFilter('ALL');
          }}
          className={cn(
            "p-4 sm:p-5 rounded-2xl border text-left transition-all cursor-pointer shadow-xs hover:shadow-md hover:-translate-y-0.5 group",
            customerTypeFilter === 'ALL' && customerFilterMode === 'all'
              ? "bg-slate-900 text-white border-slate-900 ring-2 ring-slate-900/30"
              : "bg-white text-slate-900 border-slate-200 hover:border-slate-400"
          )}
          title="Click to view all customer accounts and reset filters"
        >
          <span className={cn("text-[10px] sm:text-[11px] font-black uppercase tracking-wider block mb-1", customerTypeFilter === 'ALL' && customerFilterMode === 'all' ? "text-slate-300" : "text-slate-400")}>
            Total Accounts
          </span>
          <h3 className="text-xl sm:text-2xl font-black">{roleScopedCustomers.length}</h3>
          <span className={cn("text-[10px] sm:text-[11px] font-semibold mt-1 block", customerTypeFilter === 'ALL' && customerFilterMode === 'all' ? "text-emerald-300" : "text-emerald-600")}>
            {customerTypeFilter === 'ALL' && customerFilterMode === 'all' ? 'Showing All' : 'Click to show all'}
          </span>
        </button>

        {/* 2. Normal Customers */}
        <button
          type="button"
          onClick={() => {
            setCustomerTypeFilter('Normal Customer');
            setSelectedVendorFilter('ALL');
            setCustomerFilterMode('all');
          }}
          className={cn(
            "p-4 sm:p-5 rounded-2xl border text-left transition-all cursor-pointer shadow-xs hover:shadow-md hover:-translate-y-0.5 group",
            customerTypeFilter === 'Normal Customer'
              ? "bg-emerald-700 text-white border-emerald-700 ring-2 ring-emerald-500/50"
              : "bg-white text-slate-900 border-slate-200 hover:border-emerald-400"
          )}
          title="Click to filter Normal / Direct retail solar customers"
        >
          <div className="flex items-center justify-between mb-1">
            <span className={cn("text-[10px] sm:text-[11px] font-black uppercase tracking-wider block", customerTypeFilter === 'Normal Customer' ? "text-emerald-100" : "text-emerald-700")}>
              Normal Customers
            </span>
            <UserCheck className={cn("w-3.5 h-3.5", customerTypeFilter === 'Normal Customer' ? "text-emerald-200" : "text-emerald-600")} />
          </div>
          <h3 className="text-xl sm:text-2xl font-black">{normalCustomersCount}</h3>
          <span className={cn("text-[10px] sm:text-[11px] font-semibold mt-1 block", customerTypeFilter === 'Normal Customer' ? "text-emerald-200" : "text-emerald-600")}>
            {normalCustomersCapacity} kW Direct Stock
          </span>
        </button>

        {/* 3. Vendor Related Stock */}
        <button
          type="button"
          onClick={() => {
            setCustomerTypeFilter('Vendor Related Stock');
            setCustomerFilterMode('all');
          }}
          className={cn(
            "p-4 sm:p-5 rounded-2xl border text-left transition-all cursor-pointer shadow-xs hover:shadow-md hover:-translate-y-0.5 group",
            customerTypeFilter === 'Vendor Related Stock'
              ? "bg-amber-700 text-white border-amber-700 ring-2 ring-amber-500/50"
              : "bg-white text-slate-900 border-slate-200 hover:border-amber-400"
          )}
          title="Click to filter customers fulfilled using vendor-supplied stock"
        >
          <div className="flex items-center justify-between mb-1">
            <span className={cn("text-[10px] sm:text-[11px] font-black uppercase tracking-wider block", customerTypeFilter === 'Vendor Related Stock' ? "text-amber-100" : "text-amber-700")}>
              Vendor Stock
            </span>
            <Package className={cn("w-3.5 h-3.5", customerTypeFilter === 'Vendor Related Stock' ? "text-amber-200" : "text-amber-600")} />
          </div>
          <h3 className="text-xl sm:text-2xl font-black">{vendorStockCustomersCount}</h3>
          <span className={cn("text-[10px] sm:text-[11px] font-semibold mt-1 block", customerTypeFilter === 'Vendor Related Stock' ? "text-amber-200" : "text-amber-600")}>
            {vendorStockCapacity} kW Vendor Stock
          </span>
        </button>

        {/* 4. Installed Capacity */}
        <button
          type="button"
          onClick={() => {
            setCustomerFilterMode(prev => prev === 'highest-capacity' ? 'all' : 'highest-capacity');
          }}
          className={cn(
            "p-4 sm:p-5 rounded-2xl border text-left transition-all cursor-pointer shadow-xs hover:shadow-md hover:-translate-y-0.5 group",
            customerFilterMode === 'highest-capacity'
              ? "bg-teal-700 text-white border-teal-700 ring-2 ring-teal-500/50"
              : "bg-white text-slate-900 border-slate-200 hover:border-teal-400"
          )}
          title="Click to sort customers by highest solar capacity"
        >
          <span className={cn("text-[10px] sm:text-[11px] font-black uppercase tracking-wider block mb-1", customerFilterMode === 'highest-capacity' ? "text-teal-100" : "text-slate-400")}>
            Installed Capacity
          </span>
          <h3 className="text-xl sm:text-2xl font-black">
            {roleScopedCustomers.reduce((sum, c) => sum + (c.systemCapacityKw || 0), 0)} kW
          </h3>
          <span className={cn("text-[10px] sm:text-[11px] font-semibold mt-1 block", customerFilterMode === 'highest-capacity' ? "text-teal-200" : "text-teal-600")}>
            {customerFilterMode === 'highest-capacity' ? 'Sorted: Highest First' : 'Click to sort by kW'}
          </span>
        </button>

        {/* 5. Total Project Value */}
        <button
          type="button"
          onClick={() => {
            setCustomerFilterMode(prev => prev === 'highest-value' ? 'all' : 'highest-value');
          }}
          className={cn(
            "p-4 sm:p-5 rounded-2xl border text-left transition-all cursor-pointer shadow-xs hover:shadow-md hover:-translate-y-0.5 group col-span-2 sm:col-span-1",
            customerFilterMode === 'highest-value'
              ? "bg-purple-700 text-white border-purple-700 ring-2 ring-purple-500/50"
              : "bg-white text-slate-900 border-slate-200 hover:border-purple-400"
          )}
          title="Click to sort customers by highest project value"
        >
          <span className={cn("text-[10px] sm:text-[11px] font-black uppercase tracking-wider block mb-1", customerFilterMode === 'highest-value' ? "text-purple-100" : "text-slate-400")}>
            Total Value
          </span>
          <h3 className="text-xl sm:text-2xl font-black truncate">
            {formatCurrency(roleScopedCustomers.reduce((sum, c) => sum + (c.totalProjectValue || 0), 0))}
          </h3>
          <span className={cn("text-[10px] sm:text-[11px] font-semibold mt-1 block", customerFilterMode === 'highest-value' ? "text-purple-200" : "text-purple-600")}>
            {customerFilterMode === 'highest-value' ? 'Sorted: Highest First' : 'Click to sort by value'}
          </span>
        </button>
      </div>

      {/* Segmented Filter Pills & Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3">
        {/* Top Segmented Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl w-full sm:w-auto overflow-x-auto">
            <button
              type="button"
              onClick={() => {
                setCustomerTypeFilter('ALL');
                setSelectedVendorFilter('ALL');
              }}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer",
                customerTypeFilter === 'ALL'
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              )}
            >
              <Users className="w-3.5 h-3.5" />
              <span>All Accounts ({roleScopedCustomers.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCustomerTypeFilter('Normal Customer');
                setSelectedVendorFilter('ALL');
              }}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer",
                customerTypeFilter === 'Normal Customer'
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-emerald-700 hover:bg-emerald-50"
              )}
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-300" />
              <span>Normal Customers ({normalCustomersCount})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCustomerTypeFilter('Vendor Related Stock');
              }}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer",
                customerTypeFilter === 'Vendor Related Stock'
                  ? "bg-amber-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-amber-700 hover:bg-amber-50"
              )}
            >
              <Package className="w-3.5 h-3.5 text-amber-300" />
              <span>Vendor Related Stock ({vendorStockCustomersCount})</span>
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <span className="text-[11px] font-bold text-slate-400">
              Showing <span className="text-slate-800 font-black">{filteredCustomers.length}</span> of {roleScopedCustomers.length} accounts
            </span>
            {customerFilterMode === 'linked-projects' && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-50 text-amber-800 border border-amber-200">
                Filtered: Linked Projects
              </span>
            )}
          </div>
        </div>

        {/* Inputs & Dropdowns Row */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by customer name, vendor name, stock ref, city, phone..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            {/* Vendor Filter Dropdown */}
            {(customerTypeFilter === 'Vendor Related Stock' || uniqueVendorsFromCustomers.length > 0) && (
              <select
                value={selectedVendorFilter}
                onChange={e => setSelectedVendorFilter(e.target.value)}
                className="px-3 py-2 border border-amber-300/80 rounded-xl text-xs font-bold bg-amber-50/40 text-amber-900 outline-none shrink-0"
              >
                <option value="ALL">All Vendors (Stock)</option>
                {uniqueVendorsFromCustomers.map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            )}

            <select
              value={selectedRoofFilter}
              onChange={e => setSelectedRoofFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white text-slate-700 outline-none shrink-0"
            >
              <option value="ALL">All Roof Types</option>
              {roofTypes.map(rt => (
                <option key={rt} value={rt}>{rt}</option>
              ))}
            </select>

            <select
              value={selectedStateFilter}
              onChange={e => setSelectedStateFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white text-slate-700 outline-none shrink-0"
            >
              <option value="ALL">All States</option>
              <option value="Andhra Pradesh">Andhra Pradesh</option>
              <option value="Telangana">Telangana</option>
              <option value="Karnataka">Karnataka</option>
              <option value="Tamil Nadu">Tamil Nadu</option>
              <option value="Maharashtra">Maharashtra</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customers Cards Grid */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-black text-slate-700">No Customers Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {customerTypeFilter === 'Vendor Related Stock'
              ? 'No customers found linked to vendor-supplied stock. Click "Add New Customer" and designate as Vendor Related Stock.'
              : 'No customers match your search criteria or none have been assigned to your account yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map(customer => {
            const isVendorStock = customer.customerType === 'Vendor Related Stock';
            const linkedProjs = projectsList.filter(p => 
              (p.customerName && p.customerName.toLowerCase() === customer.name.toLowerCase()) ||
              (p.phone && customer.phone && p.phone.replace(/\D/g, '').endsWith(customer.phone.replace(/\D/g, '').slice(-10)))
            );

            const linkedDocs = docsList.filter(d => 
              (d.customerId && d.customerId === customer.id) ||
              (d.customerPhone && customer.phone && d.customerPhone.replace(/\D/g, '').endsWith(customer.phone.replace(/\D/g, '').slice(-10))) ||
              (d.customerName && d.customerName.toLowerCase() === customer.name.toLowerCase())
            );

            return (
              <div 
                key={customer.id} 
                onClick={() => setSelectedCustomerForDocs(customer)}
                className={cn(
                  "bg-white rounded-2xl p-5 border transition-all duration-200 flex flex-col justify-between cursor-pointer group relative shadow-xs hover:shadow-xl hover:-translate-y-1",
                  isVendorStock 
                    ? "border-amber-300/80 hover:border-amber-500 bg-gradient-to-b from-amber-50/25 via-white to-white" 
                    : "border-slate-200/80 hover:border-emerald-500"
                )}
                title={`Click anywhere to view document portfolio & details for ${customer.name}`}
              >
                <div>
                  {/* Card Header & Differentiation Badge */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0 flex-1">
                      {/* Classification Badge & Status */}
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        {isVendorStock ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100/80 text-amber-900 border border-amber-300 flex items-center gap-1">
                            <Package className="w-3 h-3 text-amber-700" /> Vendor Related Stock
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                            <UserCheck className="w-3 h-3 text-emerald-600" /> Normal Customer
                          </span>
                        )}
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border",
                          customer.status === 'Active' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                          customer.status === 'Installed' ? "bg-blue-50 text-blue-700 border-blue-200" :
                          "bg-slate-100 text-slate-700 border-slate-200"
                        )}>
                          {customer.status || 'Active'}
                        </span>
                      </div>

                      <h3 className="font-black text-slate-900 text-base group-hover:text-emerald-700 transition-colors truncate">
                        {customer.name}
                      </h3>
                      <p className="text-slate-400 text-xs font-medium flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[200px]">{customer.city || customer.district || 'City'}, {customer.state}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(customer);
                        }}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Edit Customer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(customer.id, customer.name);
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Delete Customer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Vendor Stock Fulfillment Details Box (If Vendor Related Stock) */}
                  {isVendorStock && (
                    <div className="mt-2.5 mb-2 p-2.5 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50/40 border border-amber-200 text-xs">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-amber-700" /> Supplied By Vendor
                        </span>
                        {customer.stockCategory && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 bg-amber-200/80 text-amber-950 rounded">
                            {customer.stockCategory}
                          </span>
                        )}
                      </div>
                      <div className="font-black text-slate-900 text-xs flex items-center gap-1">
                        <span className="truncate">{customer.vendorName || 'Vendor Stock Allocated'}</span>
                      </div>
                      {customer.vendorStockRef && (
                        <div className="text-[10px] text-amber-900 font-mono mt-0.5 flex items-center gap-1">
                          <Tag className="w-2.5 h-2.5 text-amber-600" /> Ref: {customer.vendorStockRef}
                        </div>
                      )}
                      {customer.vendorStockNotes && (
                        <p className="text-[10px] text-slate-600 mt-1 line-clamp-1 italic">
                          "{customer.vendorStockNotes}"
                        </p>
                      )}
                    </div>
                  )}

                  {/* Normal Customer Direct Stock Tag */}
                  {!isVendorStock && (
                    <div className="mt-1 mb-2 text-[11px] text-slate-500 font-medium flex items-center gap-1">
                      <Boxes className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>Company Direct Inventory Fulfillment</span>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 my-2.5">
                    <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-black flex items-center gap-1">
                      <Sun className="w-3.5 h-3.5 text-emerald-600" />
                      {customer.systemCapacityKw || 3} kW System
                    </span>
                    <span className="px-2.5 py-1 bg-teal-50 border border-teal-200 text-teal-800 rounded-lg text-xs font-bold">
                      🏠 {customer.roofType || 'RCC Flat'}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCustomerForDocs(customer);
                      }}
                      className="px-2.5 py-1 bg-violet-50 hover:bg-violet-100 border border-violet-200 text-violet-800 rounded-lg text-xs font-black flex items-center gap-1 transition-colors cursor-pointer"
                      title="Click to view linked Invoices, Quotations & Proposals"
                    >
                      <Archive className="w-3.5 h-3.5 text-violet-600" />
                      <span>{linkedDocs.length} Doc{linkedDocs.length !== 1 ? 's' : ''}</span>
                    </button>
                    {customer.sanctionedLoad && (
                      <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs font-bold">
                        ⚡ {customer.sanctionedLoad} kW Load
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 text-xs text-slate-600 my-2">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <a 
                        href={`tel:${customer.phone}`} 
                        onClick={(e) => e.stopPropagation()} 
                        className="font-semibold text-slate-900 hover:underline"
                      >
                        {customer.phone}
                      </a>
                    </div>
                    {customer.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span 
                          onClick={(e) => e.stopPropagation()}
                          className="truncate max-w-[200px]"
                        >
                          {customer.email}
                        </span>
                      </div>
                    )}
                    {customer.totalProjectValue && (
                      <div className="flex items-center gap-2 text-slate-700 font-bold pt-1">
                        <span>Project Value:</span>
                        <span className="text-emerald-700 font-black">{formatCurrency(customer.totalProjectValue)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCustomerForDocs(customer);
                    }}
                    className="text-xs font-black text-violet-700 hover:text-violet-800 flex items-center gap-1.5 hover:underline cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Documents ({linkedDocs.length})</span>
                  </button>
                  {onNavigate && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate('projects', customer.name);
                      }}
                      className="text-xs font-black text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      View Projects <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[200] flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="p-5 bg-slate-900 text-white flex justify-between items-center shrink-0 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Client CRM Directory</span>
                  <h3 className="text-lg font-black text-white">{editingCustomerId ? 'Edit Customer Account' : 'Register New Customer Account'}</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <form id="customer-form" onSubmit={handleSubmitCustomer} className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-4 text-xs bg-slate-50/50">
              {/* Customer Classification & Stock Differentiation */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div>
                  <label className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-600" /> Customer & Stock Classification *
                  </label>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Choose whether this client receives standard company inventory or vendor-supplied stock/consignment.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Normal Customer Card */}
                  <div
                    onClick={() => setFormData(prev => ({ ...prev, customerType: 'Normal Customer' }))}
                    className={cn(
                      "p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3",
                      (formData.customerType || 'Normal Customer') === 'Normal Customer'
                        ? "border-emerald-500 bg-emerald-50/50 shadow-xs ring-2 ring-emerald-500/20"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      (formData.customerType || 'Normal Customer') === 'Normal Customer'
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-100 text-slate-500"
                    )}>
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-slate-900">Normal Customer</h4>
                        {(formData.customerType || 'Normal Customer') === 'Normal Customer' && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        Direct retail solar client. Fulfilled via standard company stock & general inventory.
                      </p>
                    </div>
                  </div>

                  {/* Vendor Related Stock Card */}
                  <div
                    onClick={() => setFormData(prev => ({ ...prev, customerType: 'Vendor Related Stock' }))}
                    className={cn(
                      "p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3",
                      formData.customerType === 'Vendor Related Stock'
                        ? "border-amber-500 bg-amber-50/50 shadow-xs ring-2 ring-amber-500/20"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      formData.customerType === 'Vendor Related Stock'
                        ? "bg-amber-600 text-white"
                        : "bg-slate-100 text-slate-500"
                    )}>
                      <Package className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-slate-900">Vendor Related Stock</h4>
                        {formData.customerType === 'Vendor Related Stock' && (
                          <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        Fulfilled from third-party vendor stock, equipment consignment, or distributor allocation.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Dynamic Vendor Related Stock Sub-Form */}
                {formData.customerType === 'Vendor Related Stock' && (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-300/80 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-amber-700" /> Vendor Stock Allocation Details
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsCustomVendor(!isCustomVendor)}
                        className="text-[11px] font-bold text-amber-800 hover:text-amber-900 underline cursor-pointer"
                      >
                        {isCustomVendor ? "Choose from Registered Vendors" : "+ Enter Custom Vendor Name"}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-amber-900 uppercase mb-1">
                          Associated Vendor / Supplier *
                        </label>
                        {isCustomVendor ? (
                          <input
                            type="text"
                            required={formData.customerType === 'Vendor Related Stock'}
                            value={formData.vendorName || ''}
                            onChange={e => setFormData(prev => ({ ...prev, vendorName: e.target.value, vendorId: '' }))}
                            placeholder="e.g. Waaree Solar / Tata Power / Goldi"
                            className="w-full px-3.5 py-2 border border-amber-300 rounded-xl font-bold text-slate-900 bg-white outline-none focus:ring-2 focus:ring-amber-500/20"
                          />
                        ) : (
                          <select
                            value={formData.vendorName || ''}
                            onChange={e => {
                              if (e.target.value === '__custom__') {
                                setIsCustomVendor(true);
                                setFormData(prev => ({ ...prev, vendorName: '', vendorId: '' }));
                                return;
                              }
                              const selectedV = vendorsList.find(v => v.name === e.target.value);
                              setFormData(prev => ({
                                ...prev,
                                vendorName: e.target.value,
                                vendorId: selectedV?.id || ''
                              }));
                            }}
                            required={formData.customerType === 'Vendor Related Stock'}
                            className="w-full px-3.5 py-2 border border-amber-300 rounded-xl font-bold text-slate-900 bg-white outline-none focus:ring-2 focus:ring-amber-500/20"
                          >
                            <option value="">Select Vendor / Supplier</option>
                            {vendorsList.map(v => (
                              <option key={v.id} value={v.name}>
                                {v.name} {v.category ? `(${v.category})` : ''}
                              </option>
                            ))}
                            <option value="__custom__">+ Enter Custom Vendor Name</option>
                          </select>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-amber-900 uppercase mb-1">
                          Supplied Stock Component
                        </label>
                        <select
                          value={formData.stockCategory || 'Solar Panels (Mono/Poly PV)'}
                          onChange={e => setFormData(prev => ({ ...prev, stockCategory: e.target.value }))}
                          className="w-full px-3.5 py-2 border border-amber-300 rounded-xl font-bold text-slate-900 bg-white outline-none focus:ring-2 focus:ring-amber-500/20"
                        >
                          <option value="Solar Panels (Mono/Poly PV)">Solar Panels (Mono/Poly PV)</option>
                          <option value="Inverters (String/Micro/Hybrid)">Inverters (String/Micro/Hybrid)</option>
                          <option value="Complete Solar Kit (Panels + Inverter + BOS)">Complete Solar Kit</option>
                          <option value="Mounting Structures (GI/Aluminium)">Mounting Structures</option>
                          <option value="Batteries & Energy Storage">Batteries & Energy Storage</option>
                          <option value="Cables & AC/DC Wiring">Cables & AC/DC Wiring</option>
                          <option value="Other Components">Other Components</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-amber-900 uppercase mb-1">
                          Vendor Stock Ref / PO / Batch #
                        </label>
                        <input
                          type="text"
                          value={formData.vendorStockRef || ''}
                          onChange={e => setFormData(prev => ({ ...prev, vendorStockRef: e.target.value }))}
                          placeholder="e.g. PO-2024-045 or Lot #9A"
                          className="w-full px-3.5 py-2 border border-amber-300 rounded-xl font-mono text-slate-900 bg-white outline-none focus:ring-2 focus:ring-amber-500/20"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-amber-900 uppercase mb-1">
                          Vendor Stock / Fulfillment Notes
                        </label>
                        <input
                          type="text"
                          value={formData.vendorStockNotes || ''}
                          onChange={e => setFormData(prev => ({ ...prev, vendorStockNotes: e.target.value }))}
                          placeholder="e.g. Reserved from Hyderabad depot"
                          className="w-full px-3.5 py-2 border border-amber-300 rounded-xl text-slate-900 bg-white outline-none focus:ring-2 focus:ring-amber-500/20"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Customer Full Name *</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="e.g. Uyyuru Nageswara Rao"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mobile / Phone Number *</label>
                  <input
                    required
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="e.g. +91 98765 43210"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="customer@gmail.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Roof Type *</label>
                  <select
                    value={formData.roofType}
                    onChange={e => setFormData({ ...formData, roofType: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white"
                  >
                    {roofTypes.map(rt => (
                      <option key={rt} value={rt}>{rt}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">System Size (kW) *</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={formData.systemCapacityKw}
                    onChange={e => setFormData({ ...formData, systemCapacityKw: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-black text-emerald-700 outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Sanctioned Load (kW)</label>
                  <input
                    type="text"
                    value={formData.sanctionedLoad}
                    onChange={e => setFormData({ ...formData, sanctionedLoad: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="e.g. 5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Est. Project Value (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.totalProjectValue}
                    onChange={e => setFormData({ ...formData, totalProjectValue: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="350000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Street Address / Landmark</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-medium text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="e.g. 2-201, Shivalayam Street, T.Narasapuram"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">City / Village</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="Eluru"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={e => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="Andhra Pradesh"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Pincode</label>
                  <input
                    type="text"
                    value={formData.pincode}
                    onChange={e => setFormData({ ...formData, pincode: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-mono font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="534467"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Notes / Installation Requirements</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl font-medium outline-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="e.g. 3-phase connection required, south-facing shadow-free roof."
                />
              </div>
            </form>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 shrink-0 flex gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="customer-form"
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" /> {editingCustomerId ? 'Update Customer' : 'Save Customer Account'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Customer Linked Invoices & Quotations Portfolio Modal */}
      {selectedCustomerForDocs && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[200] flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="p-5 bg-slate-900 text-white flex justify-between items-center shrink-0 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Archive className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Customer Document Portfolio</span>
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] font-bold rounded-full">
                      {selectedCustomerForDocs.phone}
                    </span>
                    {selectedCustomerForDocs.customerType === 'Vendor Related Stock' ? (
                      <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[10px] font-black uppercase rounded-full flex items-center gap-1">
                        <Package className="w-3 h-3 text-amber-400" /> Vendor Stock: {selectedCustomerForDocs.vendorName || 'Assigned'}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-black uppercase rounded-full flex items-center gap-1">
                        <UserCheck className="w-3 h-3 text-emerald-400" /> Normal Customer
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-black text-white">{selectedCustomerForDocs.name}</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomerForDocs(null)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 bg-slate-50/50">
              {/* Vendor Stock Banner in Portfolio */}
              {selectedCustomerForDocs.customerType === 'Vendor Related Stock' && (
                <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50/50 rounded-2xl border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block">Vendor Stock Fulfillment</span>
                      <h4 className="text-xs font-black text-slate-900">
                        {selectedCustomerForDocs.vendorName || 'Vendor Assigned'}
                        {selectedCustomerForDocs.stockCategory ? ` • ${selectedCustomerForDocs.stockCategory}` : ''}
                      </h4>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedCustomerForDocs.vendorStockRef && (
                      <div className="px-2.5 py-1 bg-white rounded-xl border border-amber-200 font-mono text-[11px] font-bold text-amber-900 flex items-center gap-1">
                        <Tag className="w-3 h-3 text-amber-600" /> Ref: {selectedCustomerForDocs.vendorStockRef}
                      </div>
                    )}
                    {selectedCustomerForDocs.vendorStockNotes && (
                      <span className="text-[11px] text-slate-600 italic">
                        "{selectedCustomerForDocs.vendorStockNotes}"
                      </span>
                    )}
                  </div>
                </div>
              )}
              {(() => {
                const custDocs = docsList.filter(d => 
                  (d.customerId && d.customerId === selectedCustomerForDocs.id) ||
                  (d.customerPhone && selectedCustomerForDocs.phone && d.customerPhone.replace(/\D/g, '').endsWith(selectedCustomerForDocs.phone.replace(/\D/g, '').slice(-10))) ||
                  (d.customerName && d.customerName.toLowerCase() === selectedCustomerForDocs.name.toLowerCase())
                );

                if (custDocs.length === 0) {
                  return (
                    <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300 p-8">
                      <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <h4 className="text-base font-black text-slate-800 mb-1">No Documents Generated Yet</h4>
                      <p className="text-xs text-slate-500 max-w-md mx-auto mb-5">
                        Quotations, sales proposals, commercial invoices, and tax invoices created for {selectedCustomerForDocs.name} will be tracked here automatically.
                      </p>
                      {onNavigate && (
                        <div className="flex items-center justify-center gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCustomerForDocs(null);
                              onNavigate('quotation');
                            }}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Calculator className="w-4 h-4" /> Create Quotation
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCustomerForDocs(null);
                              onNavigate('invoice');
                            }}
                            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Receipt className="w-4 h-4" /> Create Invoice
                          </button>
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                        {custDocs.length} Total Document{custDocs.length !== 1 ? 's' : ''} Linked
                      </span>
                      <span className="text-xs font-black text-emerald-700">
                        Total Value: {formatCurrency(custDocs.reduce((sum, d) => sum + (d.totalAmount || 0), 0))}
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-50 text-slate-600 font-black border-b border-slate-200">
                          <tr>
                            <th className="py-3 px-4">Doc # & Type</th>
                            <th className="py-3 px-4">Capacity</th>
                            <th className="py-3 px-4">Total Amount</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4">Generated By</th>
                            <th className="py-3 px-4">Created Date</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                          {custDocs.map(doc => (
                            <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3 px-4">
                                <div className="font-mono font-black text-slate-900">{doc.docNumber}</div>
                                <span className={cn(
                                  "inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase mt-0.5",
                                  doc.type === 'tax-invoice' ? "bg-rose-50 text-rose-700 border border-rose-200" :
                                  doc.type === 'invoice' ? "bg-blue-50 text-blue-700 border border-blue-200" :
                                  doc.type === 'proposal' ? "bg-purple-50 text-purple-700 border border-purple-200" :
                                  "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                )}>
                                  {doc.type}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="font-bold text-slate-900">{doc.systemCapacityKw ? `${doc.systemCapacityKw} kW` : '—'}</span>
                              </td>
                              <td className="py-3 px-4">
                                <div className="font-black text-slate-900">{formatCurrency(doc.totalAmount)}</div>
                                {doc.taxAmount ? (
                                  <div className="text-[10px] text-slate-400">GST: {formatCurrency(doc.taxAmount)}</div>
                                ) : null}
                              </td>
                              <td className="py-3 px-4">
                                <span className={cn(
                                  "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                                  doc.status === 'Paid' ? "bg-emerald-100 text-emerald-800" :
                                  doc.status === 'Approved' ? "bg-blue-100 text-blue-800" :
                                  doc.status === 'Sent' ? "bg-amber-100 text-amber-800" :
                                  "bg-slate-100 text-slate-700"
                                )}>
                                  {doc.status}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <div className="font-bold text-slate-900 truncate max-w-[120px]">{doc.userName || 'System'}</div>
                                <div className="text-[10px] text-slate-400 truncate max-w-[120px]">{doc.companyName || doc.userEmail || 'MetaGreen'}</div>
                              </td>
                              <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                                {doc.createdAt ? (doc.createdAt.toDate ? doc.createdAt.toDate().toLocaleDateString('en-IN') : new Date(doc.createdAt).toLocaleDateString('en-IN')) : '—'}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setInspectingDoc(doc)}
                                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                                    title="View Details"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      toast.info(`Preparing ${doc.type.toUpperCase()} #${doc.docNumber}...`, 'Downloading Document');
                                      downloadDocumentPDF(doc, logos);
                                    }}
                                    className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors cursor-pointer"
                                    title="Download PDF"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedCustomerForDocs(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Close Portfolio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inspect Document Modal */}
      {inspectingDoc && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[210] flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="p-5 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-emerald-400" />
                <div>
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{inspectingDoc.type} Document Record</span>
                  <h3 className="text-base font-black text-white">{inspectingDoc.docNumber}</h3>
                </div>
              </div>
              <button onClick={() => setInspectingDoc(null)} className="text-slate-400 hover:text-white p-2">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Customer</span>
                  <p className="text-sm font-black text-slate-900">{inspectingDoc.customerName}</p>
                  <p className="text-slate-500">{inspectingDoc.customerPhone || '—'}</p>
                  <p className="text-slate-500">{inspectingDoc.customerEmail || '—'}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Creator / Attribution</span>
                  <p className="text-sm font-black text-slate-900">{inspectingDoc.userName || 'System'}</p>
                  <p className="text-slate-500">{inspectingDoc.companyName || inspectingDoc.userRole || 'Admin'}</p>
                  <p className="text-slate-500">{inspectingDoc.userEmail || '—'}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Total Amount</span>
                  <p className="text-sm font-black text-emerald-700">{formatCurrency(inspectingDoc.totalAmount)}</p>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">System Size</span>
                  <p className="text-sm font-black text-slate-900">{inspectingDoc.systemCapacityKw ? `${inspectingDoc.systemCapacityKw} kW` : '—'}</p>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Status</span>
                  <p className="text-sm font-black text-blue-700">{inspectingDoc.status}</p>
                </div>
              </div>

              {inspectingDoc.metadata && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Document Metadata</span>
                  <pre className="text-[11px] font-mono bg-white p-3 rounded-xl border border-slate-200 overflow-x-auto text-slate-700">
                    {JSON.stringify(inspectingDoc.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setInspectingDoc(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  toast.info(`Preparing ${inspectingDoc.type.toUpperCase()} #${inspectingDoc.docNumber}...`, 'Downloading Document');
                  downloadDocumentPDF(inspectingDoc, logos);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-200 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
