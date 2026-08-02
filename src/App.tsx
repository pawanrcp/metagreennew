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
import { Sun, Clock, LogOut } from 'lucide-react';
import { cn } from './lib/utils';

export default function App() {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [currentView, setView] = useState<ViewType>('dashboard');
  const [isPunchedIn, setIsPunchedIn] = useState(false);
  const [punchTime, setPunchTime] = useState<Date | null>(null);

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

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'crm':
        return <CRM />;
      case 'inventory':
        return <Inventory />;
      case 'projects':
        return <Projects />;
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
        return <Dashboard />;
    }
  };

  const handleViewChange = (view: ViewType) => {
    setView(view);
  };

  return (
    <div className="flex flex-col h-screen bg-white font-sans text-slate-800 overflow-hidden">
      {/* Top Navigation */}
      <nav className="h-16 bg-emerald-700 text-white flex items-center justify-between px-6 shrink-0 border-b border-emerald-800 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
            <Sun className="w-5 h-5 text-emerald-700" />
          </div>
          <span className="text-xl font-bold tracking-tight">Meta Green</span>
        </div>
        <div className="flex items-center gap-6">
          {canPunch && (
            <button 
              onClick={handlePunch}
              className={cn(
                "hidden md:flex items-center gap-2 text-sm px-4 py-1.5 rounded-full font-bold transition-all shadow-sm",
                isPunchedIn ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100" : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
              )}
            >
              <Clock className="w-4 h-4" />
              {isPunchedIn ? 'Punch Out' : 'Punch In'}
            </button>
          )}

          {/* <div className="hidden md:flex items-center gap-2 text-sm bg-emerald-800 px-3 py-1.5 rounded-full border border-emerald-600/50">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            <span>Firebase: Connected</span>
          </div> */}
          
          <div className="flex items-center gap-3">
            <div className="flex flex-col text-right hidden md:flex">
              <span className="text-sm font-bold leading-none">{user.name}</span>
              <span className="text-[10px] uppercase tracking-widest text-emerald-300 font-bold mt-1">{user.role}</span>
            </div>
            <div className="w-10 h-10 bg-emerald-600 rounded-full border-2 border-white/20 flex items-center justify-center font-bold text-lg">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <button onClick={() => setUser(null)} className="p-2 hover:bg-emerald-800 rounded-full ml-2" title="Log out">
              <LogOut className="w-5 h-5 text-emerald-100 hover:text-white" />
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
    </div>
  );
}