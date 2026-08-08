/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import CRM from './components/CRM';
import Inventory from './components/Inventory';
import Projects from './components/Projects';
import CustomerPortal from './components/CustomerPortal';
import SiteSurvey from './components/SiteSurvey';
import SolarDesign from './components/SolarDesign';
import ProposalGenerator from './components/ProposalGenerator';
import QuotationBuilder from './components/QuotationBuilder';
import SubsidyManagement from './components/SubsidyManagement';
import Procurement from './components/Procurement';
import WorkOrders from './components/WorkOrders';
import Finance from './components/Finance';
import Support from './components/Support';
import WarrantyManagement from './components/WarrantyManagement';
import DocumentManagement from './components/DocumentManagement';
import Compliance from './components/Compliance';
import HRModule from './components/HRModule';
import VendorPortal from './components/VendorPortal';
import Reporting from './components/Reporting';
import MasterSettings from './components/MasterSettings';
import Login from './components/Login';
import { ViewType, AuthenticatedUser } from './types';
import { Sun, Moon, Clock, LogOut, Bell, User as UserIcon } from 'lucide-react';
import { cn } from './lib/utils';
import { AuthProvider, useAuth } from './context/AuthContext';
import { authService } from './services/auth.service';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentView, setView] = useState<ViewType>('dashboard');
  const [isPunchedIn, setIsPunchedIn] = useState(false);
  const [punchTime, setPunchTime] = useState<Date | null>(null);
  const [currentFilter, setCurrentFilter] = useState<string | undefined>();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Determine if the role can punch in
  const canPunch = user?.role === 'Installer' || 
                   user?.role === 'Survey Engineer' || 
                   user?.role === 'Sales Executive' || 
                   user?.role === 'Warehouse Manager' || 
                   user?.role === 'Design Engineer' || 
                   user?.role === 'Project Manager' || 
                   user?.role === 'Finance Manager' || 
                   user?.role === 'Customer Support';

  const handlePunch = () => {
    setIsPunchedIn(!isPunchedIn);
    setPunchTime(new Date());
  };

  useEffect(() => {
    if (user) {
      // Find the first allowed view
      if (['Vendor', 'Customer', 'Survey Engineer', 'Design Engineer', 'Installer', 'Procurement Officer', 'Warehouse Manager', 'Auditor'].includes(user.role)) {
        if (user.role === 'Vendor') setView('vendors');
        else if (user.role === 'Customer') setView('portal');
        else if (user.role === 'Survey Engineer') setView('site-survey');
        else if (user.role === 'Design Engineer') setView('solar-design');
        else if (user.role === 'Installer') setView('projects');
        else if (user.role === 'Procurement Officer' || user.role === 'Warehouse Manager') setView('inventory');
        else if (user.role === 'Auditor') setView('reports');
        else setView('dashboard');
      } else {
        setView('dashboard');
      }
    }
  }, [user]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!user) {
    return <Login />;
  }

  if (user.status === 'Pending' || user.status === 'Rejected') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans text-slate-800">
        <div className="sm:mx-auto sm:w-full sm:max-w-md bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-100 text-center">
          <h2 className="text-2xl font-black text-slate-900 mb-4">Account Pending</h2>
          <p className="text-slate-600 mb-6">
            Your account is currently {user.status.toLowerCase()}. Please wait for an administrator to review and approve your account.
          </p>
          <button 
            onClick={() => authService.logout()}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onNavigate={handleViewChange} />;
      case 'crm':
        return <CRM initialFilter={currentFilter} />;
      case 'inventory':
        return <Inventory />;
      case 'projects':
        return <Projects initialFilter={currentFilter} />;
      case 'portal':
        return <CustomerPortal />;
      case 'site-survey':
        return <SiteSurvey />;
      case 'solar-design':
        return <SolarDesign />;
      case 'proposal':
        return <ProposalGenerator />;
      case 'quotation':
        return <QuotationBuilder />;
      case 'subsidy':
        return <SubsidyManagement />;
      case 'procurement':
        return <Procurement />;
      case 'work-orders':
        return <WorkOrders />;
      case 'finance':
        return <Finance />;
      case 'support':
        return <Support />;
      case 'warranty':
        return <WarrantyManagement />;
      case 'documents':
        return <DocumentManagement />;
      case 'compliance':
        return <Compliance />;
      case 'hr':
        return <HRModule />;
      case 'vendors':
        return <VendorPortal />;
      case 'reports':
        return <Reporting />;
      case 'settings':
        return <MasterSettings />;
      default:
        return <Dashboard onNavigate={handleViewChange} />;
    }
  };

  const handleViewChange = (view: ViewType, filter?: string) => {
    setView(view);
    setCurrentFilter(filter);
  };

  return (
    <div className="flex flex-col h-screen bg-white font-sans text-slate-800 overflow-hidden">
      {/* Top Navigation */}
      <nav className="h-16 bg-[#0f172a] text-white flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-3 w-1/4">
          <div className="w-8 h-8 bg-emerald-500 rounded flex items-center justify-center">
            <Sun className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">Meta Green</span>
        </div>
        
        <div className="flex items-center gap-4 w-1/4 justify-end">
          {canPunch && (
            <button 
              onClick={handlePunch}
              className={cn(
                "hidden md:flex items-center gap-2 text-sm px-4 py-1.5 rounded-full font-bold transition-all shadow-sm",
                isPunchedIn ? "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
              )}
            >
              <Clock className="w-4 h-4" />
              {isPunchedIn ? 'Punch Out' : 'Punch In'}
            </button>
          )}

          <div className="flex items-center gap-2 border-l border-slate-700 pl-4 ml-2">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 hover:bg-slate-800 rounded-full text-slate-300 hover:text-white transition-colors" title="Toggle Theme">
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button onClick={() => setIsProfileModalOpen(true)} className="p-2 hover:bg-slate-800 rounded-full text-slate-300 hover:text-white transition-colors" title="Profile Settings">
              <UserIcon className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center font-bold text-sm ml-1 ring-2 ring-emerald-900">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <button onClick={() => authService.logout()} className="p-2 hover:bg-slate-800 rounded-full text-slate-300 hover:text-white transition-colors" title="Log out">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Menu (Previously Sidebar) */}
        <Sidebar currentView={currentView} setView={handleViewChange} userRole={user.role} />
        
        <main className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
              {renderView()}
            </div>
          </div>
        </main>
      </div>

      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900">Profile Settings</h3>
              <button onClick={() => setIsProfileModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                &times;
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center font-black text-2xl text-white shadow-md">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-900">{user.name}</h4>
                  <p className="text-sm font-medium text-emerald-600">{user.role}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Email Address</label>
                <input type="email" value={user.email} disabled className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 font-medium cursor-not-allowed" />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Account Status</label>
                <div className="px-4 py-2 border border-emerald-200 bg-emerald-50 rounded-xl text-emerald-700 font-bold flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  Active
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-6">
                <button 
                  onClick={() => {
                    setIsProfileModalOpen(false);
                    authService.logout();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 font-bold rounded-xl transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out of Meta Green
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}