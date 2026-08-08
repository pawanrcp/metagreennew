import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  Plus, 
  Trash2, 
  Save, 
  History, 
  CheckCircle, 
  Send,
  FileText,
  Clock,
  ArrowRight,
  Download,
  Mail,
  Building2,
  Printer,
  User
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { collection, onSnapshot, addDoc, updateDoc, doc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { Lead } from '@/src/types';
import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';

type ItemCategory = 'Panel' | 'Inverter' | 'Battery' | 'Structure' | 'Wiring';

interface QuotationItem {
  id: string;
  category: ItemCategory;
  name: string;
  quantity: number;
  unitPrice: number;
}

interface QuotationVersion {
  id: string;
  versionNumber: number;
  date: string;
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'Rejected';
  items: QuotationItem[];
  labourCost: number;
  transportCost: number;
  discount: number;
  gstRate: number;
  use7030Split?: boolean;
  totalValue: number;
}

const defaultItems: QuotationItem[] = [
  { id: '1', category: 'Panel', name: 'Solar Panel 400W Mono', quantity: 12, unitPrice: 12000 },
  { id: '2', category: 'Inverter', name: 'String Inverter 5kW', quantity: 1, unitPrice: 45000 },
  { id: '3', category: 'Structure', name: 'GI Mounting Structure (per kW)', quantity: 5, unitPrice: 3500 },
  { id: '4', category: 'Wiring', name: 'DC/AC Cables & Conduits (Lot)', quantity: 1, unitPrice: 15000 },
];

export default function QuotationBuilder() {
  const [versions, setVersions] = useState<QuotationVersion[]>([]);
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'leads'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLeads(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead)));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'quotationVersions'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const fetchedVersions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as QuotationVersion));
      
      if (fetchedVersions.length > 0) {
        setVersions(fetchedVersions);
        // Only set active version if it's currently null or not in the new list
        setActiveVersionId(currentId => {
          if (!currentId || !fetchedVersions.find(v => v.id === currentId)) {
            return fetchedVersions[0].id;
          }
          return currentId;
        });
      } else {
        // If empty, create an initial draft
        const initialVersion: any = {
          versionNumber: 1,
          date: new Date().toISOString().split('T')[0],
          status: 'Draft',
          items: [...defaultItems],
          labourCost: 20000,
          transportCost: 5000,
          discount: 10000,
          gstRate: 12,
          totalValue: 260400,
          createdAt: serverTimestamp()
        };
        addDoc(collection(db, 'quotationVersions'), initialVersion);
      }
    });
    return () => unsub();
  }, []);

  const updateVersionInDb = async (id: string, updates: Partial<QuotationVersion>) => {
    try {
      await updateDoc(doc(db, 'quotationVersions', id), updates);
    } catch (err) {
      console.error("Error updating version in DB:", err);
    }
  };
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const [inventoryItems, setInventoryItems] = useState<{name: string, category: string}[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'inventory'), (snapshot) => {
      setInventoryItems(snapshot.docs.map(doc => ({
        name: doc.data().name,
        category: doc.data().category
      })));
    });
    return () => unsub();
  }, []);

  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [customerEmail, setCustomerEmail] = useState('customer@example.com');
  const [customerDetails, setCustomerDetails] = useState({
    name: '',
    mobile: '',
    addressLine1: '',
    city: '',
    district: '',
    state: '',
    pincode: '',
    systemSize: ''
  });
  const [isEmailing, setIsEmailing] = useState(false);

  const activeVersion = versions.find(v => v.id === activeVersionId) || versions[0];

  const calculateTotals = (version?: QuotationVersion) => {
    if (!version || !version.items) return { subtotal: 0, totalBeforeTax: 0, gstAmount: 0, grandTotal: 0 };
    const subtotal = version.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const totalBeforeTax = subtotal + (version.labourCost || 0) + (version.transportCost || 0) - (version.discount || 0);
    
    let gstAmount = 0;
    if (version.use7030Split) {
      gstAmount = (totalBeforeTax * 0.7 * 0.12) + (totalBeforeTax * 0.3 * 0.18);
    } else {
      gstAmount = (totalBeforeTax * (version.gstRate || 0)) / 100;
    }
    
    const grandTotal = totalBeforeTax + gstAmount;
    return { subtotal, totalBeforeTax, gstAmount, grandTotal };
  };

  const { subtotal, totalBeforeTax, gstAmount, grandTotal } = calculateTotals(activeVersion);

  if (!activeVersion) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const handleUpdateItem = (id: string, field: keyof QuotationItem, value: any) => {
    if (!activeVersionId) return;
    const updatedItems = activeVersion.items.map(item => item.id === id ? { ...item, [field]: value } : item);
    updateVersionInDb(activeVersionId, { items: updatedItems });
  };

  const handleUpdateCost = (field: keyof QuotationVersion, value: number) => {
    if (!activeVersionId) return;
    updateVersionInDb(activeVersionId, { [field]: value });
  };

  const handleAddItem = () => {
    if (!activeVersionId) return;
    const newItem: QuotationItem = {
      id: Math.random().toString(36).substr(2, 9),
      category: 'Other' as any,
      name: '',
      quantity: 1,
      unitPrice: 0
    };
    updateVersionInDb(activeVersionId, { items: [...activeVersion.items, newItem] });
  };

  const handleDeleteItem = (id: string) => {
    if (!activeVersionId) return;
    updateVersionInDb(activeVersionId, { items: activeVersion.items.filter(item => item.id !== id) });
  };

  const handleCreateNewVersion = async () => {
    const newVersion: any = {
      ...activeVersion,
      versionNumber: versions.length + 1,
      date: new Date().toISOString().split('T')[0],
      status: 'Draft',
      createdAt: serverTimestamp()
    };
    delete newVersion.id; // Remove the old ID before inserting as a new doc
    const docRef = await addDoc(collection(db, 'quotationVersions'), newVersion);
    setActiveVersionId(docRef.id);
    setIsHistoryOpen(false);
  };

  const handleSendForApproval = () => {
    if (!activeVersionId) return;
    updateVersionInDb(activeVersionId, { status: 'Pending Approval' });
    alert('Quotation sent for approval to the Manager.');
  };

  const handleApprove = () => {
    if (!activeVersionId) return;
    updateVersionInDb(activeVersionId, { status: 'Approved' });
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('quotation-preview-container');
    if (!element) return;
    
    try {
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      const pdf = new jsPDF('p', 'mm', 'a4');
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`Quotation_GES25-${activeVersion.versionNumber.toString().padStart(6, '0')}.pdf`);
    } catch (err) {
      console.error('Error generating PDF', err);
      alert('Error generating PDF.');
    }
  };

  const handleEmailQuotation = async () => {
    if (!customerEmail) {
      alert('Please enter a customer email.');
      return;
    }
    setIsEmailing(true);
    try {
      await addDoc(collection(db, 'mail'), {
        to: customerEmail,
        message: {
          subject: 'Solar Quotation from Meta Green Solutions',
          html: `<p>Please find your solar quotation attached or viewable in your portal.</p>`,
        }
      });
      alert('Quotation emailed to customer successfully.');
    } catch (error) {
      console.error(error);
      alert('Error sending email. Ensure Firebase is configured.');
    }
    setIsEmailing(false);
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Calculator className="w-8 h-8 text-emerald-600" /> Quotation Builder
          </h1>
          <p className="text-slate-500 font-medium mt-1">Build precise quotes, manage versions, and handle approvals</p>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={() => setIsHistoryOpen(!isHistoryOpen)}
             className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-2 text-sm"
           >
             <History className="w-4 h-4" /> Version History
           </button>
           <button 
             onClick={handleCreateNewVersion}
             className="px-4 py-2 bg-emerald-100 text-emerald-800 font-semibold rounded-lg hover:bg-emerald-200 transition-colors flex items-center gap-2 text-sm"
           >
             <Plus className="w-4 h-4" /> New Version
           </button>
        </div>
      </header>

      <div className="flex overflow-x-auto pb-4 gap-2 no-scrollbar border-b border-slate-100 print:hidden">
        {[
          { id: 'editor', label: 'Quotation Editor', icon: Calculator },
          { id: 'preview', label: 'PDF Preview', icon: FileText },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap",
              activeTab === tab.id 
                ? "bg-emerald-100/80 text-emerald-800" 
                : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-200"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'preview' && (
        <div className="flex justify-end gap-2 mb-4 print:hidden">
            <div className="flex items-center gap-2 mr-4">
                <input 
                    type="email" 
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="Customer Email"
                    className="p-2 border border-slate-200 rounded-lg text-sm"
                />
                <button 
                  onClick={handleEmailQuotation}
                  disabled={isEmailing}
                  className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
                >
                  <Mail className="w-4 h-4" /> {isEmailing ? 'Sending...' : 'Email Quotation'}
                </button>
            </div>
            <button 
              onClick={handleDownloadPDF}
              className="px-4 py-2 bg-slate-800 text-white font-semibold rounded-lg hover:bg-slate-900 transition-colors flex items-center gap-2 text-sm"
            >
              <Download className="w-4 h-4" /> Download PDF
            </button>
        </div>
      )}

      {isHistoryOpen && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Version History</h3>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {versions.map(v => (
              <button
                key={v.id}
                onClick={() => setActiveVersionId(v.id)}
                className={cn(
                  "flex-shrink-0 flex flex-col items-start p-3 rounded-lg border min-w-[160px] text-left transition-all",
                  activeVersionId === v.id 
                    ? "bg-white border-emerald-500 ring-1 ring-emerald-500 shadow-sm"
                    : "bg-white border-slate-200 hover:border-slate-300"
                )}
              >
                <div className="flex justify-between w-full mb-1">
                  <span className="font-bold text-slate-900">v{v.versionNumber}.0</span>
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full",
                    v.status === 'Draft' ? "bg-slate-100 text-slate-600" :
                    v.status === 'Pending Approval' ? "bg-amber-100 text-amber-700" :
                    v.status === 'Approved' ? "bg-emerald-100 text-emerald-700" :
                    "bg-red-100 text-red-700"
                  )}>{v.status}</span>
                </div>
                <span className="text-xs text-slate-500">{v.date}</span>
                <span className="text-sm font-semibold text-emerald-700 mt-2">₹{v.totalValue.toLocaleString()}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'editor' && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Details Form */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-600" />
              Customer Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Customer Name</label>
                <div className="relative">
                  <select 
                    value={customerDetails.name}
                    onChange={(e) => {
                      const selectedLead = leads.find(l => l.name === e.target.value);
                      if (selectedLead) {
                        setCustomerDetails({
                          ...customerDetails,
                          name: selectedLead.name,
                          mobile: selectedLead.phone || '',
                          addressLine1: selectedLead.address || '',
                          city: selectedLead.city || '',
                          district: selectedLead.district || '',
                          state: selectedLead.state || '',
                          pincode: selectedLead.pincode || '',
                        });
                      } else {
                        setCustomerDetails({...customerDetails, name: e.target.value});
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none appearance-none"
                  >
                    <option value="">Select Customer</option>
                    {leads.map(lead => (
                      <option key={lead.id} value={lead.name}>{lead.name}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mobile Number</label>
                <input 
                  type="text" 
                  value={customerDetails.mobile}
                  onChange={(e) => setCustomerDetails({...customerDetails, mobile: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Address Line 1</label>
                <input 
                  type="text" 
                  value={customerDetails.addressLine1}
                  onChange={(e) => setCustomerDetails({...customerDetails, addressLine1: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">City</label>
                  <input 
                    type="text" 
                    value={customerDetails.city}
                    onChange={(e) => setCustomerDetails({...customerDetails, city: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">District</label>
                  <input 
                    type="text" 
                    value={customerDetails.district}
                    onChange={(e) => setCustomerDetails({...customerDetails, district: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">State</label>
                  <input 
                    type="text" 
                    value={customerDetails.state}
                    onChange={(e) => setCustomerDetails({...customerDetails, state: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Pincode</label>
                  <input 
                    type="text" 
                    value={customerDetails.pincode}
                    onChange={(e) => setCustomerDetails({...customerDetails, pincode: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">System Size</label>
                <input 
                  type="text" 
                  value={customerDetails.systemSize}
                  onChange={(e) => setCustomerDetails({...customerDetails, systemSize: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                Line Items
              </h2>
              {activeVersion.status === 'Draft' && (
                <button 
                  onClick={handleAddItem}
                  className="text-emerald-600 hover:bg-emerald-50 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add Item
                </button>
              )}
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Item Description</th>
                    <th className="px-4 py-3 w-24">Qty</th>
                    <th className="px-4 py-3 w-32">Unit Price (₹)</th>
                    <th className="px-4 py-3 w-32">Total (₹)</th>
                    <th className="px-4 py-3 w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeVersion.items.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <select 
                          value={item.category}
                          onChange={(e) => handleUpdateItem(item.id, 'category', e.target.value)}
                          disabled={activeVersion.status !== 'Draft'}
                          className="w-full bg-transparent border-0 p-0 text-sm focus:ring-0 text-slate-700 disabled:opacity-70"
                        >
                          <option>Panel</option>
                          <option>Inverter</option>
                          <option>Battery</option>
                          <option>Structure</option>
                          <option>Wiring</option>
                          <option>Other</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input 
                          type="text" 
                          list={`inventory-list-${item.id}`}
                          value={item.name}
                          onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                          disabled={activeVersion.status !== 'Draft'}
                          placeholder="Item name..."
                          className="w-full bg-transparent border-0 p-0 text-sm focus:ring-0 text-slate-900 font-medium disabled:opacity-70"
                        />
                        <datalist id={`inventory-list-${item.id}`}>
                           {inventoryItems.map((inv, idx) => (
                             <option key={idx} value={inv.name} />
                           ))}
                        </datalist>
                      </td>
                      <td className="px-4 py-3">
                        <input 
                          type="number" 
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleUpdateItem(item.id, 'quantity', Number(e.target.value))}
                          disabled={activeVersion.status !== 'Draft'}
                          className="w-full bg-transparent border-0 p-0 text-sm focus:ring-0 text-slate-700 disabled:opacity-70"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input 
                          type="number" 
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => handleUpdateItem(item.id, 'unitPrice', Number(e.target.value))}
                          disabled={activeVersion.status !== 'Draft'}
                          className="w-full bg-transparent border-0 p-0 text-sm focus:ring-0 text-slate-700 disabled:opacity-70"
                        />
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {(item.quantity * item.unitPrice).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {activeVersion.status === 'Draft' && (
                          <button 
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-slate-400 hover:text-red-500 transition-colors p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {activeVersion.items.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                        No items added. Click 'Add Item' to begin.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Status and Workflow */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Approval Workflow</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  "bg-emerald-100 text-emerald-600" 
                )}>
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Drafted</p>
                  <p className="text-xs text-slate-500">Current version created</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300" />
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  activeVersion.status === 'Pending Approval' || activeVersion.status === 'Approved' ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"
                )}>
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className={cn("font-bold", activeVersion.status === 'Pending Approval' || activeVersion.status === 'Approved' ? "text-slate-900" : "text-slate-400")}>Manager Review</p>
                  <p className="text-xs text-slate-500">Pending internal approval</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300" />
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  activeVersion.status === 'Approved' ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"
                )}>
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className={cn("font-bold", activeVersion.status === 'Approved' ? "text-slate-900" : "text-slate-400")}>Approved</p>
                  <p className="text-xs text-slate-500">Ready to send to client</p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              {activeVersion.status === 'Draft' && (
                <button 
                  onClick={handleSendForApproval}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl flex items-center gap-2 transition-all shadow-sm"
                >
                  <Send className="w-4 h-4" /> Request Approval
                </button>
              )}
              {activeVersion.status === 'Pending Approval' && (
                <button 
                  onClick={handleApprove}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl flex items-center gap-2 transition-all shadow-sm"
                >
                  <CheckCircle className="w-4 h-4" /> Approve Quote
                </button>
              )}
              {activeVersion.status === 'Approved' && (
                <button 
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl flex items-center gap-2 transition-all shadow-sm"
                >
                  <Send className="w-4 h-4" /> Send to Customer
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Cost Summary Sidebar */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 h-fit sticky top-6">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Quote Summary</h2>
          
          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Items Subtotal</span>
              <span className="font-semibold text-slate-900">₹{subtotal.toLocaleString()}</span>
            </div>
            
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Labour & Installation</span>
                <input 
                  type="number"
                  value={activeVersion.labourCost}
                  onChange={(e) => handleUpdateCost('labourCost', Number(e.target.value))}
                  disabled={activeVersion.status !== 'Draft'}
                  className="w-24 text-right p-1 text-sm border border-slate-200 rounded focus:ring-1 focus:ring-emerald-500 outline-none disabled:bg-slate-100"
                />
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Transportation</span>
                <input 
                  type="number"
                  value={activeVersion.transportCost}
                  onChange={(e) => handleUpdateCost('transportCost', Number(e.target.value))}
                  disabled={activeVersion.status !== 'Draft'}
                  className="w-24 text-right p-1 text-sm border border-slate-200 rounded focus:ring-1 focus:ring-emerald-500 outline-none disabled:bg-slate-100"
                />
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600 font-medium">Discounts (-)</span>
                <input 
                  type="number"
                  value={activeVersion.discount}
                  onChange={(e) => handleUpdateCost('discount', Number(e.target.value))}
                  disabled={activeVersion.status !== 'Draft'}
                  className="w-24 text-right p-1 text-sm border border-slate-200 rounded text-emerald-600 font-bold focus:ring-1 focus:ring-emerald-500 outline-none disabled:bg-slate-100"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <div className="flex justify-between items-center text-sm mb-2">
                <span className="font-bold text-slate-800">Total before Tax</span>
                <span className="font-bold text-slate-900">₹{totalBeforeTax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm mb-2">
                <span className="text-slate-600 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={activeVersion.use7030Split || false}
                    onChange={(e) => handleUpdateCost('use7030Split' as any, e.target.checked as any)}
                    disabled={activeVersion.status !== 'Draft'}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  Use 70/30 Tax Split (12% & 18%)
                </span>
              </div>
              {!activeVersion.use7030Split && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">
                    GST 
                    <input 
                      type="number"
                      value={activeVersion.gstRate}
                      onChange={(e) => handleUpdateCost('gstRate', Number(e.target.value))}
                      disabled={activeVersion.status !== 'Draft'}
                      className="w-12 text-center p-0.5 mx-1 text-xs border border-slate-200 rounded outline-none disabled:bg-slate-100"
                    />%
                  </span>
                  <span className="text-slate-600">₹{gstAmount.toLocaleString()}</span>
                </div>
              )}
              {activeVersion.use7030Split && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">GST (70% @ 12%, 30% @ 18%)</span>
                  <span className="text-slate-600">₹{gstAmount.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-emerald-600 text-white p-4 rounded-xl shadow-lg shadow-emerald-200/50">
            <p className="text-emerald-100 text-sm font-medium mb-1">Grand Total (Incl. Taxes)</p>
            <p className="text-3xl font-black">₹{grandTotal.toLocaleString()}</p>
          </div>
        </div>
      </div>
      )}

      {activeTab === 'preview' && (
          <div id="quotation-preview-container" className="bg-white mx-auto shadow-2xl print:shadow-none print:max-w-none max-w-4xl min-h-[1056px] text-slate-800 text-sm p-12 relative overflow-hidden">
             {/* PDF Document Formatting */}
             <div className="flex flex-col items-center mb-8">
                 <div className="flex items-center gap-2 mb-2 text-emerald-600">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-12 h-12">
                       <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364l-1.414 1.414M7.05 16.95l-1.414 1.414M16.95 16.95l1.414 1.414M7.05 7.05L5.636 5.636M12 8a4 4 0 100 8 4 4 0 000-8z" />
                    </svg>
                 </div>
                 <h2 className="text-3xl font-black text-emerald-600 tracking-tight">GREEN ENERGY SOLUTIONS</h2>
                 <div className="mt-8 text-center">
                    <h1 className="text-4xl font-bold text-emerald-600 mb-2">Solar Proposal</h1>
                    <h3 className="text-xl font-bold text-blue-900">System Size: {customerDetails.systemSize}</h3>
                 </div>
             </div>

             <div className="grid grid-cols-2 gap-4 border border-slate-200 rounded-lg p-4 mb-8">
                 <div>
                     <p className="text-xs font-bold text-slate-500 mb-1">Estimate ID</p>
                     <p className="text-lg font-bold text-blue-900">GES25-{activeVersion.versionNumber.toString().padStart(6, '0')}</p>
                 </div>
                 <div>
                     <p className="text-xs font-bold text-slate-500 mb-1">Date</p>
                     <p className="text-lg font-bold text-blue-900">{activeVersion.date}</p>
                 </div>
             </div>

             <div className="grid grid-cols-2 gap-12 mb-8">
                 <div>
                     <h3 className="text-emerald-600 font-bold border-b-2 border-emerald-600 inline-block mb-3">Prepared For</h3>
                     <p className="font-bold text-slate-900 text-base">{customerDetails.name}</p>
                     <p>Mobile: {customerDetails.mobile}</p>
                     <p>{customerDetails.addressLine1}</p>
                     <p>{customerDetails.city}</p>
                     <p>{customerDetails.city}, {customerDetails.district}</p>
                     <p>{customerDetails.state} - {customerDetails.pincode}</p>
                 </div>
                 <div>
                     <h3 className="text-emerald-600 font-bold border-b-2 border-emerald-600 inline-block mb-3">Prepared By</h3>
                     <p className="font-bold text-slate-900 text-base">Greenenergy Admin</p>
                     <p>Mobile: 9848992333</p>
                     <p className="mt-4">Meta Green Solutions</p>
                     <p>Vijayawada, Andhra Pradesh</p>
                     <p>www.gesindia.co</p>
                 </div>
             </div>

             <div className="mb-8">
                <p className="mb-2"><span className="font-bold">Bill To:</span><br/>Sri/Smt, {customerDetails.name} Garu, {customerDetails.addressLine1}, {customerDetails.city}, {customerDetails.city}, {customerDetails.district}, {customerDetails.state}- {customerDetails.pincode}. Ph: {customerDetails.mobile}</p>
                <p className="mb-4">Note: <span className="font-bold">Quote for Supply of {customerDetails.systemSize} RTS plant for Client.</span></p>

                <table className="w-full border-collapse border border-slate-300">
                    <thead>
                        <tr className="bg-slate-200">
                            <th className="border border-slate-300 px-4 py-2 text-left font-bold w-3/4">Product Description</th>
                            <th className="border border-slate-300 px-4 py-2 text-right font-bold w-1/4">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {activeVersion.items.map((item, idx) => (
                           <tr key={item.id}>
                               <td className="border border-slate-300 px-4 py-2">{idx + 1}) {item.name}</td>
                               <td className="border border-slate-300 px-4 py-2 text-right">
                                  {idx === 0 ? `Rs. ${grandTotal.toLocaleString()}` : ''}
                               </td>
                           </tr>
                        ))}
                        <tr>
                            <td className="border border-slate-300 px-4 py-2 font-bold bg-amber-50">Total Amount (Incl. GST {activeVersion.use7030Split ? '70/30 Split' : `${activeVersion.gstRate}%`})</td>
                            <td className="border border-slate-300 px-4 py-2 text-right font-bold bg-amber-50">Rs. {grandTotal.toLocaleString()} /-</td>
                        </tr>
                    </tbody>
                </table>
                
                <p className="mt-4">Total Amount in Words: <span className="font-bold">Rupees {grandTotal.toLocaleString()} only</span></p>
                
                <p className="mt-6 font-bold text-emerald-700">Thank you for your interest in doing business with Meta Green Solutions. Waiting for your order confirmation...</p>
             </div>

             <div className="mb-8">
                 <h3 className="text-emerald-600 font-bold border-b-2 border-emerald-600 inline-block mb-3 text-lg">Bank Details for Payments:</h3>
                 <p>Bank Name: <span className="font-bold">HPFC Bank</span></p>
                 <p>Account Name: <span className="font-bold">GREEN ENERGY SOLUTIONS</span></p>
                 <p>A/C No: <span className="font-bold">50200119127645</span></p>
                 <p>IFSC: <span className="font-bold">HDFC0009146</span></p>
             </div>

             <div className="mb-8">
                 <h3 className="text-emerald-600 font-bold border-b-2 border-emerald-600 inline-block mb-3 text-lg">Warranty Terms and Conditions</h3>
                 <table className="w-full border-collapse border border-slate-300 mb-6">
                    <thead>
                        <tr className="bg-slate-200">
                            <th className="border border-slate-300 px-4 py-2 text-left font-bold">Component</th>
                            <th className="border border-slate-300 px-4 py-2 text-left font-bold">Standard Warranty</th>
                            <th className="border border-slate-300 px-4 py-2 text-left font-bold">Warranty Type</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="border border-slate-300 px-4 py-2">Solar PV Modules</td>
                            <td className="border border-slate-300 px-4 py-2">10 Years - Product Warranty<br/>25 Years - Performance Warranty</td>
                            <td className="border border-slate-300 px-4 py-2">Product & Performance</td>
                        </tr>
                        <tr>
                            <td className="border border-slate-300 px-4 py-2">Inverter</td>
                            <td className="border border-slate-300 px-4 py-2">5 Years</td>
                            <td className="border border-slate-300 px-4 py-2">Inverter Only</td>
                        </tr>
                        <tr>
                            <td className="border border-slate-300 px-4 py-2">Structure</td>
                            <td className="border border-slate-300 px-4 py-2">3 Years</td>
                            <td className="border border-slate-300 px-4 py-2">Structure Only</td>
                        </tr>
                    </tbody>
                 </table>
                 
                 <h4 className="font-bold text-base mb-2">Warranty Coverage</h4>
                 <p className="mb-2">Our warranty covers the following aspects:</p>
                 <ul className="list-decimal pl-5 space-y-1 mb-4">
                     <li>Manufacturing Defects: Any defects in materials or workmanship.</li>
                     <li>Performance Degradation: For solar modules, warranty ensures performance remains within specified levels.</li>
                     <li>Installation Defects: Workmanship-related faults covered if installed by Meta Green Solutions.</li>
                 </ul>
                 
                 <h4 className="font-bold text-base mb-2">Benefits of choosing Meta Green Solutions</h4>
                 <ul className="list-decimal pl-5 space-y-1">
                     <li>Free Site Visits.</li>
                     <li>End-End solutions from Consultation to Installation and Technical support.</li>
                     <li>We Provide Flexible Financing options from various Banks.</li>
                 </ul>
             </div>
             
             <div className="mt-12">
                 <p className="font-bold">Regards</p>
                 <p>Greenenergy Admin</p>
                 <p>Meta Green Solutions</p>
                 <p>www.gesindia.co</p>
             </div>
          </div>
      )}
    </div>
  );
}
