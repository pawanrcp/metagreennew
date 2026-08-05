import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Calendar, CheckCircle2, Clock, MapPin, 
  AlertCircle, Users, Milestone, GitCommit, Search, Plus, ListTodo,
  AlertTriangle, Sun, Edit2, Trash2
} from 'lucide-react';
import { Project } from '@/src/types';
import { cn, formatCurrency } from '@/src/lib/utils';
import { format } from 'date-fns';
import { collection, query, where, onSnapshot, orderBy, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';

interface ProjectDetailsProps {
  project: Project;
  onBack: () => void;
}

export default function ProjectDetails({ project, onBack }: ProjectDetailsProps) {
  const [activeTab, setActiveTab] = useState<'timeline' | 'tasks' | 'resources'>('timeline');
  const [tasks, setTasks] = useState<any[]>([]);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    name: '', start: 0, duration: 1, status: 'Pending', type: 'task', dependency: ''
  });
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'projectTasks'), where('projectId', '==', project.id), orderBy('start', 'asc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setTasks(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [project.id]);

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTaskId) {
        await updateDoc(doc(db, 'projectTasks', editingTaskId), newTask);
      } else {
        await addDoc(collection(db, 'projectTasks'), { ...newTask, projectId: project.id, createdAt: serverTimestamp() });
      }
      setIsTaskModalOpen(false);
      setEditingTaskId(null);
      setNewTask({ name: '', start: 0, duration: 1, status: 'Pending', type: 'task', dependency: '' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (window.confirm("Delete this task?")) {
      await deleteDoc(doc(db, 'projectTasks', id));
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-black text-slate-900">{project.customerName}</h1>
              <span className={cn(
                "px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-[0.1em] border shadow-sm",
                project.status === 'Completed' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-blue-50 text-blue-700 border-blue-100"
              )}>
                {project.status}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
              <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Site PRJ-{project.id.slice(0,4)}</span>
              <span className="flex items-center gap-1.5"><Sun className="w-3.5 h-3.5 text-emerald-500" /> {project.capacityKw} kWp</span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
           <button className="px-4 py-2 border border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2">
             <AlertTriangle className="w-4 h-4" /> Report Delay
           </button>
           <button className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200">
             Save Progress
           </button>
        </div>
      </header>

      <div className="flex overflow-x-auto pb-2 gap-2 no-scrollbar">
        {[
          { id: 'timeline', label: 'Gantt Timeline', icon: Calendar },
          { id: 'tasks', label: 'Tasks & Dependencies', icon: ListTodo },
          { id: 'resources', label: 'Resource Allocation', icon: Users },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap",
              activeTab === tab.id 
                ? "bg-slate-900 text-white shadow-md" 
                : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-200"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'timeline' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-black text-slate-900">Project Gantt Chart</h3>
                <p className="text-sm text-slate-500 font-medium mt-1">Visualize critical path and task overlaps.</p>
              </div>
              <div className="flex gap-4 text-xs font-bold uppercase tracking-widest text-slate-500">
                <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-emerald-500 rounded-sm"></div> Completed</span>
                <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-blue-500 rounded-sm"></div> In Progress</span>
                <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-amber-500 rounded-sm"></div> Delayed</span>
                <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-slate-200 rounded-sm"></div> Pending</span>
              </div>
            </div>

            <div className="relative mt-8">
              {/* Timeline Header (Days) */}
              <div className="flex ml-48 border-b border-slate-100 pb-2 mb-4">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} className="flex-1 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest border-l border-slate-100">
                    Day {i + 1}
                  </div>
                ))}
              </div>

              {/* Tasks */}
              <div className="space-y-4">
                {tasks.map(task => (
                  <div key={task.id} className="flex items-center group">
                    <div className="w-48 shrink-0 pr-4">
                      <div className="text-xs font-bold text-slate-700 truncate" title={task.name}>
                        {task.type === 'milestone' ? (
                          <span className="flex items-center gap-1.5 text-indigo-600"><Milestone className="w-3 h-3" /> {task.name}</span>
                        ) : task.name}
                      </div>
                      {task.dependency && (
                        <div className="text-[10px] text-slate-400 font-medium mt-0.5 flex items-center gap-1">
                          <GitCommit className="w-3 h-3" /> Depends on {task.dependency}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 flex relative h-8 bg-slate-50 rounded-lg overflow-hidden border border-slate-100">
                      {/* Grid lines */}
                      <div className="absolute inset-0 flex">
                        {Array.from({ length: 20 }).map((_, i) => (
                          <div key={i} className="flex-1 border-l border-slate-100/50"></div>
                        ))}
                      </div>
                      
                      {/* Task Bar */}
                      {task.type === 'task' ? (
                        <div 
                          className={cn(
                            "absolute top-1.5 bottom-1.5 rounded-md shadow-sm transition-all group-hover:scale-[1.02] z-10 flex items-center justify-center text-[10px] font-black text-white px-2 overflow-hidden",
                            task.status === 'Completed' ? "bg-emerald-500" :
                            task.status === 'In Progress' ? "bg-blue-500" :
                            task.delay ? "bg-amber-500" : "bg-slate-300 text-slate-600"
                          )}
                          style={{
                            left: `${(task.start / 20) * 100}%`,
                            width: `${(task.duration / 20) * 100}%`
                          }}
                        >
                          {task.delay && <AlertTriangle className="w-3 h-3 mr-1" />}
                        </div>
                      ) : (
                        <div 
                          className="absolute top-1/2 -translate-y-1/2 z-10"
                          style={{ left: `${(task.start / 20) * 100}%` }}
                        >
                          <div className="w-3 h-3 bg-indigo-600 rotate-45 transform origin-center border-2 border-white shadow-sm"></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tasks' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-slate-900">Task Breakdown</h3>
            <button 
              onClick={() => {
                setEditingTaskId(null);
                setNewTask({ name: '', start: 0, duration: 1, status: 'Pending', type: 'task', dependency: '' });
                setIsTaskModalOpen(true);
              }}
              className="text-emerald-600 text-xs font-black uppercase tracking-widest flex items-center gap-1.5 hover:underline"
            >
              <Plus className="w-4 h-4" /> Add Task
            </button>
          </div>
          <div className="space-y-3">
            {tasks.filter(t => t.type === 'task').map(task => (
              <div key={task.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-emerald-200 transition-colors group bg-slate-50/50">
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    {task.status === 'Completed' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Clock className="w-5 h-5 text-slate-400" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{task.name}</h4>
                    <div className="flex items-center gap-4 text-xs font-medium text-slate-500 mt-1">
                      <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Day {task.start + 1} - Day {task.start + task.duration}</span>
                      {task.dependency && <span className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100"><GitCommit className="w-3 h-3" /> {task.dependency}</span>}
                      {task.delay && <span className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100"><AlertTriangle className="w-3 h-3" /> Delayed</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                   <button onClick={() => {
                     setEditingTaskId(task.id);
                     setNewTask({ name: task.name, start: task.start, duration: task.duration, status: task.status, type: task.type, dependency: task.dependency || '' });
                     setIsTaskModalOpen(true);
                   }} className="text-slate-400 hover:text-emerald-600">
                     <Edit2 className="w-4 h-4" />
                   </button>
                   <button onClick={() => handleDeleteTask(task.id)} className="text-slate-400 hover:text-red-500">
                     <Trash2 className="w-4 h-4" />
                   </button>
                   <select 
                     className="text-xs font-bold uppercase tracking-widest bg-white border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:border-emerald-500"
                     value={task.status}
                     onChange={async (e) => {
                       await updateDoc(doc(db, 'projectTasks', task.id), { status: e.target.value });
                     }}
                   >
                     <option>Pending</option>
                     <option>In Progress</option>
                     <option>Completed</option>
                   </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'resources' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-slate-900">Resource Allocation</h3>
            <button className="text-emerald-600 text-xs font-black uppercase tracking-widest flex items-center gap-1.5 hover:underline">
              <Plus className="w-4 h-4" /> Assign Resource
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-slate-100 rounded-xl flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-black text-lg">
                RK
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Rajesh Kumar</h4>
                <p className="text-xs text-slate-500 font-medium">Lead Installer</p>
                <div className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mt-1">On Site</div>
              </div>
            </div>
            <div className="p-4 border border-slate-100 rounded-xl flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center font-black text-lg">
                SP
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Suresh Patel</h4>
                <p className="text-xs text-slate-500 font-medium">Electrician</p>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Scheduled for Day 9</div>
              </div>
            </div>
            <div className="p-4 border border-slate-100 rounded-xl flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-100 text-slate-700 rounded-full flex items-center justify-center font-black text-lg">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Labor Team Alpha</h4>
                <p className="text-xs text-slate-500 font-medium">General Labor</p>
                <div className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mt-1">On Site</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Task Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                {editingTaskId ? <Edit2 className="w-5 h-5 text-emerald-600" /> : <Plus className="w-5 h-5 text-emerald-600" />} 
                {editingTaskId ? 'Edit Task' : 'Add New Task'}
              </h3>
              <button onClick={() => setIsTaskModalOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <form onSubmit={handleSaveTask} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Task Name</label>
                <input required type="text" value={newTask.name} onChange={e => setNewTask({...newTask, name: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Start Day</label>
                  <input required type="number" min="0" value={newTask.start} onChange={e => setNewTask({...newTask, start: parseInt(e.target.value)})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Duration (Days)</label>
                  <input required type="number" min="1" value={newTask.duration} onChange={e => setNewTask({...newTask, duration: parseInt(e.target.value)})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Type</label>
                  <select value={newTask.type} onChange={e => setNewTask({...newTask, type: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none">
                    <option value="task">Task</option>
                    <option value="milestone">Milestone</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Status</label>
                  <select value={newTask.status} onChange={e => setNewTask({...newTask, status: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none">
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Dependency (Optional)</label>
                <input type="text" value={newTask.dependency} onChange={e => setNewTask({...newTask, dependency: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none" placeholder="e.g. T1" />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsTaskModalOpen(false)} className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700">Save Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
