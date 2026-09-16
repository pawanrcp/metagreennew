import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  serverTimestamp,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
  where
} from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { Lead, LeadStatus, CustomerType, CustomerRecord } from '@/src/types';
import { Plus, Search, Filter, MoreVertical, Mail, Phone, MapPin, Users, FileText, Edit2, Trash2, ShieldCheck, Sparkles, Building2, Loader2, Compass, LocateFixed, Box, Sun, Zap, Wrench, CheckCircle2, Clock, ArrowRight, FileCheck, X, Download, UserCheck, UserPlus, PackageCheck, RefreshCw, Tag } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useAuth } from '@/src/context/AuthContext';
import { useLogos } from '@/src/context/LogoContext';
import Solar3DViewer from './Solar3DViewer';
import { saveGeneratedDocument, subscribeGeneratedDocuments, downloadDocumentPDF } from '@/src/services/generatedDocuments.service';
import { GeneratedDocument } from '@/src/types';

const DEFAULT_VENDORS = [
  { id: 'v1', name: 'Waaree Energies Ltd', category: 'Solar Panels (Mono/Poly PV)' },
  { id: 'v2', name: 'Adani Solar (Mundra Solar)', category: 'Solar Panels (Bifacial TopCon)' },
  { id: 'v3', name: 'Tata Power Solar Systems', category: 'Solar Panels & EPC Kits' },
  { id: 'v4', name: 'Havells India (Enviro)', category: 'String & Hybrid Inverters' },
  { id: 'v5', name: 'Growatt New Energy', category: 'Solar Inverters & Storage' },
  { id: 'v6', name: 'Luminous Power Technologies', category: 'Batteries & Inverters' },
  { id: 'v7', name: 'Vikram Solar Limited', category: 'Solar PV Modules' },
  { id: 'v8', name: 'Sungrow Power Supply', category: 'Utility & Commercial Inverters' }
];

const STOCK_CATEGORIES = [
  'Solar Panels (Mono/Poly PV)',
  'Inverters (String/Hybrid/Micro)',
  'Mounting Structures & Rails',
  'Batteries & Storage (LiFePO4/Lead-Acid)',
  'Balance of System & Wiring',
  'Other Vendor Consignment Stock'
];

const initialLeadState: Partial<Lead> = {
  name: '',
  email: '',
  phone: '',
  source: 'Website',
  address: '',
  city: '',
  district: '',
  state: '',
  pincode: '',
  gpsLocation: '',
  roofType: '',
  monthlyUnits: '',
  expectedLoad: '',
  expectedLoadUnit: 'KW',
  electricityBillUrl: '',
  propertyImagesUrls: [],
  roofImagesUrls: [],
  customerType: 'Normal Customer',
  vendor: '',
  stockCategory: '',
  vendorStockRef: '',
  vendorStockNotes: '',
  assignedTo: ''
};

export default function CRM({ 
  initialFilter, 
  onNavigate 
}: { 
  initialFilter?: string;
  onNavigate?: (view: any, filter?: string) => void;
}) {
  const { user } = useAuth();
  const { logos } = useLogos();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [generatedDocumentsList, setGeneratedDocumentsList] = useState<GeneratedDocument[]>([]);
  const [viewingQuotationDoc, setViewingQuotationDoc] = useState<GeneratedDocument | null>(null);
  const [searchTerm, setSearchTerm] = useState(initialFilter || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [isSubmittingQuotation, setIsSubmittingQuotation] = useState(false);
  const [isSubmittingAssign, setIsSubmittingAssign] = useState(false);
  const [isBatchSyncing, setIsBatchSyncing] = useState(false);

  // Customer Differentiation Filters for Leads
  const [customerTypeFilter, setCustomerTypeFilter] = useState<'ALL' | 'Normal Customer' | 'Vendor Related Stock'>('ALL');
  const [selectedVendorFilter, setSelectedVendorFilter] = useState<string>('ALL');
  const [vendorsList, setVendorsList] = useState<{ id: string; name: string; category?: string }[]>(DEFAULT_VENDORS);

  const [showTrash, setShowTrash] = useState(false);
  const [selected3DLead, setSelected3DLead] = useState<Lead | null>(null);

  // Role Scoped Lead Filtering
  const roleScopedLeads = leads.filter(lead => {
    if (!user) return true;

    // Super Admin / Solar Company Admin see ALL leads across India
    if (user.role === 'Super Admin' || user.role === 'Solar Company Admin') {
      return true;
    }

    // Vendor and Vendor Employee have full CRM lead pipeline access
    if (user.role === 'Vendor' || user.role === 'Vendor Employee') {
      const vendorName = (user.companyName || user.name || '').toLowerCase();
      const uName = (user.name || '').toLowerCase();
      const uEmail = (user.email || '').toLowerCase();
      return (
        lead.vendor?.toLowerCase().includes(vendorName) ||
        lead.assignedTo?.toLowerCase().includes(uName) ||
        lead.assignedTo?.toLowerCase().includes(vendorName) ||
        lead.createdBy === uEmail ||
        true
      );
    }

    // Installer and Solar Installer have full CRM lead pipeline access
    if (user.role === 'Installer' || user.role === 'Solar Installer' || user.role === 'Survey Engineer') {
      const uName = (user.name || '').toLowerCase();
      const uEmail = (user.email || '').toLowerCase();
      return (
        lead.assignedTo?.toLowerCase().includes(uName) ||
        lead.assignedTo?.toLowerCase().includes('installer') ||
        lead.installerId === user.uid ||
        lead.createdBy === uEmail ||
        true
      );
    }

    // Sales Rep / Regional Manager see leads assigned to or created by them
    const uName = (user.name || '').toLowerCase();
    const uEmail = (user.email || '').toLowerCase();

    return (
      lead.assignedTo?.toLowerCase().includes(uName) ||
      lead.salesRep?.toLowerCase().includes(uName) ||
      lead.createdBy === uEmail ||
      lead.region === (user as any).region ||
      true
    );
  });

  const [selectedStageGroup, setSelectedStageGroup] = useState<'all' | 'qualified' | 'proposal' | 'approved'>('all');

  // Customer Differentiation Metrics for Leads
  const normalLeadsCount = React.useMemo(() => {
    return roleScopedLeads.filter(l => !l.isDeleted && (l.customerType || (l.vendor && l.vendor !== 'Default Vendor' ? 'Vendor Related Stock' : 'Normal Customer')) === 'Normal Customer').length;
  }, [roleScopedLeads]);

  const vendorStockLeadsCount = React.useMemo(() => {
    return roleScopedLeads.filter(l => !l.isDeleted && (l.customerType === 'Vendor Related Stock' || (l.vendor && l.vendor !== 'Default Vendor' && !l.customerType))).length;
  }, [roleScopedLeads]);

  const normalLeadsCapacity = React.useMemo(() => {
    return roleScopedLeads
      .filter(l => !l.isDeleted && (l.customerType || (l.vendor && l.vendor !== 'Default Vendor' ? 'Vendor Related Stock' : 'Normal Customer')) === 'Normal Customer')
      .reduce((sum, l) => {
        const raw = parseFloat(l.expectedLoad || '0') || 0;
        return sum + (l.expectedLoadUnit === 'MW' ? raw * 1000 : raw);
      }, 0);
  }, [roleScopedLeads]);

  const vendorStockLeadsCapacity = React.useMemo(() => {
    return roleScopedLeads
      .filter(l => !l.isDeleted && (l.customerType === 'Vendor Related Stock' || (l.vendor && l.vendor !== 'Default Vendor' && !l.customerType)))
      .reduce((sum, l) => {
        const raw = parseFloat(l.expectedLoad || '0') || 0;
        return sum + (l.expectedLoadUnit === 'MW' ? raw * 1000 : raw);
      }, 0);
  }, [roleScopedLeads]);

  const uniqueVendorsFromLeads = React.useMemo(() => {
    const set = new Set<string>();
    leads.forEach(l => {
      if (l.vendor && l.vendor.trim() && l.vendor !== 'Default Vendor') {
        set.add(l.vendor.trim());
      }
    });
    vendorsList.forEach(v => {
      if (v.name?.trim()) set.add(v.name.trim());
    });
    return Array.from(set).sort();
  }, [leads, vendorsList]);

  const filteredLeads = roleScopedLeads.filter(lead => {
    const matchesTrash = showTrash ? lead.isDeleted : !lead.isDeleted;

    const leadCustType = lead.customerType || (lead.vendor && lead.vendor.trim() && lead.vendor !== 'Default Vendor' ? 'Vendor Related Stock' : 'Normal Customer');
    if (customerTypeFilter !== 'ALL' && leadCustType !== customerTypeFilter) {
      return false;
    }

    if (selectedVendorFilter !== 'ALL') {
      const vName = (lead.vendor || '').trim().toLowerCase();
      if (vName !== selectedVendorFilter.toLowerCase()) {
        return false;
      }
    }

    const matchesSearch =
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.assignedTo && lead.assignedTo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lead.vendor && lead.vendor.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lead.stockCategory && lead.stockCategory.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lead.vendorStockRef && lead.vendorStockRef.toLowerCase().includes(searchTerm.toLowerCase())) ||
      leadCustType.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesGroup = 
      selectedStageGroup === 'all' ? true :
      selectedStageGroup === 'qualified' ? ['Qualified', 'Site Survey'].includes(lead.status) :
      selectedStageGroup === 'proposal' ? ['Proposal', 'Negotiation'].includes(lead.status) :
      selectedStageGroup === 'approved' ? ['Approved', 'Installation', 'Completed', 'AMC'].includes(lead.status) : true;

    return matchesTrash && matchesSearch && matchesGroup;
  });

  const [newLead, setNewLead] = useState<Partial<Lead>>(initialLeadState);
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);
  const [selectedLeadForQuotation, setSelectedLeadForQuotation] = useState<Lead | null>(null);
  const [quotationDetails, setQuotationDetails] = useState({
    systemSize: '',
    panelType: 'Monocrystalline',
    inverterType: 'String Inverter',
    totalCost: '',
    estimatedGeneration: ''
  });

  const [roofTypesList, setRoofTypesList] = useState<{ id?: string; name: string; structureType?: string; tiltAngle?: string }[]>([]);
  const [isManageRoofTypesOpen, setIsManageRoofTypesOpen] = useState(false);
  const [editingRoofId, setEditingRoofId] = useState<string | null>(null);
  const [roofFormName, setRoofFormName] = useState('');
  const [roofFormStructure, setRoofFormStructure] = useState('Fixed Mount');
  const [roofFormTilt, setRoofFormTilt] = useState('15°');
  const [isSavingRoofType, setIsSavingRoofType] = useState(false);

  useEffect(() => {
    const unsubRoofs = onSnapshot(collection(db, 'roofTypes'), (snapshot) => {
      if (snapshot.empty) {
        const defaults = [
          { name: 'RCC (Flat Roof)', structureType: 'Ballasted / Anchor Fixed Tilt', tiltAngle: '15° - 20°' },
          { name: 'Industrial Tin Shed', structureType: 'Mini Rail / Klip-lok Clamps', tiltAngle: 'Parallel to Roof' },
          { name: 'Tiled Roof', structureType: 'Tile Hooks & Profile Rails', tiltAngle: 'Pitch Slope' },
          { name: 'Asbestos Sheet', structureType: 'Hanger Bolts & Long Rails', tiltAngle: 'Parallel to Roof' },
          { name: 'Ground Mount Structure', structureType: 'GI Piled Foundation', tiltAngle: '20° - 25°' },
          { name: 'Elevated Super Structure', structureType: 'High Elevated Heavy MS/GI Columns', tiltAngle: '12° - 15°' }
        ];
        setRoofTypesList(defaults);
      } else {
        const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));
        setRoofTypesList(items);
      }
    });
    return () => unsubRoofs();
  }, []);

  const handleSaveRoofType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roofFormName.trim()) return;
    setIsSavingRoofType(true);
    try {
      if (editingRoofId) {
        await updateDoc(doc(db, 'roofTypes', editingRoofId), {
          name: roofFormName.trim(),
          structureType: roofFormStructure,
          tiltAngle: roofFormTilt,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'roofTypes'), {
          name: roofFormName.trim(),
          structureType: roofFormStructure,
          tiltAngle: roofFormTilt,
          status: 'Active',
          createdAt: serverTimestamp()
        });
        setNewLead(prev => ({ ...prev, roofType: roofFormName.trim() }));
      }
      setRoofFormName('');
      setRoofFormStructure('Fixed Mount');
      setRoofFormTilt('15°');
      setEditingRoofId(null);
    } catch (err) {
      console.error('Error saving roof type:', err);
      alert('Failed to save roof type.');
    } finally {
      setIsSavingRoofType(false);
    }
  };

  const handleDeleteRoofType = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete roof type "${name}"?`)) return;
    try {
      await deleteDoc(doc(db, 'roofTypes', id));
    } catch (err) {
      console.error('Error deleting roof type:', err);
      alert('Failed to delete roof type.');
    }
  };

  useEffect(() => {
    const q = query(collection(db, 'leads'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLeads(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead)));
    });
    return () => unsubscribe();
  }, []);

  // Reverse Geocoding for CRM Lead Address: GPS Coords -> Address, City, District, State, Pincode
  const handleDropPinGPS = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const gpsStr = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;

        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
          const data = await res.json();
          if (data && data.address) {
            const addr = data.address;
            const door = addr.house_number || addr.building || addr.unit || addr.house || '';
            const street = [addr.road, addr.suburb, addr.neighbourhood, addr.industrial].filter(Boolean).join(', ') || data.display_name?.split(',')[0] || '';
            const fullAddress = door ? `${door}, ${street}` : street;
            const city = addr.city || addr.town || addr.village || '';
            const district = addr.county || addr.district || city || '';
            const state = addr.state || 'Telangana';
            const pincode = addr.postcode || '';

            setNewLead(prev => ({
              ...prev,
              gpsLocation: gpsStr,
              address: fullAddress || prev.address,
              city: city || prev.city,
              district: district || prev.district,
              state: state || prev.state,
              pincode: pincode || prev.pincode
            }));
          } else {
            setNewLead(prev => ({ ...prev, gpsLocation: gpsStr }));
          }
        } catch (err) {
          console.error("Reverse geocoding error:", err);
          setNewLead(prev => ({ ...prev, gpsLocation: gpsStr }));
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (error) => {
        console.error("GPS Error:", error);
        setIsDetectingLocation(false);
        alert("Unable to retrieve location. Please enter manually.");
      },
      { timeout: 10000 }
    );
  };

  // Sync Lead to Customers Collection upon Assignment or Approval
  const syncLeadToCustomer = async (
    leadData: Partial<Lead>,
    leadId: string,
    assignedOfficerName: string
  ): Promise<string> => {
    try {
      const rawCapacity = parseFloat(leadData.expectedLoad || '5') || 5;
      const capacityKw = leadData.expectedLoadUnit === 'MW' ? rawCapacity * 1000 : rawCapacity;
      const totalCost = Number(leadData.quotationTotalCost || leadData.estimatedSystemCost) || (capacityKw * 55000);

      const isVendorStock = leadData.customerType === 'Vendor Related Stock' || Boolean(leadData.vendor && leadData.vendor.trim() && leadData.vendor !== 'Default Vendor');
      const custType: CustomerType = isVendorStock ? 'Vendor Related Stock' : 'Normal Customer';
      const vendorName = isVendorStock ? (leadData.vendor || '').trim() : '';

      // Check existing customer by leadId first, or by phone
      let existingCustomerId = leadData.customerId || '';

      if (!existingCustomerId && leadId) {
        const qByLeadId = query(collection(db, 'customers'), where('leadId', '==', leadId));
        const snapLead = await getDocs(qByLeadId);
        if (!snapLead.empty) {
          existingCustomerId = snapLead.docs[0].id;
        }
      }

      if (!existingCustomerId && leadData.phone) {
        const qByPhone = query(collection(db, 'customers'), where('phone', '==', leadData.phone));
        const snapPhone = await getDocs(qByPhone);
        if (!snapPhone.empty) {
          existingCustomerId = snapPhone.docs[0].id;
        }
      }

      const isApprovedOrActive = ['Approved', 'Installation', 'Completed', 'AMC'].includes(leadData.status || '');
      const customerStatus = isApprovedOrActive ? 'Active' : 'Lead';

      const customerPayload: any = {
        name: leadData.name || 'Prospect Client',
        phone: leadData.phone || '',
        email: leadData.email || '',
        address: leadData.address || '',
        city: leadData.city || '',
        district: leadData.district || '',
        state: leadData.state || 'Maharashtra',
        pincode: leadData.pincode || '',
        roofType: leadData.roofType || 'RCC Flat Roof',
        sanctionedLoad: leadData.expectedLoad || '5',
        systemCapacityKw: capacityKw,
        totalProjectValue: totalCost,
        leadId: leadId,
        source: leadData.source || 'Website',
        assignedTo: assignedOfficerName || 'Solar Team',
        customerType: custType,
        vendorName: vendorName,
        stockCategory: isVendorStock ? (leadData.stockCategory || 'Solar Panels (Mono/Poly PV)') : '',
        vendorStockRef: isVendorStock ? (leadData.vendorStockRef || '') : '',
        vendorStockNotes: isVendorStock ? (leadData.vendorStockNotes || '') : '',
        status: customerStatus,
        notes: `Customer account linked to CRM Lead (${custType}, assigned to ${assignedOfficerName || 'Solar Team'})`,
        updatedAt: serverTimestamp()
      };

      if (existingCustomerId) {
        await updateDoc(doc(db, 'customers', existingCustomerId), customerPayload);
        return existingCustomerId;
      } else {
        const newCustRef = await addDoc(collection(db, 'customers'), {
          ...customerPayload,
          creatorId: user?.uid || '',
          createdBy: user?.email || '',
          creatorName: user?.name || '',
          companyName: user?.companyName || user?.vendorAccount?.companyName || '',
          createdAt: serverTimestamp()
        });
        return newCustRef.id;
      }
    } catch (error) {
      console.error('Error syncing lead to customer:', error);
      return '';
    }
  };

  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingLead(true);
    try {
      const assignedToName = (newLead.assignedTo || user?.name || 'Sales Representative').trim();
      const isVendorStock = newLead.customerType === 'Vendor Related Stock' || Boolean(newLead.vendor && newLead.vendor.trim() && newLead.vendor !== 'Default Vendor');
      const custType: CustomerType = isVendorStock ? 'Vendor Related Stock' : 'Normal Customer';
      const vendorName = isVendorStock ? (newLead.vendor || '').trim() : '';

      if (editingLeadId) {
        await updateDoc(doc(db, 'leads', editingLeadId), {
          ...newLead,
          customerType: custType,
          vendor: vendorName,
          assignedTo: assignedToName,
          updatedAt: serverTimestamp()
        });

        // Automatically sync to Customers collection when lead is assigned!
        const custId = await syncLeadToCustomer(
          { ...newLead, id: editingLeadId, customerType: custType, vendor: vendorName },
          editingLeadId,
          assignedToName
        );
        if (custId) {
          await updateDoc(doc(db, 'leads', editingLeadId), { customerId: custId });
        }
      } else {
        const leadRef = await addDoc(collection(db, 'leads'), {
          ...newLead,
          customerType: custType,
          vendor: vendorName,
          createdBy: user?.email || 'admin@metagreen.com',
          creatorName: user?.name || 'Admin',
          assignedTo: assignedToName,
          status: newLead.status || 'New Lead',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        // Automatically sync to Customers collection when lead is assigned!
        const custId = await syncLeadToCustomer(
          { ...newLead, id: leadRef.id, customerType: custType, vendor: vendorName },
          leadRef.id,
          assignedToName
        );
        if (custId) {
          await updateDoc(doc(db, 'leads', leadRef.id), { customerId: custId });
        }
      }

      setIsModalOpen(false);
      setEditingLeadId(null);
      setNewLead(initialLeadState);
    } catch (err) {
      console.error('Error saving lead:', err);
      alert('Failed to save lead. Please check network connection.');
    } finally {
      setIsSubmittingLead(false);
    }
  };

  // Batch Sync All Assigned Historical Leads to Customers Collection
  const handleBatchSyncAssignedLeads = async () => {
    const assignedLeads = leads.filter(l => !l.isDeleted && l.assignedTo && l.assignedTo.trim());
    if (assignedLeads.length === 0) {
      alert("No assigned leads found to sync.");
      return;
    }
    setIsBatchSyncing(true);
    let count = 0;
    try {
      for (const l of assignedLeads) {
        const custId = await syncLeadToCustomer(l, l.id, l.assignedTo!);
        if (custId && l.customerId !== custId) {
          await updateDoc(doc(db, 'leads', l.id), { customerId: custId });
        }
        count++;
      }
      alert(`Successfully synced ${count} assigned leads to Customers!`);
    } catch (err) {
      console.error("Batch sync error:", err);
      alert("Encountered an error while syncing leads to customers.");
    } finally {
      setIsBatchSyncing(false);
    }
  };

  const handleDeleteLead = async (id: string, permanently: boolean = false) => {
    if (permanently) {
      if (window.confirm("Are you sure you want to permanently delete this lead?")) {
        try {
          await deleteDoc(doc(db, 'leads', id));
        } catch (err) {
          console.error('Error deleting lead:', err);
        }
      }
    } else {
      if (window.confirm("Are you sure you want to move this lead to trash?")) {
        try {
          await updateDoc(doc(db, 'leads', id), { isDeleted: true });
        } catch (err) {
          console.error('Error moving lead to trash:', err);
        }
      }
    }
  };

  // Dynamic Regional Officers dataset structure
  interface DynamicOfficer {
    id: string;
    name: string;
    role: string;
    region: string;
    states: string[];
    cities: string[];
    contact: string;
  }

  const DEFAULT_OFFICERS: DynamicOfficer[] = [
    { id: 'E101', name: 'Rajesh Sharma', role: 'Regional Project Manager', region: 'West Zone (Maharashtra / Gujarat)', states: ['Maharashtra', 'Gujarat', 'Goa', 'MH', 'GJ'], cities: ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Ahmedabad', 'Surat'], contact: '+91 98765 11001' },
    { id: 'E102', name: 'Sunita Patil', role: 'Site Engineer', region: 'Maharashtra Region', states: ['Maharashtra', 'MH'], cities: ['Pune', 'Satara', 'Kolhapur', 'Mumbai', 'Thane'], contact: '+91 98765 11002' },
    { id: 'E103', name: 'Amit Solanki', role: 'Installation Lead', region: 'Gujarat Region', states: ['Gujarat', 'GJ'], cities: ['Ahmedabad', 'Vadodara', 'Surat', 'Rajkot'], contact: '+91 98765 11003' },
    { id: 'E201', name: 'Karthik Ramanathan', role: 'Regional Project Manager', region: 'South Zone (Karnataka / TN / KL)', states: ['Karnataka', 'Tamil Nadu', 'Kerala', 'KA', 'TN', 'KL'], cities: ['Bengaluru', 'Bangalore', 'Chennai', 'Coimbatore', 'Kochi', 'Mysuru'], contact: '+91 98765 22001' },
    { id: 'E202', name: 'Sanjay Reddy', role: 'Senior Project Lead', region: 'Telangana & AP', states: ['Telangana', 'Andhra Pradesh', 'TS', 'AP'], cities: ['Hyderabad', 'Secunderabad', 'Vijayawada', 'Visakhapatnam'], contact: '+91 98765 22002' },
    { id: 'E301', name: 'Vikram Singh Chawla', role: 'Regional Project Manager', region: 'North Zone (Delhi NCR / Punjab / UP / Rajasthan)', states: ['Delhi', 'Punjab', 'Haryana', 'Uttar Pradesh', 'Rajasthan', 'DL', 'PB', 'HR', 'UP', 'RJ'], cities: ['Delhi', 'New Delhi', 'Noida', 'Gurugram', 'Gurgaon', 'Jaipur', 'Chandigarh', 'Lucknow'], contact: '+91 98765 33001' },
    { id: 'E302', name: 'Pooja Agarwal', role: 'Lead Survey Engineer', region: 'Delhi NCR & UP Region', states: ['Delhi', 'Uttar Pradesh', 'DL', 'UP'], cities: ['Noida', 'Ghaziabad', 'Lucknow', 'Kanpur'], contact: '+91 98765 33002' },
    { id: 'E401', name: 'Subhashish Roy', role: 'Regional Project Manager', region: 'East Zone (West Bengal / Odisha)', states: ['West Bengal', 'Odisha', 'Bihar', 'Jharkhand', 'WB', 'OD', 'BR', 'JH'], cities: ['Kolkata', 'Bhubaneswar', 'Patna', 'Ranchi'], contact: '+91 98765 44001' },
  ];

  const [officers, setOfficers] = useState<DynamicOfficer[]>(DEFAULT_OFFICERS);

  // Approval & Assignment Modal States
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignModalMode, setAssignModalMode] = useState<'assign' | 'approve'>('approve');
  const [selectedLeadForApproval, setSelectedLeadForApproval] = useState<Lead | null>(null);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>('');
  const [assignmentNotes, setAssignmentNotes] = useState<string>('');
  const [showAllOfficers, setShowAllOfficers] = useState(false);

  useEffect(() => {
    // 1. Dynamic Leads Subscription
    const qLeads = query(collection(db, 'leads'), orderBy('createdAt', 'desc'));
    const unsubLeads = onSnapshot(qLeads, (snapshot) => {
      setLeads(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead)));
    });

    // 2. Dynamic Employees Subscription for Location-Based Regional Officer Assignment
    const qEmployees = query(collection(db, 'employees'));
    const unsubEmployees = onSnapshot(qEmployees, (snapshot) => {
      if (!snapshot.empty) {
        const dynamicList: DynamicOfficer[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || 'Unnamed Employee',
            role: data.role || 'Project Officer',
            region: data.region || data.team || 'General Region',
            states: data.states || (data.state ? [data.state] : ['Maharashtra', 'Gujarat', 'Karnataka', 'Delhi', 'Telangana']),
            cities: data.cities || (data.city ? [data.city] : ['Mumbai', 'Pune', 'Bengaluru', 'Delhi', 'Hyderabad']),
            contact: data.contact || data.phone || '+91 98765 00000'
          };
        });
        setOfficers(dynamicList);
      } else {
        setOfficers(DEFAULT_OFFICERS);
      }
    });

    // 3. Dynamic Generated Documents Subscription
    const unsubDocs = subscribeGeneratedDocuments((docs) => {
      setGeneratedDocumentsList(docs);
    });

    // 4. Dynamic Vendors Subscription
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

    // 5. Registered Vendor Users Subscription
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
      unsubLeads();
      unsubEmployees();
      unsubDocs();
      unsubVendors();
      unsubUsers();
    };
  }, []);

  // Match lead with its generated quotation document from generatedDocuments repository
  const getLeadQuotation = (lead: Lead): GeneratedDocument | null => {
    const quotationDocs = generatedDocumentsList.filter(d => d.type === 'quotation');

    // 1. Direct match by leadId
    const byLeadId = quotationDocs.find(d => d.leadId === lead.id);
    if (byLeadId) return byLeadId;

    // 2. Direct match by quotationId on lead
    if (lead.quotationId) {
      const byQuoteId = quotationDocs.find(d => d.id === lead.quotationId || d.docNumber === lead.quotationId);
      if (byQuoteId) return byQuoteId;
    }

    // 3. Match by customer phone digits
    const cleanDigits = (s?: string) => (s || '').replace(/\D/g, '');
    const leadPhoneDigits = cleanDigits(lead.phone);
    if (leadPhoneDigits && leadPhoneDigits.length >= 10) {
      const byPhone = quotationDocs.find(d => {
        const docPhoneDigits = cleanDigits(d.customerPhone);
        return docPhoneDigits.length >= 10 && docPhoneDigits.slice(-10) === leadPhoneDigits.slice(-10);
      });
      if (byPhone) return byPhone;
    }

    // 4. Match by customer email
    if (lead.email && lead.email.trim()) {
      const leadEmail = lead.email.trim().toLowerCase();
      const byEmail = quotationDocs.find(d => (d.customerEmail || '').trim().toLowerCase() === leadEmail);
      if (byEmail) return byEmail;
    }

    // 5. Match by customer name (case-insensitive)
    if (lead.name && lead.name.trim()) {
      const leadName = lead.name.trim().toLowerCase();
      const byName = quotationDocs.find(d => (d.customerName || '').trim().toLowerCase() === leadName);
      if (byName) return byName;
    }

    // 6. If lead document in Firestore explicitly has quotationGenerated: true
    if (lead.quotationGenerated) {
      return {
        id: lead.quotationId || lead.id,
        docNumber: lead.quotationId ? (lead.quotationId.startsWith('QT') ? lead.quotationId : `QT-${lead.quotationId.slice(-6)}`) : `QT-${lead.id.slice(-6)}`,
        type: 'quotation',
        customerName: lead.name,
        customerPhone: lead.phone,
        customerEmail: lead.email,
        customerAddress: lead.address,
        city: lead.city,
        state: lead.state,
        leadId: lead.id,
        totalAmount: Number(lead.quotationTotalCost || lead.estimatedSystemCost || 0),
        systemCapacityKw: Number(lead.quotationSystemSize || lead.systemSizeKw || (lead.expectedLoad ? parseFloat(lead.expectedLoad) : 5)),
        status: 'Approved',
        createdAt: lead.createdAt || new Date().toISOString(),
        userId: user?.uid || 'system',
        userName: user?.name || 'Solar Consultant',
        userEmail: user?.email || '',
        userRole: user?.role || 'Sales Executive',
        companyName: user?.companyName || 'Meta Green Global HQ',
        items: [
          {
            name: `Solar PV System (${lead.quotationSystemSize || lead.systemSizeKw || (lead.expectedLoad ? parseFloat(lead.expectedLoad) : 5)} kW)`,
            description: `Grid-tied Rooftop Solar Power Plant with High-Efficiency Solar Modules & String Inverter`,
            quantity: 1,
            unitPrice: Number(lead.quotationTotalCost || lead.estimatedSystemCost || 0),
            amount: Number(lead.quotationTotalCost || lead.estimatedSystemCost || 0)
          }
        ]
      } as GeneratedDocument;
    }

    return null;
  };

  const handleDocClick = (e: React.MouseEvent, lead: Lead) => {
    e.stopPropagation();
    const quote = getLeadQuotation(lead);
    if (quote) {
      // If quotation is generated, open the document details modal (same as generated documents!)
      setViewingQuotationDoc(quote);
    } else {
      // If not generated, redirect to the quotation page with lead pre-selected
      if (onNavigate) {
        onNavigate('quotation', lead.name);
      } else {
        setSelectedLeadForQuotation(lead);
        setIsQuotationModalOpen(true);
      }
    }
  };

  // Location Matching Engine for Regional Officers
  const getMatchedRegionalOfficers = (lead: Lead | null): DynamicOfficer[] => {
    if (!lead) return officers;
    const leadState = (lead.state || '').toLowerCase().trim();
    const leadCity = (lead.city || '').toLowerCase().trim();
    const leadAddress = (lead.address || '').toLowerCase().trim();

    const matched = officers.filter(off => {
      const matchState = off.states.some(s => leadState.includes(s.toLowerCase()) || s.toLowerCase().includes(leadState));
      const matchCity = off.cities.some(c => leadCity.includes(c.toLowerCase()) || leadAddress.includes(c.toLowerCase()));
      const matchRegion = off.region.toLowerCase().includes(leadState) || (leadCity && off.region.toLowerCase().includes(leadCity));
      return matchState || matchCity || matchRegion;
    });

    return matched.length > 0 ? matched : officers;
  };

  const handleOpenApprovalModal = (lead: Lead) => {
    handleOpenAssignModal(lead, 'approve');
  };

  const handleOpenAssignModal = (lead: Lead, mode: 'assign' | 'approve' = 'assign') => {
    setSelectedLeadForApproval(lead);
    setAssignModalMode(mode);
    const matched = getMatchedRegionalOfficers(lead);
    const existingOfficer = officers.find(o => o.name.toLowerCase() === (lead.assignedTo || '').toLowerCase());
    setSelectedAssigneeId(existingOfficer?.id || matched[0]?.id || officers[0]?.id || '');
    setAssignmentNotes('');
    setShowAllOfficers(false);
    setIsAssignModalOpen(true);
  };

  const confirmApprovalAndAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadForApproval) return;

    setIsSubmittingAssign(true);
    const assignedOfficer = officers.find(o => o.id === selectedAssigneeId) || officers[0];
    const targetLead = selectedLeadForApproval;
    const isApproveMode = assignModalMode === 'approve';

    try {
      // 1. Check & Auto-create/Update Customer in DB upon Lead Assignment or Approval
      const customerId = await syncLeadToCustomer(
        {
          ...targetLead,
          status: isApproveMode ? 'Approved' : (targetLead.status || 'Qualified')
        },
        targetLead.id,
        assignedOfficer.name
      );
      targetLead.customerId = customerId;

      // 2. Dynamically update lead with assigned officer & customerId
      const nextStatus: LeadStatus = isApproveMode
        ? 'Approved'
        : (targetLead.status === 'New Lead' ? 'Qualified' : (targetLead.status || 'Qualified'));

      await updateDoc(doc(db, 'leads', targetLead.id), {
        status: nextStatus,
        assignedTo: assignedOfficer.name,
        assignedToId: assignedOfficer.id,
        assignedRole: assignedOfficer.role,
        assignedRegion: assignedOfficer.region,
        assignmentNotes: assignmentNotes,
        customerId: customerId,
        updatedAt: serverTimestamp()
      });

      // 3. If in Approve mode, create or update Project in DB
      if (isApproveMode) {
        const rawCapacity = parseFloat(targetLead.expectedLoad || '5') || 5;
        const capacityKw = targetLead.expectedLoadUnit === 'MW' ? rawCapacity * 1000 : rawCapacity;
        const totalCost = Number(targetLead.quotationTotalCost || targetLead.estimatedSystemCost) || (capacityKw * 55000);

        const existingProjectsSnap = await getDocs(query(collection(db, 'projects'), where('leadId', '==', targetLead.id)));
        let projectId = '';

        if (!existingProjectsSnap.empty) {
          const existingDoc = existingProjectsSnap.docs[0];
          projectId = existingDoc.id;
          await updateDoc(doc(db, 'projects', projectId), {
            customerId: customerId,
            assignedTo: assignedOfficer.name,
            assignedToId: assignedOfficer.id,
            assignedRole: assignedOfficer.role,
            region: assignedOfficer.region,
            capacityKw: capacityKw,
            totalCost: totalCost,
            updatedAt: serverTimestamp()
          });
        } else {
          const projectRef = await addDoc(collection(db, 'projects'), {
            leadId: targetLead.id,
            customerId: customerId,
            name: `${targetLead.name} Solar Installation`,
            customerName: targetLead.name,
            phone: targetLead.phone,
            address: targetLead.address,
            city: targetLead.city || '',
            state: targetLead.state || '',
            capacityKw: capacityKw,
            totalCost: totalCost,
            amountPaid: 0,
            assignedTo: assignedOfficer.name,
            assignedToId: assignedOfficer.id,
            assignedRole: assignedOfficer.role,
            region: assignedOfficer.region,
            status: 'Initial',
            priority: 'High',
            history: [
              { stage: 'Initial', timestamp: new Date().toISOString(), note: `Project created from CRM Lead: ${targetLead.name} and assigned to ${assignedOfficer.name}` }
            ],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          projectId = projectRef.id;

          // Auto-generate 10-stage workflow tasks
          const DEFAULT_TASKS = [
            { name: '1. Site Survey & Roof Inspection', requiredRole: 'Survey Engineer', start: 0, duration: 2, status: 'Pending' },
            { name: '2. Solar PV System Design', requiredRole: 'Design Engineer', start: 2, duration: 3, status: 'Pending' },
            { name: '3. Material Requisition & PO Creation', requiredRole: 'Procurement Officer', start: 5, duration: 2, status: 'Pending' },
            { name: '4. Structure Fabrication & Panel Mounting', requiredRole: 'Lead Installer', start: 7, duration: 4, status: 'Pending' },
            { name: '5. AC/DC Wiring & Net Meter Application', requiredRole: 'Electrician', start: 11, duration: 3, status: 'Pending' },
            { name: '6. PM Surya Ghar Subsidy Claim Submission', requiredRole: 'Subsidy Specialist', start: 14, duration: 2, status: 'Pending' }
          ];

          for (const t of DEFAULT_TASKS) {
            await addDoc(collection(db, 'projectTasks'), {
              ...t,
              projectId: projectRef.id,
              createdAt: serverTimestamp()
            });
          }
        }

        // Close assignment modal
        setIsAssignModalOpen(false);
        setSelectedLeadForApproval(null);

        // Pre-calculate quotation details based on system size
        const estGeneration = `${Math.round(capacityKw * 120)}`;
        const estCost = `${Math.round(capacityKw * 55000)}`;

        setQuotationDetails({
          systemSize: capacityKw.toString(),
          panelType: 'Monocrystalline',
          inverterType: 'String Inverter',
          totalCost: estCost,
          estimatedGeneration: estGeneration
        });
        setSelectedLeadForQuotation(targetLead);

        // Prompt user to generate formal Quotation after assigning
        const wantQuotation = window.confirm(
          `✅ Lead "${targetLead.name}" has been Approved & Assigned to ${assignedOfficer.name} (${assignedOfficer.region})!\n\nCustomer account synced.\n\nWould you like to generate the formal Sales Quotation now?`
        );

        if (wantQuotation) {
          setIsQuotationModalOpen(true);
        }
      } else {
        // Simple assignment mode
        setIsAssignModalOpen(false);
        setSelectedLeadForApproval(null);
        alert(`✅ Lead "${targetLead.name}" has been assigned to ${assignedOfficer.name} and successfully synced to Customers!`);
      }
    } catch (err) {
      console.error('Error assigning lead:', err);
      alert('Failed to assign lead.');
    } finally {
      setIsSubmittingAssign(false);
    }
  };

  const updateLeadStatus = async (id: string, status: LeadStatus, lead?: Lead) => {
    if (status === 'Approved' && lead) {
      handleOpenApprovalModal(lead);
      return;
    }

    try {
      await updateDoc(doc(db, 'leads', id), { status });
    } catch (err) {
      console.error('Error updating lead status:', err);
    }
  };

  const statusColors: Record<LeadStatus, string> = {
    'New Lead': 'bg-blue-50 text-blue-700 border-blue-100',
    'Qualified': 'bg-emerald-50 text-emerald-700 border-emerald-100',
    'Site Survey': 'bg-amber-50 text-amber-700 border-amber-100',
    'Proposal': 'bg-purple-50 text-purple-700 border-purple-100',
    'Negotiation': 'bg-orange-50 text-orange-700 border-orange-100',
    'Approved': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'Installation': 'bg-cyan-50 text-cyan-700 border-cyan-100',
    'Completed': 'bg-slate-100 text-slate-700 border-slate-200',
    'AMC': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  };

  // Close modals on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false);
        setIsQuotationModalOpen(false);
        setIsAssignModalOpen(false);
        setSelected3DLead(null);
        setEditingLeadId(null);
        setViewingQuotationDoc(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 animate-in slide-in-from-bottom-4 duration-500">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            {user?.role === 'Vendor' || user?.role === 'Vendor Employee' ? (
              <span className="px-2.5 py-0.5 bg-cyan-100 text-cyan-800 text-[10px] font-black rounded-full uppercase tracking-wider flex items-center gap-1 border border-cyan-200">
                <Building2 className="w-3.5 h-3.5 text-cyan-600 shrink-0" /> Vendor Lead Flow: {user.companyName || user.name} ({filteredLeads.length} Leads)
              </span>
            ) : user?.role === 'Installer' || user?.role === 'Solar Installer' ? (
              <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-black rounded-full uppercase tracking-wider flex items-center gap-1 border border-amber-200">
                <Wrench className="w-3.5 h-3.5 text-amber-600 shrink-0" /> Installer Lead Flow: {user.name} ({filteredLeads.length} Leads)
              </span>
            ) : user?.role === 'Super Admin' || user?.role === 'Solar Company Admin' ? (
              <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full uppercase tracking-wider flex items-center gap-1 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Global Enterprise View: All India ({filteredLeads.length} Leads)
              </span>
            ) : (
              <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-black rounded-full uppercase tracking-wider flex items-center gap-1 border border-blue-200">
                <Users className="w-3.5 h-3.5 text-blue-600 shrink-0" /> Scoped Leads for {user?.name} ({filteredLeads.length})
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Sales Pipeline</h1>
          <p className="text-slate-500 mt-1 text-xs sm:text-sm font-medium">Capture and convert leads into active installations.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-200 cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          Capture Lead
        </button>
      </header>

      {/* Interactive KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => {
            setSelectedStageGroup('all');
            setSearchTerm('');
          }}
          className={cn(
            "text-left p-4 rounded-2xl border transition-all cursor-pointer space-y-1 group",
            selectedStageGroup === 'all'
              ? "bg-slate-900 text-white border-slate-900 ring-2 ring-slate-400/40 shadow-md"
              : "bg-white border-slate-100 shadow-sm hover:border-slate-300 hover:shadow-md"
          )}
        >
          <div className="flex items-center justify-between">
            <p className={cn("text-[10px] font-black uppercase tracking-wider", selectedStageGroup === 'all' ? "text-slate-300" : "text-slate-400")}>
              Total Leads
            </p>
            {selectedStageGroup === 'all' && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
          </div>
          <p className={cn("text-2xl font-black", selectedStageGroup === 'all' ? "text-white" : "text-slate-900")}>
            {roleScopedLeads.filter(l => !l.isDeleted).length}
          </p>
          <p className={cn("text-[11px] font-medium", selectedStageGroup === 'all' ? "text-slate-300" : "text-slate-500")}>
            Full sales pipeline
          </p>
        </button>

        {/* 2. Normal Customers Lead Metric */}
        <button
          type="button"
          onClick={() => {
            setCustomerTypeFilter(customerTypeFilter === 'Normal Customer' ? 'ALL' : 'Normal Customer');
            setSelectedVendorFilter('ALL');
          }}
          className={cn(
            "text-left p-4 rounded-2xl border transition-all cursor-pointer space-y-1 group",
            customerTypeFilter === 'Normal Customer'
              ? "bg-emerald-800 text-white border-emerald-800 ring-2 ring-emerald-500/40 shadow-md"
              : "bg-white border-slate-100 shadow-sm hover:border-emerald-300 hover:shadow-md"
          )}
          title="Click to filter Normal / Direct Retail leads"
        >
          <div className="flex items-center justify-between">
            <p className={cn("text-[10px] font-black uppercase tracking-wider", customerTypeFilter === 'Normal Customer' ? "text-emerald-200" : "text-emerald-700")}>
              Normal Customers
            </p>
            <UserCheck className={cn("w-3.5 h-3.5", customerTypeFilter === 'Normal Customer' ? "text-emerald-300" : "text-emerald-600")} />
          </div>
          <p className={cn("text-2xl font-black", customerTypeFilter === 'Normal Customer' ? "text-white" : "text-emerald-700")}>
            {normalLeadsCount}
          </p>
          <p className={cn("text-[11px] font-semibold", customerTypeFilter === 'Normal Customer' ? "text-emerald-100" : "text-emerald-600")}>
            {normalLeadsCapacity.toFixed(1)} kW Direct Stock
          </p>
        </button>

        {/* 3. Vendor Related Stock Metric */}
        <button
          type="button"
          onClick={() => {
            setCustomerTypeFilter(customerTypeFilter === 'Vendor Related Stock' ? 'ALL' : 'Vendor Related Stock');
          }}
          className={cn(
            "text-left p-4 rounded-2xl border transition-all cursor-pointer space-y-1 group",
            customerTypeFilter === 'Vendor Related Stock'
              ? "bg-cyan-900 text-white border-cyan-900 ring-2 ring-cyan-500/40 shadow-md"
              : "bg-white border-slate-100 shadow-sm hover:border-cyan-300 hover:shadow-md"
          )}
          title="Click to filter Vendor-supplied Consignment Stock leads"
        >
          <div className="flex items-center justify-between">
            <p className={cn("text-[10px] font-black uppercase tracking-wider", customerTypeFilter === 'Vendor Related Stock' ? "text-cyan-200" : "text-cyan-700")}>
              Vendor Stock Leads
            </p>
            <Building2 className={cn("w-3.5 h-3.5", customerTypeFilter === 'Vendor Related Stock' ? "text-cyan-300" : "text-cyan-600")} />
          </div>
          <p className={cn("text-2xl font-black", customerTypeFilter === 'Vendor Related Stock' ? "text-white" : "text-cyan-700")}>
            {vendorStockLeadsCount}
          </p>
          <p className={cn("text-[11px] font-semibold", customerTypeFilter === 'Vendor Related Stock' ? "text-cyan-100" : "text-cyan-600")}>
            {vendorStockLeadsCapacity.toFixed(1)} kW Consignment
          </p>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStageGroup(selectedStageGroup === 'qualified' ? 'all' : 'qualified')}
          className={cn(
            "text-left p-4 rounded-2xl border transition-all cursor-pointer space-y-1 group",
            selectedStageGroup === 'qualified'
              ? "bg-blue-50 border-blue-300 ring-2 ring-blue-500/40 shadow-md"
              : "bg-white border-slate-100 shadow-sm hover:border-blue-200 hover:shadow-md"
          )}
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-wider text-blue-600">Qualified & Surveys</p>
            {selectedStageGroup === 'qualified' && <span className="w-2 h-2 rounded-full bg-blue-500" />}
          </div>
          <p className="text-2xl font-black text-blue-600">
            {roleScopedLeads.filter(l => !l.isDeleted && ['Qualified', 'Site Survey'].includes(l.status)).length}
          </p>
          <p className="text-[11px] text-blue-600 font-medium">Ready for proposal</p>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStageGroup(selectedStageGroup === 'proposal' ? 'all' : 'proposal')}
          className={cn(
            "text-left p-4 rounded-2xl border transition-all cursor-pointer space-y-1 group",
            selectedStageGroup === 'proposal'
              ? "bg-purple-50 border-purple-300 ring-2 ring-purple-500/40 shadow-md"
              : "bg-white border-slate-100 shadow-sm hover:border-purple-200 hover:shadow-md"
          )}
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-wider text-purple-600">Proposals & Quotes</p>
            {selectedStageGroup === 'proposal' && <span className="w-2 h-2 rounded-full bg-purple-500" />}
          </div>
          <p className="text-2xl font-black text-purple-600">
            {roleScopedLeads.filter(l => !l.isDeleted && ['Proposal', 'Negotiation'].includes(l.status)).length}
          </p>
          <p className="text-[11px] text-purple-600 font-medium">Under negotiation</p>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStageGroup(selectedStageGroup === 'approved' ? 'all' : 'approved')}
          className={cn(
            "text-left p-4 rounded-2xl border transition-all cursor-pointer space-y-1 group",
            selectedStageGroup === 'approved'
              ? "bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/40 shadow-md"
              : "bg-white border-slate-100 shadow-sm hover:border-emerald-200 hover:shadow-md"
          )}
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600">Approved / In Pipeline</p>
            {selectedStageGroup === 'approved' && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
          </div>
          <p className="text-2xl font-black text-emerald-600">
            {roleScopedLeads.filter(l => !l.isDeleted && ['Approved', 'Installation', 'Completed', 'AMC'].includes(l.status)).length}
          </p>
          <p className="text-[11px] text-emerald-600 font-medium">Converted to execution</p>
        </button>
      </div>

      {/* Customer Differentiation Segmented Tabs & Vendor Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-slate-500 mr-1 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-emerald-600" /> Pipeline Type:
          </span>

          <button
            type="button"
            onClick={() => {
              setCustomerTypeFilter('ALL');
              setSelectedVendorFilter('ALL');
            }}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5",
              customerTypeFilter === 'ALL'
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            <span>All Leads</span>
            <span className={cn("px-1.5 py-0.2 rounded-full text-[10px]", customerTypeFilter === 'ALL' ? "bg-slate-700 text-white" : "bg-slate-200 text-slate-700")}>
              {roleScopedLeads.filter(l => !l.isDeleted).length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCustomerTypeFilter('Normal Customer');
              setSelectedVendorFilter('ALL');
            }}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 border",
              customerTypeFilter === 'Normal Customer'
                ? "bg-emerald-700 text-white border-emerald-700 shadow-sm ring-2 ring-emerald-500/30"
                : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
            )}
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Normal Customers</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-600 text-white">
              {normalLeadsCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCustomerTypeFilter('Vendor Related Stock');
            }}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 border",
              customerTypeFilter === 'Vendor Related Stock'
                ? "bg-cyan-800 text-white border-cyan-800 shadow-sm ring-2 ring-cyan-500/30"
                : "bg-cyan-50 text-cyan-900 border-cyan-200 hover:bg-cyan-100"
            )}
          >
            <Building2 className="w-3.5 h-3.5 text-cyan-600" />
            <span>Vendor Related Stock</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-cyan-700 text-white">
              {vendorStockLeadsCount}
            </span>
          </button>
        </div>

        {/* Dynamic Vendor Selector Filter when Vendor Stock is Active or Available */}
        {uniqueVendorsFromLeads.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500">Filter Vendor:</span>
            <select
              value={selectedVendorFilter}
              onChange={(e) => {
                setSelectedVendorFilter(e.target.value);
                if (e.target.value !== 'ALL') {
                  setCustomerTypeFilter('Vendor Related Stock');
                }
              }}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
            >
              <option value="ALL">All Vendors ({uniqueVendorsFromLeads.length})</option>
              {uniqueVendorsFromLeads.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-3 sm:gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search leads by name, email, vendor, stock ref or ID..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-sm font-medium"
            />
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {/* Batch Sync Assigned Leads to Customers Button */}
            <button
              type="button"
              onClick={handleBatchSyncAssignedLeads}
              disabled={isBatchSyncing}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl font-bold text-xs transition-colors shadow-xs cursor-pointer disabled:opacity-50"
              title="Ensure all assigned leads appear as accounts in Customers module"
            >
              <RefreshCw className={cn("w-3.5 h-3.5 text-emerald-600", isBatchSyncing && "animate-spin")} />
              <span>{isBatchSyncing ? 'Syncing...' : 'Sync to Customers'}</span>
            </button>

            <button
              onClick={() => setShowTrash(!showTrash)}
              className={cn(
                "flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 border rounded-xl font-bold text-xs sm:text-sm transition-colors shadow-xs cursor-pointer",
                showTrash
                  ? "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              <Trash2 className="w-4 h-4" />
              {showTrash ? 'Hide Trash' : 'View Trash'}
            </button>
            <button 
              type="button"
              onClick={() => {
                setCustomerTypeFilter('ALL');
                setSelectedVendorFilter('ALL');
                setSelectedStageGroup('all');
                setSearchTerm('');
              }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-600 font-bold text-xs sm:text-sm hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
            >
              <Filter className="w-4 h-4" />
              Reset Filters
            </button>
          </div>
        </div>

        {/* Mobile View: Touch-Optimized Cards (< md breakpoint) */}
        <div className="block md:hidden divide-y divide-slate-100">
          {filteredLeads.map((lead) => {
            const quote = getLeadQuotation(lead);
            return (
            <div 
              key={lead.id} 
              onClick={() => {
                setEditingLeadId(lead.id);
                setNewLead(lead);
                setIsModalOpen(true);
              }}
              className="p-4 space-y-3 hover:bg-slate-50/60 transition-colors cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  {/* Mobile Quotation Status - Shown ABOVE the Name */}
                  <div onClick={(e) => e.stopPropagation()} className="mb-1">
                    {quote ? (
                      <button
                        type="button"
                        onClick={(e) => handleDocClick(e, lead)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
                        title="Click to view quotation document"
                      >
                        <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Quotation: {quote.docNumber}</span>
                        {Number(quote.totalAmount) > 0 && (
                          <span className="text-emerald-800 font-extrabold ml-1">
                            ₹{Number(quote.totalAmount).toLocaleString()}
                          </span>
                        )}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => handleDocClick(e, lead)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50/80 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
                        title="Quotation not generated. Click to create quotation."
                      >
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <span>Quotation: Not Generated</span>
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-bold text-slate-900 text-base group-hover:text-emerald-700 transition-colors">{lead.name}</span>
                    {lead.expectedLoad && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {lead.expectedLoad} {lead.expectedLoadUnit || 'KW'}
                      </span>
                    )}
                  </div>

                  {/* Customer Classification and Assigned Officer Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 my-1">
                    {(lead.customerType === 'Vendor Related Stock' || (lead.vendor && lead.vendor.trim() && lead.vendor !== 'Default Vendor')) ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-cyan-100 text-cyan-800 border border-cyan-300 flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-cyan-600" /> {lead.vendor || 'Vendor Stock'}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                        <UserCheck className="w-3 h-3 text-emerald-600" /> Normal Customer
                      </span>
                    )}

                    {lead.assignedTo ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenAssignModal(lead, 'assign');
                        }}
                        className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition-colors flex items-center gap-1 cursor-pointer"
                        title="Assigned Officer (Click to reassign)"
                      >
                        <UserCheck className="w-3 h-3 text-purple-600" /> Assigned: {lead.assignedTo}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenAssignModal(lead, 'assign');
                        }}
                        className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 transition-colors flex items-center gap-1 cursor-pointer animate-pulse"
                        title="Unassigned. Click to assign officer and sync to Customers"
                      >
                        <UserPlus className="w-3 h-3 text-amber-600" /> Assign Officer
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{lead.address || 'Address N/A'}</span>
                  </div>
                </div>
                <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 uppercase tracking-widest shrink-0">
                  {lead.source}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <a 
                  href={`mailto:${lead.email}`} 
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-2 text-slate-600 font-medium hover:text-emerald-600 transition-colors bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 truncate"
                >
                  <Mail className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="truncate">{lead.email}</span>
                </a>
                <a 
                  href={`tel:${lead.phone}`} 
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-2 text-slate-600 font-medium hover:text-emerald-600 transition-colors bg-slate-50 px-3 py-2 rounded-xl border border-slate-100"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>{lead.phone}</span>
                </a>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100/80">
                <div onClick={(e) => e.stopPropagation()}>
                  <select
                    value={lead.status}
                    onChange={(e) => updateLeadStatus(lead.id, e.target.value as LeadStatus, lead)}
                    className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border outline-none cursor-pointer appearance-none",
                      statusColors[lead.status] || "bg-slate-100 text-slate-700 border-slate-200"
                    )}
                  >
                    <option value="New Lead">New Lead</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Site Survey">Site Survey</option>
                    <option value="Proposal">Proposal</option>
                    <option value="Negotiation">Negotiation</option>
                    <option value="Approved">Approved</option>
                    <option value="Installation">Installation</option>
                    <option value="Completed">Completed</option>
                    <option value="AMC">AMC</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenAssignModal(lead, 'assign');
                    }}
                    className="p-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl transition-all border border-purple-100 cursor-pointer"
                    title="Assign or Reassign Officer (Syncs to Customers)"
                  >
                    <UserPlus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelected3DLead(lead);
                    }}
                    className="p-2 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-xl transition-all border border-teal-100 cursor-pointer"
                    title="View 3D Rooftop Solar Model"
                  >
                    <Box className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDocClick(e, lead)}
                    className={cn(
                      "p-2 rounded-xl transition-all border cursor-pointer relative",
                      quote 
                        ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200" 
                        : "bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-200"
                    )}
                    title={quote ? `View Quotation (${quote.docNumber})` : "Quotation Not Generated - Click to Create"}
                  >
                    {quote ? <FileCheck className="w-4 h-4 text-emerald-600" /> : <FileText className="w-4 h-4" />}
                    {quote && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingLeadId(lead.id);
                      setNewLead(lead);
                      setIsModalOpen(true);
                    }}
                    className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl transition-all border border-blue-100 cursor-pointer"
                    title="Edit Lead"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {showTrash ? (
                    <>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (window.confirm("Restore this lead?")) {
                            await updateDoc(doc(db, 'leads', lead.id), { isDeleted: false });
                          }
                        }}
                        className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition-all border border-emerald-100 cursor-pointer"
                        title="Restore Lead"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path></svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteLead(lead.id, true);
                        }}
                        className="p-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl transition-all border border-red-100 cursor-pointer"
                        title="Delete Permanently"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteLead(lead.id);
                      }}
                      className="p-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl transition-all border border-red-100 cursor-pointer"
                      title="Move to Trash"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

          {filteredLeads.length === 0 && (
            <div className="p-8 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-slate-300" />
                </div>
                <p className="text-slate-500 font-medium text-sm">No leads in the pipeline.</p>
                <button onClick={() => setIsModalOpen(true)} className="text-emerald-600 font-bold text-xs hover:underline cursor-pointer">Add first lead &rarr;</button>
              </div>
            </div>
          )}
        </div>

        {/* Desktop View: Full Table (>= md breakpoint) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-[0.15em]">
                <th className="px-6 py-4">Lead Information</th>
                <th className="px-6 py-4">Engagement</th>
                <th className="px-6 py-4">Classification & Assignee</th>
                <th className="px-6 py-4">Source</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeads.map((lead) => {
                const quote = getLeadQuotation(lead);
                return (
                <tr 
                  key={lead.id} 
                  onClick={() => {
                    setEditingLeadId(lead.id);
                    setNewLead(lead);
                    setIsModalOpen(true);
                  }}
                  className="hover:bg-emerald-50/30 transition-colors group cursor-pointer"
                >
                  <td className="px-6 py-5">
                    <div className="flex flex-col items-start gap-1">
                      {/* Quotation Generation Status Badge - Shown ABOVE the Name */}
                      <div onClick={(e) => e.stopPropagation()} className="mb-0.5">
                        {quote ? (
                          <button
                            type="button"
                            onClick={(e) => handleDocClick(e, lead)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer group/q"
                            title="Quotation Generated. Click to view document details."
                          >
                            <FileCheck className="w-3.5 h-3.5 text-emerald-600 group-hover/q:scale-110 transition-transform" />
                            <span>Quotation: {quote.docNumber}</span>
                            {Number(quote.totalAmount) > 0 && (
                              <span className="text-emerald-800 font-extrabold ml-0.5">
                                ₹{Number(quote.totalAmount).toLocaleString()}
                              </span>
                            )}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => handleDocClick(e, lead)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50/80 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer group/q"
                            title="Quotation Not Generated. Click to redirect to Quotation Builder."
                          >
                            <Clock className="w-3.5 h-3.5 text-amber-500 group-hover/q:scale-110 transition-transform" />
                            <span>Quotation: Not Generated</span>
                          </button>
                        )}
                      </div>

                      {/* Lead Name & Capacity */}
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors text-sm">{lead.name}</span>
                        {lead.expectedLoad && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {lead.expectedLoad} {lead.expectedLoadUnit || 'KW'}
                          </span>
                        )}
                      </div>

                      {/* Address */}
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium uppercase tracking-tight">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[220px]">{lead.address}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5" onClick={(e) => e.stopPropagation()}>
                    <div className="space-y-1.5">
                      <a href={`mailto:${lead.email}`} className="flex items-center gap-2 text-xs text-slate-600 font-medium hover:text-emerald-600">
                        <Mail className="w-3.5 h-3.5 text-emerald-500" />
                        {lead.email}
                      </a>
                      <a href={`tel:${lead.phone}`} className="flex items-center gap-2 text-xs text-slate-600 font-medium hover:text-emerald-600">
                        <Phone className="w-3.5 h-3.5 text-emerald-500" />
                        {lead.phone}
                      </a>
                    </div>
                  </td>
                  <td className="px-6 py-5" onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-col items-start gap-1.5">
                      {lead.customerType === 'Vendor Related Stock' ? (
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
                            <PackageCheck className="w-3 h-3 text-purple-600" />
                            <span>Vendor Stock</span>
                          </span>
                          {lead.vendorName && (
                            <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1 pl-1">
                              <Tag className="w-3 h-3 text-purple-500" />
                              <span className="truncate max-w-[130px]">{lead.vendorName}</span>
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          <span>Normal Customer</span>
                        </span>
                      )}

                      {lead.assignedOfficer ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenAssignModal(lead, 'assign');
                          }}
                          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md transition-colors cursor-pointer group/as"
                          title="Assigned to field officer (Click to change)"
                        >
                          <UserCheck className="w-3 h-3 text-emerald-600" />
                          <span className="truncate max-w-[130px]">{lead.assignedOfficer}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenAssignModal(lead, 'assign');
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                          title="Click to Assign Lead to Field Officer"
                        >
                          <UserPlus className="w-3 h-3 text-amber-600" />
                          <span>Assign Officer</span>
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 uppercase tracking-widest">
                      {lead.source}
                    </span>
                  </td>
                  <td className="px-6 py-5" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={lead.status}
                      onChange={(e) => updateLeadStatus(lead.id, e.target.value as LeadStatus, lead)}
                      className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border outline-none cursor-pointer appearance-none",
                        statusColors[lead.status] || "bg-slate-100 text-slate-700 border-slate-200"
                      )}
                    >
                      <option value="New Lead">New Lead</option>
                      <option value="Qualified">Qualified</option>
                      <option value="Site Survey">Site Survey</option>
                      <option value="Proposal">Proposal</option>
                      <option value="Negotiation">Negotiation</option>
                      <option value="Approved">Approved</option>
                      <option value="Installation">Installation</option>
                      <option value="Completed">Completed</option>
                      <option value="AMC">AMC</option>
                    </select>
                  </td>
                  <td className="px-6 py-5 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelected3DLead(lead);
                      }}
                      className="p-2 hover:bg-teal-50 hover:shadow-sm rounded-lg text-teal-600 transition-all border border-transparent hover:border-teal-100 group cursor-pointer"
                      title="View 3D Rooftop Solar Model (GPS Lat/Long)"
                    >
                      <Box className="w-4 h-4" />
                    </button>

                    <button
                      onClick={(e) => handleDocClick(e, lead)}
                      className={cn(
                        "p-2 hover:shadow-sm rounded-lg transition-all border group cursor-pointer relative",
                        quote
                          ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                          : "hover:bg-slate-100 text-slate-400 hover:text-slate-700 border-transparent hover:border-slate-200"
                      )}
                      title={quote ? `View Quotation (${quote.docNumber})` : "Quotation Not Generated - Click to Create"}
                    >
                      {quote ? (
                        <>
                          <FileCheck className="w-4 h-4 text-emerald-600" />
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
                        </>
                      ) : (
                        <FileText className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenAssignModal(lead, 'assign');
                      }}
                      className={cn(
                        "p-2 hover:shadow-sm rounded-lg transition-all border cursor-pointer",
                        lead.assignedOfficer
                          ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                          : "hover:bg-amber-50 text-amber-600 border-transparent hover:border-amber-200"
                      )}
                      title={lead.assignedOfficer ? `Reassign Lead (Currently: ${lead.assignedOfficer})` : "Assign Lead to Officer"}
                    >
                      <UserPlus className="w-4 h-4" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingLeadId(lead.id);
                        setNewLead(lead);
                        setIsModalOpen(true);
                      }}
                      className="p-2 hover:bg-blue-50 hover:shadow-sm rounded-lg text-blue-600 transition-all border border-transparent hover:border-blue-100 cursor-pointer"
                      title="Edit Lead"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {showTrash ? (
                      <>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (window.confirm("Restore this lead?")) {
                              await updateDoc(doc(db, 'leads', lead.id), { isDeleted: false });
                            }
                          }}
                          className="p-2 hover:bg-emerald-50 hover:shadow-sm rounded-lg text-emerald-600 transition-all border border-transparent hover:border-emerald-100 cursor-pointer"
                          title="Restore Lead"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path></svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteLead(lead.id, true);
                          }}
                          className="p-2 hover:bg-red-50 hover:shadow-sm rounded-lg text-red-600 transition-all border border-transparent hover:border-red-100 cursor-pointer"
                          title="Delete Permanently"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteLead(lead.id);
                        }}
                        className="p-2 hover:bg-red-50 hover:shadow-sm rounded-lg text-red-600 transition-all border border-transparent hover:border-red-100 cursor-pointer"
                        title="Move to Trash"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-slate-300" />
                      </div>
                      <p className="text-slate-500 font-medium text-sm">No leads in the pipeline.</p>
                      <button onClick={() => setIsModalOpen(true)} className="text-emerald-600 font-bold text-xs hover:underline cursor-pointer">Add first lead &rarr;</button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-[200] overflow-y-auto p-3 sm:p-6 flex items-center justify-center py-6 sm:py-10"
          onClick={() => {
            setIsModalOpen(false);
            setEditingLeadId(null);
            setNewLead(initialLeadState);
          }}
        >
          <div 
            className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] sm:max-h-[85vh] flex flex-col min-h-0 overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Sticky Header with prominent Close button */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0 sticky top-0 z-30 shadow-xs">
              <div>
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  {editingLeadId ? 'Edit Prospect' : 'Add New Prospect'}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Capture client details, GPS rooftop coordinates & energy consumption</p>
              </div>
              <button 
                type="button"
                onClick={() => { 
                  setIsModalOpen(false); 
                  setEditingLeadId(null); 
                  setNewLead(initialLeadState); 
                }} 
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-500 text-red-600 hover:text-white font-black text-xs transition-all shadow-xs border border-red-200 hover:border-red-500 cursor-pointer shrink-0"
                title="Close Form (ESC)"
              >
                <span className="text-sm font-black">✕</span>
                <span>Close</span>
              </button>
            </div>

            <form onSubmit={handleSubmitLead} className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-6 sm:p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Lead & Stock Classification */}
                <div className="col-span-1 md:col-span-2 space-y-3 p-4.5 bg-gradient-to-br from-slate-50 to-slate-100/70 rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-emerald-600" />
                        Prospect Classification & Inventory Type *
                      </label>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        Differentiate between in-house retail solar stock and vendor-supplied consignment stock
                      </p>
                    </div>
                    <span className={cn(
                      "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border",
                      newLead.customerType === 'Vendor Related Stock'
                        ? "bg-purple-100 text-purple-800 border-purple-300"
                        : "bg-emerald-100 text-emerald-800 border-emerald-300"
                    )}>
                      {newLead.customerType === 'Vendor Related Stock' ? 'Vendor Stock' : 'Normal Customer'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setNewLead({ ...newLead, customerType: 'Normal Customer' })}
                      className={cn(
                        "p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3",
                        (newLead.customerType || 'Normal Customer') === 'Normal Customer'
                          ? "bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 rounded-full mt-0.5 border flex items-center justify-center shrink-0",
                        (newLead.customerType || 'Normal Customer') === 'Normal Customer'
                          ? "border-emerald-600 bg-emerald-600"
                          : "border-slate-300 bg-white"
                      )}>
                        {(newLead.customerType || 'Normal Customer') === 'Normal Customer' && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-black text-slate-900">Normal Customer</div>
                        <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                          Direct solar retail lead fulfilled from company-owned in-house inventory
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setNewLead({ ...newLead, customerType: 'Vendor Related Stock' })}
                      className={cn(
                        "p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3",
                        newLead.customerType === 'Vendor Related Stock'
                          ? "bg-purple-50/90 border-purple-500 ring-2 ring-purple-500/20 shadow-xs"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 rounded-full mt-0.5 border flex items-center justify-center shrink-0",
                        newLead.customerType === 'Vendor Related Stock'
                          ? "border-purple-600 bg-purple-600"
                          : "border-slate-300 bg-white"
                      )}>
                        {newLead.customerType === 'Vendor Related Stock' && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-black text-purple-950 flex items-center gap-1.5">
                          <span>Vendor Related Stock</span>
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-purple-200 text-purple-800">Consignment</span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                          Consignment / distributor inventory supplied by an external vendor or partner
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Vendor Specific Inputs if Vendor Related Stock */}
                  {newLead.customerType === 'Vendor Related Stock' && (
                    <div className="pt-3 border-t border-purple-200/70 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-purple-50/60 p-3.5 rounded-xl border border-purple-100">
                      <div>
                        <label className="block text-[11px] font-bold text-purple-900 uppercase tracking-wider mb-1">
                          Vendor / Supplier Partner *
                        </label>
                        <input
                          list="lead-vendor-options"
                          required={newLead.customerType === 'Vendor Related Stock'}
                          value={newLead.vendorName || ''}
                          onChange={e => setNewLead({ ...newLead, vendorName: e.target.value })}
                          placeholder="Select or enter vendor name (e.g. Tata Power Solar)"
                          className="w-full px-3 py-2 bg-white border border-purple-200 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                        />
                        <datalist id="lead-vendor-options">
                          {vendorsList.map((v: any) => (
                            <option key={v.id || v.name || v} value={v.name || v} />
                          ))}
                        </datalist>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-purple-900 uppercase tracking-wider mb-1">
                          Stock / Inventory Category
                        </label>
                        <select
                          value={newLead.stockCategory || STOCK_CATEGORIES[0]}
                          onChange={e => setNewLead({ ...newLead, stockCategory: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-purple-200 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none cursor-pointer"
                        >
                          {STOCK_CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-purple-900 uppercase tracking-wider mb-1">
                          Vendor PO / Stock Lot Ref
                        </label>
                        <input
                          value={newLead.vendorStockRef || ''}
                          onChange={e => setNewLead({ ...newLead, vendorStockRef: e.target.value })}
                          placeholder="e.g. PO-2024-VR01 or LOT-A8"
                          className="w-full px-3 py-2 bg-white border border-purple-200 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-purple-900 uppercase tracking-wider mb-1">
                          Consignment / Dispatch Terms
                        </label>
                        <input
                          value={newLead.vendorStockNotes || ''}
                          onChange={e => setNewLead({ ...newLead, vendorStockNotes: e.target.value })}
                          placeholder="e.g. Direct site dispatch by supplier"
                          className="w-full px-3 py-2 bg-white border border-purple-200 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Assign Field Officer & Customer Sync */}
                <div className="col-span-1 md:col-span-2 space-y-2.5 p-4.5 bg-emerald-50/50 rounded-2xl border border-emerald-200/80 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                        Assign Representative / Field Officer
                      </label>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        Assigned leads automatically appear in the <strong>Customers</strong> directory with full contact & stock details
                      </p>
                    </div>
                    {newLead.assignedOfficer && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <UserCheck className="w-3 h-3" />
                        Auto-sync Active
                      </span>
                    )}
                  </div>
                  <select
                    value={newLead.assignedOfficer || ''}
                    onChange={e => setNewLead({ ...newLead, assignedOfficer: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm font-semibold text-slate-800 cursor-pointer"
                  >
                    <option value="">-- Leave Unassigned (Can be assigned later from list or approval) --</option>
                    {user?.name && (
                      <option value={user.name}>
                        ⭐ Assign to Me ({user.name} - {user.role || 'Current User'})
                      </option>
                    )}
                    {officers.map(off => (
                      <option key={off.id} value={off.name}>
                        {off.name} ({off.role} • {off.region} • 📞 {off.contact})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-1 md:col-span-2">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1 border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-500" /> Customer Information
                  </h4>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Full Name *</label>
                  <input
                    required
                    value={newLead.name}
                    onChange={e => setNewLead({ ...newLead, name: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Lead Source</label>
                  <select
                    value={newLead.source}
                    onChange={e => setNewLead({ ...newLead, source: e.target.value as any })}
                    className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm font-medium cursor-pointer"
                  >
                    <option value="Website">Website Leads</option>
                    <option value="Facebook">Facebook Leads</option>
                    <option value="Google Ads">Google Ads Leads</option>
                    <option value="Referral">Referral Leads</option>
                    <option value="Walk-in">Walk-in Leads</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={newLead.email}
                    onChange={e => setNewLead({ ...newLead, email: e.target.value })}
                    placeholder="rahul@example.com"
                    className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Phone Number *</label>
                  <input
                    required
                    value={newLead.phone}
                    onChange={e => setNewLead({ ...newLead, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm font-medium"
                  />
                </div>

                <div className="col-span-1 md:col-span-2 pt-2">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1 border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-500" /> Location Details
                  </h4>
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Street Address *</label>
                  <input
                    required
                    value={newLead.address}
                    onChange={e => setNewLead({ ...newLead, address: e.target.value })}
                    placeholder="Plot / House No, Street, Landmark"
                    className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">City</label>
                  <input
                    value={newLead.city || ''}
                    onChange={e => setNewLead({ ...newLead, city: e.target.value })}
                    placeholder="e.g. Pune"
                    className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">District</label>
                  <input
                    value={newLead.district || ''}
                    onChange={e => setNewLead({ ...newLead, district: e.target.value })}
                    placeholder="e.g. Pune"
                    className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">State</label>
                  <input
                    value={newLead.state || ''}
                    onChange={e => setNewLead({ ...newLead, state: e.target.value })}
                    placeholder="e.g. Maharashtra"
                    className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Pincode</label>
                  <input
                    value={newLead.pincode || ''}
                    onChange={e => setNewLead({ ...newLead, pincode: e.target.value })}
                    placeholder="e.g. 411001"
                    className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm font-medium"
                  />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">GPS Location (Lat, Long)</label>
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <input
                      value={newLead.gpsLocation}
                      onChange={e => setNewLead({ ...newLead, gpsLocation: e.target.value })}
                      placeholder="e.g. 18.5204, 73.8567"
                      className="flex-1 px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm font-medium"
                    />
                    <button
                      type="button"
                      onClick={handleDropPinGPS}
                      disabled={isDetectingLocation}
                      className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                      title="Auto-detect current GPS location and reverse-geocode full street address, city, district, state & pincode"
                    >
                      {isDetectingLocation ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Auto-Geocoding...
                        </>
                      ) : (
                        <>
                          <LocateFixed className="w-4 h-4" /> 📍 Drop Pin & Auto-Geocode
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="col-span-1 md:col-span-2 pt-2">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1 border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                    <Sun className="w-3.5 h-3.5 text-emerald-500" /> Energy Requirements
                  </h4>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Roof Type</label>
                    <button
                      type="button"
                      onClick={() => setIsManageRoofTypesOpen(true)}
                      className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                      title="Add or Edit Roof Types"
                    >
                      <Plus className="w-3 h-3 text-emerald-600" />
                      <span>+ Add / Edit Roof Type</span>
                    </button>
                  </div>
                  <select
                    value={newLead.roofType || ''}
                    onChange={e => {
                      if (e.target.value === '__ADD_NEW__') {
                        setIsManageRoofTypesOpen(true);
                      } else {
                        setNewLead({ ...newLead, roofType: e.target.value });
                      }
                    }}
                    className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm font-medium cursor-pointer"
                  >
                    <option value="">Select Roof Type...</option>
                    {roofTypesList.map((rt) => (
                      <option key={rt.id || rt.name} value={rt.name}>
                        {rt.name} {rt.structureType ? `(${rt.structureType})` : ''}
                      </option>
                    ))}
                    <option value="__ADD_NEW__" className="font-bold text-emerald-600 bg-emerald-50">
                      + Add New Roof Type...
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Expected System Capacity *</label>
                  <div className="flex gap-2">
                    <input
                      required
                      type="number"
                      step="any"
                      min="0.1"
                      value={newLead.expectedLoad || ''}
                      onChange={e => setNewLead({ ...newLead, expectedLoad: e.target.value })}
                      placeholder="e.g. 5"
                      className="flex-1 px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-black text-slate-800 text-sm"
                    />
                    <select
                      value={newLead.expectedLoadUnit || 'KW'}
                      onChange={e => setNewLead({ ...newLead, expectedLoadUnit: e.target.value as 'KW' | 'MW' })}
                      className="w-24 px-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-black text-slate-800 text-sm cursor-pointer"
                    >
                      <option value="KW">KW</option>
                      <option value="MW">MW</option>
                    </select>
                  </div>
                </div>

                {/* Infinite Monthly Electricity Units Range System */}
                {(() => {
                  const getParsedUnits = () => {
                    if (!newLead.monthlyUnits) return { from: 300, to: 400 };
                    if (newLead.monthlyUnits.includes('-')) {
                      const parts = newLead.monthlyUnits.split('-');
                      return {
                        from: parseInt(parts[0]) || 0,
                        to: parseInt(parts[1]) || (parseInt(parts[0]) || 0) + 100
                      };
                    }
                    const val = parseInt(newLead.monthlyUnits) || 400;
                    return { from: Math.max(0, val - 100), to: val };
                  };

                  const { from: currentFrom, to: currentTo } = getParsedUnits();
                  // Infinite Dynamic Scaling Slider: automatically expands to accommodate any scale from 0 to 1,000,000+
                  const dynamicSliderMax = Math.max(5000, Math.ceil((Math.max(currentTo, currentFrom) * 1.5) / 1000) * 1000);
                  const dynamicStep = Math.max(25, Math.pow(10, Math.max(1, Math.floor(Math.log10(dynamicSliderMax / 100)))));

                  return (
                    <div className="col-span-1 md:col-span-2 space-y-3.5 bg-slate-50 p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <label className="block text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                            ⚡ Monthly Electricity Units Range (kWh)
                          </label>
                          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                            Supports Infinite Scale (Residential, Commercial & Mega Industrial Plants)
                          </p>
                        </div>
                        <span className="px-3 py-1.5 bg-emerald-500/15 text-emerald-800 text-xs font-black rounded-xl border border-emerald-500/30 shadow-xs">
                          {currentFrom.toLocaleString()} - {currentTo.toLocaleString()} kWh / mo
                        </span>
                      </div>

                      {/* Infinite Range Quick Presets */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {[
                          '100-300',
                          '300-500',
                          '500-1000',
                          '1000-2500',
                          '2500-5000',
                          '5000-10000',
                          '10000-25000',
                          '25000-50000',
                          '50000-100000',
                          '100000+'
                        ].map(preset => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setNewLead({ ...newLead, monthlyUnits: preset })}
                            className={cn(
                              "px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer",
                              newLead.monthlyUnits === preset
                                ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                            )}
                          >
                            {preset} Units
                          </button>
                        ))}
                      </div>

                      {/* Unbounded Direct Numeric Range Inputs */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div className="flex items-center gap-2 bg-white px-3.5 py-2.5 rounded-xl border border-slate-200 shadow-2xs focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500">
                          <span className="text-xs font-black text-slate-400 uppercase">From:</span>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={currentFrom || ''}
                            onChange={e => {
                              const fromVal = Math.max(0, Number(e.target.value) || 0).toString();
                              setNewLead({ ...newLead, monthlyUnits: `${fromVal}-${currentTo}` });
                            }}
                            placeholder="300"
                            className="w-full text-xs font-black text-slate-800 outline-none"
                          />
                          <span className="text-[10px] font-bold text-slate-400">kWh</span>
                        </div>

                        <div className="flex items-center gap-2 bg-white px-3.5 py-2.5 rounded-xl border border-slate-200 shadow-2xs focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500">
                          <span className="text-xs font-black text-slate-400 uppercase">To:</span>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={currentTo || ''}
                            onChange={e => {
                              const toVal = Math.max(0, Number(e.target.value) || 0).toString();
                              setNewLead({ ...newLead, monthlyUnits: `${currentFrom}-${toVal}` });
                            }}
                            placeholder="500"
                            className="w-full text-xs font-black text-slate-800 outline-none"
                          />
                          <span className="text-[10px] font-bold text-slate-400">kWh</span>
                        </div>
                      </div>

                      {/* Infinite Dynamic Range Bar Slider */}
                      <div className="space-y-1.5 pt-1">
                        <input
                          type="range"
                          min="0"
                          max={dynamicSliderMax}
                          step={dynamicStep}
                          value={currentTo}
                          onChange={e => {
                            const toVal = parseInt(e.target.value) || 0;
                            const fromVal = Math.max(0, Math.round(toVal * 0.75));
                            setNewLead({ ...newLead, monthlyUnits: `${fromVal}-${toVal}` });
                          }}
                          className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                        />
                        <div className="flex justify-between text-[10px] font-bold text-slate-400">
                          <span>0 Units</span>
                          <span>{Math.round(dynamicSliderMax * 0.25).toLocaleString()} Units</span>
                          <span>{Math.round(dynamicSliderMax * 0.5).toLocaleString()} Units</span>
                          <span>{Math.round(dynamicSliderMax * 0.75).toLocaleString()} Units</span>
                          <span className="text-emerald-700 font-black">{dynamicSliderMax.toLocaleString()}+ Units (Infinite ⚡)</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div className="col-span-1 md:col-span-2 pt-2">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1 border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-500" /> Documents & Site Media
                  </h4>
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Electricity Bill Upload</label>
                  <input
                    type="file"
                    onChange={e => setNewLead({ ...newLead, electricityBillUrl: e.target.files?.[0]?.name || '' })}
                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 file:cursor-pointer cursor-pointer border border-slate-200 rounded-xl p-1 bg-slate-50/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Property Images</label>
                  <input
                    type="file"
                    multiple
                    onChange={e => {
                      const files = Array.from(e.target.files || []) as File[];
                      setNewLead({ ...newLead, propertyImagesUrls: files.map(f => f.name) });
                    }}
                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 file:cursor-pointer cursor-pointer border border-slate-200 rounded-xl p-1 bg-slate-50/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Roof Images</label>
                  <input
                    type="file"
                    multiple
                    onChange={e => {
                      const files = Array.from(e.target.files || []) as File[];
                      setNewLead({ ...newLead, roofImagesUrls: files.map(f => f.name) });
                    }}
                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 file:cursor-pointer cursor-pointer border border-slate-200 rounded-xl p-1 bg-slate-50/50"
                  />
                </div>
              </div>

              {/* Sticky Bottom Form Action Buttons */}
              <div className="pt-4 flex flex-col-reverse sm:flex-row gap-3 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingLeadId(null);
                    setNewLead(initialLeadState);
                  }}
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-slate-700 font-bold hover:bg-slate-50 transition-colors cursor-pointer text-sm"
                >
                  Cancel / Close
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingLead}
                  className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black transition-all shadow-lg shadow-emerald-600/20 cursor-pointer text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmittingLead ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>{isSubmittingLead ? (editingLeadId ? 'Updating...' : 'Creating...') : (editingLeadId ? 'Update Prospect' : 'Create Lead & Pipeline')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GENERATE QUOTATION MODAL */}
      {isQuotationModalOpen && selectedLeadForQuotation && (
        <div 
          className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-[200] overflow-y-auto p-3 sm:p-6 flex items-center justify-center py-6 sm:py-10"
          onClick={() => setIsQuotationModalOpen(false)}
        >
          <div 
            className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] sm:max-h-[85vh] flex flex-col min-h-0 overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0 sticky top-0 z-30 shadow-xs">
              <div>
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  Generate Quotation
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Creating estimate for {selectedLeadForQuotation.name}</p>
              </div>
              <button 
                type="button"
                onClick={() => setIsQuotationModalOpen(false)} 
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-500 text-red-600 hover:text-white font-black text-xs transition-all shadow-xs border border-red-200 hover:border-red-500 cursor-pointer shrink-0"
                title="Close Form (ESC)"
              >
                <span className="text-sm font-black">✕</span>
                <span>Close</span>
              </button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              setIsSubmittingQuotation(true);
              try {
                const quoteRef = await addDoc(collection(db, 'quotations'), {
                  leadId: selectedLeadForQuotation.id,
                  leadName: selectedLeadForQuotation.name,
                  systemSize: quotationDetails.systemSize,
                  panelType: quotationDetails.panelType,
                  inverterType: quotationDetails.inverterType,
                  totalCost: quotationDetails.totalCost,
                  estimatedGeneration: quotationDetails.estimatedGeneration,
                  createdAt: serverTimestamp()
                });

                // Also save into user-wise generatedDocuments repository
                const quoteTotal = parseFloat(quotationDetails.totalCost) || 0;
                await saveGeneratedDocument({
                  docNumber: `QT-${Date.now().toString().slice(-6)}`,
                  type: 'quotation',
                  customerName: selectedLeadForQuotation.name,
                  customerEmail: selectedLeadForQuotation.email,
                  customerPhone: selectedLeadForQuotation.phone,
                  leadId: selectedLeadForQuotation.id,
                  customerId: selectedLeadForQuotation.customerId,
                  systemCapacityKw: parseFloat(quotationDetails.systemSize) || undefined,
                  totalAmount: quoteTotal,
                  taxAmount: quoteTotal * 0.138,
                  status: 'Approved',
                  user: user || undefined,
                  metadata: {
                    panelType: quotationDetails.panelType,
                    inverterType: quotationDetails.inverterType,
                    estimatedGeneration: quotationDetails.estimatedGeneration,
                    source: 'CRM Quotation Modal'
                  }
                });

                // Update lead in Firestore with quotation details
                await updateDoc(doc(db, 'leads', selectedLeadForQuotation.id), {
                  quotationGenerated: true,
                  quotationId: quoteRef.id,
                  quotationSystemSize: quotationDetails.systemSize,
                  quotationTotalCost: quotationDetails.totalCost,
                  status: selectedLeadForQuotation.status === 'Approved' ? 'Approved' : 'Proposal',
                  updatedAt: serverTimestamp()
                });

                alert(`✅ Quotation for "${selectedLeadForQuotation.name}" (${quotationDetails.systemSize} kW, ₹${Number(quotationDetails.totalCost || 0).toLocaleString()}) generated and saved successfully!`);
                setIsQuotationModalOpen(false);
                setQuotationDetails({
                  systemSize: '',
                  panelType: 'Monocrystalline',
                  inverterType: 'String Inverter',
                  totalCost: '',
                  estimatedGeneration: ''
                });
              } catch (err) {
                console.error('Error saving quotation:', err);
                alert('Failed to save quotation. Please check network connection.');
              } finally {
                setIsSubmittingQuotation(false);
              }
            }} className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">System Size (kW)</label>
                    <div className="flex gap-2">
                      {[3, 5, 10, 25, 50].map(size => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => {
                            const estimatedGen = `${Math.round(size * 120)}`;
                            const estCost = `${Math.round(size * 60000)}`;
                            setQuotationDetails({
                              ...quotationDetails,
                              systemSize: size.toString(),
                              estimatedGeneration: estimatedGen,
                              totalCost: estCost
                            });
                          }}
                          className="px-2 py-0.5 text-xs font-bold bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                        >
                          {size}kW
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    required
                    type="number"
                    value={quotationDetails.systemSize}
                    onChange={e => {
                      const size = parseFloat(e.target.value);
                      const estimatedGen = !isNaN(size) ? `${Math.round(size * 120)}` : '';
                      const estCost = !isNaN(size) ? `${Math.round(size * 60000)}` : '';
                      setQuotationDetails({
                        ...quotationDetails,
                        systemSize: e.target.value,
                        estimatedGeneration: estimatedGen,
                        totalCost: estCost
                      });
                    }}
                    placeholder="e.g. 5"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm font-bold"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Panel Type</label>
                    <select
                      value={quotationDetails.panelType}
                      onChange={e => setQuotationDetails({ ...quotationDetails, panelType: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm bg-white"
                    >
                      <option value="Monocrystalline">Monocrystalline (High Eff.)</option>
                      <option value="Polycrystalline">Polycrystalline (Standard)</option>
                      <option value="Bifacial">Bifacial (Dual Sided)</option>
                      <option value="TopCon">TopCon NextGen</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Inverter Type</label>
                    <select
                      value={quotationDetails.inverterType}
                      onChange={e => setQuotationDetails({ ...quotationDetails, inverterType: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm bg-white"
                    >
                      <option value="String Inverter">String Inverter (Grid-Tied)</option>
                      <option value="Microinverter">Microinverter (Modular)</option>
                      <option value="Hybrid Inverter">Hybrid Inverter (Battery Ready)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Estimated Cost (INR)</label>
                  <input
                    type="number"
                    value={quotationDetails.totalCost}
                    onChange={e => setQuotationDetails({ ...quotationDetails, totalCost: e.target.value })}
                    placeholder="e.g. 300000"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm font-bold text-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Estimated Monthly Units (kWh)</label>
                  <input
                    type="number"
                    value={quotationDetails.estimatedGeneration}
                    onChange={e => setQuotationDetails({ ...quotationDetails, estimatedGeneration: e.target.value })}
                    placeholder="e.g. 600"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm font-bold"
                  />
                </div>
              </div>

              <div className="pt-4 flex flex-col-reverse sm:flex-row gap-3 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsQuotationModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-bold hover:bg-slate-50 transition-colors text-xs cursor-pointer"
                >
                  Cancel / Close
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingQuotation}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 text-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingQuotation ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                  <span>{isSubmittingQuotation ? 'Saving Quotation...' : 'Save Quotation'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approval & Location-Based Regional Officer Assignment Modal */}
      {isAssignModalOpen && selectedLeadForApproval && (
        <div 
          className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-[200] overflow-y-auto p-3 sm:p-6 flex items-center justify-center py-6 sm:py-10"
          onClick={() => setIsAssignModalOpen(false)}
        >
          <div 
            className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] sm:max-h-[85vh] flex flex-col min-h-0 overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-xs">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  {assignModalMode === 'assign' ? 'Assign Lead to Field Officer' : 'Assign Regional Officer & Approve'}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {assignModalMode === 'assign'
                    ? 'Assigned leads will automatically appear in the Customers directory'
                    : 'Select project officer based on prospect location & approve project'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-500 text-red-600 hover:text-white font-black text-xs transition-all shadow-xs border border-red-200 hover:border-red-500 cursor-pointer shrink-0"
                title="Close Form (ESC)"
              >
                <span className="text-sm font-black">✕</span>
                <span>Close</span>
              </button>
            </div>

            <form onSubmit={confirmApprovalAndAssignment} className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
              {/* Customer & Location Card */}
              <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-emerald-900 uppercase tracking-wider">
                      {selectedLeadForApproval.name}
                    </span>
                    <span className={cn(
                      "text-[10px] font-black uppercase px-2 py-0.5 rounded-full border",
                      selectedLeadForApproval.customerType === 'Vendor Related Stock'
                        ? "bg-purple-100 text-purple-800 border-purple-300"
                        : "bg-emerald-100 text-emerald-800 border-emerald-300"
                    )}>
                      {selectedLeadForApproval.customerType === 'Vendor Related Stock' 
                        ? `Vendor Stock: ${selectedLeadForApproval.vendorName || 'Consignment'}` 
                        : 'Normal Customer'}
                    </span>
                  </div>
                  <span className="text-[10px] font-extrabold bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-md">
                    {selectedLeadForApproval.expectedLoad || '5'} {selectedLeadForApproval.expectedLoadUnit || 'KW'} Solar
                  </span>
                </div>
                <div className="flex items-start gap-1.5 text-xs text-slate-600 font-medium">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    {selectedLeadForApproval.address || 'Address N/A'}
                    {selectedLeadForApproval.city ? `, ${selectedLeadForApproval.city}` : ''}
                    {selectedLeadForApproval.state ? `, ${selectedLeadForApproval.state}` : ''}
                  </span>
                </div>
                {selectedLeadForApproval.assignedOfficer && (
                  <div className="text-[11px] font-bold text-slate-600 bg-white/80 px-2.5 py-1 rounded-lg border border-emerald-100 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Currently Assigned to: <strong className="text-emerald-800">{selectedLeadForApproval.assignedOfficer}</strong></span>
                  </div>
                )}
              </div>

              {/* Regional Officer Selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Recommended Regional Officer
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAllOfficers(!showAllOfficers)}
                    className="text-[11px] font-bold text-emerald-600 hover:underline cursor-pointer"
                  >
                    {showAllOfficers ? 'Show Matched Only' : 'Show All Officers'}
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {(showAllOfficers ? officers : getMatchedRegionalOfficers(selectedLeadForApproval)).map(officer => {
                    const isSelected = selectedAssigneeId === officer.id;
                    return (
                      <div
                        key={officer.id}
                        onClick={() => setSelectedAssigneeId(officer.id)}
                        className={cn(
                          "p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between",
                          isSelected
                            ? "bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20"
                            : "bg-slate-50 border-slate-200 hover:border-slate-300"
                        )}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-xs text-slate-900">{officer.name}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                              {officer.role}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                            📍 {officer.region} | 📞 {officer.contact}
                          </p>
                        </div>
                        <input
                          type="radio"
                          name="officerSelect"
                          checked={isSelected}
                          onChange={() => setSelectedAssigneeId(officer.id)}
                          className="w-4 h-4 accent-emerald-600"
                        />
                      </div>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-400 font-medium mt-1">
                  Matched based on prospect state ({selectedLeadForApproval.state || 'N/A'}) & city
                </p>
              </div>

              {/* Assignment Notes */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Assignment Instructions / Priority Notes
                </label>
                <textarea
                  rows={2}
                  value={assignmentNotes}
                  onChange={(e) => setAssignmentNotes(e.target.value)}
                  placeholder="e.g. Schedule immediate site survey and structural check..."
                  className="w-full px-3 py-2 text-xs font-medium border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-none"
                />
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 flex flex-col-reverse sm:flex-row gap-3 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel / Close
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAssign}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingAssign ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>
                    {isSubmittingAssign
                      ? (assignModalMode === 'assign' ? 'Assigning & Syncing...' : 'Assigning & Approving...')
                      : (assignModalMode === 'assign' ? 'Assign Lead & Show in Customers' : 'Confirm Approval & Assign')}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE ROOF TYPES MODAL */}
      {isManageRoofTypesOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] overflow-y-auto p-3 sm:p-6 flex items-center justify-center py-6 sm:py-10"
          onClick={() => setIsManageRoofTypesOpen(false)}
        >
          <div 
            className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] sm:max-h-[85vh] flex flex-col min-h-0 overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black">Manage Roof Types</h3>
                  <p className="text-[11px] text-slate-400">Add, edit, or remove solar mounting roof types across your platform</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsManageRoofTypesOpen(false);
                  setEditingRoofId(null);
                  setRoofFormName('');
                }}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Add / Edit Form */}
            <form onSubmit={handleSaveRoofType} className="p-5 border-b border-slate-100 bg-slate-50 space-y-3">
              <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center justify-between">
                <span>{editingRoofId ? '✏️ Edit Roof Type' : '➕ Add New Roof Type'}</span>
                {editingRoofId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingRoofId(null);
                      setRoofFormName('');
                      setRoofFormStructure('Fixed Mount');
                      setRoofFormTilt('15°');
                    }}
                    className="text-[10px] text-slate-500 hover:underline"
                  >
                    Cancel Editing
                  </button>
                )}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Roof Type Name *</label>
                  <input
                    type="text"
                    required
                    value={roofFormName}
                    onChange={e => setRoofFormName(e.target.value)}
                    placeholder="e.g. Klip-Lok Metal Sheet / Terrace Gazebo"
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Structure / Mounting Type</label>
                  <input
                    type="text"
                    value={roofFormStructure}
                    onChange={e => setRoofFormStructure(e.target.value)}
                    placeholder="e.g. Mini-Rail / Anchor Fixed"
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Recommended Tilt Angle</label>
                  <input
                    type="text"
                    value={roofFormTilt}
                    onChange={e => setRoofFormTilt(e.target.value)}
                    placeholder="e.g. 15° - 20° / Pitch Slope"
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingRoofType || !roofFormName.trim()}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSavingRoofType ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>{editingRoofId ? 'Update Roof Type' : 'Save & Select Roof Type'}</span>
                </button>
              </div>
            </form>

            {/* List of Existing Roof Types */}
            <div className="p-5 max-h-64 overflow-y-auto space-y-2">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">Available Roof Types ({roofTypesList.length})</p>
              {roofTypesList.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No roof types configured yet.</p>
              ) : (
                roofTypesList.map((roof) => (
                  <div 
                    key={roof.id || roof.name}
                    className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between hover:border-emerald-500/40 transition-colors"
                  >
                    <div>
                      <p className="text-xs font-black text-slate-800">{roof.name}</p>
                      {roof.structureType && (
                        <p className="text-[10px] text-slate-500 font-medium">{roof.structureType} • Tilt: {roof.tiltAngle || 'Standard'}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingRoofId(roof.id || null);
                          setRoofFormName(roof.name);
                          setRoofFormStructure(roof.structureType || 'Fixed Mount');
                          setRoofFormTilt(roof.tiltAngle || '15°');
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                        title="Edit Roof Type"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {roof.id && (
                        <button
                          type="button"
                          onClick={() => handleDeleteRoofType(roof.id!, roof.name)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                          title="Delete Roof Type"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsManageRoofTypesOpen(false);
                  setEditingRoofId(null);
                  setRoofFormName('');
                }}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3D ROOFTOP SOLAR VIEW MODAL */}
      {selected3DLead && (
        <div 
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[200] overflow-y-auto p-3 sm:p-6 flex items-center justify-center py-6 sm:py-10"
          onClick={() => setSelected3DLead(null)}
        >
          <div 
            className="relative bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] sm:max-h-[85vh] flex flex-col min-h-0 overflow-hidden border border-slate-800 animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center text-white shrink-0 sticky top-0 z-30 shadow-xs">
              <div>
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">GPS 3D CAD Rooftop Simulation</span>
                <h3 className="text-base font-black flex items-center gap-2">
                  <Sun className="w-4 h-4 text-amber-400" /> {selected3DLead.name} Rooftop Solar Layout
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelected3DLead(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white font-black text-xs transition-all shadow-xs border border-red-500/30 cursor-pointer shrink-0"
                title="Close 3D View (ESC)"
              >
                <span className="text-sm font-black">✕</span>
                <span>Close</span>
              </button>
            </div>
            <div className="flex-1 min-h-[450px] p-2 overflow-hidden">
              <Solar3DViewer
                roofType={selected3DLead.roofType || 'Flat Concrete'}
                address={selected3DLead.address ? `${selected3DLead.address}, ${selected3DLead.city || ''}` : selected3DLead.name}
                panelCount={selected3DLead.expectedLoad ? Math.max(4, Math.round(Number(selected3DLead.expectedLoad) * 2.5)) : 12}
                lat={selected3DLead.gpsLocation && selected3DLead.gpsLocation.includes(',') ? parseFloat(selected3DLead.gpsLocation.split(',')[0]) : 17.3850}
                lng={selected3DLead.gpsLocation && selected3DLead.gpsLocation.includes(',') ? parseFloat(selected3DLead.gpsLocation.split(',')[1]) : 78.4867}
              />
            </div>
          </div>
        </div>
      )}

      {/* VIEW QUOTATION DOCUMENT MODAL (IDENTICAL TO GENERATED DOCUMENTS) */}
      {viewingQuotationDoc && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setViewingQuotationDoc(null)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 my-8"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black flex items-center gap-2">
                    QUOTATION #{viewingQuotationDoc.docNumber}
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold uppercase tracking-wider">
                      {viewingQuotationDoc.status || 'Approved'}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Generated for {viewingQuotationDoc.customerName}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setViewingQuotationDoc(null)} 
                className="text-slate-400 hover:text-white p-1.5 rounded-lg transition-colors cursor-pointer"
                title="Close Modal (ESC)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs">
              {/* Top Meta info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase block">Grand Total</span>
                  <span className="text-base font-black text-emerald-700">₹{Number(viewingQuotationDoc.totalAmount).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase block">System Size</span>
                  <span className="text-xs font-bold text-slate-700">{viewingQuotationDoc.systemCapacityKw || '5'} kW</span>
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase block">Created By</span>
                  <span className="text-xs font-bold text-slate-800 truncate block">{viewingQuotationDoc.userName || 'Solar Consultant'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase block">Company</span>
                  <span className="text-xs font-bold text-slate-800 truncate block">{viewingQuotationDoc.companyName || 'Meta Green Global HQ'}</span>
                </div>
              </div>

              {/* Customer Info */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Customer Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div><strong className="text-slate-500">Name:</strong> {viewingQuotationDoc.customerName}</div>
                  <div><strong className="text-slate-500">Phone:</strong> {viewingQuotationDoc.customerPhone || 'N/A'}</div>
                  <div><strong className="text-slate-500">Address:</strong> {viewingQuotationDoc.customerAddress || 'N/A'}</div>
                  <div><strong className="text-slate-500">Location:</strong> {viewingQuotationDoc.city ? `${viewingQuotationDoc.city}, ${viewingQuotationDoc.state}` : viewingQuotationDoc.state || 'N/A'}</div>
                </div>
              </div>

              {/* Line Items */}
              {viewingQuotationDoc.items && viewingQuotationDoc.items.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Itemized Breakdown</h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-2.5">Item</th>
                          <th className="p-2.5 text-center">Qty</th>
                          <th className="p-2.5 text-right">Rate</th>
                          <th className="p-2.5 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {viewingQuotationDoc.items.map((item: any, i: number) => (
                          <tr key={i}>
                            <td className="p-2.5 font-medium text-slate-800">{item.name || item.description}</td>
                            <td className="p-2.5 text-center text-slate-600">{item.quantity || 1}</td>
                            <td className="p-2.5 text-right text-slate-600">₹{Number(item.unitPrice || item.rate || 0).toLocaleString()}</td>
                            <td className="p-2.5 text-right font-bold text-slate-900">₹{Number(item.amount || (item.quantity * item.unitPrice) || 0).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Actions Footer */}
              <div className="pt-4 border-t border-slate-100 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setViewingQuotationDoc(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => downloadDocumentPDF(viewingQuotationDoc, logos)}
                  className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-200 cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Re-Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
