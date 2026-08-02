import React, { useState } from 'react';
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
  UserPlus
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { exportToPDF, exportToExcel } from '@/src/lib/exportUtils';

type TabType = 'users' | 'roles' | 'states' | 'products' | 'approvals' | 'audit';

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
  'Project Manager',
  'Finance Manager',
  'Customer Support',
  'Customer',
  'Vendor',
  'Auditor'
];

export default function MasterSettings() {
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'Sales Executive',
    status: 'Active'
  });

  const [mockUsers, setMockUsers] = useState([
    { id: 'U1', name: 'Admin User', email: 'admin@solar.com', role: 'Super Admin', status: 'Active' },
    { id: 'U2', name: 'John Doe', email: 'john@solar.com', role: 'Sales Manager', status: 'Active' },
  ]);

  const mockAuditLogs = [
    { id: 'L1', timestamp: '2024-03-20 10:30 AM', user: 'Admin User', action: 'Updated Tax Rules', details: 'Changed GST for Panels to 12%' },
    { id: 'L2', timestamp: '2024-03-19 02:15 PM', user: 'John Doe', action: 'Approved Quotation', details: 'Quotation QT-1002 approved.' },
  ];

  const handleExportUsers_PDF = () => {
    exportToPDF('System Users', ['Name', 'Email', 'Role', 'Status'], mockUsers.map(u => [u.name, u.email, u.role, u.status]));
  };
  const handleExportUsers_Excel = () => {
    exportToExcel('System Users', mockUsers);
  };
  
  const handleExportAudit_PDF = () => {
    exportToPDF('Audit Logs', ['Timestamp', 'User', 'Action', 'Details'], mockAuditLogs.map(l => [l.timestamp, l.user, l.action, l.details]));
  };
  const handleExportAudit_Excel = () => {
    exportToExcel('Audit Logs', mockAuditLogs);
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    setMockUsers([...mockUsers, { id: `U${mockUsers.length + 1}`, ...newUser }]);
    setIsAddUserModalOpen(false);
    setNewUser({ name: '', email: '', role: 'Sales Executive', status: 'Active' });
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'users':
        return (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-900">System Users</h3>
              <div className="flex gap-2">
                <button onClick={handleExportUsers_PDF} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 text-xs shadow-sm">
                  <Download className="w-3 h-3 text-red-500" /> PDF
                </button>
                <button onClick={handleExportUsers_Excel} className="px-3 py-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 font-semibold rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-2 text-xs shadow-sm">
                  <FileSpreadsheet className="w-3 h-3" /> Excel
                </button>
                <button onClick={() => setIsAddUserModalOpen(true)} className="px-3 py-1.5 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 text-xs shadow-sm">
                  <Plus className="w-3 h-3" /> Add User
                </button>
              </div>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white text-slate-500 text-xs font-bold uppercase tracking-widest border-b border-slate-100">
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mockUsers.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50/50">
                    <td className="p-4 font-bold text-slate-900">{user.name}</td>
                    <td className="p-4 text-slate-600">{user.email}</td>
                    <td className="p-4 text-slate-600">{user.role}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md text-[10px] font-black uppercase tracking-widest border border-emerald-100">{user.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'roles':
        return (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <ShieldCheck className="w-8 h-8 text-slate-300" />
              <div>
                <h3 className="text-lg font-bold text-slate-900">Roles & Permissions</h3>
                <p className="text-sm text-slate-500">Configure access control matrix for different system roles.</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse border border-slate-200 rounded-lg min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-widest border-b border-slate-200">
                    <th className="p-3 border-r border-slate-200 sticky left-0 bg-slate-50 z-10">Permission Module</th>
                    {USER_ROLES.slice(0, 8).map(role => (
                      <th key={role} className="p-3 text-center border-r border-slate-200 whitespace-nowrap">{role}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {['Manage Settings', 'Approve Quotations', 'View Financials', 'Manage Projects', 'Site Surveys', 'Design Plans'].map((perm, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="p-3 font-medium text-slate-800 border-r border-slate-200 sticky left-0 bg-white z-10">{perm}</td>
                      <td className="p-3 text-center border-r border-slate-200"><input type="checkbox" checked readOnly className="accent-emerald-600 w-4 h-4" /></td>
                      <td className="p-3 text-center border-r border-slate-200"><input type="checkbox" checked={i > 0} readOnly className="accent-emerald-600 w-4 h-4" /></td>
                      <td className="p-3 text-center border-r border-slate-200"><input type="checkbox" checked={i > 0 && i < 3} readOnly className="accent-emerald-600 w-4 h-4" /></td>
                      <td className="p-3 text-center border-r border-slate-200"><input type="checkbox" checked={i === 1 || i === 3} readOnly className="accent-emerald-600 w-4 h-4" /></td>
                      <td className="p-3 text-center border-r border-slate-200"><input type="checkbox" checked={i === 4} readOnly className="accent-emerald-600 w-4 h-4" /></td>
                      <td className="p-3 text-center border-r border-slate-200"><input type="checkbox" checked={i === 5} readOnly className="accent-emerald-600 w-4 h-4" /></td>
                      <td className="p-3 text-center border-r border-slate-200"><input type="checkbox" checked={false} readOnly className="accent-emerald-600 w-4 h-4" /></td>
                      <td className="p-3 text-center border-r border-slate-200"><input type="checkbox" checked={false} readOnly className="accent-emerald-600 w-4 h-4" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-xs text-slate-500 italic">Scroll horizontally to view more roles. Showing 8 of 15 roles.</div>
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
                  <td className="p-4 font-bold">0%</td>
                  <td className="p-4"><span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md text-[10px] font-black uppercase tracking-widest border border-emerald-100">Active</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      case 'products':
        return (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-900">Master Product & Pricing List</h3>
              <button className="px-3 py-1.5 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 text-xs shadow-sm">
                <Plus className="w-3 h-3" /> Add Product
              </button>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white text-slate-500 text-xs font-bold uppercase tracking-widest border-b border-slate-100">
                  <th className="p-4">Category</th>
                  <th className="p-4">Product Name</th>
                  <th className="p-4">Unit Price</th>
                  <th className="p-4">Tax Bracket</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 text-slate-600">Solar Panel</td>
                  <td className="p-4 font-bold text-slate-900">Waaree 540W Mono PERC</td>
                  <td className="p-4 font-bold">₹12,500</td>
                  <td className="p-4 text-slate-600">12%</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 text-slate-600">Inverter</td>
                  <td className="p-4 font-bold text-slate-900">Growatt 5kW Hybrid</td>
                  <td className="p-4 font-bold">₹45,000</td>
                  <td className="p-4 text-slate-600">18%</td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      case 'approvals':
        return (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <CheckSquare className="w-8 h-8 text-slate-300" />
              <div>
                <h3 className="text-lg font-bold text-slate-900">Approval Workflow Rules</h3>
                <p className="text-sm text-slate-500">Define automatic rules and manual approval requirements.</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                <div>
                  <h4 className="font-bold text-slate-800">Quotation Approval</h4>
                  <p className="text-sm text-slate-500">Require manager approval for quotations exceeding ₹10,00,000</p>
                </div>
                <div className="w-12 h-6 bg-emerald-500 rounded-full relative cursor-pointer">
                  <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1 shadow-sm"></div>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                <div>
                  <h4 className="font-bold text-slate-800">Vendor Payment Approval</h4>
                  <p className="text-sm text-slate-500">Require finance head approval before releasing payments to vendors</p>
                </div>
                <div className="w-12 h-6 bg-emerald-500 rounded-full relative cursor-pointer">
                  <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1 shadow-sm"></div>
                </div>
              </div>
            </div>
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
                {mockAuditLogs.map(log => (
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
    }
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Sliders className="w-8 h-8 text-emerald-600" /> Master Settings
          </h1>
          <p className="text-slate-500 font-medium mt-1">Configure users, roles, tax rules, and system approvals.</p>
        </div>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { id: 'users', label: 'Users', icon: Users },
          { id: 'roles', label: 'Roles & Permissions', icon: ShieldCheck },
          { id: 'states', label: 'States & Taxes', icon: Percent },
          { id: 'products', label: 'Products & Pricing', icon: Package },
          { id: 'approvals', label: 'Approval Rules', icon: CheckSquare },
          { id: 'audit', label: 'Audit Logs', icon: List },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={cn(
              "px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 whitespace-nowrap transition-colors",
              activeTab === tab.id 
                ? "bg-slate-900 text-white shadow-sm" 
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            )}
          >
            <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? "text-emerald-400" : "text-slate-400")} />
            {tab.label}
          </button>
        ))}
      </div>

      {renderContent()}

      {/* Add User Modal */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" /> Add New User
              </h3>
              <button onClick={() => setIsAddUserModalOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input required type="text" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input required type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">User Role</label>
                <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none">
                  {USER_ROLES.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select value={newUser.status} onChange={e => setNewUser({...newUser, status: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => {setIsAddUserModalOpen(false); setNewUser({ name: '', email: '', role: 'Sales Executive', status: 'Active' });}} className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors">Add User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
