import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sliders, 
  Users, 
  ShieldCheck, 
  MapPin, 
  Percent, 
  Package, 
  IndianRupee, 
  CheckSquare, 
  List,
  Download,
  FileSpreadsheet,
  Plus,
  UserPlus,
  Image as ImageIcon,
  Upload,
  Check,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  Trash2,
  Building2,
  Edit2,
  X,
  Sun,
  Search,
  Filter,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  Shield,
  CreditCard,
  Building,
  UserCheck,
  LayoutGrid,
  ChevronUp,
  ChevronDown,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Gift,
  Receipt,
  Landmark,
  Zap,
  Globe
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { exportToPDF, exportToExcel } from '@/src/lib/exportUtils';
import { collection, query, onSnapshot, addDoc, serverTimestamp, orderBy, deleteDoc, doc, updateDoc, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { useLogos } from '@/src/context/LogoContext';
import { useAuth } from '@/src/context/AuthContext';
import { useToast } from '@/src/context/ToastContext';

import { METAGREEN_LOGO_BASE64 } from '@/src/assets/logoDataUrl';

import SubscriptionManagement from './SubscriptionManagement';
import { DynamicRolesManager } from './settings/DynamicRolesManager';
import { SubscriberWebsitesManager } from './settings/SubscriberWebsitesManager';
import {
  DROPDOWN_CATEGORIES,
  DropdownCategoryKey,
  DropdownOption,
  subscribeDropdownOptions,
  addDropdownOption,
  updateDropdownOption,
  deleteDropdownOption,
  seedCategoryDefaults
} from '@/src/services/dropdownMaster.service';

type TabType = 'logos' | 'subscriptions' | 'coupons' | 'users' | 'roles' | 'subscriber-websites' | 'dropdowns' | 'roof-types' | 'states' | 'products' | 'approvals' | 'audit' | 'purge';

const USER_ROLES = [
  'Super Admin',
  'Solar Company Admin',
  'Regional Manager',
  'Sales Executive',
  'Survey Engineer',
  'Design Engineer',
  'Procurement Officer',
  'Warehouse Manager',
  'Installer',
  'Solar Installer',
  'Project Manager',
  'Finance Manager',
  'HR Manager',
  'Customer Support',
  'Customer',
  'Vendor',
  'Vendor Employee',
  'Auditor'
];

const getDropdownCategoryIcon = (iconName: string) => {
  switch (iconName) {
    case 'Receipt': return Receipt;
    case 'Users': return Users;
    case 'Filter': return Filter;
    case 'Sun': return Sun;
    case 'IndianRupee': return IndianRupee;
    case 'CreditCard': return CreditCard;
    case 'Package': return Package;
    case 'Building2': return Building2;
    case 'Building': return Building;
    case 'Landmark': return Landmark;
    case 'Zap': return Zap;
    default: return Sliders;
  }
};

const CATEGORY_THEMES: Record<DropdownCategoryKey, {
  bg: string;
  iconBg: string;
  iconColor: string;
  badgeBg: string;
  badgeText: string;
  borderHover: string;
}> = {
  expense_types: {
    bg: 'hover:bg-emerald-50/50',
    iconBg: 'bg-emerald-100/90',
    iconColor: 'text-emerald-700',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700 border-emerald-200',
    borderHover: 'hover:border-emerald-400'
  },
  lead_sources: {
    bg: 'hover:bg-blue-50/50',
    iconBg: 'bg-blue-100/90',
    iconColor: 'text-blue-700',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700 border-blue-200',
    borderHover: 'hover:border-blue-400'
  },
  lead_stages: {
    bg: 'hover:bg-indigo-50/50',
    iconBg: 'bg-indigo-100/90',
    iconColor: 'text-indigo-700',
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-700 border-indigo-200',
    borderHover: 'hover:border-indigo-400'
  },
  project_stages: {
    bg: 'hover:bg-amber-50/50',
    iconBg: 'bg-amber-100/90',
    iconColor: 'text-amber-700',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-700 border-amber-200',
    borderHover: 'hover:border-amber-400'
  },
  payment_stages: {
    bg: 'hover:bg-teal-50/50',
    iconBg: 'bg-teal-100/90',
    iconColor: 'text-teal-700',
    badgeBg: 'bg-teal-50',
    badgeText: 'text-teal-700 border-teal-200',
    borderHover: 'hover:border-teal-400'
  },
  payment_modes: {
    bg: 'hover:bg-rose-50/50',
    iconBg: 'bg-rose-100/90',
    iconColor: 'text-rose-700',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-700 border-rose-200',
    borderHover: 'hover:border-rose-400'
  },
  inventory_categories: {
    bg: 'hover:bg-cyan-50/50',
    iconBg: 'bg-cyan-100/90',
    iconColor: 'text-cyan-700',
    badgeBg: 'bg-cyan-50',
    badgeText: 'text-cyan-700 border-cyan-200',
    borderHover: 'hover:border-cyan-400'
  },
  supplier_categories: {
    bg: 'hover:bg-purple-50/50',
    iconBg: 'bg-purple-100/90',
    iconColor: 'text-purple-700',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-700 border-purple-200',
    borderHover: 'hover:border-purple-400'
  },
  structure_types: {
    bg: 'hover:bg-slate-100/70',
    iconBg: 'bg-slate-200/90',
    iconColor: 'text-slate-800',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-700 border-slate-300',
    borderHover: 'hover:border-slate-400'
  },
  banks: {
    bg: 'hover:bg-emerald-50/50',
    iconBg: 'bg-emerald-100/90',
    iconColor: 'text-emerald-700',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700 border-emerald-200',
    borderHover: 'hover:border-emerald-400'
  },
  discoms: {
    bg: 'hover:bg-yellow-50/50',
    iconBg: 'bg-yellow-100/90',
    iconColor: 'text-yellow-700',
    badgeBg: 'bg-yellow-50',
    badgeText: 'text-yellow-700 border-yellow-200',
    borderHover: 'hover:border-yellow-400'
  }
};

interface MasterSettingsProps {
  initialModule?: TabType;
}

export default function MasterSettings({ initialModule }: MasterSettingsProps = {}) {
  const { user } = useAuth();
  const { toast } = useToast();

  const isGlobalAdmin = !user || user.role === 'Super Admin' || user.role === 'Solar Company Admin';
  const userOrg = (user?.companyName || '').trim();
  const currentUid = user?.uid || '';
  const currentEmail = (user?.email || '').trim().toLowerCase();

  const [selectedModule, setSelectedModule] = useState<TabType | null>(initialModule || null);
  const [activeTab, setActiveTab] = useState<TabType>(initialModule || (isGlobalAdmin ? 'logos' : 'users'));
  const [lastVisitedModule, setLastVisitedModule] = useState<TabType | null>(null);
  const [cardSearchQuery, setCardSearchQuery] = useState('');

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePop = (e: PopStateEvent) => {
      if (e.state && e.state.masterModule) {
        setSelectedModule(e.state.masterModule);
        setActiveTab(e.state.masterModule);
        if (e.state.masterModule === 'dropdowns') {
          setActiveDropdownCategory(null);
        }
      } else {
        setSelectedModule(null);
        setActiveDropdownCategory(null);
      }
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  // When returning to cards directory, smoothly scroll to last visited card
  useEffect(() => {
    if (!selectedModule && lastVisitedModule) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`card-${lastVisitedModule}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedModule, lastVisitedModule]);

  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [roofTypesList, setRoofTypesList] = useState<any[]>([]);
  const [isRoofModalOpen, setIsRoofModalOpen] = useState(false);
  const [editingRoofId, setEditingRoofId] = useState<string | null>(null);
  const [roofForm, setRoofForm] = useState({
    name: '',
    description: '',
    structureType: 'Flush Mount / Mini Rail',
    tiltAngle: '15°',
    status: 'Active'
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Dropdown Masters State
  const [activeDropdownCategory, setActiveDropdownCategory] = useState<DropdownCategoryKey | null>(null);
  const [selectedDropdownCategory, setSelectedDropdownCategory] = useState<DropdownCategoryKey>('expense_types');
  const [dropdownCategorySearch, setDropdownCategorySearch] = useState('');
  const [dropdownCategoryScopeFilter, setDropdownCategoryScopeFilter] = useState<'All' | 'Finance' | 'CRM' | 'Projects' | 'Inventory' | 'Procurement' | 'General'>('All');
  const [dropdownOptionsViewMode, setDropdownOptionsViewMode] = useState<'cards' | 'table'>('cards');
  const [dropdownOptionsList, setDropdownOptionsList] = useState<DropdownOption[]>([]);
  const [dropdownOptionSearch, setDropdownOptionSearch] = useState('');
  const [dropdownStatusFilter, setDropdownStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [isAddOptionModalOpen, setIsAddOptionModalOpen] = useState(false);
  const [editingOption, setEditingOption] = useState<DropdownOption | null>(null);
  const [optionForm, setOptionForm] = useState({
    name: '',
    code: '',
    description: '',
    status: 'Active' as 'Active' | 'Inactive'
  });
  const [isSavingOption, setIsSavingOption] = useState(false);
  const [deleteConfirmOption, setDeleteConfirmOption] = useState<DropdownOption | null>(null);
  const [isDeletingOption, setIsDeletingOption] = useState(false);
  const [isRestoringDefaults, setIsRestoringDefaults] = useState(false);
  const [dropdownCategoryCounts, setDropdownCategoryCounts] = useState<Record<string, number>>({});

  // Search & filter state for Users Master
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('All');
  const [userStatusFilter, setUserStatusFilter] = useState('All');

  // Edit User State
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editUserForm, setEditUserForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Sales Executive',
    companyName: '',
    status: 'Active',
    resetPassword: false,
    newPassword: '',
    showPassword: false
  });

  const { logos, updateLogos, resetLogos } = useLogos();

  const [companyName, setCompanyName] = useState(logos.companyName || 'METAGREEN');
  const [tagline, setTagline] = useState(logos.tagline || 'Solar Enterprise ERP');

  useEffect(() => {
    setCompanyName(logos.companyName || 'METAGREEN');
    setTagline(logos.tagline || 'Solar Enterprise ERP');
  }, [logos]);

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    role: isGlobalAdmin ? 'Sales Executive' : 'Vendor Employee',
    companyName: '',
    status: 'Active',
    tempPassword: 'User123!',
    showPassword: false
  });

  // Keep activeTab safe if role is not global admin
  useEffect(() => {
    if (!isGlobalAdmin && (activeTab === 'subscriptions' || activeTab === 'subscriber-websites' || activeTab === 'purge' || activeTab === 'audit' || activeTab === 'states' || activeTab === 'approvals')) {
      setActiveTab('users');
    }
  }, [isGlobalAdmin, activeTab]);

  useEffect(() => {
    const unsubUsers = onSnapshot(query(collection(db, 'users'), orderBy('name', 'asc')), (snapshot) => {
      setUsersList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubAudit = onSnapshot(query(collection(db, 'auditLogs'), orderBy('createdAt', 'desc')), (snapshot) => {
      setAuditLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubRoofs = onSnapshot(collection(db, 'roofTypes'), (snapshot) => {
      if (snapshot.empty) {
        const initialRoofTypes = [
          { name: 'RCC Flat Roof', description: 'Concrete Slab with south-facing ballasted or anchor mounts', structureType: 'Ballasted / Anchor Fixed Tilt', tiltAngle: '15° - 20°', status: 'Active' },
          { name: 'Tin / Metal Shed', description: 'Industrial trapezoidal or standing seam sheet with mini-rails', structureType: 'Mini Rail / Klip-lok Clamps', tiltAngle: 'Parallel to Roof (3° - 10°)', status: 'Active' },
          { name: 'Tiled / Mangalore Roof', description: 'Pitched traditional clay/cement tiles with stainless steel rafter hooks', structureType: 'Tile Hooks & Profile Rails', tiltAngle: 'Pitch Slope (20° - 35°)', status: 'Active' },
          { name: 'Asbestos Sheet', description: 'Corrugated cement asbestos roof with hanger bolts and rubber seals', structureType: 'Hanger Bolts & Long Rails', tiltAngle: 'Parallel to Roof', status: 'Active' },
          { name: 'Ground Mount Structure', description: 'Open field piled ground mount with seasonal tilt adjustment', structureType: 'GI Piled Foundation Fixed Tilt', tiltAngle: '20° - 25°', status: 'Active' },
          { name: 'Elevated Super Structure', description: 'Elevated rooftop gazebo / solar terrace enabling usable roof space below', structureType: 'High Elevated Heavy MS/GI Columns', tiltAngle: '12° - 15°', status: 'Active' }
        ];
        initialRoofTypes.forEach(rt => {
          addDoc(collection(db, 'roofTypes'), { ...rt, createdAt: serverTimestamp() });
        });
      } else {
        setRoofTypesList(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    });

    return () => { unsubUsers(); unsubAudit(); unsubRoofs(); };
  }, []);

  // Subscribe to current category dropdown options
  useEffect(() => {
    const unsub = subscribeDropdownOptions(selectedDropdownCategory, (options) => {
      setDropdownOptionsList(options);
    });
    return () => unsub();
  }, [selectedDropdownCategory]);

  // Track counts across all categories
  useEffect(() => {
    const qAll = query(collection(db, 'systemDropdownMasters'));
    const unsubAll = onSnapshot(qAll, (snapshot) => {
      const counts: Record<string, number> = {};
      DROPDOWN_CATEGORIES.forEach(c => {
        counts[c.key] = c.defaults.length;
      });
      snapshot.docs.forEach(docSnap => {
        const cat = docSnap.data().category;
        if (cat) {
          const fsKey = `fs_${cat}`;
          counts[fsKey] = (counts[fsKey] || 0) + 1;
        }
      });
      DROPDOWN_CATEGORIES.forEach(c => {
        const fsKey = `fs_${c.key}`;
        if (counts[fsKey] !== undefined) {
          counts[c.key] = counts[fsKey];
        }
      });
      setDropdownCategoryCounts(counts);
    });
    return () => unsubAll();
  }, []);

  // Dropdown Masters Actions
  const handleOpenAddOption = () => {
    setEditingOption(null);
    setOptionForm({
      name: '',
      code: '',
      description: '',
      status: 'Active'
    });
    setIsAddOptionModalOpen(true);
  };

  const handleOpenEditOption = (option: DropdownOption) => {
    setEditingOption(option);
    setOptionForm({
      name: option.name,
      code: option.code || '',
      description: option.description || '',
      status: option.status || 'Active'
    });
    setIsAddOptionModalOpen(true);
  };

  const handleSaveOption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!optionForm.name.trim()) {
      toast.error('Option name is required', 'Validation Error');
      return;
    }

    setIsSavingOption(true);
    try {
      if (editingOption) {
        if (editingOption.isDefault || editingOption.id.startsWith('default-')) {
          await addDropdownOption(selectedDropdownCategory, {
            name: optionForm.name.trim(),
            code: optionForm.code.trim().toUpperCase(),
            description: optionForm.description.trim(),
            status: optionForm.status
          });
        } else {
          await updateDropdownOption(editingOption.id, {
            name: optionForm.name.trim(),
            code: optionForm.code.trim().toUpperCase(),
            description: optionForm.description.trim(),
            status: optionForm.status
          });
        }
        toast.success(`Updated "${optionForm.name.trim()}" successfully!`, 'Option Updated');
      } else {
        await addDropdownOption(selectedDropdownCategory, {
          name: optionForm.name.trim(),
          code: optionForm.code.trim().toUpperCase(),
          description: optionForm.description.trim(),
          status: optionForm.status
        });
        toast.success(`Added "${optionForm.name.trim()}" successfully!`, 'Option Created');
      }
      setIsAddOptionModalOpen(false);
      setEditingOption(null);
    } catch (err: any) {
      console.error('Error saving dropdown option:', err);
      toast.error(err.message || 'Failed to save option. Please try again.', 'Save Error');
    } finally {
      setIsSavingOption(false);
    }
  };

  const handleToggleOptionStatus = async (option: DropdownOption) => {
    const newStatus = option.status === 'Active' ? 'Inactive' : 'Active';
    try {
      if (option.isDefault || option.id.startsWith('default-')) {
        await addDropdownOption(selectedDropdownCategory, {
          name: option.name,
          code: option.code || '',
          description: option.description || '',
          status: newStatus
        });
      } else {
        await updateDropdownOption(option.id, { status: newStatus });
      }
      toast.success(`Option marked as ${newStatus}`, 'Status Updated');
    } catch (err: any) {
      console.error('Error toggling status:', err);
      toast.error('Failed to update status', 'Error');
    }
  };

  const handleDeleteOption = async (option: DropdownOption) => {
    if (!window.confirm(`Are you sure you want to delete "${option.name}"?`)) {
      return;
    }

    try {
      if (option.isDefault || option.id.startsWith('default-')) {
        toast.info('Default options cannot be permanently deleted. You can mark them Inactive instead.', 'Notice');
        await handleToggleOptionStatus(option);
      } else {
        await deleteDropdownOption(option.id);
        toast.success(`Deleted "${option.name}" successfully`, 'Option Deleted');
      }
    } catch (err: any) {
      console.error('Error deleting option:', err);
      toast.error('Failed to delete option', 'Error');
    }
  };

  const handleSeedDefaults = async () => {
    const catMeta = DROPDOWN_CATEGORIES.find(c => c.key === selectedDropdownCategory);
    if (!window.confirm(`Restore standard default options for "${catMeta?.title || selectedDropdownCategory}"?`)) {
      return;
    }

    setIsRestoringDefaults(true);
    try {
      await seedCategoryDefaults(selectedDropdownCategory);
      toast.success(`Default options restored for ${catMeta?.title}!`, 'Defaults Seeded');
    } catch (err: any) {
      console.error('Error restoring defaults:', err);
      toast.error('Failed to restore defaults', 'Error');
    } finally {
      setIsRestoringDefaults(false);
    }
  };

  const [isClearingData, setIsClearingData] = useState(false);
  const [clearProgress, setClearProgress] = useState('');

  const handleClearAllData = async () => {
    if (!window.confirm("WARNING: This will permanently delete ALL operational records (CRM leads, projects, tasks, quotations, invoices, finance transactions, inventory, and support tickets) across the entire ERP. Are you sure you want to proceed?")) {
      return;
    }
    const secondConfirm = window.prompt("Type 'CLEAR ALL' in capital letters to confirm permanent data wipe:");
    if (secondConfirm !== 'CLEAR ALL') {
      alert("Action cancelled. Data was not modified.");
      return;
    }

    setIsClearingData(true);
    setClearProgress('Initiating database wipe...');
    try {
      const collectionsToClear = [
        'leads',
        'projects',
        'projectTasks',
        'projectDocuments',
        'siteSurveys',
        'quotationVersions',
        'proposals',
        'financeTransactions',
        'financeLoans',
        'financeExpenseTypes',
        'siteConsumptions',
        'inventory',
        'inventoryPurchases',
        'inventoryRequisitions',
        'warranties',
        'workOrders',
        'supportTickets',
        'supportTicketCategories',
        'vendors',
        'purchaseOrders',
        'vendorInvoices',
        'vendorPayments',
        'vendorEmployees',
        'vendorTasks',
        'contactInquiries',
        'auditLogs',
        'attendance',
        'mail'
      ];

      for (const colName of collectionsToClear) {
        setClearProgress(`Wiping ${colName}...`);
        const colRef = collection(db, colName);
        const snapshot = await getDocs(colRef);
        if (!snapshot.empty) {
          let batch = writeBatch(db);
          let count = 0;
          for (const d of snapshot.docs) {
            batch.delete(doc(db, colName, d.id));
            count++;
            if (count === 450) {
              await batch.commit();
              batch = writeBatch(db);
              count = 0;
            }
          }
          if (count > 0) {
            await batch.commit();
          }
        }
      }

      setClearProgress('All operational records cleared successfully!');
      alert('Success: All operational ERP data has been completely cleared!');
    } catch (err: any) {
      console.error('Error clearing data:', err);
      alert('Error clearing data: ' + (err.message || err));
    } finally {
      setIsClearingData(false);
      setTimeout(() => setClearProgress(''), 4000);
    }
  };

  // Handle Logo Upload to Base64
  const handleFileUpload = (key: 'companyLogo' | 'watermarkLogo' | 'officialSeal' | 'paymentQrCode', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        updateLogos({ [key]: base64String });
        triggerSaveSuccess();
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerSaveSuccess = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Load sample logos for quick demo
  const handleLoadSampleLogos = () => {
    const sampleSealSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><circle cx="100" cy="100" r="90" fill="none" stroke="%23047857" stroke-width="8"/><circle cx="100" cy="100" r="80" fill="none" stroke="%23047857" stroke-width="2"/><text x="100" y="90" font-family="Arial" font-size="14" font-weight="bold" fill="%23047857" text-anchor="middle">METAGREEN</text><text x="100" y="115" font-family="Arial" font-size="14" font-weight="bold" fill="%23047857" text-anchor="middle">APPROVED SEAL</text></svg>`;

    const sampleQrSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%23ffffff"/><rect x="20" y="20" width="160" height="160" fill="none" stroke="%23000000" stroke-width="4"/><rect x="40" y="40" width="40" height="40" fill="%23047857"/><rect x="120" y="40" width="40" height="40" fill="%23047857"/><rect x="40" y="120" width="40" height="40" fill="%23047857"/><text x="100" y="105" font-family="Arial" font-size="12" font-weight="bold" fill="%23047857" text-anchor="middle">UPI SCAN QR</text></svg>`;

    updateLogos({
      companyLogo: METAGREEN_LOGO_BASE64,
      watermarkLogo: METAGREEN_LOGO_BASE64,
      officialSeal: sampleSealSvg,
      paymentQrCode: sampleQrSvg,
      companyName: 'METAGREEN',
      tagline: 'Solar Enterprise ERP'
    });
    triggerSaveSuccess();
  };

  // Scoped users: Global Admin gets ALL users; Specified Login gets ONLY their organization / team users
  const scopedUsers = useMemo(() => {
    if (isGlobalAdmin) {
      return usersList;
    }

    return usersList.filter(u => {
      const uCompany = (u.companyName || '').trim().toLowerCase();
      const myCompany = userOrg.toLowerCase();

      // 1. Company match
      if (myCompany && uCompany && (myCompany === uCompany || uCompany.includes(myCompany) || myCompany.includes(uCompany))) {
        return true;
      }

      // 2. Created by this user
      if (u.createdBy && (u.createdBy === currentUid || (u.creatorEmail && u.creatorEmail.toLowerCase() === currentEmail))) {
        return true;
      }

      // 3. Linked via vendorId or vendorName
      if (u.vendorId && (u.vendorId === currentUid || u.vendorId === user?.companyName)) {
        return true;
      }

      // 4. Match self
      if (u.id === currentUid || u.uid === currentUid || (u.email && u.email.toLowerCase() === currentEmail)) {
        return true;
      }

      return false;
    });
  }, [usersList, isGlobalAdmin, userOrg, currentUid, currentEmail, user?.companyName]);

  // Filtered users based on search query, role, and status
  const displayUsers = useMemo(() => {
    return scopedUsers.filter(u => {
      if (userSearchQuery.trim()) {
        const q = userSearchQuery.toLowerCase();
        const matchName = u.name?.toLowerCase().includes(q);
        const matchEmail = u.email?.toLowerCase().includes(q);
        const matchRole = u.role?.toLowerCase().includes(q);
        const matchCompany = u.companyName?.toLowerCase().includes(q);
        const matchPhone = u.phone?.toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchRole && !matchCompany && !matchPhone) return false;
      }

      if (userRoleFilter !== 'All' && u.role !== userRoleFilter) return false;
      if (userStatusFilter !== 'All' && u.status !== userStatusFilter) return false;

      return true;
    });
  }, [scopedUsers, userSearchQuery, userRoleFilter, userStatusFilter]);

  // Summary Metrics for currently scoped users
  const userMetrics = useMemo(() => {
    const total = scopedUsers.length;
    const active = scopedUsers.filter(u => u.status === 'Active').length;
    const pending = scopedUsers.filter(u => u.status === 'Pending').length;
    const inactive = scopedUsers.filter(u => u.status === 'Inactive' || u.status === 'Rejected').length;
    return { total, active, pending, inactive };
  }, [scopedUsers]);

  // Allowed roles for creation and editing
  const allowedRoles = useMemo(() => {
    if (isGlobalAdmin) {
      return USER_ROLES;
    }
    if (user?.role === 'Vendor') {
      return ['Vendor Employee', 'Installer', 'Solar Installer', 'Sales Executive', 'Survey Engineer', 'Warehouse Manager'];
    }
    return ['Sales Executive', 'Survey Engineer', 'Design Engineer', 'Installer', 'Warehouse Manager', 'Vendor Employee'];
  }, [isGlobalAdmin, user?.role]);

  // Tab definitions dynamically scoped to role
  const availableTabs = useMemo(() => {
    if (isGlobalAdmin) {
      return [
        { 
          id: 'logos', 
          label: 'Import Logos & Branding', 
          icon: ImageIcon,
          description: 'Upload primary company logos, invoice headers, and light/dark theme assets.',
          badge: 'Branding & UI',
          iconBg: 'bg-amber-100 text-amber-600'
        },
        ...(user?.role === 'Super Admin' ? [
          { 
            id: 'subscriptions', 
            label: 'Subscription Plans & Trials', 
            icon: CreditCard,
            description: 'Annual & Monthly SaaS packages, user limits, 20% annual discount & trials.',
            badge: 'Annual & Monthly Plans',
            iconBg: 'bg-emerald-100 text-emerald-600'
          },
          { 
            id: 'coupons', 
            label: 'Coupons & Person Discounts', 
            icon: Gift,
            description: 'Promo codes, % or fixed ₹ off, usage limits, and particular person email restrictions.',
            badge: 'Coupons & Promos',
            iconBg: 'bg-teal-100 text-teal-600'
          },
          { 
            id: 'subscriber-websites', 
            label: 'Subscriber Websites', 
            icon: Globe,
            description: 'Tenant-specific website branding, themes, domains, and plan-gated capabilities.',
            badge: 'Multi-Tenant Sites',
            iconBg: 'bg-indigo-100 text-indigo-600'
          }
        ] : []),
        { 
          id: 'users', 
          label: 'System Users', 
          icon: Users,
          description: 'Manage administrative staff, vendor accounts, regional managers, and user credentials.',
          badge: 'Team & Accounts',
          iconBg: 'bg-blue-100 text-blue-600'
        },
        { 
          id: 'roles', 
          label: 'Roles & Permissions', 
          icon: ShieldCheck,
          description: 'Granular RBAC permission matrix, module restrictions, and role authorization levels.',
          badge: 'Security & Access',
          iconBg: 'bg-purple-100 text-purple-600'
        },
        { 
          id: 'dropdowns', 
          label: 'Dropdown Masters', 
          icon: Sliders,
          description: 'Configurable options for Lead Sources, Customer Types, Inverters, Panels & BOS items.',
          badge: 'Lookup Data',
          iconBg: 'bg-cyan-100 text-cyan-600'
        },
        { 
          id: 'roof-types', 
          label: 'Roof Types Master', 
          icon: Building2,
          description: 'Rooftop engineering structures: RCC Flat, Tin Shade, Tiled, and Mini-Rail brackets.',
          badge: 'Solar Tech',
          iconBg: 'bg-sky-100 text-sky-600'
        },
        { 
          id: 'states', 
          label: 'States & Taxes', 
          icon: Percent,
          description: 'State tax rates, CGST/SGST/IGST breakdown, and regional DISCOM electricity boards.',
          badge: 'Tax & Compliance',
          iconBg: 'bg-violet-100 text-violet-600'
        },
        { 
          id: 'products', 
          label: 'Products & Pricing', 
          icon: Package,
          description: 'Solar panels, inverters, battery packs, BOS equipment, and retail catalog pricing.',
          badge: 'Hardware Catalog',
          iconBg: 'bg-emerald-100 text-emerald-600'
        },
        { 
          id: 'approvals', 
          label: 'Approval Rules', 
          icon: CheckSquare,
          description: 'Multi-stage approval hierarchies for quotes, discounts, and purchase orders.',
          badge: 'Workflows',
          iconBg: 'bg-amber-100 text-amber-600'
        },
        { 
          id: 'audit', 
          label: 'Audit Logs', 
          icon: List,
          description: 'System-wide event logs, security actions, timestamp records, and access histories.',
          badge: 'Activity Audit',
          iconBg: 'bg-slate-100 text-slate-700'
        },
        { 
          id: 'purge', 
          label: 'System Reset & Data Purge', 
          icon: Trash2,
          description: 'Danger Zone: Wipe operational records, remove test leads, and factory reset tables.',
          badge: 'Danger Zone',
          iconBg: 'bg-red-100 text-red-600'
        },
      ];
    }
    // Specified logins (Vendor, Installer, Regional Manager, etc.)
    return [
      { 
        id: 'users', 
        label: 'Team & Users', 
        icon: Users,
        description: 'Manage staff and user accounts for your organization.',
        badge: 'Team & Access',
        iconBg: 'bg-blue-100 text-blue-600'
      },
      { 
        id: 'roles', 
        label: 'Roles & Permissions', 
        icon: ShieldCheck,
        description: 'Review role privileges and employee access permissions.',
        badge: 'Permissions',
        iconBg: 'bg-purple-100 text-purple-600'
      },
      { 
        id: 'dropdowns', 
        label: 'Dropdown Masters', 
        icon: Sliders,
        description: 'Custom lookup values for leads, quotes, and categories.',
        badge: 'Lookups',
        iconBg: 'bg-cyan-100 text-cyan-600'
      },
      { 
        id: 'roof-types', 
        label: 'Roof Types Master', 
        icon: Building2,
        description: 'Roof structures and installation mounting guidelines.',
        badge: 'Solar Tech',
        iconBg: 'bg-sky-100 text-sky-600'
      },
      { 
        id: 'products', 
        label: 'Products & Pricing', 
        icon: Package,
        description: 'Manage your custom products, panels, inverters, and items.',
        badge: 'Catalog',
        iconBg: 'bg-emerald-100 text-emerald-600'
      },
      { 
        id: 'logos', 
        label: 'Company Branding', 
        icon: ImageIcon,
        description: 'Upload company logo for invoices and project proposals.',
        badge: 'Branding',
        iconBg: 'bg-amber-100 text-amber-600'
      },
    ];
  }, [isGlobalAdmin, user?.role]);

  const filteredTabs = useMemo(() => {
    if (!cardSearchQuery.trim()) return availableTabs;
    const q = cardSearchQuery.toLowerCase();
    return availableTabs.filter(t =>
      t.label.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.badge.toLowerCase().includes(q)
    );
  }, [availableTabs, cardSearchQuery]);

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'Super Admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Solar Company Admin':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Regional Manager':
      case 'Project Manager':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Vendor':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Vendor Employee':
      case 'Installer':
      case 'Solar Installer':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'Finance Manager':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'Sales Executive':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const handleExportUsers_PDF = () => {
    exportToPDF(
      isGlobalAdmin ? 'All System Users (Global HQ)' : `${userOrg || 'Organization'} Team Users`,
      ['Name', 'Email', 'Phone', 'Role', 'Company', 'Status'],
      displayUsers.map(u => [u.name || '-', u.email || '-', u.phone || '-', u.role || '-', u.companyName || '-', u.status || '-'])
    );
  };

  const handleExportUsers_Excel = () => {
    exportToExcel(
      isGlobalAdmin ? 'All System Users (Global HQ)' : `${userOrg || 'Organization'} Team Users`,
      displayUsers
    );
  };
  
  const handleExportAudit_PDF = () => {
    exportToPDF('Audit Logs', ['Timestamp', 'User', 'Action', 'Details'], auditLogs.map(l => [l.timestamp, l.user, l.action, l.details]));
  };

  const handleExportAudit_Excel = () => {
    exportToExcel('Audit Logs', auditLogs);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newUser.name.trim();
    const cleanEmail = newUser.email.trim().toLowerCase();
    const cleanPhone = newUser.phone.trim();
    const cleanRole = newUser.role;
    const cleanStatus = newUser.status;
    const cleanPassword = newUser.tempPassword.trim() || 'User123!';

    if (!cleanName || !cleanEmail) {
      toast.warning('Full name and email address are required.', 'Missing Required Fields');
      return;
    }

    // Duplicate email verification across system
    const duplicate = usersList.find(u => u.email?.toLowerCase() === cleanEmail);
    if (duplicate) {
      toast.error(`A user with email "${cleanEmail}" already exists.`, 'Duplicate Account');
      return;
    }

    const assignedCompany = isGlobalAdmin
      ? (newUser.companyName.trim() || 'Meta Green Global HQ')
      : (userOrg || 'My Organization');

    try {
      await addDoc(collection(db, 'users'), {
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        role: cleanRole,
        companyName: assignedCompany,
        status: cleanStatus,
        tempPassword: cleanPassword,
        mustChangePassword: true,
        isFirstLogin: true,
        createdBy: currentUid || 'admin',
        creatorEmail: currentEmail,
        creatorName: user?.name || 'Administrator',
        createdAt: serverTimestamp()
      });

      await addDoc(collection(db, 'auditLogs'), {
        timestamp: new Date().toLocaleString(),
        user: user?.name || 'System Admin',
        action: 'Created User',
        details: `Created new user ${cleanEmail} (${cleanRole}) for ${assignedCompany}`,
        createdAt: serverTimestamp()
      });

      toast.success(`User "${cleanName}" created successfully for ${assignedCompany}!`, 'User Created');
      setIsAddUserModalOpen(false);
      setNewUser({
        name: '',
        email: '',
        phone: '',
        role: isGlobalAdmin ? 'Sales Executive' : 'Vendor Employee',
        companyName: '',
        status: 'Active',
        tempPassword: 'User123!',
        showPassword: false
      });
    } catch (err: any) {
      console.error('Error creating user:', err);
      toast.error(err.message || 'Failed to create user', 'Error');
    }
  };

  const handleOpenEditUser = (targetUser: any) => {
    setEditingUser(targetUser);
    setEditUserForm({
      name: targetUser.name || '',
      email: targetUser.email || '',
      phone: targetUser.phone || '',
      role: targetUser.role || 'Sales Executive',
      companyName: targetUser.companyName || '',
      status: targetUser.status || 'Active',
      resetPassword: false,
      newPassword: '',
      showPassword: false
    });
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const cleanName = editUserForm.name.trim();
    const cleanEmail = editUserForm.email.trim().toLowerCase();
    const cleanPhone = editUserForm.phone.trim();
    const cleanRole = editUserForm.role;
    const cleanStatus = editUserForm.status;

    if (!cleanName || !cleanEmail) {
      toast.warning('Full name and email are required.', 'Missing Fields');
      return;
    }

    try {
      const updatePayload: any = {
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        role: cleanRole,
        status: cleanStatus,
        updatedAt: serverTimestamp()
      };

      if (isGlobalAdmin && editUserForm.companyName.trim()) {
        updatePayload.companyName = editUserForm.companyName.trim();
      }

      if (editUserForm.resetPassword && editUserForm.newPassword.trim()) {
        updatePayload.tempPassword = editUserForm.newPassword.trim();
        updatePayload.mustChangePassword = true;
        updatePayload.isFirstLogin = true;
      }

      await updateDoc(doc(db, 'users', editingUser.id), updatePayload);

      await addDoc(collection(db, 'auditLogs'), {
        timestamp: new Date().toLocaleString(),
        user: user?.name || 'System Admin',
        action: 'Updated User',
        details: `Updated user profile for ${cleanEmail} (${cleanRole})`,
        createdAt: serverTimestamp()
      });

      toast.success(`User "${cleanName}" updated successfully!`, 'User Saved');
      setEditingUser(null);
    } catch (err: any) {
      console.error('Error updating user:', err);
      toast.error(err.message || 'Failed to update user', 'Error');
    }
  };

  const handleDeleteUser = async (targetUser: any) => {
    if (targetUser.id === currentUid || targetUser.uid === currentUid || targetUser.email?.toLowerCase() === currentEmail) {
      toast.warning('You cannot delete your own logged-in account!', 'Action Blocked');
      return;
    }

    if (!isGlobalAdmin && (targetUser.role === 'Super Admin' || targetUser.role === 'Solar Company Admin')) {
      toast.error('You do not have permission to delete a Global Administrator.', 'Access Denied');
      return;
    }

    const confirm = window.confirm(`Are you sure you want to permanently delete user "${targetUser.name}" (${targetUser.email})? This action cannot be undone.`);
    if (!confirm) return;

    try {
      await deleteDoc(doc(db, 'users', targetUser.id));

      await addDoc(collection(db, 'auditLogs'), {
        timestamp: new Date().toLocaleString(),
        user: user?.name || 'System Admin',
        action: 'Deleted User',
        details: `Permanently deleted user ${targetUser.email} (${targetUser.role})`,
        createdAt: serverTimestamp()
      });

      toast.success(`User "${targetUser.name}" deleted from system.`, 'User Deleted');
    } catch (err: any) {
      console.error('Error deleting user:', err);
      toast.error(err.message || 'Failed to delete user', 'Error');
    }
  };

  const handleUpdateUserStatus = async (userId: string, newStatus: 'Active' | 'Rejected' | 'Inactive') => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      toast.success(`User status updated to "${newStatus}"!`, 'Status Changed');
    } catch (err: any) {
      console.error('Error updating status:', err);
      toast.error('Failed to change user status.', 'Error');
    }
  };

  const handleCopyPassword = (pass: string) => {
    navigator.clipboard.writeText(pass);
    toast.info(`Copied initial password "${pass}" to clipboard!`, 'Password Copied');
  };

  const handleOpenAddRoof = () => {
    setEditingRoofId(null);
    setRoofForm({
      name: '',
      description: '',
      structureType: 'Flush Mount / Mini Rail',
      tiltAngle: '15°',
      status: 'Active'
    });
    setIsRoofModalOpen(true);
  };

  const handleOpenEditRoof = (roof: any) => {
    setEditingRoofId(roof.id);
    setRoofForm({
      name: roof.name || '',
      description: roof.description || '',
      structureType: roof.structureType || 'Flush Mount / Mini Rail',
      tiltAngle: roof.tiltAngle || '15°',
      status: roof.status || 'Active'
    });
    setIsRoofModalOpen(true);
  };

  const handleSaveRoofType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roofForm.name.trim()) return;
    try {
      if (editingRoofId) {
        await updateDoc(doc(db, 'roofTypes', editingRoofId), {
          ...roofForm,
          updatedAt: serverTimestamp()
        });
        alert(`✅ Roof Type "${roofForm.name}" updated successfully!`);
      } else {
        await addDoc(collection(db, 'roofTypes'), {
          ...roofForm,
          createdAt: serverTimestamp()
        });
        alert(`✅ Roof Type "${roofForm.name}" created successfully!`);
      }
      setIsRoofModalOpen(false);
      setEditingRoofId(null);
    } catch (err) {
      console.error('Error saving roof type:', err);
      alert('Failed to save roof type.');
    }
  };

  const handleDeleteRoofType = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete roof type "${name}"?`)) return;
    try {
      await deleteDoc(doc(db, 'roofTypes', id));
      alert(`✅ Roof type "${name}" deleted.`);
    } catch (err) {
      console.error('Error deleting roof type:', err);
      alert('Failed to delete roof type.');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'subscriptions':
        return <SubscriptionManagement initialTab="plans" />;
      case 'coupons':
        return <SubscriptionManagement initialTab="coupons" />;
      case 'logos':
        return (
          <div className="space-y-6">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-6 rounded-2xl text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-700">
              <div className="space-y-1">
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit">
                  <Sparkles className="w-3.5 h-3.5" /> Company Asset Import
                </span>
                <h3 className="text-2xl font-black tracking-tight">Import Logos & Branding Assets</h3>
                <p className="text-slate-300 text-sm max-w-xl">
                  Upload official logos, watermarks, company seal stamps, and payment QR codes. These assets automatically embed in generated PDFs, Quotations, and Proposals.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 shrink-0">
                <button
                  onClick={handleLoadSampleLogos}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg transition-all"
                >
                  <Sparkles className="w-4 h-4" /> Load Sample Logos
                </button>
                <button
                  onClick={resetLogos}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs flex items-center gap-2 border border-slate-700 transition-all"
                >
                  <RefreshCw className="w-4 h-4" /> Reset All
                </button>
              </div>
            </div>

            {saveSuccess && (
              <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl flex items-center gap-2 font-bold text-sm animate-in fade-in duration-200">
                <Check className="w-5 h-5 text-emerald-600" /> Company logos and branding assets updated successfully!
              </div>
            )}

            {/* Company Info Input */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h4 className="font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-600" /> Company Name & Tagline
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Company Title</label>
                  <input 
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    onBlur={() => updateLogos({ companyName })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm font-bold text-slate-800"
                    placeholder="Green Energy Solutions"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Company Tagline</label>
                  <input 
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    onBlur={() => updateLogos({ tagline })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm font-bold text-slate-800"
                    placeholder="Powering the Solar Future"
                  />
                </div>
              </div>
            </div>

            {/* 4 Asset Upload Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1: Main Company Logo */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
                      Header Logo
                    </span>
                    <span className="text-xs text-slate-400 font-medium">PNG, SVG, JPG</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-lg">1. Company Header Logo</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Main logo displayed on top of proposals, quotations, and invoice PDFs.
                  </p>
                </div>

                <div className="my-4 min-h-[120px] bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-4 relative group">
                  {logos.companyLogo ? (
                    <div className="flex flex-col items-center gap-2">
                      <img src={logos.companyLogo} alt="Company Logo" className="max-h-24 max-w-full object-contain" />
                      <button 
                        onClick={() => updateLogos({ companyLogo: '' })}
                        className="text-xs text-red-600 font-bold hover:underline flex items-center gap-1 mt-1"
                      >
                        <Trash2 className="w-3 h-3" /> Remove Logo
                      </button>
                    </div>
                  ) : (
                    <div className="text-center space-y-2">
                      <ImageIcon className="w-10 h-10 text-slate-300 mx-auto" />
                      <p className="text-xs font-bold text-slate-600">No logo imported yet</p>
                      <p className="text-[11px] text-slate-400">Click below to upload from computer</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs cursor-pointer transition-all shadow-sm">
                    <Upload className="w-4 h-4 text-emerald-400" />
                    <span>Upload Header Logo</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload('companyLogo', e)} />
                  </label>
                </div>
              </div>

              {/* Card 2: Watermark Logo */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                      Background Watermark
                    </span>
                    <span className="text-xs text-slate-400 font-medium">PNG (Transparent)</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-lg">2. Document Watermark</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Transparent watermark background printed across PDF document pages.
                  </p>
                </div>

                <div className="my-4 min-h-[120px] bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-4 relative group opacity-90">
                  {logos.watermarkLogo ? (
                    <div className="flex flex-col items-center gap-2">
                      <img src={logos.watermarkLogo} alt="Watermark Logo" className="max-h-24 max-w-full object-contain opacity-30" />
                      <button 
                        onClick={() => updateLogos({ watermarkLogo: '' })}
                        className="text-xs text-red-600 font-bold hover:underline flex items-center gap-1 mt-1"
                      >
                        <Trash2 className="w-3 h-3" /> Remove Watermark
                      </button>
                    </div>
                  ) : (
                    <div className="text-center space-y-2">
                      <ImageIcon className="w-10 h-10 text-slate-300 mx-auto" />
                      <p className="text-xs font-bold text-slate-600">No watermark uploaded</p>
                      <p className="text-[11px] text-slate-400">Click below to upload transparent PNG</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs cursor-pointer transition-all shadow-sm">
                    <Upload className="w-4 h-4 text-blue-400" />
                    <span>Upload Watermark Logo</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload('watermarkLogo', e)} />
                  </label>
                </div>
              </div>

              {/* Card 3: Official Seal / Stamp */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-100">
                      Official Seal
                    </span>
                    <span className="text-xs text-slate-400 font-medium">Round Stamp</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-lg">3. Official Stamp / Seal</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Authorized company round seal stamp printed beside regards & signature lines.
                  </p>
                </div>

                <div className="my-4 min-h-[120px] bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-4 relative group">
                  {logos.officialSeal ? (
                    <div className="flex flex-col items-center gap-2">
                      <img src={logos.officialSeal} alt="Official Seal" className="max-h-24 max-w-full object-contain" />
                      <button 
                        onClick={() => updateLogos({ officialSeal: '' })}
                        className="text-xs text-red-600 font-bold hover:underline flex items-center gap-1 mt-1"
                      >
                        <Trash2 className="w-3 h-3" /> Remove Seal
                      </button>
                    </div>
                  ) : (
                    <div className="text-center space-y-2">
                      <ImageIcon className="w-10 h-10 text-slate-300 mx-auto" />
                      <p className="text-xs font-bold text-slate-600">No round seal uploaded</p>
                      <p className="text-[11px] text-slate-400">Click below to upload authorization seal</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs cursor-pointer transition-all shadow-sm">
                    <Upload className="w-4 h-4 text-purple-400" />
                    <span>Upload Official Seal</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload('officialSeal', e)} />
                  </label>
                </div>
              </div>

              {/* Card 4: Payment QR Code */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-100">
                      Payment QR
                    </span>
                    <span className="text-xs text-slate-400 font-medium">UPI / Bank QR</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-lg">4. Payment QR Code</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    UPI scan QR code image rendered beside bank details on proposals & bills.
                  </p>
                </div>

                <div className="my-4 min-h-[120px] bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-4 relative group">
                  {logos.paymentQrCode ? (
                    <div className="flex flex-col items-center gap-2">
                      <img src={logos.paymentQrCode} alt="Payment QR Code" className="max-h-24 max-w-full object-contain" />
                      <button 
                        onClick={() => updateLogos({ paymentQrCode: '' })}
                        className="text-xs text-red-600 font-bold hover:underline flex items-center gap-1 mt-1"
                      >
                        <Trash2 className="w-3 h-3" /> Remove QR Code
                      </button>
                    </div>
                  ) : (
                    <div className="text-center space-y-2">
                      <ImageIcon className="w-10 h-10 text-slate-300 mx-auto" />
                      <p className="text-xs font-bold text-slate-600">No payment QR uploaded</p>
                      <p className="text-[11px] text-slate-400">Click below to upload scan QR image</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs cursor-pointer transition-all shadow-sm">
                    <Upload className="w-4 h-4 text-amber-400" />
                    <span>Upload Payment QR</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload('paymentQrCode', e)} />
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case 'users':
        return (
          <div className="space-y-6">
            {/* Scope Information Banner */}
            {isGlobalAdmin ? (
              <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-5 shadow-sm border border-slate-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-inner flex-shrink-0">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black tracking-widest uppercase bg-amber-400/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                        Global HQ Scope
                      </span>
                      <span className="text-xs text-slate-400">All Organizations & Vendors</span>
                    </div>
                    <h2 className="text-xl font-black text-white mt-1">Global System Users Directory</h2>
                    <p className="text-xs text-slate-300 mt-0.5">Showing all registered users across every company, vendor, and regional partner in the system.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-start md:self-auto">
                  <span className="text-xs font-semibold text-slate-300 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
                    Role: <strong className="text-white">{user?.role || 'Super Admin'}</strong>
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl p-5 shadow-sm border border-emerald-700/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-emerald-400/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shadow-inner flex-shrink-0">
                    <Building className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black tracking-widest uppercase bg-emerald-400/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                        Organization Scope
                      </span>
                      <span className="text-xs text-emerald-200/80">{userOrg || user?.companyName || 'My Team'}</span>
                    </div>
                    <h2 className="text-xl font-black text-white mt-1">{userOrg || user?.companyName ? `${userOrg || user?.companyName} - Team & Staff` : 'Organization Users Directory'}</h2>
                    <p className="text-xs text-emerald-100/70 mt-0.5">Showing only members, employees, and installers belonging to your organization.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-start md:self-auto">
                  <span className="text-xs font-semibold text-emerald-100 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
                    Logged in: <strong className="text-white">{user?.name}</strong> ({user?.role})
                  </span>
                </div>
              </div>
            )}

            {/* Metric Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total in Scope</span>
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900">{userMetrics.total}</span>
                  <span className="text-xs text-slate-500 font-medium">registered</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Active Accounts</span>
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-emerald-600">{userMetrics.active}</span>
                  <span className="text-xs text-slate-500 font-medium">enabled</span>
                </div>
              </div>

              <div className={cn(
                "rounded-2xl p-4 border shadow-sm transition-colors",
                userMetrics.pending > 0 
                  ? "bg-amber-50/50 border-amber-200" 
                  : "bg-white border-slate-100"
              )}>
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "text-xs font-bold uppercase tracking-wider",
                    userMetrics.pending > 0 ? "text-amber-700" : "text-slate-400"
                  )}>Pending Approvals</span>
                  <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                    <UserCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className={cn(
                    "text-2xl font-black",
                    userMetrics.pending > 0 ? "text-amber-700" : "text-slate-900"
                  )}>{userMetrics.pending}</span>
                  <span className="text-xs text-slate-500 font-medium">needs review</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Inactive / Rejected</span>
                  <div className="p-2 rounded-xl bg-slate-100 text-slate-600">
                    <XCircle className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-700">{userMetrics.inactive}</span>
                  <span className="text-xs text-slate-500 font-medium">disabled</span>
                </div>
              </div>
            </div>

            {/* Filter & Action Toolbar */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex flex-1 flex-wrap items-center gap-2.5">
                {/* Search Bar */}
                <div className="relative min-w-[240px] flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={e => setUserSearchQuery(e.target.value)}
                    placeholder="Search by name, email, role, phone, company..."
                    className="w-full pl-9 pr-8 py-2 text-xs font-medium border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all"
                  />
                  {userSearchQuery && (
                    <button
                      onClick={() => setUserSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Role Filter */}
                <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Role:</span>
                  <select
                    value={userRoleFilter}
                    onChange={e => setUserRoleFilter(e.target.value)}
                    className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer"
                  >
                    <option value="All">All Roles</option>
                    {allowedRoles.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Status:</span>
                  <select
                    value={userStatusFilter}
                    onChange={e => setUserStatusFilter(e.target.value)}
                    className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                {/* Reset Filters */}
                {(userSearchQuery || userRoleFilter !== 'All' || userStatusFilter !== 'All') && (
                  <button
                    onClick={() => {
                      setUserSearchQuery('');
                      setUserRoleFilter('All');
                      setUserStatusFilter('All');
                    }}
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline px-2 py-1"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end md:self-auto flex-shrink-0">
                <button
                  onClick={handleExportUsers_PDF}
                  className="px-3 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-1.5 text-xs shadow-sm"
                  title="Export current view to PDF"
                >
                  <Download className="w-3.5 h-3.5 text-red-500" /> PDF
                </button>
                <button
                  onClick={handleExportUsers_Excel}
                  className="px-3 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold rounded-xl hover:bg-emerald-100 transition-colors flex items-center gap-1.5 text-xs shadow-sm"
                  title="Export current view to Excel"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Excel
                </button>
                <button
                  onClick={() => setIsAddUserModalOpen(true)}
                  className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-2 text-xs shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Add User
                </button>
              </div>
            </div>

            {/* Users Directory Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[850px]">
                  <thead>
                    <tr className="bg-slate-50/80 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                      <th className="p-4">User</th>
                      <th className="p-4">Contact</th>
                      <th className="p-4">Organization / Company</th>
                      <th className="p-4">Role</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Credentials</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayUsers.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                        {/* User identity */}
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
                              {(u.name || 'U').slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900 text-sm truncate">{u.name || 'Unnamed User'}</span>
                                {(u.id === currentUid || u.uid === currentUid || u.email?.toLowerCase() === currentEmail) && (
                                  <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 text-xs text-slate-500 truncate mt-0.5">
                                <Mail className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                <span className="truncate">{u.email}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="p-4 text-xs">
                          {u.phone ? (
                            <div className="flex items-center gap-1.5 font-medium text-slate-700">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{u.phone}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">No phone</span>
                          )}
                        </td>

                        {/* Company / Org */}
                        <td className="p-4">
                          <div className="flex items-center gap-1.5 text-xs">
                            <Building className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span className={cn(
                              "font-semibold truncate max-w-[160px]",
                              u.companyName === 'Meta Green Global HQ' ? "text-indigo-700" : "text-slate-700"
                            )}>
                              {u.companyName || 'Meta Green Global HQ'}
                            </span>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="p-4">
                          <span className={cn(
                            "px-2.5 py-1 rounded-lg text-[11px] font-bold border inline-flex items-center gap-1",
                            getRoleBadgeColor(u.role)
                          )}>
                            <Shield className="w-3 h-3" />
                            {u.role || 'Sales Executive'}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="p-4">
                          <span className={cn(
                            "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border inline-flex items-center gap-1.5",
                            u.status === 'Active' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                            u.status === 'Pending' ? "bg-amber-50 text-amber-700 border-amber-200" :
                            "bg-rose-50 text-rose-700 border-rose-200"
                          )}>
                            <span className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              u.status === 'Active' ? "bg-emerald-500" :
                              u.status === 'Pending' ? "bg-amber-500 animate-pulse" :
                              "bg-rose-500"
                            )} />
                            {u.status || 'Active'}
                          </span>
                        </td>

                        {/* Credentials */}
                        <td className="p-4">
                          {u.tempPassword ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleCopyPassword(u.tempPassword)}
                                title="Click to copy initial password"
                                className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-mono flex items-center gap-1 border border-slate-200 transition-colors"
                              >
                                <KeyRound className="w-3 h-3 text-slate-500" />
                                <span className="font-semibold">{u.tempPassword}</span>
                                <Copy className="w-3 h-3 text-slate-400" />
                              </button>
                              {u.isFirstLogin && (
                                <span className="text-[9px] font-black uppercase bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200" title="User has not changed password yet">
                                  1st Login
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Self-set password</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {u.status === 'Pending' && (
                              <>
                                <button
                                  onClick={() => handleUpdateUserStatus(u.id, 'Active')}
                                  title="Approve user"
                                  className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleUpdateUserStatus(u.id, 'Rejected')}
                                  title="Reject user"
                                  className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition-colors"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleOpenEditUser(u)}
                              title="Edit user details"
                              className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {!(u.id === currentUid || u.uid === currentUid || u.email?.toLowerCase() === currentEmail) && (
                              <button
                                onClick={() => handleDeleteUser(u)}
                                title="Delete user"
                                className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {displayUsers.length === 0 && (
                <div className="py-16 px-4 text-center">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                    <Users className="w-7 h-7" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900">No users found</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    {userSearchQuery || userRoleFilter !== 'All' || userStatusFilter !== 'All'
                      ? 'No users match your active search and filter criteria. Try adjusting your filters.'
                      : isGlobalAdmin 
                        ? 'There are currently no users in the database.' 
                        : `No team members are currently assigned to ${userOrg || 'your organization'}.`}
                  </p>
                  <div className="mt-4 flex justify-center gap-2">
                    {(userSearchQuery || userRoleFilter !== 'All' || userStatusFilter !== 'All') && (
                      <button
                        onClick={() => {
                          setUserSearchQuery('');
                          setUserRoleFilter('All');
                          setUserStatusFilter('All');
                        }}
                        className="px-3 py-1.5 text-xs font-bold bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                      >
                        Clear Filters
                      </button>
                    )}
                    <button
                      onClick={() => setIsAddUserModalOpen(true)}
                      className="px-3.5 py-1.5 text-xs font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add User
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'roles':
        return <DynamicRolesManager />;

      case 'subscriber-websites':
        return <SubscriberWebsitesManager />;

      case 'dropdowns': {
        if (activeDropdownCategory === null) {
          const scopes = ['All', 'Finance', 'CRM', 'Projects', 'Inventory', 'Procurement', 'General'] as const;
          
          const filteredCategories = DROPDOWN_CATEGORIES.filter(cat => {
            const query = dropdownCategorySearch.toLowerCase();
            const matchesSearch = 
              cat.title.toLowerCase().includes(query) ||
              cat.description.toLowerCase().includes(query) ||
              cat.scope.toLowerCase().includes(query) ||
              cat.defaults.some(d => 
                d.name.toLowerCase().includes(query) || 
                (d.code && d.code.toLowerCase().includes(query))
              );

            const matchesScope = dropdownCategoryScopeFilter === 'All' || cat.scope === dropdownCategoryScopeFilter;

            return matchesSearch && matchesScope;
          });

          return (
            <div className="space-y-6">
              {/* Header Banner */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-50 text-cyan-700 border border-cyan-200 flex items-center gap-1">
                        <Sliders className="w-3 h-3 text-cyan-600" />
                        System Lookups & Dropdowns
                      </span>
                      <span className="text-xs text-slate-400 font-bold">
                        {DROPDOWN_CATEGORIES.length} Master Categories
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                      <Sliders className="w-6 h-6 text-emerald-600" />
                      Dropdown Masters & System Lookups
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-3xl">
                      Configure standard select menus, expense classifications, sales milestones, payment modes, and DISCOMs across the ERP. Select any category card below to manage its options.
                    </p>
                  </div>

                  {/* Search categories */}
                  <div className="relative w-full lg:w-80">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search dropdown categories..."
                      value={dropdownCategorySearch}
                      onChange={(e) => setDropdownCategorySearch(e.target.value)}
                      className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    />
                    {dropdownCategorySearch && (
                      <button
                        type="button"
                        onClick={() => setDropdownCategorySearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Scope Filters */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider mr-1">Filter Scope:</span>
                  {scopes.map(scope => {
                    const count = scope === 'All' 
                      ? DROPDOWN_CATEGORIES.length 
                      : DROPDOWN_CATEGORIES.filter(c => c.scope === scope).length;
                    const isSelected = dropdownCategoryScopeFilter === scope;
                    return (
                      <button
                        key={scope}
                        type="button"
                        onClick={() => setDropdownCategoryScopeFilter(scope)}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border",
                          isSelected
                            ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                            : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                        )}
                      >
                        <span>{scope}</span>
                        <span className={cn(
                          "px-1.5 py-0.2 rounded-full text-[10px] font-black",
                          isSelected ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                        )}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 11 CATEGORY CARDS GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredCategories.map(cat => {
                  const IconComp = getDropdownCategoryIcon(cat.iconName);
                  const theme = CATEGORY_THEMES[cat.key] || CATEGORY_THEMES.expense_types;
                  const count = dropdownCategoryCounts[cat.key] ?? cat.defaults.length;
                  const sampleDefaults = cat.defaults.slice(0, 3);
                  const remainingCount = Math.max(0, count - 3);

                  return (
                    <div
                      key={cat.key}
                      onClick={() => {
                        setSelectedDropdownCategory(cat.key);
                        setActiveDropdownCategory(cat.key);
                        setDropdownOptionSearch('');
                        setDropdownStatusFilter('All');
                      }}
                      className={cn(
                        "bg-white rounded-2xl p-5 border border-slate-200 hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between group text-left relative",
                        theme.bg,
                        theme.borderHover,
                        "hover:-translate-y-1"
                      )}
                    >
                      <div>
                        {/* Top: Icon + Badges */}
                        <div className="flex items-center justify-between gap-2 mb-3.5">
                          <div className={cn("p-3 rounded-xl border border-slate-100 shadow-xs transition-colors", theme.iconBg, theme.iconColor)}>
                            <IconComp className="w-5 h-5" />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border", theme.badgeBg, theme.badgeText)}>
                              {cat.scope}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                              {count} {count === 1 ? 'Option' : 'Options'}
                            </span>
                          </div>
                        </div>

                        {/* Title & Description */}
                        <h3 className="font-black text-base text-slate-900 tracking-tight group-hover:text-emerald-700 transition-colors mb-1.5">
                          {cat.title}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4 line-clamp-2">
                          {cat.description}
                        </p>

                        {/* Sample Options Tags Preview */}
                        <div className="space-y-1.5 mb-2">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Sample Items:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {sampleDefaults.map((d, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 bg-slate-50 group-hover:bg-white text-slate-600 rounded-lg text-[10px] font-semibold border border-slate-200/80 truncate max-w-[150px]"
                                title={d.name}
                              >
                                {d.name}
                              </span>
                            ))}
                            {remainingCount > 0 && (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-bold border border-slate-200">
                                +{remainingCount} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Bottom Action Footer */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-black text-emerald-600 group-hover:text-emerald-700">
                        <span>Configure {count} Options</span>
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredCategories.length === 0 && (
                <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
                    <Search className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-black text-slate-800">No Dropdown Categories Found</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    No categories matched "{dropdownCategorySearch}".
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setDropdownCategorySearch('');
                      setDropdownCategoryScopeFilter('All');
                    }}
                    className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer"
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </div>
          );
        }

        // =========================================================================
        // CATEGORY DETAIL VIEW (When activeDropdownCategory !== null)
        // =========================================================================
        const activeCategoryMeta = DROPDOWN_CATEGORIES.find(c => c.key === activeDropdownCategory) || DROPDOWN_CATEGORIES[0];
        const CategoryIcon = getDropdownCategoryIcon(activeCategoryMeta.iconName);
        const theme = CATEGORY_THEMES[activeCategoryMeta.key] || CATEGORY_THEMES.expense_types;

        const filteredDropdownOptions = dropdownOptionsList.filter(opt => {
          const matchesSearch = 
            opt.name.toLowerCase().includes(dropdownOptionSearch.toLowerCase()) ||
            (opt.code && opt.code.toLowerCase().includes(dropdownOptionSearch.toLowerCase())) ||
            (opt.description && opt.description.toLowerCase().includes(dropdownOptionSearch.toLowerCase()));
          
          const matchesStatus = 
            dropdownStatusFilter === 'All' ? true :
            dropdownStatusFilter === 'Active' ? opt.status === 'Active' :
            opt.status === 'Inactive';

          return matchesSearch && matchesStatus;
        });

        const activeCount = dropdownOptionsList.filter(o => o.status === 'Active').length;
        const inactiveCount = dropdownOptionsList.filter(o => o.status === 'Inactive').length;

        return (
          <div className="space-y-6">
            {/* Category Header Card */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveDropdownCategory(null)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer border border-slate-200 hover:-translate-x-0.5"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 text-emerald-600" />
                      Back to All Categories Cards
                    </button>
                    <span className="text-slate-300">|</span>
                    <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border", theme.badgeBg, theme.badgeText)}>
                      {activeCategoryMeta.scope}
                    </span>
                    <span className="text-xs text-slate-400 font-bold">
                      {dropdownOptionsList.length} Options Total
                    </span>
                  </div>

                  <div className="flex items-start sm:items-center gap-3">
                    <div className={cn("p-2.5 rounded-xl border border-slate-100 shrink-0", theme.iconBg, theme.iconColor)}>
                      <CategoryIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        {activeCategoryMeta.title}
                      </h2>
                      <p className="text-xs text-slate-500 font-medium max-w-2xl mt-0.5">
                        {activeCategoryMeta.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Top Actions & Quick Switcher */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Category Switcher */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-400 hidden sm:inline">Switch:</span>
                    <select
                      value={activeCategoryMeta.key}
                      onChange={(e) => {
                        const newCat = e.target.value as DropdownCategoryKey;
                        setActiveDropdownCategory(newCat);
                        setSelectedDropdownCategory(newCat);
                        setDropdownOptionSearch('');
                        setDropdownStatusFilter('All');
                      }}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                    >
                      {DROPDOWN_CATEGORIES.map(c => (
                        <option key={c.key} value={c.key}>{c.title}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleSeedDefaults}
                    disabled={isRestoringDefaults}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    title="Restore default options for current category"
                  >
                    <RefreshCw className={cn("w-3.5 h-3.5 text-slate-500", isRestoringDefaults && "animate-spin")} />
                    <span>{isRestoringDefaults ? 'Restoring...' : 'Restore Defaults'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenAddOption}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-emerald-200 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Option</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Filter Bar & View Mode Toggle */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Search in options */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={dropdownOptionSearch}
                  onChange={(e) => setDropdownOptionSearch(e.target.value)}
                  placeholder={`Search in ${activeCategoryMeta.title}...`}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
                {dropdownOptionSearch && (
                  <button
                    type="button"
                    onClick={() => setDropdownOptionSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status Filter & View Mode */}
              <div className="flex items-center gap-2">
                <select
                  value={dropdownStatusFilter}
                  onChange={(e) => setDropdownStatusFilter(e.target.value as any)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none cursor-pointer focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="All">All Status ({dropdownOptionsList.length})</option>
                  <option value="Active">Active ({activeCount})</option>
                  <option value="Inactive">Inactive ({inactiveCount})</option>
                </select>

                {/* View Mode Toggle: Cards vs Table */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setDropdownOptionsViewMode('cards')}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer",
                      dropdownOptionsViewMode === 'cards'
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    )}
                    title="View as Cards"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Cards</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDropdownOptionsViewMode('table')}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer",
                      dropdownOptionsViewMode === 'table'
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    )}
                    title="View as Table"
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>Table</span>
                  </button>
                </div>
              </div>
            </div>

            {/* OPTIONS CONTENT: CARDS OR TABLE */}
            {dropdownOptionsViewMode === 'cards' ? (
              /* ================= OPTIONS AS CARDS ================= */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDropdownOptions.map(opt => (
                  <div
                    key={opt.id}
                    className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all p-4 flex flex-col justify-between"
                  >
                    <div>
                      {/* Top row: Status button + Code badge + System badge */}
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <button
                          type="button"
                          onClick={() => handleToggleOptionStatus(opt)}
                          className={cn(
                            "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border inline-flex items-center gap-1.5 cursor-pointer transition-all",
                            opt.status === 'Active'
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                              : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                          )}
                          title="Click to toggle Active/Inactive"
                        >
                          <span className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            opt.status === 'Active' ? "bg-emerald-500" : "bg-slate-400"
                          )} />
                          <span>{opt.status}</span>
                        </button>

                        <div className="flex items-center gap-1.5">
                          {opt.isDefault && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-500 border border-slate-200" title="System default lookup option">
                              System
                            </span>
                          )}
                          {opt.code && (
                            <span className="font-mono text-[10px] font-black px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                              {opt.code}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Name */}
                      <h4 className="font-black text-slate-900 text-sm mb-1 leading-snug">
                        {opt.name}
                      </h4>

                      {/* Description */}
                      <p className="text-xs text-slate-500 line-clamp-2">
                        {opt.description || <span className="italic text-slate-400">No description specified</span>}
                      </p>
                    </div>

                    {/* Bottom row: Edit / Delete */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 font-mono">
                        {opt.code ? `#${opt.code}` : ''}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditOption(opt)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteOption(opt)}
                          className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-colors cursor-pointer"
                          title="Delete option"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* ================= OPTIONS AS TABLE ================= */
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/70 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="px-5 py-3">Option Name</th>
                        <th className="px-4 py-3">Code / ID</th>
                        <th className="px-5 py-3">Description</th>
                        <th className="px-4 py-3 text-center">Status</th>
                        <th className="px-5 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredDropdownOptions.map((opt) => (
                        <tr key={opt.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-5 py-3.5 font-bold text-slate-900">
                            <div className="flex items-center gap-2">
                              <span>{opt.name}</span>
                              {opt.isDefault && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-500 border border-slate-200" title="System default lookup option">
                                  System
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            {opt.code ? (
                              <span className="font-mono text-[11px] font-black px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                {opt.code}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-mono text-[11px]">—</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-slate-600 max-w-sm truncate">
                            {opt.description || <span className="text-slate-400 italic">No description</span>}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleOptionStatus(opt)}
                              className={cn(
                                "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border inline-flex items-center gap-1.5 cursor-pointer transition-all",
                                opt.status === 'Active'
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                  : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                              )}
                              title="Click to toggle Active/Inactive"
                            >
                              <span className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                opt.status === 'Active' ? "bg-emerald-500" : "bg-slate-400"
                              )} />
                              <span>{opt.status}</span>
                            </button>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditOption(opt)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                                title="Edit Option"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteOption(opt)}
                                className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-colors cursor-pointer"
                                title="Delete Option"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Empty state if filteredDropdownOptions is empty */}
            {filteredDropdownOptions.length === 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 py-14 px-4 text-center">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                  <Sliders className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">No Options Found</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  {dropdownOptionSearch || dropdownStatusFilter !== 'All'
                    ? "No options match your search and filter criteria."
                    : "No options recorded for this category yet. Click 'Restore Defaults' or 'Add Option' above."}
                </p>
                <div className="mt-4 flex items-center justify-center gap-2">
                  {(dropdownOptionSearch || dropdownStatusFilter !== 'All') && (
                    <button
                      type="button"
                      onClick={() => {
                        setDropdownOptionSearch('');
                        setDropdownStatusFilter('All');
                      }}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                    >
                      Clear Filter
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleOpenAddOption}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-black hover:bg-emerald-700 cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add First Option</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      }

      case 'roof-types':
        return (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
              <div>
                <h3 className="font-black text-slate-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-emerald-600" /> Roof Types Master & Engineering Specifications
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Manage allowable roof substrates, mounting structure pairings, and design tilt angles for site surveys and projects
                </p>
              </div>
              <button
                onClick={handleOpenAddRoof}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors flex items-center gap-1.5 text-xs shadow-sm cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" /> Add Roof Type
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-white text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                    <th className="p-4">Roof Type Name</th>
                    <th className="p-4">Description & Substrate</th>
                    <th className="p-4">Recommended Structure</th>
                    <th className="p-4 text-center">Design Tilt</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {roofTypesList.map((roof) => (
                    <tr key={roof.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-bold text-slate-900 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 font-black flex items-center justify-center text-xs">
                          {roof.name.charAt(0)}
                        </div>
                        <span>{roof.name}</span>
                      </td>
                      <td className="p-4 text-slate-600 max-w-xs">{roof.description || 'Standard solar roof installation'}</td>
                      <td className="p-4 text-slate-700 font-semibold">{roof.structureType || 'Fixed Tilt Structure'}</td>
                      <td className="p-4 text-center font-bold text-slate-800">{roof.tiltAngle || '15°'}</td>
                      <td className="p-4 text-center">
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase",
                          roof.status === 'Active' ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-600"
                        )}>
                          {roof.status || 'Active'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditRoof(roof)}
                            className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit Roof Type"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRoofType(roof.id, roof.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Roof Type"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      case 'states':
        return (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-900">States & Taxes</h3>
              <button className="px-3 py-1.5 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 text-xs shadow-sm">
                <Plus className="w-3 h-3" /> Add Rule
              </button>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white text-slate-500 text-xs font-bold uppercase tracking-widest border-b border-slate-100">
                  <th className="p-4">State/Region</th>
                  <th className="p-4">Tax Type</th>
                  <th className="p-4">Rate (%)</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 font-bold text-slate-900">Maharashtra</td>
                  <td className="p-4 text-slate-600">IGST / SGST</td>
                  <td className="p-4 font-bold">18%</td>
                  <td className="p-4"><span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md text-[10px] font-black uppercase tracking-widest border border-emerald-100">Active</span></td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 font-bold text-slate-900">Gujarat</td>
                  <td className="p-4 text-slate-600">State Subsidy Tax Exemption</td>
                  <td className="p-4 font-bold">12%</td>
                  <td className="p-4"><span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md text-[10px] font-black uppercase tracking-widest border border-emerald-100">Active</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        );

      case 'products':
        return (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center text-slate-500">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <h4 className="font-bold text-slate-900">Products & Pricing Catalog</h4>
            <p className="text-xs text-slate-400 mt-1">Configure global product price lists and solar components.</p>
          </div>
        );

      case 'approvals':
        return (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center text-slate-500">
            <CheckSquare className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <h4 className="font-bold text-slate-900">Approval Workflow Matrix</h4>
            <p className="text-xs text-slate-400 mt-1">Define discount thresholds requiring manager approval.</p>
          </div>
        );

      case 'audit':
        return (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-900">Audit Logs</h3>
              <div className="flex gap-2">
                <button onClick={handleExportAudit_PDF} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 text-xs shadow-sm">
                  <Download className="w-3 h-3 text-red-500" /> PDF
                </button>
                <button onClick={handleExportAudit_Excel} className="px-3 py-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 font-semibold rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-2 text-xs shadow-sm">
                  <FileSpreadsheet className="w-3 h-3" /> Excel
                </button>
              </div>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white text-slate-500 text-xs font-bold uppercase tracking-widest border-b border-slate-100">
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">User</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="p-4 text-xs font-medium text-slate-500 whitespace-nowrap">{log.timestamp}</td>
                    <td className="p-4 font-bold text-slate-900">{log.user}</td>
                    <td className="p-4 font-semibold text-slate-700">{log.action}</td>
                    <td className="p-4 text-sm text-slate-600">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'purge':
        return (
          <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-6 space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-900">System Reset & Data Purge</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Permanently clear all operational records (CRM Leads, Projects & Pipelines, Tasks, Quotations, Invoices, Finance Transactions, Inventory, and Support Tickets) across the ERP.
                </p>
              </div>
            </div>

            <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-2 text-xs text-red-900 font-medium">
              <p className="font-bold flex items-center gap-1.5 text-red-950">
                <AlertTriangle className="w-4 h-4 text-red-600" /> Caution: Irreversible Operation
              </p>
              <ul className="list-disc pl-5 space-y-1 text-red-800 text-[11px]">
                <li>All CRM Leads and Customer records will be purged.</li>
                <li>All 10-Stage Projects and Installation workflows will be reset.</li>
                <li>All Quotation versions, PDFs, and Tax Invoices will be cleared.</li>
                <li>All Inventory stock-in/out records and Ledger transactions will be wiped.</li>
                <li>User accounts and Super Admin access credentials remain preserved for login.</li>
              </ul>
            </div>

            {clearProgress && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-900 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-amber-600 animate-spin" />
                {clearProgress}
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Click to execute full database wipe</span>
              <button
                type="button"
                disabled={isClearingData}
                onClick={handleClearAllData}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-black text-xs rounded-xl transition-all shadow-md shadow-red-200 flex items-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                {isClearingData ? 'Clearing All Data...' : 'Clear All Operational Data'}
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="animate-in fade-in duration-300 space-y-6">
      {selectedModule === null ? (
        /* ========================================================================= */
        /* 1. MASTER SETTINGS CARDS DIRECTORY / HUB                                  */
        /* ========================================================================= */
        <div className="space-y-6">
          {/* Header Banner */}
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-emerald-600" /> Enterprise Control Center
                </span>
                <span className="text-xs text-slate-400 font-bold">
                  {availableTabs.length} Modules Available
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                <Sliders className="w-7 h-7 text-emerald-600" /> Master Settings
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm font-medium mt-1">
                Select any master control card below to configure that module in its dedicated management page.
              </p>
            </div>

            {/* Quick Filter Search */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search master modules..."
                value={cardSearchQuery}
                onChange={(e) => setCardSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
              />
              {cardSearchQuery && (
                <button
                  type="button"
                  onClick={() => setCardSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </header>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTabs.map((tab) => {
              const isJustVisited = lastVisitedModule === tab.id;
              const isPurge = tab.id === 'purge';
              const IconComp = tab.icon;

              return (
                <div
                  key={tab.id}
                  id={`card-${tab.id}`}
                  onClick={() => {
                    setActiveTab(tab.id as TabType);
                    setSelectedModule(tab.id as TabType);
                    setLastVisitedModule(tab.id as TabType);
                    if (tab.id === 'dropdowns') {
                      setActiveDropdownCategory(null);
                    }
                    try {
                      window.history.pushState({ masterModule: tab.id }, '', window.location.href);
                    } catch (_) {}
                  }}
                  className={cn(
                    "rounded-2xl p-5 transition-all duration-200 cursor-pointer flex flex-col justify-between group relative border text-left",
                    isJustVisited
                      ? "bg-white border-emerald-500 ring-2 ring-emerald-500/50 shadow-lg -translate-y-0.5"
                      : isPurge
                        ? "bg-red-50/50 hover:bg-red-50 text-red-900 border-red-200/80 hover:shadow-md hover:border-red-300"
                        : "bg-white hover:bg-slate-50/90 text-slate-800 border-slate-200 hover:shadow-lg hover:border-slate-300 hover:-translate-y-1"
                  )}
                >
                  <div>
                    {/* Top Row: Icon + Badge */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className={cn(
                        "p-3 rounded-xl border transition-colors",
                        isJustVisited
                          ? "bg-emerald-500 text-white border-emerald-400 shadow-sm"
                          : (isPurge ? "bg-red-100 text-red-600 border-red-200" : (tab.iconBg + " border-slate-100"))
                      )}>
                        <IconComp className="w-5 h-5" />
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isJustVisited ? (
                          <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border tracking-wider bg-emerald-500 text-white border-emerald-400 shadow-sm">
                            Recently Configured
                          </span>
                        ) : (
                          <span className={cn(
                            "text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border tracking-wider",
                            isPurge ? "bg-red-100 text-red-700 border-red-200" : "bg-slate-100 text-slate-600 border-slate-200"
                          )}>
                            {tab.badge}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Title & Description */}
                    <h3 className={cn(
                      "font-black text-sm tracking-tight mb-1.5",
                      isJustVisited ? "text-emerald-950" : "text-slate-900 group-hover:text-emerald-700"
                    )}>
                      {tab.label}
                    </h3>
                    <p className="text-xs leading-relaxed text-slate-500 font-medium line-clamp-2">
                      {tab.description}
                    </p>
                  </div>

                  {/* Card Bottom / Action CTA */}
                  <div className={cn(
                    "mt-4 pt-3 border-t flex items-center justify-between text-xs font-black",
                    isJustVisited
                      ? "border-emerald-100 text-emerald-600"
                      : (isPurge ? "border-red-200/60 text-red-600" : "border-slate-100 text-blue-600 group-hover:text-blue-700")
                  )}>
                    <span>
                      {isPurge ? 'Open Danger Zone →' : 'Launch Module →'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              );
            })}
          </div>

          {filteredTabs.length === 0 && (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <Sliders className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-600">No master settings cards matched "{cardSearchQuery}".</p>
              <button
                type="button"
                onClick={() => setCardSearchQuery('')}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Clear Search Filter
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ========================================================================= */
        /* 2. DEDICATED MODULE PAGE (OPENED AS DIFFERENT PAGE WITH BACK NAVIGATION)  */
        /* ========================================================================= */
        <div className="space-y-6">
          {/* Top Sticky Navigation Bar */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  if (selectedModule === 'dropdowns' && activeDropdownCategory !== null) {
                    setActiveDropdownCategory(null);
                  } else {
                    setSelectedModule(null);
                    setActiveDropdownCategory(null);
                    try {
                      window.history.pushState(null, '', window.location.href);
                    } catch (_) {}
                  }
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-2xl transition-all shadow-md hover:shadow-lg hover:-translate-x-0.5 cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4 text-emerald-400" />
                {selectedModule === 'dropdowns' && activeDropdownCategory !== null
                  ? 'Back to Dropdown Categories Cards'
                  : 'Back to Master Settings Cards'}
              </button>

              <div className="h-6 w-px bg-slate-200 hidden sm:block" />

              {/* Breadcrumb Navigation */}
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 overflow-hidden text-ellipsis whitespace-nowrap">
                <span 
                  onClick={() => {
                    setSelectedModule(null);
                    setActiveDropdownCategory(null);
                  }}
                  className="hover:text-slate-900 cursor-pointer underline-offset-2 hover:underline"
                >
                  Master Settings
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span 
                  onClick={() => {
                    if (selectedModule === 'dropdowns' && activeDropdownCategory) {
                      setActiveDropdownCategory(null);
                    }
                  }}
                  className={cn(
                    "truncate",
                    selectedModule === 'dropdowns' && activeDropdownCategory
                      ? "hover:text-slate-900 cursor-pointer underline-offset-2 hover:underline text-slate-600"
                      : "text-slate-900 font-black"
                  )}
                >
                  {availableTabs.find(t => t.id === selectedModule)?.label}
                </span>
                {selectedModule === 'dropdowns' && activeDropdownCategory && (
                  <>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-emerald-700 font-black truncate">
                      {DROPDOWN_CATEGORIES.find(c => c.key === activeDropdownCategory)?.title}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Quick Switch Module Dropdown */}
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
              <span className="text-xs text-slate-400 font-bold hidden md:inline">Jump to Module:</span>
              <select
                value={selectedModule}
                onChange={(e) => {
                  const newMod = e.target.value as TabType;
                  setSelectedModule(newMod);
                  setActiveTab(newMod);
                  setLastVisitedModule(newMod);
                  if (newMod === 'dropdowns') {
                    setActiveDropdownCategory(null);
                  }
                  try {
                    window.history.pushState({ masterModule: newMod }, '', window.location.href);
                  } catch (_) {}
                }}
                className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer w-full sm:w-auto"
              >
                {availableTabs.map(t => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Module Content */}
          <div className="pt-1">
            {renderContent()}
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in zoom-in-95 my-8">
            <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black">Add New System User</h3>
                  <p className="text-[11px] text-slate-400">
                    {isGlobalAdmin ? 'Register user under any company or organization' : `Register team member for ${userOrg || user?.companyName || 'your organization'}`}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddUserModalOpen(false)} 
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Full Name *
                  </label>
                  <input 
                    required 
                    type="text" 
                    value={newUser.name} 
                    onChange={e => setNewUser({...newUser, name: e.target.value})} 
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Email Address *
                  </label>
                  <input 
                    required 
                    type="email" 
                    value={newUser.email} 
                    onChange={e => setNewUser({...newUser, email: e.target.value})} 
                    placeholder="user@example.com"
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Phone Number
                  </label>
                  <input 
                    type="tel" 
                    value={newUser.phone} 
                    onChange={e => setNewUser({...newUser, phone: e.target.value})} 
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    User Role *
                  </label>
                  <select 
                    value={newUser.role} 
                    onChange={e => setNewUser({...newUser, role: e.target.value})} 
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                  >
                    {allowedRoles.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Organization / Company field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Organization / Company Name
                </label>
                {isGlobalAdmin ? (
                  <input 
                    type="text" 
                    value={newUser.companyName} 
                    onChange={e => setNewUser({...newUser, companyName: e.target.value})} 
                    placeholder="Meta Green Global HQ (or vendor name e.g. Vikram Solar)"
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" 
                  />
                ) : (
                  <div className="w-full px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-700 flex items-center justify-between">
                    <span>{userOrg || user?.companyName || 'My Organization'}</span>
                    <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-slate-200 text-slate-600">
                      Locked to your org
                    </span>
                  </div>
                )}
                <p className="text-[11px] text-slate-400 mt-1">
                  {isGlobalAdmin ? 'Global admin can assign user to any company or vendor.' : 'User will automatically be scoped to your organization directory.'}
                </p>
              </div>

              {/* Status & Temp Password */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Account Status
                  </label>
                  <select 
                    value={newUser.status} 
                    onChange={e => setNewUser({...newUser, status: e.target.value})} 
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                  >
                    <option value="Active">Active (Ready to login)</option>
                    <option value="Pending">Pending (Requires approval)</option>
                    <option value="Inactive">Inactive (Disabled)</option>
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase">
                      Initial Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const randomPass = 'Pass@' + Math.floor(1000 + Math.random() * 9000);
                        setNewUser(prev => ({ ...prev, tempPassword: randomPass }));
                      }}
                      className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 underline"
                    >
                      Generate
                    </button>
                  </div>
                  <div className="relative">
                    <input 
                      type={newUser.showPassword ? "text" : "password"}
                      value={newUser.tempPassword} 
                      onChange={e => setNewUser({...newUser, tempPassword: e.target.value})} 
                      className="w-full pl-3 pr-9 py-2.5 border border-slate-300 rounded-xl font-mono font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" 
                    />
                    <button
                      type="button"
                      onClick={() => setNewUser(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {newUser.showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => {
                    setIsAddUserModalOpen(false);
                    setNewUser({ 
                      name: '', 
                      email: '', 
                      phone: '',
                      role: isGlobalAdmin ? 'Sales Executive' : 'Vendor Employee', 
                      companyName: '',
                      status: 'Active',
                      tempPassword: 'User123!',
                      showPassword: false
                    });
                  }} 
                  className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-200"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in zoom-in-95 my-8">
            <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black">Edit User Profile</h3>
                  <p className="text-[11px] text-slate-400">{editingUser.email}</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingUser(null)} 
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Full Name *
                  </label>
                  <input 
                    required 
                    type="text" 
                    value={editUserForm.name} 
                    onChange={e => setEditUserForm({...editUserForm, name: e.target.value})} 
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Email Address *
                  </label>
                  <input 
                    required 
                    type="email" 
                    value={editUserForm.email} 
                    onChange={e => setEditUserForm({...editUserForm, email: e.target.value})} 
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Phone Number
                  </label>
                  <input 
                    type="tel" 
                    value={editUserForm.phone} 
                    onChange={e => setEditUserForm({...editUserForm, phone: e.target.value})} 
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    User Role *
                  </label>
                  <select 
                    value={editUserForm.role} 
                    onChange={e => setEditUserForm({...editUserForm, role: e.target.value})} 
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                  >
                    {allowedRoles.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                    {!allowedRoles.includes(editUserForm.role) && (
                      <option value={editUserForm.role}>{editUserForm.role}</option>
                    )}
                  </select>
                </div>
              </div>

              {/* Organization / Company */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Organization / Company
                </label>
                {isGlobalAdmin ? (
                  <input 
                    type="text" 
                    value={editUserForm.companyName} 
                    onChange={e => setEditUserForm({...editUserForm, companyName: e.target.value})} 
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" 
                  />
                ) : (
                  <div className="w-full px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-700">
                    {editUserForm.companyName || userOrg || 'My Organization'}
                  </div>
                )}
              </div>

              {/* Account Status */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Account Status
                </label>
                <select 
                  value={editUserForm.status} 
                  onChange={e => setEditUserForm({...editUserForm, status: e.target.value})} 
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                >
                  <option value="Active">Active (Approved)</option>
                  <option value="Pending">Pending (Awaiting Approval)</option>
                  <option value="Inactive">Inactive (Disabled)</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              {/* Reset Password Toggle */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editUserForm.resetPassword}
                    onChange={e => setEditUserForm({...editUserForm, resetPassword: e.target.checked})}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-bold text-slate-800">Set New Temporary Password</span>
                </label>

                {editUserForm.resetPassword && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">
                        New Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const randomPass = 'Pass@' + Math.floor(1000 + Math.random() * 9000);
                          setEditUserForm(prev => ({ ...prev, newPassword: randomPass }));
                        }}
                        className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 underline"
                      >
                        Generate
                      </button>
                    </div>
                    <div className="relative">
                      <input 
                        type={editUserForm.showPassword ? "text" : "password"}
                        value={editUserForm.newPassword} 
                        onChange={e => setEditUserForm({...editUserForm, newPassword: e.target.value})} 
                        placeholder="Enter new temporary password"
                        className="w-full pl-3 pr-9 py-2 border border-slate-300 rounded-xl font-mono text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white" 
                      />
                      <button
                        type="button"
                        onClick={() => setEditUserForm(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {editUserForm.showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      User will be required to change this password on next login.
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setEditingUser(null)} 
                  className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-200"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Roof Type Modal */}
      {isRoofModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in zoom-in-95">
            <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-black">
                  {editingRoofId ? 'Edit Roof Type' : 'Add New Roof Type'}
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsRoofModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRoofType} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Roof Type Name *
                </label>
                <input
                  required
                  type="text"
                  value={roofForm.name}
                  onChange={e => setRoofForm({ ...roofForm, name: e.target.value })}
                  placeholder="e.g. Concrete Flat Roof / Tin Shed"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-medium outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Description & Substrate Notes
                </label>
                <textarea
                  rows={3}
                  value={roofForm.description}
                  onChange={e => setRoofForm({ ...roofForm, description: e.target.value })}
                  placeholder="e.g. Concrete slab with waterproof membrane..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Mounting Structure
                  </label>
                  <select
                    value={roofForm.structureType}
                    onChange={e => setRoofForm({ ...roofForm, structureType: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-medium outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="Ballasted / Anchor Fixed Tilt">Ballasted / Anchor Fixed Tilt</option>
                    <option value="Flush Mount / Mini Rail">Flush Mount / Mini Rail</option>
                    <option value="Tile Hooks & Profile Rails">Tile Hooks & Profile Rails</option>
                    <option value="Hanger Bolts & Long Rails">Hanger Bolts & Long Rails</option>
                    <option value="High Elevated Heavy MS/GI Columns">High Elevated Heavy MS/GI Columns</option>
                    <option value="GI Piled Foundation Fixed Tilt">GI Piled Foundation Fixed Tilt</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Design Tilt Angle
                  </label>
                  <input
                    type="text"
                    value={roofForm.tiltAngle}
                    onChange={e => setRoofForm({ ...roofForm, tiltAngle: e.target.value })}
                    placeholder="e.g. 15° - 20°"
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-medium outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Status
                </label>
                <select
                  value={roofForm.status}
                  onChange={e => setRoofForm({ ...roofForm, status: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-medium outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsRoofModalOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" /> Save Roof Type
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD / EDIT DROPDOWN OPTION MODAL */}
      {isAddOptionModalOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setIsAddOptionModalOpen(false)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in zoom-in-95 my-8"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black">
                    {editingOption ? 'Edit Dropdown Option' : 'Add Dropdown Option'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Category: {DROPDOWN_CATEGORIES.find(c => c.key === selectedDropdownCategory)?.title || selectedDropdownCategory}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddOptionModalOpen(false)} 
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOption} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Option Name *
                </label>
                <input 
                  required 
                  type="text" 
                  value={optionForm.name} 
                  onChange={e => setOptionForm({...optionForm, name: e.target.value})} 
                  placeholder="e.g. Inbound Website Lead"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Short Code / Identifier
                </label>
                <input 
                  type="text" 
                  value={optionForm.code} 
                  onChange={e => setOptionForm({...optionForm, code: e.target.value.toUpperCase()})} 
                  placeholder="e.g. SRC-WEB"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-mono uppercase font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs" 
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Short abbreviation or ERP lookup code (optional)</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Description / Helpful Hint
                </label>
                <textarea 
                  rows={3}
                  value={optionForm.description} 
                  onChange={e => setOptionForm({...optionForm, description: e.target.value})} 
                  placeholder="Describe when to choose this option or what it represents..."
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs resize-none" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Status
                </label>
                <select 
                  value={optionForm.status} 
                  onChange={e => setOptionForm({...optionForm, status: e.target.value as any})} 
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white text-xs cursor-pointer"
                >
                  <option value="Active">Active (Visible across ERP dropdowns)</option>
                  <option value="Inactive">Inactive (Hidden from dropdowns)</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsAddOptionModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingOption}
                  className="px-5 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-200 cursor-pointer disabled:opacity-50"
                >
                  {isSavingOption ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingOption ? 'Update Option' : 'Add Option'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
