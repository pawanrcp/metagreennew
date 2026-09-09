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
  Receipt
} from 'lucide-react';
import { collection, query, onSnapshot, orderBy, addDoc, serverTimestamp, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { useAuth } from '@/src/context/AuthContext';
import { useToast } from '@/src/context/ToastContext';
import { useLogos } from '@/src/context/LogoContext';
import { cn, formatCurrency } from '@/src/lib/utils';
import { ViewType, GeneratedDocument } from '@/src/types';
import { downloadDocumentPDF } from '@/src/services/generatedDocuments.service';

export interface CustomerRecord {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  district?: string;
  state: string;
  pincode?: string;
  sanctionedLoad?: string | number;
  roofType?: string;
  systemCapacityKw?: number;
  totalProjectValue?: number;
  notes?: string;
  status?: 'Active' | 'Lead' | 'Installed' | 'Archived';
  source?: string;
  assignedTo?: string;
  installerId?: string;
  creatorId?: string;
  createdBy?: string;
  createdAt?: any;
  updatedAt?: any;
}

interface CustomersProps {
  onNavigate?: (view: ViewType, filter?: string) => void;
}

export default function Customers({ onNavigate }: CustomersProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { logos } = useLogos();

  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoofFilter, setSelectedRoofFilter] = useState('ALL');
  const [selectedStateFilter, setSelectedStateFilter] = useState('ALL');
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
    status: 'Active' as 'Active' | 'Lead' | 'Installed' | 'Archived'
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

    return () => {
      unsubCustomers();
      unsubRoofs();
      unsubProjects();
      unsubDocs();
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
        (c.notes && c.notes.toLowerCase().includes(uCompany))
      );
    }

    return (
      c.creatorId === uId ||
      c.createdBy === uEmail ||
      (c.assignedTo && c.assignedTo.toLowerCase().includes(uName))
    );
  });

  const filteredCustomers = useMemo(() => {
    let list = roleScopedCustomers.filter(c => {
      const matchesSearch = 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.city || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.address || '').toLowerCase().includes(searchTerm.toLowerCase());

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
  }, [roleScopedCustomers, searchTerm, selectedRoofFilter, selectedStateFilter, customerFilterMode, projectsList]);

  const handleSubmitCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.phone?.trim()) {
      toast.warning("Customer Name and Phone are required.", "Missing Fields");
      return;
    }

    try {
      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        district: formData.district.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim(),
        sanctionedLoad: formData.sanctionedLoad,
        roofType: formData.roofType,
        systemCapacityKw: Number(formData.systemCapacityKw) || 0,
        totalProjectValue: Number(formData.totalProjectValue) || 0,
        notes: formData.notes.trim(),
        status: formData.status,
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
        status: 'Active'
      });
    } catch (err: any) {
      console.error('Error saving customer:', err);
      toast.error('Failed to save customer: ' + (err.message || err));
    }
  };

  const handleEdit = (c: CustomerRecord) => {
    setEditingCustomerId(c.id);
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
      status: c.status || 'Active'
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* 1. Total Customers */}
        <button
          type="button"
          onClick={() => {
            setCustomerFilterMode('all');
            setSearchTerm('');
            setSelectedRoofFilter('ALL');
            setSelectedStateFilter('ALL');
          }}
          className={cn(
            "p-5 rounded-2xl border text-left transition-all cursor-pointer shadow-xs hover:shadow-md hover:-translate-y-0.5 group",
            customerFilterMode === 'all'
              ? "bg-slate-900 text-white border-slate-900 ring-2 ring-slate-900/30"
              : "bg-white text-slate-900 border-slate-200 hover:border-slate-400"
          )}
          title="Click to view all customers and reset filters"
        >
          <span className={cn("text-[11px] font-black uppercase tracking-wider block mb-1", customerFilterMode === 'all' ? "text-slate-300" : "text-slate-400")}>
            Total Customers
          </span>
          <h3 className="text-2xl font-black">{roleScopedCustomers.length}</h3>
          <span className={cn("text-[11px] font-semibold mt-1 block", customerFilterMode === 'all' ? "text-emerald-300" : "text-emerald-600")}>
            {customerFilterMode === 'all' ? 'Showing All Accounts' : 'Click to show all'}
          </span>
        </button>

        {/* 2. Installed Capacity */}
        <button
          type="button"
          onClick={() => {
            setCustomerFilterMode(prev => prev === 'highest-capacity' ? 'all' : 'highest-capacity');
          }}
          className={cn(
            "p-5 rounded-2xl border text-left transition-all cursor-pointer shadow-xs hover:shadow-md hover:-translate-y-0.5 group",
            customerFilterMode === 'highest-capacity'
              ? "bg-teal-700 text-white border-teal-700 ring-2 ring-teal-500/50"
              : "bg-white text-slate-900 border-slate-200 hover:border-teal-400"
          )}
          title="Click to sort customers by highest solar capacity"
        >
          <span className={cn("text-[11px] font-black uppercase tracking-wider block mb-1", customerFilterMode === 'highest-capacity' ? "text-teal-100" : "text-slate-400")}>
            Installed Capacity
          </span>
          <h3 className="text-2xl font-black">
            {roleScopedCustomers.reduce((sum, c) => sum + (c.systemCapacityKw || 0), 0)} kW
          </h3>
          <span className={cn("text-[11px] font-semibold mt-1 block", customerFilterMode === 'highest-capacity' ? "text-teal-200" : "text-teal-600")}>
            {customerFilterMode === 'highest-capacity' ? 'Sorted: Highest First' : 'Click to sort by kW'}
          </span>
        </button>

        {/* 3. Total Project Value */}
        <button
          type="button"
          onClick={() => {
            setCustomerFilterMode(prev => prev === 'highest-value' ? 'all' : 'highest-value');
          }}
          className={cn(
            "p-5 rounded-2xl border text-left transition-all cursor-pointer shadow-xs hover:shadow-md hover:-translate-y-0.5 group",
            customerFilterMode === 'highest-value'
              ? "bg-purple-700 text-white border-purple-700 ring-2 ring-purple-500/50"
              : "bg-white text-slate-900 border-slate-200 hover:border-purple-400"
          )}
          title="Click to sort customers by highest project value"
        >
          <span className={cn("text-[11px] font-black uppercase tracking-wider block mb-1", customerFilterMode === 'highest-value' ? "text-purple-100" : "text-slate-400")}>
            Total Project Value
          </span>
          <h3 className="text-2xl font-black">
            {formatCurrency(roleScopedCustomers.reduce((sum, c) => sum + (c.totalProjectValue || 0), 0))}
          </h3>
          <span className={cn("text-[11px] font-semibold mt-1 block", customerFilterMode === 'highest-value' ? "text-purple-200" : "text-purple-600")}>
            {customerFilterMode === 'highest-value' ? 'Sorted: Highest Value First' : 'Click to sort by value'}
          </span>
        </button>

        {/* 4. Linked Projects */}
        <button
          type="button"
          onClick={() => {
            setCustomerFilterMode(prev => prev === 'linked-projects' ? 'all' : 'linked-projects');
          }}
          className={cn(
            "p-5 rounded-2xl border text-left transition-all cursor-pointer shadow-xs hover:shadow-md hover:-translate-y-0.5 group",
            customerFilterMode === 'linked-projects'
              ? "bg-amber-600 text-white border-amber-600 ring-2 ring-amber-400/50"
              : "bg-white text-slate-900 border-slate-200 hover:border-amber-400"
          )}
          title="Click to filter customers with active linked projects"
        >
          <span className={cn("text-[11px] font-black uppercase tracking-wider block mb-1", customerFilterMode === 'linked-projects' ? "text-amber-100" : "text-slate-400")}>
            Linked Projects
          </span>
          <h3 className="text-2xl font-black">
            {projectsList.filter(p => roleScopedCustomers.some(c => c.name.toLowerCase() === (p.customerName || '').toLowerCase())).length}
          </h3>
          <span className={cn("text-[11px] font-semibold mt-1 block", customerFilterMode === 'linked-projects' ? "text-amber-200" : "text-amber-600")}>
            {customerFilterMode === 'linked-projects' ? 'Showing With Projects' : 'Click to filter projects'}
          </span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by customer name, phone, email, city, address..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <select
            value={selectedRoofFilter}
            onChange={e => setSelectedRoofFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white text-slate-700 outline-none"
          >
            <option value="ALL">All Roof Types</option>
            {roofTypes.map(rt => (
              <option key={rt} value={rt}>{rt}</option>
            ))}
          </select>

          <select
            value={selectedStateFilter}
            onChange={e => setSelectedStateFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white text-slate-700 outline-none"
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

      {/* Customers Cards Grid */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-black text-slate-700">No Customers Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            No customers match your search criteria or none have been assigned to your account yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map(customer => {
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
                className="bg-white rounded-2xl p-5 border border-slate-200/80 hover:border-emerald-500 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between cursor-pointer group relative"
                title={`Click anywhere to view document portfolio & details for ${customer.name}`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-slate-900 text-base group-hover:text-emerald-700 transition-colors">{customer.name}</h3>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border",
                          customer.status === 'Active' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                          customer.status === 'Installed' ? "bg-blue-50 text-blue-700 border-blue-200" :
                          "bg-slate-100 text-slate-700 border-slate-200"
                        )}>
                          {customer.status || 'Active'}
                        </span>
                      </div>
                      <p className="text-slate-400 text-xs font-medium flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[200px]">{customer.city || customer.district || 'City'}, {customer.state}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
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

                  <div className="flex flex-wrap gap-2 my-3">
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
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Customer Document Portfolio</span>
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] font-bold rounded-full">
                      {selectedCustomerForDocs.phone}
                    </span>
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
