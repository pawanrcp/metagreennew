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
  deleteDoc
} from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { Lead, LeadStatus } from '@/src/types';
import { Plus, Search, Filter, MoreVertical, Mail, Phone, MapPin, Users, FileText, Edit2, Trash2 } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export default function CRM({ initialFilter }: { initialFilter?: string }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState(initialFilter || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);

  const [showTrash, setShowTrash] = useState(false);

  const filteredLeads = leads.filter(lead => 
    (showTrash ? lead.isDeleted : !lead.isDeleted) &&
    (lead.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     lead.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
     lead.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
     lead.status.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  const [newLead, setNewLead] = useState<Partial<Lead>>({ name: '', email: '', phone: '', source: 'Website', address: '', city: '', district: '', state: '', pincode: '', gpsLocation: '', roofType: '', monthlyUnits: '', expectedLoad: '', electricityBillUrl: '', propertyImagesUrls: [], roofImagesUrls: [] });
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);
  const [selectedLeadForQuotation, setSelectedLeadForQuotation] = useState<Lead | null>(null);
  const [quotationDetails, setQuotationDetails] = useState({
    systemSize: '',
    panelType: 'Monocrystalline',
    inverterType: 'String Inverter',
    totalCost: '',
    estimatedGeneration: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'leads'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLeads(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead)));
    });
    return () => unsubscribe();
  }, []);

  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingLeadId) {
        await updateDoc(doc(db, 'leads', editingLeadId), newLead);
      } else {
        await addDoc(collection(db, 'leads'), {
          ...newLead,
          status: 'New Lead',
          createdAt: serverTimestamp()
        });
      }
      setIsModalOpen(false);
      setEditingLeadId(null);
      setNewLead({ name: '', email: '', phone: '', source: 'Website', address: '', city: '', district: '', state: '', pincode: '', gpsLocation: '', roofType: '', monthlyUnits: '', expectedLoad: '', electricityBillUrl: '', propertyImagesUrls: [], roofImagesUrls: [] });
    } catch (err) {
      console.error('Error saving lead:', err);
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

  const updateLeadStatus = async (id: string, status: LeadStatus, lead?: Lead) => {
    try {
      await updateDoc(doc(db, 'leads', id), { status });
      
      // Auto-create project if approved
      if (status === 'Approved' && lead) {
        await addDoc(collection(db, 'projects'), {
          leadId: lead.id,
          name: `${lead.name} Solar Installation`,
          customerName: lead.name,
          phone: lead.phone,
          address: lead.address,
          status: 'Initiated',
          priority: 'Medium',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        alert(`Lead approved. Project created automatically for ${lead.name}.`);
      }
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

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Sales Pipeline</h1>
          <p className="text-slate-500 mt-1 font-medium">Capture and convert leads into active installations.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-200"
        >
          <Plus className="w-5 h-5" />
          Capture Lead
        </button>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search leads by name, email or ID..." 
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-sm font-medium"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button 
              onClick={() => setShowTrash(!showTrash)}
              className={cn(
                "flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 border rounded-xl font-bold text-sm transition-colors shadow-sm",
                showTrash 
                  ? "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              <Trash2 className="w-4 h-4" />
              {showTrash ? 'Hide Trash' : 'View Trash'}
            </button>
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors shadow-sm">
              <Filter className="w-4 h-4" />
              Pipeline Filter
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-[0.15em]">
                <th className="px-6 py-4">Lead Information</th>
                <th className="px-6 py-4">Engagement</th>
                <th className="px-6 py-4">Source</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-emerald-50/30 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">{lead.name}</span>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1 font-medium uppercase tracking-tight">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {lead.address}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                        <Mail className="w-3.5 h-3.5 text-emerald-500" />
                        {lead.email}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                        <Phone className="w-3.5 h-3.5 text-emerald-500" />
                        {lead.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 uppercase tracking-widest">
                      {lead.source}
                    </span>
                  </td>
                  <td className="px-6 py-5">
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
                  <td className="px-6 py-5 text-right space-x-2">
                    <button 
                      onClick={() => {
                        setSelectedLeadForQuotation(lead);
                        setIsQuotationModalOpen(true);
                      }}
                      className="p-2 hover:bg-emerald-50 hover:shadow-sm rounded-lg text-emerald-600 transition-all border border-transparent hover:border-emerald-100 group"
                      title="Generate Quotation"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => {
                        setEditingLeadId(lead.id);
                        setNewLead(lead);
                        setIsModalOpen(true);
                      }}
                      className="p-2 hover:bg-blue-50 hover:shadow-sm rounded-lg text-blue-600 transition-all border border-transparent hover:border-blue-100"
                      title="Edit Lead"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {showTrash ? (
                      <>
                        <button 
                          onClick={async () => {
                            if (window.confirm("Restore this lead?")) {
                              await updateDoc(doc(db, 'leads', lead.id), { isDeleted: false });
                            }
                          }}
                          className="p-2 hover:bg-emerald-50 hover:shadow-sm rounded-lg text-emerald-600 transition-all border border-transparent hover:border-emerald-100"
                          title="Restore Lead"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path></svg>
                        </button>
                        <button 
                          onClick={() => handleDeleteLead(lead.id, true)}
                          className="p-2 hover:bg-red-50 hover:shadow-sm rounded-lg text-red-600 transition-all border border-transparent hover:border-red-100"
                          title="Delete Permanently"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={() => handleDeleteLead(lead.id)}
                        className="p-2 hover:bg-red-50 hover:shadow-sm rounded-lg text-red-600 transition-all border border-transparent hover:border-red-100"
                        title="Move to Trash"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-slate-300" />
                      </div>
                      <p className="text-slate-500 font-medium text-sm">No leads in the pipeline.</p>
                      <button onClick={() => setIsModalOpen(true)} className="text-emerald-600 font-bold text-xs hover:underline">Add first lead &rarr;</button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">{editingLeadId ? 'Edit Prospect' : 'Add New Prospect'}</h3>
              <button onClick={() => {setIsModalOpen(false); setEditingLeadId(null); setNewLead({ name: '', email: '', phone: '', source: 'Website', address: '', city: '', district: '', state: '', pincode: '', gpsLocation: '', roofType: '', monthlyUnits: '', expectedLoad: '', electricityBillUrl: '', propertyImagesUrls: [], roofImagesUrls: [] });}} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <form onSubmit={handleSubmitLead} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-100 pb-1">Customer Information</h4>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                  <input 
                    required
                    value={newLead.name}
                    onChange={e => setNewLead({...newLead, name: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" 
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Source</label>
                  <select 
                    value={newLead.source}
                    onChange={e => setNewLead({...newLead, source: e.target.value as any})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-white" 
                  >
                    <option value="Website">Website Leads</option>
                    <option value="Facebook">Facebook Leads</option>
                    <option value="Google Ads">Google Ads Leads</option>
                    <option value="Referral">Referral Leads</option>
                    <option value="Walk-in">Walk-in Leads</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input 
                    type="email"
                    required
                    value={newLead.email}
                    onChange={e => setNewLead({...newLead, email: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                  <input 
                    required
                    value={newLead.phone}
                    onChange={e => setNewLead({...newLead, phone: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" 
                  />
                </div>
                <div className="col-span-2">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mt-2 mb-2 border-b border-slate-100 pb-1">Location Details</h4>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                  <input 
                    required
                    value={newLead.address}
                    onChange={e => setNewLead({...newLead, address: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" 
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                  <input 
                    value={newLead.city || ''}
                    onChange={e => setNewLead({...newLead, city: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" 
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">District</label>
                  <input 
                    value={newLead.district || ''}
                    onChange={e => setNewLead({...newLead, district: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" 
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                  <input 
                    value={newLead.state || ''}
                    onChange={e => setNewLead({...newLead, state: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" 
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Pincode</label>
                  <input 
                    value={newLead.pincode || ''}
                    onChange={e => setNewLead({...newLead, pincode: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" 
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">GPS Location (Lat, Long)</label>
                  <div className="flex gap-2">
                    <input 
                      value={newLead.gpsLocation}
                      onChange={e => setNewLead({...newLead, gpsLocation: e.target.value})}
                      placeholder="e.g. 34.0522, -118.2437"
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" 
                    />
                    <button 
                      type="button"
                      onClick={() => {
                        if (navigator.geolocation) {
                          navigator.geolocation.getCurrentPosition(
                            (position) => {
                              setNewLead({...newLead, gpsLocation: `${position.coords.latitude}, ${position.coords.longitude}`});
                            },
                            (error) => {
                              alert("Unable to retrieve location. Please enter manually.");
                            }
                          );
                        } else {
                          alert("Geolocation is not supported by your browser.");
                        }
                      }}
                      className="whitespace-nowrap px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 transition-colors"
                    >
                      <MapPin className="w-4 h-4 inline-block mr-1" />
                      Drop Pin
                    </button>
                  </div>
                </div>
                <div className="col-span-2">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mt-2 mb-2 border-b border-slate-100 pb-1">Energy Requirements</h4>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Roof Type</label>
                  <select 
                    value={newLead.roofType}
                    onChange={e => setNewLead({...newLead, roofType: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none appearance-none" 
                  >
                    <option value="">Select Roof Type...</option>
                    <option value="RCC">RCC (Flat)</option>
                    <option value="Tin Shed">Tin Shed</option>
                    <option value="Tiled">Tiled</option>
                    <option value="Asbestos">Asbestos</option>
                  </select>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Expected Load (kW)</label>
                  <input 
                    type="number"
                    value={newLead.expectedLoad}
                    onChange={e => setNewLead({...newLead, expectedLoad: e.target.value})}
                    placeholder="e.g. 5"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" 
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Monthly Electricity Units</label>
                  <input 
                    type="number"
                    value={newLead.monthlyUnits}
                    onChange={e => setNewLead({...newLead, monthlyUnits: e.target.value})}
                    placeholder="e.g. 600"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" 
                  />
                </div>
                <div className="col-span-2">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mt-2 mb-2 border-b border-slate-100 pb-1">Documents & Media</h4>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Electricity Bill Upload</label>
                  <input 
                    type="file"
                    onChange={e => setNewLead({...newLead, electricityBillUrl: e.target.files?.[0]?.name || ''})}
                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" 
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Property Images</label>
                  <input 
                    type="file"
                    multiple
                    onChange={e => {
                      const files = Array.from(e.target.files || []) as File[];
                      setNewLead({...newLead, propertyImagesUrls: files.map(f => f.name)});
                    }}
                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" 
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Roof Images</label>
                  <input 
                    type="file"
                    multiple
                    onChange={e => {
                      const files = Array.from(e.target.files || []) as File[];
                      setNewLead({...newLead, roofImagesUrls: files.map(f => f.name)});
                    }}
                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" 
                  />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                >
                  Create Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {isQuotationModalOpen && selectedLeadForQuotation && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Generate Quotation</h3>
              <button onClick={() => setIsQuotationModalOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                await addDoc(collection(db, 'quotations'), {
                  leadId: selectedLeadForQuotation.id,
                  leadName: selectedLeadForQuotation.name,
                  systemSize: quotationDetails.systemSize,
                  panelType: quotationDetails.panelType,
                  inverterType: quotationDetails.inverterType,
                  totalCost: quotationDetails.totalCost,
                  estimatedGeneration: quotationDetails.estimatedGeneration,
                  createdAt: serverTimestamp()
                });
                updateLeadStatus(selectedLeadForQuotation.id, 'Proposal', selectedLeadForQuotation);
                alert(`Quotation for ${selectedLeadForQuotation.name} generated and saved successfully!`);
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
                alert('Failed to save quotation');
              }
            }} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="mb-4">
                <p className="text-sm text-slate-500 font-medium">Creating quotation for:</p>
                <p className="text-lg font-bold text-slate-900">{selectedLeadForQuotation.name}</p>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-slate-700">System Size (kW)</label>
                    <div className="flex gap-2">
                      {[3, 5, 10].map(size => (
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
                          className="px-2 py-0.5 text-xs font-bold bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 rounded border border-slate-200 transition-colors"
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
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Panel Type</label>
                  <select 
                    value={quotationDetails.panelType}
                    onChange={e => setQuotationDetails({...quotationDetails, panelType: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-white" 
                  >
                    <option>Monocrystalline</option>
                    <option>Polycrystalline</option>
                    <option>Thin Film</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Inverter Type</label>
                  <select 
                    value={quotationDetails.inverterType}
                    onChange={e => setQuotationDetails({...quotationDetails, inverterType: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-white" 
                  >
                    <option>String Inverter</option>
                    <option>Microinverter</option>
                    <option>Hybrid Inverter</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Total Cost (₹)</label>
                  <input 
                    required
                    type="number" 
                    value={quotationDetails.totalCost}
                    onChange={e => setQuotationDetails({...quotationDetails, totalCost: e.target.value})}
                    placeholder="e.g. 450000"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Estimated Monthly Generation (Units)</label>
                  <input 
                    required
                    type="number" 
                    value={quotationDetails.estimatedGeneration}
                    onChange={e => setQuotationDetails({...quotationDetails, estimatedGeneration: e.target.value})}
                    placeholder="e.g. 600"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" 
                  />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsQuotationModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" /> Generate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
