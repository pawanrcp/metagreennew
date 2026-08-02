import React, { useState, useEffect } from 'react';
import { 
  Landmark, 
  FileCheck, 
  UploadCloud, 
  CheckCircle2, 
  Clock, 
  Search,
  IndianRupee,
  Building,
  FileText, Edit2, Trash2
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { collection, query, onSnapshot, orderBy, addDoc, serverTimestamp, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';

export default function SubsidyManagement() {
  const [activeTab, setActiveTab] = useState<'tracking' | 'schemes'>('tracking');
  const [searchQuery, setSearchQuery] = useState('');

  const [applications, setApplications] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppId, setEditingAppId] = useState<string | null>(null);
  const [newApp, setNewApp] = useState({ customer: '', scheme: 'PM Surya Ghar Muft Bijli Yojana', capacity: '', subsidyAmount: 0 });

  useEffect(() => {
    const q = query(collection(db, 'subsidies'), orderBy('appliedDate', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setApplications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAppId) {
        await updateDoc(doc(db, 'subsidies', editingAppId), {
          customer: newApp.customer,
          scheme: newApp.scheme,
          capacity: newApp.capacity,
          subsidyAmount: newApp.subsidyAmount,
        });
      } else {
        const newId = `SUB-2026-${String(applications.length + 1).padStart(3, '0')}`;
        await addDoc(collection(db, 'subsidies'), {
          displayId: newId,
          customer: newApp.customer,
          scheme: newApp.scheme,
          capacity: newApp.capacity,
          status: 'Application',
          progress: 10,
          appliedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-'),
          subsidyAmount: newApp.subsidyAmount,
          steps: [
            { name: 'Application', completed: true },
            { name: 'Documents', completed: false, current: true },
            { name: 'Verification', completed: false },
            { name: 'Approval', completed: false },
            { name: 'Amount Received', completed: false }
          ]
        });
      }
      setIsModalOpen(false);
      setEditingAppId(null);
      setNewApp({ customer: '', scheme: 'PM Surya Ghar Muft Bijli Yojana', capacity: '', subsidyAmount: 0 });
    } catch (err) {
      console.error('Error saving subsidy:', err);
    }
  };

  const handleDeleteApplication = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this application?")) {
      try {
        await deleteDoc(doc(db, 'subsidies', id));
      } catch (err) {
        console.error('Error deleting subsidy:', err);
      }
    }
  };


  const centralSchemes = [
    {
      name: 'PM Surya Ghar Muft Bijli Yojana',
      description: 'Central government scheme providing up to ₹78,000 for residential rooftop solar installations.',
      eligibility: 'Residential consumers',
      benefits: 'Up to ₹78,000 subsidy',
      link: 'https://pmsuryaghar.gov.in'
    },
    {
      name: 'CFA for Grid Connected Rooftop Solar',
      description: 'Phase-II program by MNRE for residential sector.',
      eligibility: 'Residential (Individual/GHS/RWA)',
      benefits: '40% up to 3kW, 20% beyond 3kW up to 10kW',
      link: 'https://solarrooftop.gov.in'
    }
  ];

  const stateSchemes = [
    {
      state: 'Andhra Pradesh',
      name: 'AP State Solar Rooftop Policy',
      description: 'Additional state subsidy for residential rooftop solar installations.',
      eligibility: 'Residential consumers in AP',
      benefits: '20% of system cost up to maximum of ₹20,000'
    },
    {
      state: 'Gujarat',
      name: 'Surya Gujarat Scheme',
      description: 'State specific subsidy scheme for accelerating residential rooftop solar.',
      eligibility: 'Residential consumers in Gujarat',
      benefits: 'Additional ₹10,000 beyond central subsidy'
    }
  ];

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Landmark className="w-8 h-8 text-emerald-600" /> Subsidy Management
          </h1>
          <p className="text-slate-500 font-medium mt-1">Track applications and manage government schemes</p>
        </div>
      </header>

      <div className="flex overflow-x-auto pb-4 gap-2 no-scrollbar border-b border-slate-100">
        {[
          { id: 'tracking', label: 'Application Tracking', icon: FileCheck },
          { id: 'schemes', label: 'Available Schemes', icon: Building },
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

      {activeTab === 'tracking' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="relative w-96">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search by customer name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
              />
            </div>
            <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 text-sm shadow-sm shadow-emerald-200">
              New Application
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {applications.map(app => (
              <div key={app.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{app.customer}</h3>
                    <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                      <span className="font-medium text-slate-700">{app.displayId || app.id}</span>
                      <span>•</span>
                      <span>{app.scheme}</span>
                      <span>•</span>
                      <span>{app.capacity}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-2 mb-2">
                        <button 
                          onClick={() => {
                            setEditingAppId(app.id);
                            setNewApp({ customer: app.customer, scheme: app.scheme, capacity: app.capacity, subsidyAmount: app.subsidyAmount });
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 hover:bg-blue-50 text-blue-400 hover:text-blue-600 rounded-lg transition-colors"
                          title="Edit Application"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteApplication(app.id)}
                          className="p-1.5 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-colors"
                          title="Delete Application"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="text-sm text-slate-500 font-medium mb-1">Expected Subsidy</div>
                    <div className="text-xl font-bold text-emerald-600 flex items-center justify-end gap-1">
                      <IndianRupee className="w-5 h-5" /> {app.subsidyAmount.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="relative">
                  {/* Progress Bar Background */}
                  <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-1000" 
                      style={{ width: `${app.progress}%` }}
                    />
                  </div>

                  {/* Steps */}
                  <div className="relative flex justify-between">
                    {app.steps.map((step, idx) => (
                      <div key={idx} className="flex flex-col items-center">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center border-2 bg-white z-10 transition-colors",
                          step.completed 
                            ? "border-emerald-500 bg-emerald-500 text-white" 
                            : step.current 
                              ? "border-emerald-500 text-emerald-600" 
                              : "border-slate-200 text-slate-300"
                        )}>
                          {step.completed ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : step.current ? (
                            <Clock className="w-4 h-4 animate-spin-slow" />
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-slate-200" />
                          )}
                        </div>
                        <div className={cn(
                          "text-xs font-bold mt-2 text-center w-24",
                          step.completed || step.current ? "text-slate-900" : "text-slate-400"
                        )}>
                          {step.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {app.status === 'Documents' && (
                   <div className="mt-6 p-4 bg-amber-50 border border-amber-100 rounded-lg flex justify-between items-center">
                      <div className="flex items-center gap-3">
                         <FileText className="w-5 h-5 text-amber-600" />
                         <span className="text-sm font-medium text-amber-800">Missing Documents: Electricity Bill, Cancelled Cheque</span>
                      </div>
                      <div>
                        <input type="file" id={`upload-${app.id}`} className="hidden" onChange={() => alert('Documents uploaded successfully.')} />
                        <label htmlFor={`upload-${app.id}`} className="cursor-pointer px-3 py-1.5 bg-amber-600 text-white text-xs font-bold rounded-md hover:bg-amber-700">Upload Now</label>
                      </div>
                   </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'schemes' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Building className="w-6 h-6 text-blue-600" /> Central Schemes
            </h2>
            {centralSchemes.map((scheme, idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-lg font-bold text-slate-900 mb-2">{scheme.name}</h3>
                <p className="text-sm text-slate-600 mb-4">{scheme.description}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500 font-medium">Eligibility</span>
                    <span className="font-bold text-slate-800">{scheme.eligibility}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500 font-medium">Benefits</span>
                    <span className="font-bold text-emerald-600">{scheme.benefits}</span>
                  </div>
                </div>
                <div className="mt-4 text-right">
                  <a href={scheme.link} target="_blank" rel="noreferrer" className="text-blue-600 text-sm font-bold hover:underline">Official Portal &rarr;</a>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Landmark className="w-6 h-6 text-amber-600" /> State Schemes
            </h2>
            {stateSchemes.map((scheme, idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="inline-block px-2 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-md mb-3">
                  {scheme.state}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{scheme.name}</h3>
                <p className="text-sm text-slate-600 mb-4">{scheme.description}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500 font-medium">Eligibility</span>
                    <span className="font-bold text-slate-800">{scheme.eligibility}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500 font-medium">Benefits</span>
                    <span className="font-bold text-emerald-600">{scheme.benefits}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">{editingAppId ? 'Edit Application' : 'New Subsidy Application'}</h3>
              <button onClick={() => {setIsModalOpen(false); setEditingAppId(null); setNewApp({ customer: '', scheme: 'PM Surya Ghar Muft Bijli Yojana', capacity: '', subsidyAmount: 0 });}} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <form onSubmit={handleSubmitApplication} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Customer Name</label>
                <input required type="text" value={newApp.customer} onChange={e => setNewApp({...newApp, customer: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Scheme</label>
                <select value={newApp.scheme} onChange={e => setNewApp({...newApp, scheme: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none">
                  {centralSchemes.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                  {stateSchemes.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Capacity</label>
                  <input required type="text" placeholder="e.g. 5kW" value={newApp.capacity} onChange={e => setNewApp({...newApp, capacity: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Expected Subsidy (₹)</label>
                  <input required type="number" min="0" value={newApp.subsidyAmount || ''} onChange={e => setNewApp({...newApp, subsidyAmount: Number(e.target.value)})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none" />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => {setIsModalOpen(false); setNewApp({ customer: '', scheme: 'PM Surya Ghar Muft Bijli Yojana', capacity: '', subsidyAmount: 0 }); setEditingAppId(null);}} className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors">Create Application</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
