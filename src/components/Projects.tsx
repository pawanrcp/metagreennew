import React, { useState, useEffect } from 'react';
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
import { db } from '@/src/lib/firebase';
import { Project, ProjectStatus } from '@/src/types';
import { Search, Calendar, CheckCircle2, Clock, MapPin, Plus, Sun, Edit2, Trash2 } from 'lucide-react';
import { formatCurrency, cn } from '@/src/lib/utils';
import { format } from 'date-fns';
import ProjectDetails from './ProjectDetails';

export default function Projects({ initialFilter }: { initialFilter?: string }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState(initialFilter || '');
  const [showTrash, setShowTrash] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const filteredProjects = projects.filter(project => 
    (showTrash ? project.isDeleted : !project.isDeleted) &&
    (project.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    project.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.status.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  const [newProject, setNewProject] = useState({ 
    customerName: '', 
    capacityKw: 0, 
    totalCost: 0, 
    amountPaid: 0,
    status: 'Planning' as ProjectStatus 
  });

  useEffect(() => {
    const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project)));
    });
    return () => unsubscribe();
  }, []);

  const handleSubmitProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProjectId) {
        await updateDoc(doc(db, 'projects', editingProjectId), {
          ...newProject
        });
      } else {
        await addDoc(collection(db, 'projects'), {
          ...newProject,
          createdAt: serverTimestamp(),
          leadId: 'manual'
        });
      }
      setIsModalOpen(false);
      setEditingProjectId(null);
      setNewProject({ customerName: '', capacityKw: 0, totalCost: 0, amountPaid: 0, status: 'Planning' });
    } catch (err) {
      console.error('Error saving project:', err);
    }
  };

  const handleDeleteProject = async (id: string, e: React.MouseEvent, permanently: boolean = false) => {
    e.stopPropagation();
    if (permanently) {
      if (window.confirm("Are you sure you want to permanently delete this project?")) {
        try {
          await deleteDoc(doc(db, 'projects', id));
        } catch (err) {
          console.error('Error deleting project:', err);
        }
      }
    } else {
      if (window.confirm("Are you sure you want to move this project to trash?")) {
        try {
          await updateDoc(doc(db, 'projects', id), { isDeleted: true });
        } catch (err) {
          console.error('Error moving project to trash:', err);
        }
      }
    }
  };

  if (selectedProject) {
    return <ProjectDetails project={selectedProject} onBack={() => setSelectedProject(null)} />;
  }

  const statusIcons = {
    'Planning': Clock,
    'In Progress': Clock,
    'Installation': Sun,
    'Testing': CheckCircle2,
    'Completed': CheckCircle2,
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Active Installations</h1>
          <p className="text-slate-500 mt-1 font-medium">Monitor real-time progress of solar deployments.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Project
          </button>
        </div>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by customer, site or ID..." 
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 text-sm font-medium transition-all"
            />
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowTrash(!showTrash)}
              className={cn(
                "px-4 py-2.5 border rounded-xl text-sm font-bold flex items-center gap-2 transition-all",
                showTrash 
                  ? "bg-red-50 text-red-600 border-red-200" 
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              )}
            >
              <Trash2 className="w-4 h-4" />
              {showTrash ? 'View Active' : 'Trash'}
            </button>
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              4 Active
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 p-8">
          {filteredProjects.map((project) => (
            <div key={project.id} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full -mr-12 -mt-12 opacity-50 group-hover:scale-110 transition-transform"></div>
              
              <div className="relative flex justify-between items-start mb-6">
                <span className={cn(
                  "px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-[0.1em] border shadow-sm",
                  project.status === 'Completed' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-blue-50 text-blue-700 border-blue-100"
                )}>
                  {project.status}
                </span>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold uppercase">
                    <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                    {project.installDate ? format(project.installDate.toDate(), 'MMM dd') : 'TBD'}
                  </div>
                  <div className="flex items-center gap-1">
                    {!showTrash && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingProjectId(project.id);
                          setNewProject(project);
                          setIsModalOpen(true);
                        }}
                        className="p-1 hover:bg-blue-50 text-blue-400 hover:text-blue-600 rounded transition-colors"
                        title="Edit Project"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {showTrash && (
                      <button 
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (window.confirm("Restore this project?")) {
                            await updateDoc(doc(db, 'projects', project.id), { isDeleted: false });
                          }
                        }}
                        className="p-1 hover:bg-emerald-50 text-emerald-400 hover:text-emerald-600 rounded transition-colors"
                        title="Restore Project"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button 
                      onClick={(e) => handleDeleteProject(project.id, e, showTrash)}
                      className="p-1 hover:bg-red-50 text-red-400 hover:text-red-600 rounded transition-colors"
                      title={showTrash ? "Permanently Delete Project" : "Move to Trash"}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="relative mb-6">
                <h3 className="text-xl font-black text-slate-900 mb-1 group-hover:text-emerald-700 transition-colors">{project.customerName}</h3>
                <div className="flex items-center gap-1 text-[11px] text-slate-500 font-bold uppercase tracking-tight">
                  <MapPin className="w-3 h-3 text-emerald-400" />
                  Site Site #PRJ-{project.id.slice(0,4).toUpperCase()}
                </div>
              </div>
              
              <div className="space-y-4 mb-8 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-bold uppercase tracking-wider">System Size</span>
                  <span className="font-black text-slate-900">{project.capacityKw} kWp</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-bold uppercase tracking-wider">Investment</span>
                  <span className="font-black text-slate-900">{formatCurrency(project.totalCost)}</span>
                </div>
                
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] uppercase font-black tracking-widest text-emerald-600">
                    <span>Payment Status</span>
                    <span>{Math.round((project.amountPaid / project.totalCost) * 100)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${(project.amountPaid / project.totalCost) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setSelectedProject(project)}
                  className="flex-1 px-4 py-3 bg-emerald-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                >
                  Site Insights
                </button>
                <button className="px-4 py-3 border border-slate-200 text-slate-600 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-100 transition-all">
                  Files
                </button>
              </div>
            </div>
          ))}
          {filteredProjects.length === 0 && (
            <div className="col-span-full py-24 text-center bg-slate-50 rounded-3xl border-4 border-dashed border-slate-200">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl border border-slate-100">
                <Sun className="text-emerald-400 w-10 h-10 animate-pulse" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Initialize Deployment</h3>
              <p className="text-slate-500 font-medium max-w-xs mx-auto">Convert a qualified lead to start tracking installation milestones.</p>
              <button className="text-emerald-600 font-black text-sm mt-6 hover:underline uppercase tracking-widest bg-emerald-50 px-6 py-3 rounded-full border border-emerald-100">Go to CRM Pipeline &rarr;</button>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">{editingProjectId ? 'Edit Project' : 'Initialize New Project'}</h3>
              <button onClick={() => {setIsModalOpen(false); setEditingProjectId(null); setNewProject({ customerName: '', capacityKw: 0, totalCost: 0, amountPaid: 0, status: 'Planning' });}} className="text-slate-400 hover:text-slate-600 font-bold text-2xl">&times;</button>
            </div>
            <form onSubmit={handleSubmitProject} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Customer Name</label>
                <input 
                  required
                  value={newProject.customerName}
                  onChange={e => setNewProject({...newProject, customerName: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none font-medium" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">System Capacity (kW)</label>
                  <input 
                    type="number"
                    required
                    value={newProject.capacityKw || ''}
                    onChange={e => setNewProject({...newProject, capacityKw: e.target.value === '' ? 0 : parseFloat(e.target.value)})}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none font-medium" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Project Value</label>
                  <input 
                    type="number"
                    required
                    value={newProject.totalCost || ''}
                    onChange={e => setNewProject({...newProject, totalCost: e.target.value === '' ? 0 : parseFloat(e.target.value)})}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none font-medium" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Initial Advance Paid</label>
                  <input 
                    type="number"
                    required
                    value={newProject.amountPaid || ''}
                    onChange={e => setNewProject({...newProject, amountPaid: e.target.value === '' ? 0 : parseFloat(e.target.value)})}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none font-medium" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Initial Status</label>
                  <select 
                    value={newProject.status}
                    onChange={e => setNewProject({...newProject, status: e.target.value as ProjectStatus})}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none font-medium"
                  >
                    <option value="Planning">Planning</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Installation">Installation</option>
                  </select>
                </div>
              </div>
              <div className="pt-6 flex gap-3">
                <button 
                  type="button"
                  onClick={() => {setIsModalOpen(false); setEditingProjectId(null); setNewProject({ customerName: '', capacityKw: 0, totalCost: 0, amountPaid: 0, status: 'Planning' });}}
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-slate-600 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-colors"
                >
                  Discard
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                >
                  Launch Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
