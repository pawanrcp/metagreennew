import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Store, 
  FileText, 
  Truck, 
  Receipt, 
  CreditCard,
  Star,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle, Edit2, Trash2, ArrowRight
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { collection, query, onSnapshot, orderBy, addDoc, serverTimestamp, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';

export default function Procurement() {
  const [activeTab, setActiveTab] = useState<'purchase' | 'vendors'>('purchase');
  const [searchQuery, setSearchQuery] = useState('');

  const [vendors, setVendors] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);

  useEffect(() => {
    const qVendors = query(collection(db, 'vendors'), orderBy('name', 'asc'));
    const unsubVendors = onSnapshot(qVendors, (snapshot) => {
      if (!snapshot.empty) {
        setVendors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    });

    const qPOs = query(collection(db, 'purchaseOrders'), orderBy('date', 'desc'));
    const unsubPOs = onSnapshot(qPOs, (snapshot) => {
      if (!snapshot.empty) {
        setPurchaseOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    });
    return () => { unsubVendors(); unsubPOs(); };
  }, []);

  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [isPoModalOpen, setIsPoModalOpen] = useState(false);
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null);
  const [editingPoId, setEditingPoId] = useState<string | null>(null);
  const [newVendor, setNewVendor] = useState({ name: '', category: 'Solar Panels', contact: '', phone: '' });
  const [newPo, setNewPo] = useState({ vendor: '', items: '', amount: 0 });

  const handleSubmitVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingVendorId) {
        await updateDoc(doc(db, 'vendors', editingVendorId), {
          name: newVendor.name,
          category: newVendor.category,
          contact: newVendor.contact,
          phone: newVendor.phone
        });
      } else {
        const newId = `VEN-${String(vendors.length + 1).padStart(3, '0')}`;
        await addDoc(collection(db, 'vendors'), {
          displayId: newId,
          name: newVendor.name,
          category: newVendor.category,
          contact: newVendor.contact,
          phone: newVendor.phone,
          rating: 0,
          metrics: { delivery: 0, quality: 0, pricing: 0, support: 0 },
          status: 'Active'
        });
      }
      setIsVendorModalOpen(false);
      setEditingVendorId(null);
      setNewVendor({ name: '', category: 'Solar Panels', contact: '', phone: '' });
    } catch (err) {
      console.error('Error saving vendor', err);
    }
  };

  const handleDeleteVendor = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this vendor?")) {
      try {
        await deleteDoc(doc(db, 'vendors', id));
      } catch (err) {
        console.error('Error deleting vendor:', err);
      }
    }
  };

  const handleSubmitPo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPoId) {
        await updateDoc(doc(db, 'purchaseOrders', editingPoId), {
          vendor: newPo.vendor || vendors[0]?.name || 'Unknown Vendor',
          items: newPo.items,
          amount: newPo.amount,
        });
      } else {
        const newId = `PO-2026-${String(purchaseOrders.length + 1).padStart(3, '0')}`;
        await addDoc(collection(db, 'purchaseOrders'), {
          displayId: newId,
          vendor: newPo.vendor || vendors[0]?.name || 'Unknown Vendor',
          items: newPo.items,
          amount: newPo.amount,
          date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-'),
          status: 'RFQ',
          expectedDelivery: 'TBD',
          stage: 1
        });
      }
      setIsPoModalOpen(false);
      setEditingPoId(null);
      setNewPo({ vendor: '', items: '', amount: 0 });
    } catch (err) {
      console.error('Error saving PO', err);
    }
  };

  const handleDeletePo = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this PO?")) {
      try {
        await deleteDoc(doc(db, 'purchaseOrders', id));
      } catch (err) {
        console.error('Error deleting PO:', err);
      }
    }
  };

  const advanceStage = async (id: string, currentStage: number) => {
    if (currentStage >= 5) return;
    try {
      await updateDoc(doc(db, 'purchaseOrders', id), {
        stage: currentStage + 1,
        status: getStageName(currentStage + 1)
      });
    } catch (err) {
      console.error('Error advancing stage:', err);
    }
  };

  const getStageColor = (currentStage: number, stage: number) => {
    if (currentStage > stage) return 'bg-emerald-500 text-white border-emerald-500';
    if (currentStage === stage) return 'bg-blue-500 text-white border-blue-500';
    return 'bg-white text-slate-400 border-slate-200';
  };

  const getStageIcon = (stage: number) => {
    switch (stage) {
      case 1: return <FileText className="w-4 h-4" />;
      case 2: return <ShoppingCart className="w-4 h-4" />;
      case 3: return <Truck className="w-4 h-4" />;
      case 4: return <Receipt className="w-4 h-4" />;
      case 5: return <CreditCard className="w-4 h-4" />;
      default: return <CheckCircle2 className="w-4 h-4" />;
    }
  };

  const getStageName = (stage: number) => {
    switch (stage) {
      case 1: return 'RFQ';
      case 2: return 'Purchase Order';
      case 3: return 'Delivery Tracking';
      case 4: return 'Invoice Verification';
      case 5: return 'Payment';
      default: return '';
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star 
            key={star} 
            className={cn(
              "w-3.5 h-3.5",
              star <= rating ? "text-amber-400 fill-amber-400" : "text-slate-200"
            )} 
          />
        ))}
      </div>
    );
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-blue-600" /> Procurement
          </h1>
          <p className="text-slate-500 font-medium mt-1">Manage vendors, purchase orders, and deliveries</p>
        </div>
      </header>

      <div className="flex overflow-x-auto pb-4 gap-2 no-scrollbar border-b border-slate-100">
        {[
          { id: 'purchase', label: 'Purchase Management', icon: ShoppingCart },
          { id: 'vendors', label: 'Vendor Rating', icon: Store },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap",
              activeTab === tab.id 
                ? "bg-blue-100/80 text-blue-800" 
                : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-200"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-96 flex items-center">
          <Search className="w-5 h-5 absolute left-3 text-slate-400" />
          <input 
            type="text" 
            placeholder={activeTab === 'purchase' ? "Search Purchase Orders..." : "Search Vendors..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
          />
        </div>
        <div className="flex gap-2">
           <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm">
             <Filter className="w-4 h-4" /> Filter
           </button>
           <button 
             onClick={() => activeTab === 'purchase' ? setIsPoModalOpen(true) : setIsVendorModalOpen(true)}
             className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm shadow-sm shadow-blue-200"
           >
             <Plus className="w-4 h-4" /> {activeTab === 'purchase' ? 'New PO / RFQ' : 'Add Vendor'}
           </button>
        </div>
      </div>

      {activeTab === 'purchase' && (
        <div className="grid grid-cols-1 gap-4">
          {purchaseOrders.map(po => (
            <div key={po.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative group">
              <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                {po.stage < 5 && (
                  <button onClick={() => advanceStage(po.id, po.stage)} title="Advance Stage" className="p-1.5 hover:bg-emerald-50 text-emerald-500 hover:text-emerald-700 rounded-lg transition-colors bg-white shadow-sm border border-slate-100">
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => { setEditingPoId(po.id); setNewPo({ vendor: po.vendor, items: po.items, amount: po.amount }); setIsPoModalOpen(true); }} className="p-1.5 hover:bg-blue-50 text-blue-400 hover:text-blue-600 rounded-lg transition-colors bg-white shadow-sm border border-slate-100">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDeletePo(po.id)} className="p-1.5 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-colors bg-white shadow-sm border border-slate-100">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex justify-between items-start mb-6 pr-10">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{po.displayId || po.id} - {po.vendor}</h3>
                  <p className="text-sm text-slate-600 mt-1">{po.items}</p>
                  <div className="flex items-center gap-4 text-xs font-medium text-slate-500 mt-3">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5"/> Date: {po.date}</span>
                    <span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5"/> Exp. Delivery: {po.expectedDelivery}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-slate-900">₹{po.amount.toLocaleString()}</div>
                  <div className="text-xs font-bold text-blue-600 uppercase tracking-wide mt-1 bg-blue-50 inline-block px-2 py-1 rounded-md">
                    {po.status}
                  </div>
                </div>
              </div>

              {/* Progress Stepper */}
              <div className="relative pt-4">
                 <div className="absolute top-8 left-4 right-4 h-0.5 bg-slate-100 -z-10" />
                 <div className="flex justify-between">
                    {[1, 2, 3, 4, 5].map((stageNumber) => (
                       <div key={stageNumber} className="flex flex-col items-center gap-2 w-24">
                          <div className={cn(
                             "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors bg-white",
                             getStageColor(po.stage, stageNumber)
                          )}>
                             {po.stage > stageNumber ? <CheckCircle2 className="w-4 h-4" /> : getStageIcon(stageNumber)}
                          </div>
                          <span className={cn(
                             "text-[10px] font-bold text-center",
                             po.stage >= stageNumber ? "text-slate-700" : "text-slate-400"
                          )}>
                             {getStageName(stageNumber)}
                          </span>
                       </div>
                    ))}
                 </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'vendors' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
           {vendors.map(vendor => (
              <div key={vendor.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col h-full relative group">
                 <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button onClick={() => { setEditingVendorId(vendor.id); setNewVendor({ name: vendor.name, category: vendor.category, contact: vendor.contact, phone: vendor.phone }); setIsVendorModalOpen(true); }} className="p-1.5 hover:bg-blue-50 text-blue-400 hover:text-blue-600 rounded-lg transition-colors bg-white shadow-sm border border-slate-100">
                     <Edit2 className="w-4 h-4" />
                   </button>
                   <button onClick={() => handleDeleteVendor(vendor.id)} className="p-1.5 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-colors bg-white shadow-sm border border-slate-100">
                     <Trash2 className="w-4 h-4" />
                   </button>
                 </div>
                 <div className="flex justify-between items-start mb-4 pr-16">
                    <div>
                       <h3 className="text-lg font-bold text-slate-900">{vendor.name}</h3>
                       <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mt-1">{vendor.category}</p>
                    </div>
                    <div className="flex flex-col items-end">
                       <span className="text-lg font-black text-slate-900">{vendor.rating.toFixed(1)}</span>
                       {renderStars(vendor.rating)}
                    </div>
                 </div>
                 
                 <div className="text-sm text-slate-600 mb-6 space-y-1">
                    <p>{vendor.contact}</p>
                    <p>{vendor.phone}</p>
                 </div>

                 <div className="mt-auto space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Performance Metrics</h4>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                       <div>
                          <div className="flex justify-between items-center mb-1">
                             <span className="text-slate-600 font-medium">Delivery Time</span>
                             <span className="font-bold text-slate-900">{vendor.metrics.delivery}</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5">
                             <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${(vendor.metrics.delivery / 5) * 100}%` }} />
                          </div>
                       </div>
                       <div>
                          <div className="flex justify-between items-center mb-1">
                             <span className="text-slate-600 font-medium">Quality</span>
                             <span className="font-bold text-slate-900">{vendor.metrics.quality}</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5">
                             <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${(vendor.metrics.quality / 5) * 100}%` }} />
                          </div>
                       </div>
                       <div>
                          <div className="flex justify-between items-center mb-1">
                             <span className="text-slate-600 font-medium">Pricing</span>
                             <span className="font-bold text-slate-900">{vendor.metrics.pricing}</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5">
                             <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${(vendor.metrics.pricing / 5) * 100}%` }} />
                          </div>
                       </div>
                       <div>
                          <div className="flex justify-between items-center mb-1">
                             <span className="text-slate-600 font-medium">Support</span>
                             <span className="font-bold text-slate-900">{vendor.metrics.support}</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5">
                             <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${(vendor.metrics.support / 5) * 100}%` }} />
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           ))}
        </div>
      )}

      {isVendorModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">{editingVendorId ? 'Edit Vendor' : 'Add New Vendor'}</h3>
              <button onClick={() => {setIsVendorModalOpen(false); setEditingVendorId(null); setNewVendor({ name: '', category: 'Solar Panels', contact: '', phone: '' });}} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <form onSubmit={handleSubmitVendor} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Vendor Name</label>
                <input required type="text" value={newVendor.name} onChange={e => setNewVendor({...newVendor, name: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                <select value={newVendor.category} onChange={e => setNewVendor({...newVendor, category: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none">
                  <option value="Solar Panels">Solar Panels</option>
                  <option value="Inverters">Inverters</option>
                  <option value="Batteries">Batteries</option>
                  <option value="Cables & Accessories">Cables & Accessories</option>
                  <option value="Mounting Structures">Mounting Structures</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Contact Email</label>
                  <input required type="email" value={newVendor.contact} onChange={e => setNewVendor({...newVendor, contact: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                  <input required type="tel" value={newVendor.phone} onChange={e => setNewVendor({...newVendor, phone: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none" />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => {setIsVendorModalOpen(false); setEditingVendorId(null); setNewVendor({ name: '', category: 'Solar Panels', contact: '', phone: '' });}} className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">Add Vendor</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isPoModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">{editingPoId ? 'Edit PO' : 'Create PO / RFQ'}</h3>
              <button onClick={() => {setIsPoModalOpen(false); setEditingPoId(null); setNewPo({ vendor: '', items: '', amount: 0 });}} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <form onSubmit={handleSubmitPo} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Select Vendor</label>
                <select required value={newPo.vendor} onChange={e => setNewPo({...newPo, vendor: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none">
                  <option value="">-- Select a Vendor --</option>
                  {vendors.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Items Description</label>
                <textarea required value={newPo.items} onChange={e => setNewPo({...newPo, items: e.target.value})} rows={3} placeholder="e.g. 500x 400W Mono Panels" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Total Amount (₹)</label>
                <input required type="number" min="0" value={newPo.amount || ''} onChange={e => setNewPo({...newPo, amount: Number(e.target.value)})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none" />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => {setIsPoModalOpen(false); setEditingPoId(null); setNewPo({ vendor: '', items: '', amount: 0 });}} className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">Create Order</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
