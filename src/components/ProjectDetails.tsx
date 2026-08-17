import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Calendar, CheckCircle2, Clock, MapPin, 
  AlertCircle, Users, Milestone, GitCommit, Search, Plus, ListTodo,
  AlertTriangle, Sun, Edit2, Trash2, UserCheck, Filter, ShieldCheck, Wrench
} from 'lucide-react';
import { Project, ProjectTask } from '@/src/types';
import { cn, formatCurrency } from '@/src/lib/utils';
import { format } from 'date-fns';
import { collection, query, where, onSnapshot, orderBy, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';

interface ProjectDetailsProps {
  project: Project;
  onBack: () => void;
}

interface StaffMember {
  id: string;
  name: string;
  role: string;
  team?: string;
  contact?: string;
}

const DEFAULT_STAFF: StaffMember[] = [
  { id: 'emp-1', name: 'Rajesh Kumar', role: 'Lead Installer', team: 'Installation Team Alpha' },
  { id: 'emp-2', name: 'Suresh Patel', role: 'Electrician', team: 'Electrical Team' },
  { id: 'emp-3', name: 'Anita Sharma', role: 'Survey Engineer', team: 'Site Survey Unit' },
  { id: 'emp-4', name: 'Priya Varma', role: 'Design Engineer', team: 'Engineering Design' },
  { id: 'emp-5', name: 'Vikram Rao', role: 'Procurement Officer', team: 'Supply Chain' },
  { id: 'emp-6', name: 'Ramesh Reddy', role: 'Compliance Officer', team: 'DISCOM & Approvals' },
  { id: 'emp-7', name: 'K. Swathi', role: 'Subsidy Specialist', team: 'Finance & Subsidy' },
  { id: 'emp-8', name: 'Labor Team Alpha', role: 'Installer', team: 'General Field Crew' },
];

const SOLAR_ROLES = [
  'Survey Engineer',
  'Design Engineer',
  'Procurement Officer',
  'Lead Installer',
  'Installer',
  'Electrician',
  'Compliance Officer',
  'Subsidy Specialist',
  'Project Manager',
  'General Staff'
];

export default function ProjectDetails({ project, onBack }: ProjectDetailsProps) {
  const [activeTab, setActiveTab] = useState<'timeline' | 'tasks' | 'resources'>('timeline');
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>(DEFAULT_STAFF);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [showAllStaffInModal, setShowAllStaffInModal] = useState(false);

  const [newTask, setNewTask] = useState<{
    name: string;
    requiredRole: string;
    assigneeId: string;
    assigneeName: string;
    assigneeRole: string;
    start: number;
    duration: number;
    status: 'Pending' | 'In Progress' | 'Completed';
    type: 'task' | 'milestone';
    dependency: string;
  }>({
    name: '',
    requiredRole: 'Lead Installer',
    assigneeId: '',
    assigneeName: '',
    assigneeRole: '',
    start: 0,
    duration: 1,
    status: 'Pending',
    type: 'task',
    dependency: ''
  });

  // Fetch Tasks
  useEffect(() => {
    const q = query(collection(db, 'projectTasks'), where('projectId', '==', project.id), orderBy('start', 'asc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setTasks(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ProjectTask)));
    });
    return () => unsub();
  }, [project.id]);

  // Fetch Staff / Employees
  useEffect(() => {
    const unsubEmp = onSnapshot(collection(db, 'employees'), (snapshot) => {
      if (!snapshot.empty) {
        const fetched = snapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          role: doc.data().role,
          team: doc.data().team,
          contact: doc.data().contact
        }));
        const existingIds = new Set(fetched.map(f => f.id));
        const combined = [...fetched, ...DEFAULT_STAFF.filter(d => !existingIds.has(d.id))];
        setStaffList(combined);
      }
    });

    return () => unsubEmp();
  }, []);

  // Filter staff by selected requirement role
  const filteredStaff = staffList.filter(emp => {
    if (showAllStaffInModal) return true;
    if (!newTask.requiredRole || newTask.requiredRole === 'General Staff') return true;
    const req = newTask.requiredRole.toLowerCase();
    const empRole = emp.role.toLowerCase();
    return empRole.includes(req) || req.includes(empRole);
  });

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...newTask,
        projectId: project.id,
        updatedAt: serverTimestamp()
      };

      if (editingTaskId) {
        await updateDoc(doc(db, 'projectTasks', editingTaskId), payload);
      } else {
        await addDoc(collection(db, 'projectTasks'), {
          ...payload,
          createdAt: serverTimestamp()
        });
      }
      setIsTaskModalOpen(false);
      setEditingTaskId(null);
      setNewTask({
        name: '',
        requiredRole: 'Lead Installer',
        assigneeId: '',
        assigneeName: '',
        assigneeRole: '',
        start: 0,
        duration: 1,
        status: 'Pending',
        type: 'task',
        dependency: ''
      });
    } catch (err) {
      console.error('Error saving task:', err);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      await deleteDoc(doc(db, 'projectTasks', id));
    }
  };

  const handleQuickAssigneeChange = async (taskId: string, assigneeId: string) => {
    const selected = staffList.find(s => s.id === assigneeId);
    if (selected) {
      await updateDoc(doc(db, 'projectTasks', taskId), {
        assigneeId: selected.id,
        assigneeName: selected.name,
        assigneeRole: selected.role
      });
    } else {
      await updateDoc(doc(db, 'projectTasks', taskId), {
        assigneeId: '',
        assigneeName: '',
        assigneeRole: ''
      });
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
             <AlertTriangle className="w-4 h-4 text-amber-500" /> Report Delay
           </button>
           <button 
             onClick={() => {
               setEditingTaskId(null);
               setNewTask({
                 name: '',
                 requiredRole: 'Lead Installer',
                 assigneeId: '',
                 assigneeName: '',
                 assigneeRole: '',
                 start: 0,
                 duration: 1,
                 status: 'Pending',
                 type: 'task',
                 dependency: ''
               });
               setIsTaskModalOpen(true);
             }}
             className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200 flex items-center gap-2"
           >
             <Plus className="w-4 h-4" /> Add Task
           </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex overflow-x-auto pb-2 gap-2 no-scrollbar">
        {[
          { id: 'timeline', label: 'Gantt Timeline', icon: Calendar },
          { id: 'tasks', label: 'Tasks & Assignees', icon: ListTodo },
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

      {/* TAB 1: GANTT TIMELINE */}
      {activeTab === 'timeline' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-black text-slate-900">Project Gantt Chart</h3>
                <p className="text-sm text-slate-500 font-medium mt-1">Visualize critical path, required roles, and assigned employee schedule.</p>
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
              <div className="flex ml-56 border-b border-slate-100 pb-2 mb-4">
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
                    <div className="w-56 shrink-0 pr-4">
                      <div className="text-xs font-bold text-slate-700 truncate" title={task.name}>
                        {task.type === 'milestone' ? (
                          <span className="flex items-center gap-1.5 text-indigo-600 font-black"><Milestone className="w-3 h-3" /> {task.name}</span>
                        ) : task.name}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">
                          {task.requiredRole || 'Requirement'}
                        </span>
                        {task.assigneeName && (
                          <span className="text-[9px] font-medium text-slate-500 truncate flex items-center gap-1">
                            <UserCheck className="w-3 h-3 text-emerald-600" /> {task.assigneeName}
                          </span>
                        )}
                      </div>
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
                            "absolute top-1.5 bottom-1.5 rounded-md shadow-sm transition-all group-hover:scale-[1.02] z-10 flex items-center justify-between text-[10px] font-black text-white px-2 overflow-hidden",
                            task.status === 'Completed' ? "bg-emerald-500" :
                            task.status === 'In Progress' ? "bg-blue-500" :
                            task.delay ? "bg-amber-500" : "bg-slate-400 text-white"
                          )}
                          style={{
                            left: `${(task.start / 20) * 100}%`,
                            width: `${(task.duration / 20) * 100}%`
                          }}
                          title={`${task.name} (${task.assigneeName || 'Unassigned'})`}
                        >
                          <span className="truncate">{task.assigneeName || task.requiredRole}</span>
                          {task.delay && <AlertTriangle className="w-3 h-3 shrink-0 ml-1" />}
                        </div>
                      ) : (
                        <div 
                          className="absolute top-1/2 -translate-y-1/2 z-10"
                          style={{ left: `${(task.start / 20) * 100}%` }}
                        >
                          <div className="w-3.5 h-3.5 bg-indigo-600 rotate-45 transform origin-center border-2 border-white shadow-sm" title={task.name} />
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

      {/* TAB 2: TASKS & ASSIGNEES BREAKDOWN */}
      {activeTab === 'tasks' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-black text-slate-900">Task Breakdown & Role-Based Assignee Selector</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Tasks auto-filter available employees based on required skill set.</p>
            </div>
            <button 
              onClick={() => {
                setEditingTaskId(null);
                setNewTask({
                  name: '',
                  requiredRole: 'Lead Installer',
                  assigneeId: '',
                  assigneeName: '',
                  assigneeRole: '',
                  start: 0,
                  duration: 1,
                  status: 'Pending',
                  type: 'task',
                  dependency: ''
                });
                setIsTaskModalOpen(true);
              }}
              className="text-emerald-600 text-xs font-black uppercase tracking-widest flex items-center gap-1.5 hover:underline bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200/60 w-fit"
            >
              <Plus className="w-4 h-4" /> Add Custom Task
            </button>
          </div>

          <div className="space-y-3">
            {tasks.map(task => {
              const reqRole = task.requiredRole || 'General Staff';
              const matchingEmployees = staffList.filter(e => 
                e.role.toLowerCase().includes(reqRole.toLowerCase()) || 
                reqRole.toLowerCase().includes(e.role.toLowerCase())
              );

              return (
                <div key={task.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-emerald-200 transition-colors group bg-slate-50/50 gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="mt-1 shrink-0">
                      {task.status === 'Completed' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Clock className="w-5 h-5 text-slate-400" />}
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-sm">{task.name}</h4>
                        {task.type === 'milestone' && (
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase rounded border border-indigo-100 flex items-center gap-1">
                            <Milestone className="w-3 h-3" /> Milestone
                          </span>
                        )}
                        <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-[10px] font-bold rounded">
                          Required: {reqRole}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-500">
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-400" /> Day {task.start + 1} - Day {task.start + task.duration}</span>
                        {task.dependency && (
                          <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                            <GitCommit className="w-3 h-3" /> {task.dependency}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Assignee Dropdown & Actions */}
                  <div className="flex flex-wrap items-center gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200/60">
                    {/* Role Filtered Employee Dropdown */}
                    <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-sm">
                      <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <select
                        className="text-xs font-bold text-slate-800 bg-transparent outline-none cursor-pointer max-w-[170px] truncate"
                        value={task.assigneeId || ''}
                        onChange={(e) => handleQuickAssigneeChange(task.id, e.target.value)}
                        title={`Select employee with role '${reqRole}'`}
                      >
                        <option value="">-- Assign Employee --</option>
                        <optgroup label={`Matching Requirement (${reqRole})`}>
                          {matchingEmployees.map(emp => (
                            <option key={emp.id} value={emp.id}>
                              {emp.name} ({emp.role})
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Other Company Staff">
                          {staffList.filter(e => !matchingEmployees.some(m => m.id === e.id)).map(emp => (
                            <option key={emp.id} value={emp.id}>
                              {emp.name} - {emp.role}
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </div>

                    {/* Status Dropdown */}
                    <select 
                      className="text-xs font-bold uppercase tracking-wider bg-white border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:border-emerald-500 shadow-sm"
                      value={task.status}
                      onChange={async (e) => {
                        await updateDoc(doc(db, 'projectTasks', task.id), { status: e.target.value });
                      }}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>

                    <button 
                      onClick={() => {
                        setEditingTaskId(task.id);
                        setNewTask({
                          name: task.name,
                          requiredRole: task.requiredRole || 'Lead Installer',
                          assigneeId: task.assigneeId || '',
                          assigneeName: task.assigneeName || '',
                          assigneeRole: task.assigneeRole || '',
                          start: task.start,
                          duration: task.duration,
                          status: task.status,
                          type: task.type,
                          dependency: task.dependency || ''
                        });
                        setIsTaskModalOpen(true);
                      }} 
                      className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Edit Task"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteTask(task.id)} 
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Delete Task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: RESOURCE ALLOCATION */}
      {activeTab === 'resources' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-900">Resource & Staff Allocation</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Assigned staff personnel and requirement coverage for this project.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {staffList.map(staff => {
              const assignedTasks = tasks.filter(t => t.assigneeId === staff.id);
              const isAssigned = assignedTasks.length > 0;

              return (
                <div 
                  key={staff.id} 
                  className={cn(
                    "p-4 border rounded-xl flex items-start gap-4 transition-all",
                    isAssigned ? "border-emerald-200 bg-emerald-50/20 shadow-sm" : "border-slate-100 bg-white"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center font-black text-sm shrink-0 border shadow-sm",
                    isAssigned ? "bg-emerald-600 text-white border-emerald-500" : "bg-slate-100 text-slate-600 border-slate-200"
                  )}>
                    {staff.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-sm truncate">{staff.name}</h4>
                      <span className={cn(
                        "text-[9px] font-black uppercase px-2 py-0.5 rounded-full border",
                        isAssigned ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"
                      )}>
                        {isAssigned ? `${assignedTasks.length} Task(s)` : 'Available'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 font-bold mt-0.5">{staff.role}</p>
                    {staff.team && <p className="text-[10px] text-slate-400 font-medium">{staff.team}</p>}

                    {isAssigned ? (
                      <div className="mt-2 space-y-1">
                        {assignedTasks.map(t => (
                          <div key={t.id} className="text-[10px] font-semibold text-slate-700 bg-white px-2 py-1 rounded border border-slate-200 flex items-center justify-between">
                            <span className="truncate">{t.name}</span>
                            <span className="text-[9px] font-bold text-emerald-600 shrink-0 ml-1">{t.status}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-400 italic mt-2">No tasks assigned for this project yet.</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add/Edit Task Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                {editingTaskId ? <Edit2 className="w-5 h-5 text-emerald-600" /> : <Plus className="w-5 h-5 text-emerald-600" />} 
                {editingTaskId ? 'Edit Project Task' : 'Add New Project Task'}
              </h3>
              <button onClick={() => setIsTaskModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
            </div>

            <form onSubmit={handleSaveTask} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Task Name</label>
                <input 
                  required 
                  type="text" 
                  value={newTask.name} 
                  onChange={e => setNewTask({...newTask, name: e.target.value})} 
                  className="w-full px-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-medium"
                  placeholder="e.g. Inverter Installation & Earthing"
                />
              </div>

              {/* Requirement & Employee Assignee Dropdown */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center justify-between">
                    <span>1. Required Skill / Role</span>
                    <span className="text-[10px] text-emerald-600 font-bold">Requirement Filter</span>
                  </label>
                  <select 
                    value={newTask.requiredRole} 
                    onChange={e => {
                      const newRole = e.target.value;
                      setNewTask(prev => {
                        // Check if current assignee matches new requirement
                        const matching = staffList.find(s => s.role.toLowerCase().includes(newRole.toLowerCase()));
                        return {
                          ...prev,
                          requiredRole: newRole,
                          assigneeId: matching ? matching.id : prev.assigneeId,
                          assigneeName: matching ? matching.name : prev.assigneeName,
                          assigneeRole: matching ? matching.role : prev.assigneeRole,
                        };
                      });
                    }} 
                    className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none bg-white"
                  >
                    {SOLAR_ROLES.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      2. Assignee Employee Dropdown
                    </label>
                    <label className="flex items-center gap-1 text-[10px] font-bold text-slate-500 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={showAllStaffInModal} 
                        onChange={e => setShowAllStaffInModal(e.target.checked)} 
                        className="rounded border-slate-300 text-emerald-600"
                      />
                      Show All Staff
                    </label>
                  </div>

                  <select 
                    value={newTask.assigneeId}
                    onChange={e => {
                      const selectedEmp = staffList.find(s => s.id === e.target.value);
                      if (selectedEmp) {
                        setNewTask({
                          ...newTask,
                          assigneeId: selectedEmp.id,
                          assigneeName: selectedEmp.name,
                          assigneeRole: selectedEmp.role
                        });
                      } else {
                        setNewTask({
                          ...newTask,
                          assigneeId: '',
                          assigneeName: '',
                          assigneeRole: ''
                        });
                      }
                    }}
                    className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none bg-white text-slate-900"
                  >
                    <option value="">-- Select Employee --</option>
                    {filteredStaff.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} — {emp.role} ({emp.team || 'Staff'})
                      </option>
                    ))}
                  </select>
                  {filteredStaff.length === 0 && (
                    <p className="text-[10px] text-amber-600 font-semibold mt-1">
                      No exact match for '{newTask.requiredRole}'. Check 'Show All Staff' to assign any employee.
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Start Day</label>
                  <input 
                    required 
                    type="number" 
                    min="0" 
                    value={newTask.start} 
                    onChange={e => setNewTask({...newTask, start: parseInt(e.target.value) || 0})} 
                    className="w-full px-4 py-2 text-xs font-bold border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Duration (Days)</label>
                  <input 
                    required 
                    type="number" 
                    min="1" 
                    value={newTask.duration} 
                    onChange={e => setNewTask({...newTask, duration: parseInt(e.target.value) || 1})} 
                    className="w-full px-4 py-2 text-xs font-bold border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Task Type</label>
                  <select 
                    value={newTask.type} 
                    onChange={e => setNewTask({...newTask, type: e.target.value as any})} 
                    className="w-full px-3 py-2 text-xs font-bold border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  >
                    <option value="task">Task</option>
                    <option value="milestone">Milestone</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Status</label>
                  <select 
                    value={newTask.status} 
                    onChange={e => setNewTask({...newTask, status: e.target.value as any})} 
                    className="w-full px-3 py-2 text-xs font-bold border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Dependency (Optional)</label>
                <input 
                  type="text" 
                  value={newTask.dependency} 
                  onChange={e => setNewTask({...newTask, dependency: e.target.value})} 
                  className="w-full px-4 py-2 text-xs font-medium border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none" 
                  placeholder="e.g. Site Survey & Structural Assessment" 
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsTaskModalOpen(false)} className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 shadow-md transition-colors">Save Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
