import { 
  LayoutDashboard, 
  Users, 
  Sun, 
  Package, 
  IndianRupee, 
  Settings,
  LogOut,
  UserCircle,
  Map,
  PenTool,
  FileText,
  Calculator,
  Landmark,
  ShoppingCart,
  Wrench,
  ShieldCheck,
  FolderOpen,
  ClipboardCheck,
  UserCheck,
  Truck,
  BarChart,
  Sliders,
  Plus
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { ViewType, UserRole } from '@/src/types';

interface SidebarProps {
  currentView: ViewType;
  setView: (view: ViewType) => void;
  userRole?: UserRole;
}

export default function Sidebar({ currentView, setView, userRole }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Super Admin', 'Solar Company Admin', 'Regional Manager', 'Sales Executive', 'Project Manager', 'Finance Manager'] },
    { id: 'crm', label: 'CRM / Leads', icon: Users, roles: ['Super Admin', 'Solar Company Admin', 'Regional Manager', 'Sales Executive'] },
    { id: 'site-survey', label: 'Site Survey', icon: Map, roles: ['Super Admin', 'Solar Company Admin', 'Regional Manager', 'Survey Engineer', 'Project Manager'] },
    { id: 'solar-design', label: 'Solar Design', icon: PenTool, roles: ['Super Admin', 'Solar Company Admin', 'Design Engineer', 'Project Manager'] },
    { id: 'proposal', label: 'Proposal Generator', icon: FileText, roles: ['Super Admin', 'Solar Company Admin', 'Sales Executive'] },
    { id: 'quotation', label: 'Quotation Builder', icon: Calculator, roles: ['Super Admin', 'Solar Company Admin', 'Sales Executive', 'Finance Manager'] },
    { id: 'subsidy', label: 'Subsidy Management', icon: Landmark, roles: ['Super Admin', 'Solar Company Admin', 'Finance Manager', 'Customer Support'] },
    { id: 'procurement', label: 'Procurement', icon: ShoppingCart, roles: ['Super Admin', 'Solar Company Admin', 'Procurement Officer', 'Warehouse Manager'] },
    { id: 'projects', label: 'Projects', icon: Sun, roles: ['Super Admin', 'Solar Company Admin', 'Regional Manager', 'Project Manager', 'Installer'] },
    { id: 'work-orders', label: 'Work Orders', icon: Wrench, roles: ['Super Admin', 'Solar Company Admin', 'Project Manager', 'Installer'] },
    { id: 'inventory', label: 'Inventory', icon: Package, roles: ['Super Admin', 'Solar Company Admin', 'Warehouse Manager', 'Procurement Officer'] },
    { id: 'finance', label: 'Finance', icon: IndianRupee, roles: ['Super Admin', 'Solar Company Admin', 'Finance Manager', 'Auditor'] },
    { id: 'support', label: 'Support & Complaints', icon: Settings, roles: ['Super Admin', 'Solar Company Admin', 'Customer Support', 'Project Manager'] },
    { id: 'warranty', label: 'Warranty Tracking', icon: ShieldCheck, roles: ['Super Admin', 'Solar Company Admin', 'Customer Support'] },
    { id: 'documents', label: 'Document Management', icon: FolderOpen, roles: ['Super Admin', 'Solar Company Admin', 'Project Manager', 'Sales Executive', 'Finance Manager'] },
    { id: 'compliance', label: 'Compliance & Approvals', icon: ClipboardCheck, roles: ['Super Admin', 'Solar Company Admin', 'Finance Manager', 'Auditor'] },
    { id: 'hr', label: 'HR & Teams', icon: UserCheck, roles: ['Super Admin', 'Solar Company Admin', 'Regional Manager'] },
    { id: 'vendors', label: 'Vendor Portal', icon: Truck, roles: ['Super Admin', 'Solar Company Admin', 'Vendor', 'Procurement Officer', 'Finance Manager'] },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart, roles: ['Super Admin', 'Solar Company Admin', 'Regional Manager', 'Finance Manager', 'Auditor'] },
    { id: 'settings', label: 'Master Settings', icon: Sliders, roles: ['Super Admin', 'Solar Company Admin'] },
    { id: 'portal', label: 'Customer Portal', icon: UserCircle, roles: ['Super Admin', 'Customer', 'Customer Support'] },
  ];

  const filteredMenuItems = menuItems.filter(item => !userRole || item.roles.includes(userRole));

  return (
    <div className="flex items-center w-full px-4 py-2 bg-slate-50 border-b border-slate-200 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] gap-2 z-40">
      <div className="flex-1 flex items-center gap-2">
        {filteredMenuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id as ViewType)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 shrink-0",
              currentView === item.id 
                ? "bg-emerald-100/50 text-emerald-900 font-semibold" 
                : "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
            )}
          >
            <item.icon className={cn(
              "w-4 h-4 transition-colors",
              currentView === item.id ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-600"
            )} />
            <span className="text-sm whitespace-nowrap">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
