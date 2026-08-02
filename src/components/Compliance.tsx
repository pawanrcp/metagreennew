import React, { useState, useEffect } from 'react';
import { 
  ClipboardCheck, 
  FileCheck, 
  Building, 
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Plus,
  Upload,
  Download,
  Filter,
  Edit2,
  Trash2
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { collection, query, onSnapshot, orderBy, addDoc, serverTimestamp, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { format } from 'date-fns';
import jsPDF from 'jspdf';

type ApprovalType = 'Electrical Safety Inspection' | 'Government Approval' | 'Net Meter Approval' | 'Inspection Certificate';
type ApprovalStatus = 'Pending' | 'In Progress' | 'Approved' | 'Rejected';

interface ComplianceRecord {
  id: string;
  projectId: string;
  customerName: string;
  type: ApprovalType;
  status: ApprovalStatus;
  applicationDate: string;
  approvalDate?: string;
  documentUrl?: string;
  remarks?: string;
}

export default function Compliance() {
  const [records, setRecords] = useState<ComplianceRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<ApprovalType | 'All'>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [updateModal, setUpdateModal] = useState<{isOpen: boolean, recordId: string | null}>({isOpen: false, recordId: null});

  const [newRecord, setNewRecord] = useState({
    projectId: '',
    customerName: '',
    type: 'Electrical Safety Inspection' as ApprovalType,
    applicationDate: format(new Date(), 'yyyy-MM-dd'),
    remarks: ''
  });

  const [updateData, setUpdateData] = useState({
    status: 'Approved' as ApprovalStatus,
    approvalDate: format(new Date(), 'yyyy-MM-dd'),
    remarks: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'complianceRecords'), orderBy('applicationDate', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setRecords(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ComplianceRecord)));
      } else {
        setRecords([
          {
            id: 'C1',
            projectId: 'PRJ-401',
            customerName: 'Pradeep Suvvada',
            type: 'Net Meter Approval',
            status: 'Approved',
            applicationDate: '2024-03-10',
            approvalDate: '2024-03-25',
            remarks: 'Approved by DISCOM'
          },
          {
            id: 'C2',
            projectId: 'PRJ-302',
            customerName: 'Anita Sharma',
            type: 'Electrical Safety Inspection',
            status: 'Pending',
            applicationDate: '2024-04-01',
            remarks: 'Awaiting inspector visit'
          },
          {
            id: 'C3',
            projectId: 'PRJ-205',
            customerName: 'Kiran Reddy',
            type: 'Government Approval',
            status: 'In Progress',
            applicationDate: '2024-03-20',
            remarks: 'Submitted to state nodal agency'
          }
        ]);
      }
    });
    return () => unsub();
  }, []);

  const handleSubmitRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRecordId) {
        await updateDoc(doc(db, 'complianceRecords', editingRecordId), newRecord);
      } else {
        await addDoc(collection(db, 'complianceRecords'), {
          ...newRecord,
          status: 'Pending',
          createdAt: serverTimestamp()
        });
      }
      setIsModalOpen(false);
      setEditingRecordId(null);
      setNewRecord({
        projectId: '',
        customerName: '',
        type: 'Electrical Safety Inspection',
        applicationDate: format(new Date(), 'yyyy-MM-dd'),
        remarks: ''
      });
    } catch (err) {
      console.error('Error saving compliance record:', err);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this compliance record?")) {
      try {
        await deleteDoc(doc(db, 'complianceRecords', id));
      } catch (err) {
        console.error('Error deleting compliance record:', err);
      }
    }
  };

  const handleDownloadCertificate = (record: ComplianceRecord) => {
    const pdf = new jsPDF();
    pdf.setFontSize(24);
    pdf.text('Approval Certificate', 105, 30, { align: 'center' });
    pdf.setFontSize(14);
    pdf.text(`Project ID: ${record.projectId}`, 20, 60);
    pdf.text(`Customer Name: ${record.customerName}`, 20, 75);
    pdf.text(`Approval Type: ${record.type}`, 20, 90);
    pdf.text(`Status: ${record.status}`, 20, 105);
    pdf.text(`Date: ${record.approvalDate || new Date().toISOString().split('T')[0]}`, 20, 120);
    pdf.text('This is an official system-generated certificate.', 20, 160);
    pdf.save(`Certificate_${record.projectId}_${record.type.replace(/\s+/g, '_')}.pdf`);
  };

  const handleUpdateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (updateModal.recordId) {
      if (updateModal.recordId.startsWith('C')) {
        // Dummy update
        setRecords(records.map(r => r.id === updateModal.recordId ? { ...r, ...updateData } : r));
      } else {
        try {
          await updateDoc(doc(db, 'complianceRecords', updateModal.recordId), {
            ...updateData,
            updatedAt: serverTimestamp()
          });
        } catch (err) {
          console.error(err);
        }
      }
      setUpdateModal({ isOpen: false, recordId: null });
      setUpdateData({ status: 'Approved', approvalDate: '', approvedBy: '', notes: '' });
    }
  };

  const filteredRecords = records.filter(r => {
    const matchesSearch = r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || r.projectId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'All' || r.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: ApprovalStatus) => {
    switch (status) {
      case 'Approved': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Rejected': return 'bg-red-50 text-red-700 border-red-200';
      case 'In Progress': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  const getStatusIcon = (status: ApprovalStatus) => {
    switch (status) {
      case 'Approved': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'Rejected': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'In Progress': return <Clock className="w-4 h-4 text-blue-500" />;
      default: return <Clock className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <ClipboardCheck className="w-8 h-8 text-emerald-600" /> Compliance & Approvals
          </h1>
          <p className="text-slate-500 font-medium mt-1">Manage government approvals, net metering, and safety inspections</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 text-sm shadow-sm shadow-emerald-200"
        >
          <Plus className="w-4 h-4" /> New Application
        </button>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 text-emerald-600 font-bold text-sm uppercase tracking-widest mb-4">
            <CheckCircle2 className="w-5 h-5" /> Approved
          </div>
          <div className="text-3xl font-black text-slate-900">{records.filter(r => r.status === 'Approved').length}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 text-blue-600 font-bold text-sm uppercase tracking-widest mb-4">
            <Clock className="w-5 h-5" /> In Progress
          </div>
          <div className="text-3xl font-black text-slate-900">{records.filter(r => r.status === 'In Progress').length}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 text-amber-600 font-bold text-sm uppercase tracking-widest mb-4">
            <Clock className="w-5 h-5" /> Pending
          </div>
          <div className="text-3xl font-black text-slate-900">{records.filter(r => r.status === 'Pending').length}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 text-slate-600 font-bold text-sm uppercase tracking-widest mb-4">
            <FileCheck className="w-5 h-5" /> Total Apps
          </div>
          <div className="text-3xl font-black text-slate-900">{records.length}</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="relative w-96 flex items-center">
            <Search className="w-5 h-5 absolute left-3 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by project or customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="All">All Types</option>
              <option value="Electrical Safety Inspection">Electrical Safety Inspection</option>
              <option value="Government Approval">Government Approval</option>
              <option value="Net Meter Approval">Net Meter Approval</option>
              <option value="Inspection Certificate">Inspection Certificate</option>
            </select>
          </div>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white text-slate-500 text-xs font-bold uppercase tracking-widest border-b border-slate-100">
              <th className="p-4">Project & Application</th>
              <th className="p-4">Approval Type</th>
              <th className="p-4">Dates</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRecords.map(record => (
              <tr key={record.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="p-4">
                  <div className="font-bold text-slate-900">{record.customerName}</div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mt-1 flex items-center gap-1">
                    <Building className="w-3 h-3" /> {record.projectId}
                  </div>
                  {record.remarks && (
                    <div className="text-xs text-slate-500 mt-2 italic">{record.remarks}</div>
                  )}
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2 font-medium text-slate-700">
                    <FileCheck className="w-4 h-4 text-slate-400" />
                    {record.type}
                  </div>
                </td>
                <td className="p-4 text-sm text-slate-600">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Applied</div>
                    <div>{format(new Date(record.applicationDate), 'dd MMM yyyy')}</div>
                    {record.approvalDate && (
                      <>
                        <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Approved</div>
                        <div className="font-medium text-slate-900">{format(new Date(record.approvalDate), 'dd MMM yyyy')}</div>
                      </>
                    )}
                  </div>
                </td>
                <td className="p-4 text-center">
                  <span className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest border",
                    getStatusColor(record.status)
                  )}>
                    {getStatusIcon(record.status)}
                    {record.status}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-center gap-2">
                    {record.status !== 'Approved' && (
                      <button 
                        onClick={() => setUpdateModal({ isOpen: true, recordId: record.id })}
                        className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold transition-colors shadow-sm"
                      >
                        Update
                      </button>
                    )}
                    {record.status === 'Approved' && (
                      <button onClick={() => handleDownloadCertificate(record)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Download Certificate">
                        <Download className="w-4 h-4" />
                      </button>
                    )}
                    <button 
                      onClick={() => {
                        setEditingRecordId(record.id);
                        setNewRecord({
                          projectId: record.projectId,
                          customerName: record.customerName,
                          type: record.type,
                          applicationDate: record.applicationDate,
                          remarks: record.remarks || ''
                        });
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 hover:bg-blue-50 text-blue-400 hover:text-blue-600 rounded-lg transition-colors"
                      title="Edit Application"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteRecord(record.id)}
                      className="p-1.5 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-colors"
                      title="Delete Application"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredRecords.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">No compliance records found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Record Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">{editingRecordId ? 'Edit Application' : 'New Application'}</h3>
              <button onClick={() => {setIsModalOpen(false); setEditingRecordId(null); setNewRecord({ projectId: '', customerName: '', type: 'Electrical Safety Inspection', applicationDate: format(new Date(), 'yyyy-MM-dd'), remarks: '' });}} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <form onSubmit={handleSubmitRecord} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Project ID</label>
                  <input required type="text" placeholder="PRJ-101" value={newRecord.projectId} onChange={e => setNewRecord({...newRecord, projectId: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Customer Name</label>
                  <input required type="text" value={newRecord.customerName} onChange={e => setNewRecord({...newRecord, customerName: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Approval Type</label>
                <select value={newRecord.type} onChange={e => setNewRecord({...newRecord, type: e.target.value as ApprovalType})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none">
                  <option value="Electrical Safety Inspection">Electrical Safety Inspection</option>
                  <option value="Government Approval">Government Approval</option>
                  <option value="Net Meter Approval">Net Meter Approval</option>
                  <option value="Inspection Certificate">Inspection Certificate</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Application Date</label>
                <input required type="date" value={newRecord.applicationDate} onChange={e => setNewRecord({...newRecord, applicationDate: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Remarks (Optional)</label>
                <textarea rows={2} value={newRecord.remarks} onChange={e => setNewRecord({...newRecord, remarks: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none"></textarea>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => {setIsModalOpen(false); setNewRecord({projectId: '', customerName: '', type: 'Electrical Safety Inspection', applicationDate: format(new Date(), 'yyyy-MM-dd'), remarks: ''}); setEditingRecordId(null);}} className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors">Add Application</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {updateModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Update Status</h3>
            </div>
            <form onSubmit={handleUpdateRecord} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">New Status</label>
                <select value={updateData.status} onChange={e => setUpdateData({...updateData, status: e.target.value as ApprovalStatus})} className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none">
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              {updateData.status === 'Approved' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Approval Date</label>
                  <input type="date" required value={updateData.approvalDate} onChange={e => setUpdateData({...updateData, approvalDate: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none" />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Remarks (Optional)</label>
                <textarea rows={2} value={updateData.remarks} onChange={e => setUpdateData({...updateData, remarks: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none"></textarea>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setUpdateModal({ isOpen: false, recordId: null })} className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg">Update</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
