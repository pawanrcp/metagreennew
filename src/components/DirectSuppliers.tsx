import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  ShoppingCart,
  Phone,
  Mail,
  MapPin,
  FileText,
  CreditCard,
  RotateCcw,
  Filter,
  Layers,
  LayoutGrid,
  List,
  AlertTriangle,
  X,
  Save,
  TrendingUp
} from 'lucide-react';
import { db } from '../lib/firebase';
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  addDoc,
  serverTimestamp,
  updateDoc,
  doc,
  deleteDoc
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { cn } from '../lib/utils';
import { DirectSupplier } from '../types';

interface DirectSuppliersProps {
  onCreatePO?: (supplier: DirectSupplier) => void;
}

const DEFAULT_CATEGORIES = [
  'Solar Panels (Mono/Poly PV)',
  'Inverters (String/Micro/Hybrid)',
  'Cables & AC/DC Wiring',
  'Mounting Structures (GI/Aluminium)',
  'Batteries & Energy Storage',
  'All-in-One Solar Supplier',
  'Other Components'
];

export default function DirectSuppliers({ onCreatePO }: DirectSuppliersProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const userRole = user?.role || 'Super Admin';
  const isVendor = userRole === 'Vendor' || userRole === 'Vendor Employee' || userRole === 'Solar Supplier';
  const isInstaller = userRole === 'Installer' || userRole === 'Solar Installer' || (userRole as any) === 'Technician';
  const isGlobalAdmin = !isVendor && !isInstaller;

  const [suppliers, setSuppliers] = useState<DirectSupplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [registeredVendors, setRegisteredVendors] = useState<any[]>([]);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isTrashView, setIsTrashView] = useState(false);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);
  const [selectedSupplierForDetails, setSelectedSupplierForDetails] = useState<DirectSupplier | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isPermanentDelete, setIsPermanentDelete] = useState(false);

  // Custom Category addition inside form
  const [isAddingNewCat, setIsAddingNewCat] = useState(false);
  const [newCatInput, setNewCatInput] = useState('');

  // Form data state
  const initialFormData = {
    name: '',
    category: 'Solar Panels (Mono/Poly PV)',
    categories: ['Solar Panels (Mono/Poly PV)'] as string[],
    contact: '',
    phone: '',
    secondaryPhone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gstin: '',
    pan: '',
    bankName: '',
    bankAccountNumber: '',
    bankIfsc: '',
    paymentTerms: '100% Advance',
    notes: ''
  };
  const [formData, setFormData] = useState(initialFormData);

  // Quick Inline PO Modal state if onCreatePO not provided
  const [standalonePoSupplier, setStandalonePoSupplier] = useState<DirectSupplier | null>(null);
  const [standalonePoItem, setStandalonePoItem] = useState({
    name: 'Mono Perc Solar Panels 550W',
    type: 'Panel',
    unit: 'KW',
    size: 550,
    quantity: 10,
    unitPrice: 18500,
    taxRate: 12
  });
  const [isSubmittingStandalonePo, setIsSubmittingStandalonePo] = useState(false);

  // Fetch data
  useEffect(() => {
    const qSuppliers = query(collection(db, 'vendors'), orderBy('name', 'asc'));
    const unsubSuppliers = onSnapshot(qSuppliers, (snap) => {
      setSuppliers(snap.docs.map(d => ({ id: d.id, ...d.data() } as DirectSupplier)));
    });

    const qPOs = query(collection(db, 'purchaseOrders'), orderBy('date', 'desc'));
    const unsubPOs = onSnapshot(qPOs, (snap) => {
      setPurchaseOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const qCats = query(collection(db, 'vendorCategories'), orderBy('name', 'asc'));
    const unsubCats = onSnapshot(qCats, (snap) => {
      setCustomCategories(snap.docs.map(d => d.data().name as string).filter(Boolean));
    });

    const qUsers = query(collection(db, 'users'));
    const unsubUsers = onSnapshot(qUsers, (snap) => {
      const regList = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as any))
        .filter(u => u.role === 'Vendor' || u.role === 'Solar Supplier');
      setRegisteredVendors(regList);
    });

    return () => {
      unsubSuppliers();
      unsubPOs();
      unsubCats();
      unsubUsers();
    };
  }, []);

  const allCategories = useMemo(() => {
    return Array.from(new Set([...DEFAULT_CATEGORIES, ...customCategories]));
  }, [customCategories]);

  // Filter suppliers visible to current user (creator-scoped unless Global Admin)
  const scopedSuppliers = useMemo(() => {
    return suppliers.filter(s => {
      // Must be Unregistered / Direct Supplier
      if (s.vendorType === 'Registered' || s.isRegistered) return false;
      if (isGlobalAdmin) return true;
      const isCreator = s.creatorId === user?.uid ||
        s.createdBy === user?.email ||
        s.createdBy === user?.uid;
      return isCreator;
    });
  }, [suppliers, isGlobalAdmin, user]);

  // Active vs Trash filtering
  const activeSuppliers = useMemo(() => {
    return scopedSuppliers.filter(s => !s.isDeleted);
  }, [scopedSuppliers]);

  const trashedSuppliers = useMemo(() => {
    return scopedSuppliers.filter(s => !!s.isDeleted);
  }, [scopedSuppliers]);

  const currentList = isTrashView ? trashedSuppliers : activeSuppliers;

  // Search and category filtered suppliers
  const filteredSuppliers = useMemo(() => {
    return currentList.filter(s => {
      // Category filter
      if (selectedCategory !== 'ALL') {
        const cats = s.categories && s.categories.length > 0 ? s.categories : [s.category || ''];
        const matchesCat = cats.some(c => c.toLowerCase().includes(selectedCategory.toLowerCase()));
        if (!matchesCat) return false;
      }

      // Search query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchName = s.name?.toLowerCase().includes(q);
      const matchContact = s.contact?.toLowerCase().includes(q);
      const matchPhone = s.phone?.toLowerCase().includes(q);
      const matchEmail = s.email?.toLowerCase().includes(q);
      const matchGstin = s.gstin?.toLowerCase().includes(q);
      const matchCategory = s.category?.toLowerCase().includes(q) || (s.categories && s.categories.join(' ').toLowerCase().includes(q));
      const matchCity = s.city?.toLowerCase().includes(q) || s.state?.toLowerCase().includes(q);

      return matchName || matchContact || matchPhone || matchEmail || matchGstin || matchCategory || matchCity;
    });
  }, [currentList, selectedCategory, searchQuery]);

  // Metrics Calculation
  const metrics = useMemo(() => {
    const totalCount = activeSuppliers.length;
    const catSet = new Set<string>();
    activeSuppliers.forEach(s => {
      if (s.categories && s.categories.length > 0) {
        s.categories.forEach(c => catSet.add(c));
      } else if (s.category) {
        catSet.add(s.category);
      }
    });

    // Count POs linked to active direct suppliers
    const activeNames = new Set(activeSuppliers.map(s => s.name.toLowerCase()));
    const linkedPOs = purchaseOrders.filter(po => {
      const vName = (po.vendor || '').toLowerCase();
      return activeNames.has(vName);
    });

    const totalSpend = linkedPOs.reduce((acc, po) => acc + (po.amount || 0), 0);

    return {
      totalSuppliers: totalCount,
      activeCategories: catSet.size,
      linkedPOCount: linkedPOs.length,
      totalSpend
    };
  }, [activeSuppliers, purchaseOrders]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingSupplierId(null);
    setFormData(initialFormData);
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (supplier: DirectSupplier, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingSupplierId(supplier.id);
    setFormData({
      name: supplier.name || '',
      category: supplier.category || 'Solar Panels (Mono/Poly PV)',
      categories: supplier.categories || [supplier.category || 'Solar Panels (Mono/Poly PV)'],
      contact: supplier.contact || '',
      phone: supplier.phone || '',
      secondaryPhone: supplier.secondaryPhone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      city: supplier.city || '',
      state: supplier.state || '',
      pincode: supplier.pincode || '',
      gstin: supplier.gstin || '',
      pan: supplier.pan || '',
      bankName: supplier.bankName || '',
      bankAccountNumber: supplier.bankAccountNumber || '',
      bankIfsc: supplier.bankIfsc || '',
      paymentTerms: supplier.paymentTerms || '100% Advance',
      notes: supplier.notes || ''
    });
    setIsFormModalOpen(true);
  };

  // Save (Create or Update)
  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      toast.warning('Please enter supplier or company name.', 'Name Required');
      return;
    }

    // Duplicate check
    const duplicateReg = registeredVendors.find(rv =>
      (rv.companyName && rv.companyName.toLowerCase() === trimmedName.toLowerCase()) ||
      (rv.name && rv.name.toLowerCase() === trimmedName.toLowerCase())
    );
    if (duplicateReg) {
      toast.warning(`"${trimmedName}" is already registered on the MetaGreen Platform as an official supplier.`, 'Registered Vendor Conflict');
    }

    const selectedCats = formData.categories && formData.categories.length > 0
      ? formData.categories
      : [formData.category || 'Solar Panels (Mono/Poly PV)'];
    const catStr = selectedCats.join(', ');

    try {
      if (editingSupplierId) {
        await updateDoc(doc(db, 'vendors', editingSupplierId), {
          name: trimmedName,
          category: catStr,
          categories: selectedCats,
          contact: formData.contact,
          phone: formData.phone,
          secondaryPhone: formData.secondaryPhone,
          email: formData.email,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          gstin: formData.gstin,
          pan: formData.pan,
          bankName: formData.bankName,
          bankAccountNumber: formData.bankAccountNumber,
          bankIfsc: formData.bankIfsc,
          paymentTerms: formData.paymentTerms,
          notes: formData.notes,
          updatedAt: serverTimestamp()
        });
        toast.success(`Supplier "${trimmedName}" updated successfully!`, 'Supplier Updated');
      } else {
        const newDisplayId = `DIR-${String(scopedSuppliers.length + 1).padStart(3, '0')}`;
        await addDoc(collection(db, 'vendors'), {
          displayId: newDisplayId,
          name: trimmedName,
          category: catStr,
          categories: selectedCats,
          contact: formData.contact,
          phone: formData.phone,
          secondaryPhone: formData.secondaryPhone,
          email: formData.email,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          gstin: formData.gstin,
          pan: formData.pan,
          bankName: formData.bankName,
          bankAccountNumber: formData.bankAccountNumber,
          bankIfsc: formData.bankIfsc,
          paymentTerms: formData.paymentTerms,
          notes: formData.notes,
          vendorType: 'Unregistered',
          isRegistered: false,
          status: 'Active',
          isDeleted: false,
          rating: 5.0,
          creatorId: user?.uid || '',
          createdBy: user?.email || 'admin',
          creatorName: user?.name || user?.companyName || 'User',
          creatorRole: user?.role || '',
          createdAt: serverTimestamp()
        });
        toast.success(`Direct Supplier "${trimmedName}" created successfully!`, 'Supplier Added');
      }

      setIsFormModalOpen(false);
      setEditingSupplierId(null);
      setFormData(initialFormData);
    } catch (err: any) {
      console.error('Error saving supplier:', err);
      toast.error('Failed to save supplier: ' + (err.message || err));
    }
  };

  // Add Custom Category
  const handleAddNewCategory = async () => {
    const trimmed = newCatInput.trim();
    if (!trimmed) return;

    if (allCategories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      const matched = allCategories.find(c => c.toLowerCase() === trimmed.toLowerCase()) || trimmed;
      if (!formData.categories.includes(matched)) {
        setFormData(prev => ({ ...prev, categories: [...prev.categories, matched], category: [...prev.categories, matched].join(', ') }));
      }
      setIsAddingNewCat(false);
      setNewCatInput('');
      return;
    }

    try {
      await addDoc(collection(db, 'vendorCategories'), {
        name: trimmed,
        createdBy: user?.email || 'admin',
        createdAt: serverTimestamp()
      });
      setFormData(prev => ({
        ...prev,
        categories: [...prev.categories, trimmed],
        category: [...prev.categories, trimmed].join(', ')
      }));
      setIsAddingNewCat(false);
      setNewCatInput('');
      toast.success(`Category "${trimmed}" added and selected!`, 'Category Created');
    } catch (err: any) {
      console.error('Error adding category:', err);
      toast.error('Failed to add category');
    }
  };

  // Soft Delete (Move to Trash)
  const handleMoveToTrash = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await updateDoc(doc(db, 'vendors', id), {
        isDeleted: true,
        deletedAt: serverTimestamp()
      });
      toast.info('Supplier moved to Trash bin. You can restore it anytime.', 'Moved to Trash');
      if (selectedSupplierForDetails?.id === id) {
        setSelectedSupplierForDetails(null);
      }
      setDeleteConfirmId(null);
    } catch (err: any) {
      console.error('Error trashing supplier:', err);
      toast.error('Failed to move supplier to trash');
    }
  };

  // Restore from Trash
  const handleRestoreFromTrash = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await updateDoc(doc(db, 'vendors', id), {
        isDeleted: false,
        deletedAt: null
      });
      toast.success('Supplier restored successfully!', 'Supplier Restored');
    } catch (err: any) {
      console.error('Error restoring supplier:', err);
      toast.error('Failed to restore supplier');
    }
  };

  // Permanent Delete
  const handlePermanentDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'vendors', id));
      toast.success('Supplier permanently deleted from database.', 'Permanently Deleted');
      setDeleteConfirmId(null);
    } catch (err: any) {
      console.error('Error permanently deleting supplier:', err);
      toast.error('Failed to permanently delete supplier');
    }
  };

  // Trigger PO Creation
  const handleCreatePoClick = (supplier: DirectSupplier, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (onCreatePO) {
      onCreatePO(supplier);
    } else {
      setStandalonePoSupplier(supplier);
    }
  };

  // Standalone PO Submission (if rendered outside Procurement tab)
  const handleStandalonePoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!standalonePoSupplier) return;
    setIsSubmittingStandalonePo(true);

    try {
      const newPoId = `PO-2026-${String(purchaseOrders.length + 1).padStart(3, '0')}`;
      const newInvoiceId = `INV-${newPoId}`;
      const creatorUID = user?.uid || 'admin';
      const creatorTitle = user?.name || user?.companyName || (isVendor ? 'Solar Supplier' : 'Solar Installer');

      const taxSubtotal = (standalonePoItem.unitPrice * standalonePoItem.quantity);
      const taxAmount = taxSubtotal * (standalonePoItem.taxRate / 100);
      const grandTotal = taxSubtotal + taxAmount;
      const itemsSummaryStr = `${standalonePoItem.quantity} ${standalonePoItem.unit} x ${standalonePoItem.name} @ ₹${standalonePoItem.unitPrice.toLocaleString('en-IN')}/${standalonePoItem.unit} (+${standalonePoItem.taxRate}% GST)`;

      const poItems = [
        {
          id: Date.now().toString(),
          name: standalonePoItem.name,
          type: standalonePoItem.type,
          unit: standalonePoItem.unit,
          size: standalonePoItem.size,
          quantity: standalonePoItem.quantity,
          unitPrice: standalonePoItem.unitPrice,
          taxRate: standalonePoItem.taxRate
        }
      ];

      // Auto-accepted Unregistered PO
      const poDocRef = await addDoc(collection(db, 'purchaseOrders'), {
        displayId: newPoId,
        vendor: standalonePoSupplier.name,
        vendorId: '',
        vendorType: 'Unregistered',
        stockOwner: creatorUID,
        stockOwnerName: creatorTitle,
        creatorId: creatorUID,
        creatorName: creatorTitle,
        creatorRole: user?.role || (isVendor ? 'Solar Supplier' : 'Solar Installer'),
        poItems,
        items: itemsSummaryStr,
        taxableAmount: taxSubtotal,
        taxAmount: taxAmount,
        amount: grandTotal,
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-'),
        status: 'Accepted & Stock Received',
        autoAccepted: true,
        invoiceGenerated: true,
        invoiceNumber: newInvoiceId,
        expectedDelivery: 'Direct / On-The-Spot',
        stage: 5,
        acceptedAt: serverTimestamp(),
        receivedAt: serverTimestamp(),
        createdBy: user?.email || 'admin',
        createdAt: serverTimestamp()
      });

      // Invoice
      await addDoc(collection(db, 'vendorInvoices'), {
        poId: poDocRef.id,
        displayId: newPoId,
        invoiceNumber: newInvoiceId,
        vendor: standalonePoSupplier.name,
        vendorType: 'Unregistered',
        taxableAmount: taxSubtotal,
        taxAmount: taxAmount,
        amount: grandTotal,
        items: poItems,
        recipientId: creatorUID,
        recipientName: creatorTitle,
        recipientRole: user?.role || (isVendor ? 'Solar Supplier' : 'Solar Installer'),
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-'),
        dueDate: 'Immediate',
        status: 'Paid',
        createdAt: serverTimestamp()
      });

      // Auto-add to creator's inventory
      await addDoc(collection(db, 'inventory'), {
        name: standalonePoItem.name,
        category: standalonePoSupplier.category || 'Solar Panels',
        type: standalonePoItem.type,
        quantity: standalonePoItem.quantity,
        availableQuantity: standalonePoItem.quantity,
        reservedQuantity: 0,
        soldQuantity: 0,
        unit: standalonePoItem.unit,
        size: standalonePoItem.size,
        purchasePrice: standalonePoItem.unitPrice,
        price: Math.round(standalonePoItem.unitPrice * 1.25),
        availableForSelling: true,
        minThreshold: 5,
        vendor: standalonePoSupplier.name,
        vendorType: 'Unregistered',
        stockOwner: creatorUID,
        stockOwnerName: creatorTitle,
        poId: poDocRef.id,
        poDisplayId: newPoId,
        createdAt: serverTimestamp()
      });

      toast.success(
        `Purchase Order ${newPoId} created for ${standalonePoSupplier.name}! Stock automatically added to your inventory.`,
        'PO Generated & Stock Received'
      );
      setStandalonePoSupplier(null);
    } catch (err: any) {
      console.error('Error submitting standalone PO:', err);
      toast.error('Failed to create PO: ' + (err.message || err));
    } finally {
      setIsSubmittingStandalonePo(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* TOP HEADER SECTION */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              {isGlobalAdmin ? 'Direct Procurement Sources (All Users)' : 'My Direct / Offline Suppliers (Private To You)'}
            </span>
            {isTrashView && (
              <span className="px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full text-xs font-black uppercase tracking-wider inline-flex items-center gap-1">
                <Trash2 className="w-3.5 h-3.5" /> Trash Bin ({trashedSuppliers.length})
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Direct Procurement Sources</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Private unregistered vendors created for Purchase Orders. Complete with contact directory, banking credentials & direct PO generation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsTrashView(!isTrashView)}
            className={cn(
              "px-3.5 py-2 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer",
              isTrashView
                ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            )}
            title={isTrashView ? "View Active Suppliers" : "View Trashed Suppliers"}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isTrashView ? "View Active" : `Trash (${trashedSuppliers.length})`}</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Direct Supplier</span>
          </button>
        </div>
      </div>

      {/* STATS METRICS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-slate-400">Total Direct Suppliers</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{metrics.totalSuppliers}</h3>
            <p className="text-[11px] text-emerald-600 font-bold mt-0.5">Active Directory</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-slate-400">Active Categories</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{metrics.activeCategories}</h3>
            <p className="text-[11px] text-blue-600 font-bold mt-0.5">Panels, Inverters, etc.</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-slate-400">Linked Purchase Orders</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{metrics.linkedPOCount}</h3>
            <p className="text-[11px] text-teal-600 font-bold mt-0.5">Auto-Accepted POs</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
            <ShoppingCart className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-slate-400">Total Sourced Value</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">₹{metrics.totalSpend.toLocaleString('en-IN')}</h3>
            <p className="text-[11px] text-purple-600 font-bold mt-0.5">Direct Procurement</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* SEARCH, FILTER CHIPS & VIEW SWITCHER */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by supplier, contact, phone, GSTIN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
            />
          </div>

          {/* View Toggles */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={cn(
                  "p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer",
                  viewMode === 'grid' ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
                )}
                title="Grid Cards View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Grid</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={cn(
                  "p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer",
                  viewMode === 'table' ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
                )}
                title="Table View"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Table</span>
              </button>
            </div>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar pt-1 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 uppercase shrink-0 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Category:
          </span>
          <button
            type="button"
            onClick={() => setSelectedCategory('ALL')}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer",
              selectedCategory === 'ALL'
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            All Suppliers ({currentList.length})
          </button>
          {allCategories.map(cat => {
            const count = currentList.filter(s => {
              const cats = s.categories || [s.category || ''];
              return cats.some(c => c.toLowerCase().includes(cat.toLowerCase()));
            }).length;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5",
                  selectedCategory === cat
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                <span>{cat.replace(/\(.*?\)/g, '').trim()}</span>
                <span className={cn(
                  "text-[10px] px-1.5 py-0.2 rounded-full",
                  selectedCategory === cat ? "bg-emerald-700 text-white" : "bg-slate-200 text-slate-600"
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SUPPLIERS CONTENT: GRID OR TABLE */}
      {filteredSuppliers.length === 0 ? (
        <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center text-slate-400 space-y-3 shadow-xs">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <h4 className="text-base font-black text-slate-800">
              {isTrashView ? 'Trash Bin is Empty' : 'No Direct Suppliers Found'}
            </h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {isTrashView
                ? 'Deleted direct suppliers will appear here. You can restore or permanently delete them.'
                : 'Click "+ Add Direct Supplier" to create suppliers private to your account for fast Purchase Order issuance.'}
            </p>
          </div>
          {!isTrashView && (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="mt-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> + Add Your First Direct Supplier
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredSuppliers.map(supplier => {
            const cats = supplier.categories && supplier.categories.length > 0
              ? supplier.categories
              : [supplier.category || 'Direct Supplier'];

            return (
              <div
                key={supplier.id}
                onClick={() => setSelectedSupplierForDetails(supplier)}
                className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md hover:border-emerald-300 transition-all relative group cursor-pointer"
              >
                {/* Top Actions: Edit / Trash */}
                <div className="absolute top-4 right-4 flex items-center gap-1 z-10">
                  {!isTrashView ? (
                    <>
                      <button
                        type="button"
                        onClick={(e) => handleOpenEditModal(supplier, e)}
                        className="p-1.5 hover:bg-blue-50 text-blue-500 hover:text-blue-700 rounded-lg transition-colors bg-white shadow-xs border border-slate-100 cursor-pointer"
                        title="Edit Supplier"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmId(supplier.id);
                          setIsPermanentDelete(false);
                        }}
                        className="p-1.5 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-colors bg-white shadow-xs border border-slate-100 cursor-pointer"
                        title="Move to Trash"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={(e) => handleRestoreFromTrash(supplier.id, e)}
                        className="p-1.5 hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 rounded-lg transition-colors bg-white shadow-xs border border-slate-100 cursor-pointer"
                        title="Restore Supplier"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmId(supplier.id);
                          setIsPermanentDelete(true);
                        }}
                        className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-colors bg-white shadow-xs border border-slate-100 cursor-pointer"
                        title="Delete Permanently"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>

                <div>
                  <div className="pr-16">
                    <div className="flex flex-wrap gap-1 mb-1.5">
                      {cats.slice(0, 2).map((c, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-black uppercase rounded-md border border-slate-200">
                          {c.replace(/\(.*?\)/g, '').trim()}
                        </span>
                      ))}
                      {cats.length > 2 && (
                        <span className="px-1.5 py-0.5 bg-slate-50 text-slate-500 text-[10px] font-bold rounded-md">
                          +{cats.length - 2}
                        </span>
                      )}
                    </div>
                    <h4 className="text-base font-black text-slate-900 leading-tight group-hover:text-emerald-700 transition-colors">
                      {supplier.name}
                    </h4>
                    {supplier.email ? (
                      <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" />
                        {supplier.email}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 font-medium mt-0.5 italic">No email registered</p>
                    )}
                  </div>

                  {/* Contact Info Box */}
                  <div className="mt-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5 text-xs text-slate-600 font-medium">
                    {supplier.contact && (
                      <p className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-400 uppercase text-[10px] w-14">Contact:</span>
                        <span className="text-slate-800 font-bold">{supplier.contact}</span>
                      </p>
                    )}
                    {supplier.phone && (
                      <p className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-400 uppercase text-[10px] w-14">Phone:</span>
                        <span className="text-slate-800">{supplier.phone}</span>
                      </p>
                    )}
                    <p className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-400 uppercase text-[10px] w-14">GSTIN:</span>
                      <span className={cn(supplier.gstin ? "text-slate-800 font-mono text-[11px]" : "text-slate-400 italic")}>
                        {supplier.gstin || 'NA'}
                      </span>
                    </p>
                    {supplier.city && (
                      <p className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-400 uppercase text-[10px] w-14">Location:</span>
                        <span className="text-slate-700">{supplier.city}{supplier.state ? `, ${supplier.state}` : ''}</span>
                      </p>
                    )}
                    {isGlobalAdmin && supplier.createdBy && (
                      <p className="text-[11px] text-teal-700 font-bold pt-1 border-t border-slate-100 mt-1">
                        Creator: {supplier.createdBy}
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer with Tag and Create PO Button */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-slate-400" /> Direct Sourcing
                  </span>
                  {!isTrashView ? (
                    <button
                      type="button"
                      onClick={(e) => handleCreatePoClick(supplier, e)}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> + Create PO
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => handleRestoreFromTrash(supplier.id, e)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Restore
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Supplier Name</th>
                  <th className="py-3 px-4">Categories</th>
                  <th className="py-3 px-4">Contact Person</th>
                  <th className="py-3 px-4">Phone / WhatsApp</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">GSTIN</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredSuppliers.map(supplier => (
                  <tr
                    key={supplier.id}
                    onClick={() => setSelectedSupplierForDetails(supplier)}
                    className="hover:bg-emerald-50/40 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4">
                      <div className="font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {supplier.name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {supplier.displayId || 'Direct Supplier'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-black uppercase rounded-md border border-slate-200">
                        {supplier.category || 'Solar Panels'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-800 font-bold">{supplier.contact || '—'}</td>
                    <td className="py-3 px-4 font-mono">{supplier.phone || '—'}</td>
                    <td className="py-3 px-4 text-slate-500">{supplier.email || '—'}</td>
                    <td className="py-3 px-4 font-mono text-[11px]">{supplier.gstin || 'NA'}</td>
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {!isTrashView ? (
                          <>
                            <button
                              type="button"
                              onClick={(e) => handleCreatePoClick(supplier, e)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" /> PO
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleOpenEditModal(supplier, e)}
                              className="p-1 hover:bg-blue-50 text-blue-500 rounded-lg transition-colors cursor-pointer"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirmId(supplier.id);
                                setIsPermanentDelete(false);
                              }}
                              className="p-1 hover:bg-red-50 text-red-500 rounded-lg transition-colors cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={(e) => handleRestoreFromTrash(supplier.id, e)}
                              className="px-2.5 py-1 bg-slate-900 text-white text-[11px] font-bold rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                            >
                              <RotateCcw className="w-3 h-3" /> Restore
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirmId(supplier.id);
                                setIsPermanentDelete(true);
                              }}
                              className="p-1 hover:bg-red-50 text-red-600 rounded-lg transition-colors cursor-pointer"
                              title="Delete Permanently"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT SUPPLIER MODAL */}
      {isFormModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-3 sm:p-4 animate-in fade-in-50">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {editingSupplierId ? 'Edit Direct Supplier' : 'Add Direct Supplier'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Private procurement source for Purchase Orders & automated stock replenishment
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="p-2 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveSupplier} className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Section 1: Basic Identity */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">
                  1. Company & Primary Identification
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Supplier / Company Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Vikram Solar Distribution, Shreeji Power Ltd."
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  {/* Categories Multi-Select */}
                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[11px] font-bold text-slate-700 uppercase">
                        Equipment / Product Categories <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsAddingNewCat(!isAddingNewCat)}
                        className="text-[11px] font-black text-emerald-600 hover:text-emerald-700 cursor-pointer"
                      >
                        {isAddingNewCat ? '✕ Cancel' : '+ Add Custom Category'}
                      </button>
                    </div>

                    {isAddingNewCat && (
                      <div className="mb-2 p-2.5 bg-emerald-50/50 rounded-xl border border-emerald-200 flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Type new category name..."
                          value={newCatInput}
                          onChange={(e) => setNewCatInput(e.target.value)}
                          className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold outline-none bg-white"
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddNewCategory(); } }}
                        />
                        <button
                          type="button"
                          onClick={handleAddNewCategory}
                          className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-bold text-xs hover:bg-emerald-700 cursor-pointer"
                        >
                          Save
                        </button>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                      {allCategories.map(cat => {
                        const isSelected = formData.categories.includes(cat);
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => {
                              const cur = formData.categories;
                              let next: string[];
                              if (isSelected) {
                                next = cur.filter(c => c !== cat);
                                if (next.length === 0) next = [allCategories[0]];
                              } else {
                                next = [...cur, cat];
                              }
                              setFormData({ ...formData, categories: next, category: next.join(', ') });
                            }}
                            className={cn(
                              "px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 border",
                              isSelected
                                ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                            )}
                          >
                            <span>{isSelected ? '✓ ' : ''}{cat}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Contact Information */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">
                  2. Contact Person & Communication
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Contact Person Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Rajesh Sharma"
                      value={formData.contact}
                      onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Phone Number (Primary)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. +91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="supplier@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Secondary Phone / WhatsApp
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. +91 99999 88888"
                      value={formData.secondaryPhone}
                      onChange={(e) => setFormData({ ...formData, secondaryPhone: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Tax & Address Details */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">
                  3. Tax & Registered Address
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      GSTIN Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 27AAAAA0000A1Z5"
                      value={formData.gstin}
                      onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono uppercase font-bold outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      PAN Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. ABCDE1234F"
                      value={formData.pan}
                      onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono uppercase font-bold outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Street Address
                    </label>
                    <input
                      type="text"
                      placeholder="Plot No., Industrial Area, Street..."
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Pune, Hyderabad, Delhi"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      State & Pincode
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="State"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        className="w-2/3 px-3 py-2 border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                      <input
                        type="text"
                        placeholder="Pincode"
                        value={formData.pincode}
                        onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                        className="w-1/3 px-3 py-2 border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4: Banking & Payment Terms */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">
                  4. Banking & Commercial Terms
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. HDFC Bank, ICICI Bank"
                      value={formData.bankName}
                      onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Account Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 50200012345678"
                      value={formData.bankAccountNumber}
                      onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Bank IFSC Code
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. HDFC0001234"
                      value={formData.bankIfsc}
                      onChange={(e) => setFormData({ ...formData, bankIfsc: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono uppercase outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Standard Payment Terms
                    </label>
                    <select
                      value={formData.paymentTerms}
                      onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold bg-white outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option value="100% Advance">100% Advance</option>
                      <option value="50% Advance, 50% on Dispatch">50% Advance, 50% on Dispatch</option>
                      <option value="Net 15 Days">Net 15 Days</option>
                      <option value="Net 30 Days">Net 30 Days</option>
                      <option value="Cash on Delivery (COD)">Cash on Delivery (COD)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 5: Notes */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 uppercase">
                  Internal Notes & Remarks
                </label>
                <textarea
                  rows={2}
                  placeholder="Special pricing agreements, warehouse locations, key contact notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Form Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingSupplierId ? 'Update Supplier' : 'Save Supplier'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUPPLIER DETAILS PROFILE MODAL */}
      {selectedSupplierForDetails && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-3 sm:p-4 animate-in fade-in-50">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 bg-slate-900 text-white flex justify-between items-start shrink-0">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-black shadow-md shadow-emerald-500/20 shrink-0">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-black uppercase tracking-wider">
                      Direct Sourcing Partner
                    </span>
                    {selectedSupplierForDetails.displayId && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        {selectedSupplierForDetails.displayId}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-black text-white mt-1">{selectedSupplierForDetails.name}</h3>
                  <p className="text-xs text-slate-300 font-medium">
                    {selectedSupplierForDetails.category || 'Direct Supplier'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSupplierForDetails(null)}
                className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
              {/* Quick Actions Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const sup = selectedSupplierForDetails;
                      setSelectedSupplierForDetails(null);
                      handleOpenEditModal(sup);
                    }}
                    className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-blue-500" />
                    <span>Edit Profile</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const id = selectedSupplierForDetails.id;
                      setDeleteConfirmId(id);
                      setIsPermanentDelete(false);
                    }}
                    className="px-3.5 py-2 bg-white hover:bg-red-50 text-red-600 border border-slate-200 font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    <span>Trash</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const sup = selectedSupplierForDetails;
                    setSelectedSupplierForDetails(null);
                    handleCreatePoClick(sup);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Create PO with this Supplier</span>
                </button>
              </div>

              {/* Grid Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Contact Box */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2">
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" /> Contact Information
                  </h4>
                  <div className="space-y-1.5 pt-1">
                    <p><span className="text-slate-400 font-bold">Contact Person:</span> {selectedSupplierForDetails.contact || 'Not provided'}</p>
                    <p><span className="text-slate-400 font-bold">Primary Phone:</span> {selectedSupplierForDetails.phone || 'Not provided'}</p>
                    {selectedSupplierForDetails.secondaryPhone && (
                      <p><span className="text-slate-400 font-bold">WhatsApp / Alt:</span> {selectedSupplierForDetails.secondaryPhone}</p>
                    )}
                    <p><span className="text-slate-400 font-bold">Email:</span> {selectedSupplierForDetails.email || 'Not provided'}</p>
                  </div>
                </div>

                {/* Tax & Commercial Box */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2">
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600" /> Tax & Commercial Terms
                  </h4>
                  <div className="space-y-1.5 pt-1">
                    <p><span className="text-slate-400 font-bold">GSTIN:</span> <span className="font-mono font-bold">{selectedSupplierForDetails.gstin || 'NA'}</span></p>
                    <p><span className="text-slate-400 font-bold">PAN:</span> <span className="font-mono font-bold">{selectedSupplierForDetails.pan || 'NA'}</span></p>
                    <p><span className="text-slate-400 font-bold">Payment Terms:</span> <span className="font-bold text-slate-900">{selectedSupplierForDetails.paymentTerms || '100% Advance'}</span></p>
                    <p><span className="text-slate-400 font-bold">Status:</span> <span className="text-emerald-700 font-bold">Active Offline Vendor</span></p>
                  </div>
                </div>

                {/* Banking Box */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2">
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-purple-600" /> Banking Credentials
                  </h4>
                  <div className="space-y-1.5 pt-1">
                    <p><span className="text-slate-400 font-bold">Bank Name:</span> {selectedSupplierForDetails.bankName || 'Not configured'}</p>
                    <p><span className="text-slate-400 font-bold">Account Number:</span> <span className="font-mono">{selectedSupplierForDetails.bankAccountNumber || 'Not configured'}</span></p>
                    <p><span className="text-slate-400 font-bold">IFSC Code:</span> <span className="font-mono uppercase font-bold">{selectedSupplierForDetails.bankIfsc || 'Not configured'}</span></p>
                  </div>
                </div>

                {/* Address Box */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2">
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-600" /> Registered Location
                  </h4>
                  <div className="space-y-1.5 pt-1">
                    <p>{selectedSupplierForDetails.address || 'Address not specified'}</p>
                    <p className="font-bold text-slate-800">
                      {[selectedSupplierForDetails.city, selectedSupplierForDetails.state, selectedSupplierForDetails.pincode].filter(Boolean).join(', ') || '—'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Linked Purchase Orders History */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1 flex items-center justify-between">
                  <span>Linked Purchase Orders History</span>
                  <span className="text-[10px] font-bold text-slate-500">
                    {purchaseOrders.filter(p => (p.vendor || '').toLowerCase() === selectedSupplierForDetails.name.toLowerCase()).length} POs Found
                  </span>
                </h4>

                {purchaseOrders.filter(p => (p.vendor || '').toLowerCase() === selectedSupplierForDetails.name.toLowerCase()).length === 0 ? (
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center text-slate-400">
                    <ShoppingCart className="w-8 h-8 mx-auto text-slate-300 mb-1" />
                    <p className="font-bold">No Purchase Orders placed with this supplier yet.</p>
                    <p className="text-[11px] text-slate-400">Click "+ Create PO" above to generate a PO for this supplier.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {purchaseOrders
                      .filter(p => (p.vendor || '').toLowerCase() === selectedSupplierForDetails.name.toLowerCase())
                      .map(po => (
                        <div key={po.id} className="p-3.5 bg-slate-50 hover:bg-emerald-50/40 rounded-xl border border-slate-200 flex items-center justify-between transition-colors">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-slate-900">{po.displayId || po.id}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
                                {po.status || 'Accepted'}
                              </span>
                              <span className="text-[10px] text-slate-400">{po.date}</span>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-1 line-clamp-1">{po.items || 'Solar Equipment'}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-black text-slate-900">₹{(po.amount || 0).toLocaleString('en-IN')}</span>
                            <p className="text-[10px] text-slate-400">Total Value</p>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[250] flex items-center justify-center p-4 animate-in fade-in-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-black text-slate-900">
                {isPermanentDelete ? 'Permanently Delete Supplier?' : 'Move Supplier to Trash?'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {isPermanentDelete
                  ? 'This action cannot be undone. All supplier records will be permanently removed from the database.'
                  : 'The supplier will be moved to the Trash bin. You can restore it anytime from the Trash tab.'}
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (isPermanentDelete) {
                    handlePermanentDelete(deleteConfirmId);
                  } else {
                    handleMoveToTrash(deleteConfirmId);
                  }
                }}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors cursor-pointer"
              >
                {isPermanentDelete ? 'Delete Forever' : 'Move to Trash'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK INLINE PO CREATOR MODAL (FALLBACK IF ONCREATEPO NOT PASSED) */}
      {standalonePoSupplier && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-3 sm:p-4 animate-in fade-in-50">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-emerald-600" />
                  Create Direct PO for {standalonePoSupplier.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Unregistered supplier order: Auto-accepted & stock instantly added to your inventory
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStandalonePoSupplier(null)}
                className="p-1.5 hover:bg-slate-200 text-slate-400 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStandalonePoSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Item / Component Name</label>
                <input
                  type="text"
                  required
                  value={standalonePoItem.name}
                  onChange={(e) => setStandalonePoItem({ ...standalonePoItem, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={standalonePoItem.quantity}
                    onChange={(e) => setStandalonePoItem({ ...standalonePoItem, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Unit</label>
                  <select
                    value={standalonePoItem.unit}
                    onChange={(e) => setStandalonePoItem({ ...standalonePoItem, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold bg-white outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="KW">KW</option>
                    <option value="PCS">PCS</option>
                    <option value="MTR">MTR</option>
                    <option value="TON">TON</option>
                    <option value="KG">KG</option>
                    <option value="MW">MW</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Unit Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={standalonePoItem.unitPrice}
                    onChange={(e) => setStandalonePoItem({ ...standalonePoItem, unitPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Total Purchase Value (+12% GST)</p>
                  <p className="text-base font-black text-slate-900">
                    ₹{Math.round((standalonePoItem.unitPrice * standalonePoItem.quantity) * 1.12).toLocaleString('en-IN')}
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={isSubmittingStandalonePo}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingStandalonePo ? 'Generating PO...' : 'Confirm & Add Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
