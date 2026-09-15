import React, { useState, useEffect } from 'react';
import { 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  MapPin, 
  Zap, 
  UserCheck, 
  Download, 
  Phone, 
  ShieldCheck, 
  ArrowRight, 
  X, 
  FileText, 
  Sparkles, 
  PackageCheck, 
  Tag, 
  RefreshCw, 
  HelpCircle,
  Sun,
  Layers,
  Wrench,
  CheckCircle,
  Building
} from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { cn } from '@/src/lib/utils';
import jsPDF from 'jspdf';

export interface ApplicationTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export interface TrackedApplication {
  id: string;
  displayId: string;
  customerName: string;
  maskedPhone: string;
  maskedEmail: string;
  rawPhone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  expectedLoad: string;
  expectedLoadUnit: string;
  roofType: string;
  customerType: 'Normal Customer' | 'Vendor Related Stock';
  vendorName?: string;
  stockCategory?: string;
  assignedOfficer?: string;
  status: string;
  projectStatus?: string;
  subsidyStage?: string;
  currentStageIndex: number;
  progressPercent: number;
  applicationDate: string;
  quotationAmount?: number;
  quotationDocNumber?: string;
  monthlyUnits?: string;
  source?: string;
}

// 8 Official End-to-End Solar Rooftop Lifecycle Milestones
const APPLICATION_STAGES = [
  {
    step: 1,
    id: 'applied',
    title: 'Application Received & Registered',
    subtitle: 'Prospect entered, technical requirement & capacity recorded',
    icon: FileText,
    badge: 'Stage 1'
  },
  {
    step: 2,
    id: 'survey',
    title: 'Site Feasibility & Geotagged Survey',
    subtitle: 'Rooftop azimuth, tilt, shading assessment & structural feasibility',
    icon: MapPin,
    badge: 'Stage 2'
  },
  {
    step: 3,
    id: 'design',
    title: '3D Solar Engineering & Quotation Approval',
    subtitle: 'Optimal PV stringing layout, single-line diagram & estimate sign-off',
    icon: Sun,
    badge: 'Stage 3'
  },
  {
    step: 4,
    id: 'discom',
    title: 'PM Surya Ghar & DISCOM Net-Metering Filing',
    subtitle: 'National Portal subsidy registration & electricity DISCOM NOC',
    icon: Building,
    badge: 'Stage 4'
  },
  {
    step: 5,
    id: 'materials',
    title: 'Equipment Allocation & Stock Dispatch',
    subtitle: 'Tier-1 Mono/Poly modules, inverter & BOS structures assigned',
    icon: PackageCheck,
    badge: 'Stage 5'
  },
  {
    step: 6,
    id: 'installation',
    title: 'Rooftop Solar Mounting & Electrical Wiring',
    subtitle: 'Module mounting, DC/AC cabling, earthing & lightning arrester test',
    icon: Wrench,
    badge: 'Stage 6'
  },
  {
    step: 7,
    id: 'net_meter',
    title: 'DISCOM Joint Inspection & Net-Meter Sync',
    subtitle: 'Bi-directional net meter installed & synchronized with the grid',
    icon: Zap,
    badge: 'Stage 7'
  },
  {
    step: 8,
    id: 'commissioned',
    title: 'System Energized, Handover & Subsidy Credit',
    subtitle: 'Generation monitoring live, warranty issued & subsidy disbursed',
    icon: CheckCircle2,
    badge: 'Stage 8'
  }
];

export default function ApplicationTrackingModal({
  isOpen,
  onClose,
  initialQuery = ''
}: ApplicationTrackingModalProps) {
  const [searchInput, setSearchInput] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<TrackedApplication[]>([]);
  const [selectedApp, setSelectedApp] = useState<TrackedApplication | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialQuery) {
        setSearchInput(initialQuery);
        handleExecuteSearch(initialQuery);
      } else {
        setSearchInput('');
        setSearchResults([]);
        setSelectedApp(null);
        setHasSearched(false);
        setErrorMessage('');
      }
    }
  }, [isOpen, initialQuery]);

  const maskPhone = (phone: string) => {
    if (!phone) return 'N/A';
    const digits = phone.replace(/\D/g, '');
    if (digits.length >= 10) {
      const last4 = digits.slice(-4);
      return `+91 ${digits.slice(-10, -6)} ••• ${last4}`;
    }
    return phone;
  };

  const maskEmail = (email: string) => {
    if (!email || !email.includes('@')) return 'N/A';
    const [user, domain] = email.split('@');
    if (user.length <= 2) return `${user}•••@${domain}`;
    return `${user.slice(0, 2)}••••${user.slice(-1)}@${domain}`;
  };

  const computeStageIndex = (leadStatus?: string, projectStatus?: string): { stageIndex: number; progress: number } => {
    const s = (leadStatus || '').toLowerCase();
    const p = (projectStatus || '').toLowerCase();

    if (p.includes('subsidy released') || p.includes('completed') || s === 'completed' || s === 'amc') {
      return { stageIndex: 8, progress: 100 };
    }
    if (p.includes('net meter installed') || p.includes('subsidy pending') || p.includes('department verification') || p.includes('verification')) {
      return { stageIndex: 7, progress: 85 };
    }
    if (p.includes('installation complete') || p.includes('assigned installation') || s === 'installation') {
      return { stageIndex: 6, progress: 70 };
    }
    if (p.includes('in process') || s === 'approved') {
      return { stageIndex: 5, progress: 55 };
    }
    if (s === 'proposal' || s === 'negotiation') {
      return { stageIndex: 3, progress: 35 };
    }
    if (s === 'site survey') {
      return { stageIndex: 2, progress: 25 };
    }
    return { stageIndex: 1, progress: 15 };
  };

  const handleExecuteSearch = async (queryText?: string) => {
    const term = (queryText !== undefined ? queryText : searchInput).trim();
    if (!term) {
      setErrorMessage('Please enter an Application ID or 10-digit Mobile Number.');
      return;
    }

    setIsSearching(true);
    setErrorMessage('');
    setHasSearched(true);
    setSelectedApp(null);
    setSearchResults([]);

    try {
      const cleanDigits = term.replace(/\D/g, '');
      const isMobileSearch = cleanDigits.length >= 7;
      const cleanLowerTerm = term.toLowerCase();

      // Parallel Fetch: leads, projects, customers, subsidies
      const [leadsSnap, projectsSnap, customersSnap, subsidiesSnap] = await Promise.all([
        getDocs(collection(db, 'leads')),
        getDocs(collection(db, 'projects')),
        getDocs(collection(db, 'customers')),
        getDocs(collection(db, 'subsidies'))
      ]);

      const leads = leadsSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      const projects = projectsSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      const customers = customersSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      const subsidies = subsidiesSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));

      const matchedApps: TrackedApplication[] = [];

      // 1. Check in Leads
      for (const lead of leads) {
        if (lead.isDeleted) continue;
        const leadDigits = (lead.phone || '').replace(/\D/g, '');
        const idMatches = lead.id.toLowerCase() === cleanLowerTerm || 
                          (lead.applicationRefNo && lead.applicationRefNo.toLowerCase() === cleanLowerTerm) ||
                          (lead.leadId && lead.leadId.toLowerCase() === cleanLowerTerm);
        const phoneMatches = isMobileSearch && leadDigits.length >= 7 && (
          leadDigits.endsWith(cleanDigits.slice(-10)) || cleanDigits.endsWith(leadDigits.slice(-10))
        );

        if (idMatches || phoneMatches) {
          // Check if associated project exists
          const matchingProj = projects.find(p => p.leadId === lead.id || (p.phone && p.phone.replace(/\D/g, '').endsWith(cleanDigits.slice(-10))));
          const matchingSub = subsidies.find(s => s.applicationRefNo === lead.id || s.customer === lead.name);

          const { stageIndex, progress } = computeStageIndex(lead.status, matchingProj?.status);

          let appDate = 'Recently Registered';
          if (lead.createdAt?.toDate) {
            appDate = lead.createdAt.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
          } else if (lead.createdAt) {
            appDate = new Date(lead.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
          }

          matchedApps.push({
            id: lead.id,
            displayId: lead.applicationRefNo || `APP-${lead.id.slice(-6).toUpperCase()}`,
            customerName: lead.name || 'Valued Customer',
            maskedPhone: maskPhone(lead.phone),
            maskedEmail: maskEmail(lead.email),
            rawPhone: lead.phone || '',
            address: lead.address || 'Address on file',
            city: lead.city || 'Site Location',
            state: lead.state || 'Maharashtra',
            pincode: lead.pincode || '',
            expectedLoad: lead.expectedLoad || '5',
            expectedLoadUnit: lead.expectedLoadUnit || 'KW',
            roofType: lead.roofType || 'Standard RCC Rooftop',
            customerType: lead.customerType || 'Normal Customer',
            vendorName: lead.vendorName || (matchingProj?.vendorName) || '',
            stockCategory: lead.stockCategory || '',
            assignedOfficer: lead.assignedOfficer || matchingProj?.assignedTo || matchingProj?.installerName || '',
            status: matchingProj?.status || lead.status || 'Active Application',
            projectStatus: matchingProj?.status,
            subsidyStage: matchingSub?.scheme || 'PM Surya Ghar Muft Bijli Yojana',
            currentStageIndex: stageIndex,
            progressPercent: progress,
            applicationDate: appDate,
            monthlyUnits: lead.monthlyUnits,
            source: lead.source || 'Website Application'
          });
        }
      }

      // 2. Check in Projects (if not already matched from leads)
      for (const proj of projects) {
        if (proj.isDeleted) continue;
        if (matchedApps.some(a => a.id === proj.leadId || a.id === proj.id)) continue;

        const projDigits = (proj.phone || '').replace(/\D/g, '');
        const idMatches = proj.id.toLowerCase() === cleanLowerTerm || 
                          (proj.leadId && proj.leadId.toLowerCase() === cleanLowerTerm);
        const phoneMatches = isMobileSearch && projDigits.length >= 7 && (
          projDigits.endsWith(cleanDigits.slice(-10)) || cleanDigits.endsWith(projDigits.slice(-10))
        );

        if (idMatches || phoneMatches) {
          const { stageIndex, progress } = computeStageIndex(undefined, proj.status);
          matchedApps.push({
            id: proj.id,
            displayId: `PRJ-${proj.id.slice(-6).toUpperCase()}`,
            customerName: proj.customerName || 'Solar Consumer',
            maskedPhone: maskPhone(proj.phone),
            maskedEmail: 'Confidential (Project)',
            rawPhone: proj.phone || '',
            address: proj.address || '',
            city: proj.city || '',
            state: proj.state || '',
            pincode: '',
            expectedLoad: String(proj.capacityKw || '5'),
            expectedLoadUnit: proj.capacityUnit || 'KW',
            roofType: 'RCC Rooftop',
            customerType: proj.vendorName ? 'Vendor Related Stock' : 'Normal Customer',
            vendorName: proj.vendorName || '',
            assignedOfficer: proj.assignedTo || proj.installerName || 'MetaGreen Technical Team',
            status: proj.status || 'In Execution',
            projectStatus: proj.status,
            currentStageIndex: stageIndex,
            progressPercent: progress,
            applicationDate: proj.createdAt ? new Date(proj.createdAt).toLocaleDateString('en-IN') : 'Active Project'
          });
        }
      }

      if (matchedApps.length === 0) {
        setErrorMessage(`No solar application found matching "${term}". Please check the Application ID or 10-digit mobile number.`);
      } else {
        setSearchResults(matchedApps);
        setSelectedApp(matchedApps[0]); // Select first match by default
      }
    } catch (err) {
      console.error('Error searching application flow:', err);
      setErrorMessage('Network error while looking up application. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleDownloadPDFSlip = (app: TrackedApplication) => {
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFillColor(16, 185, 129); // emerald
      doc.rect(0, 0, 210, 35, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('METAGREEN SOLAR SOLUTIONS', 15, 18);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Official Solar Rooftop Application Status & Milestone Flow', 15, 27);
      
      // Tracking ID Banner
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Application Ref: ${app.displayId}`, 15, 48);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated On: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, 130, 48);
      
      doc.setDrawColor(226, 232, 240);
      doc.line(15, 52, 195, 52);

      // Customer & System Table
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('1. Applicant & Installation Details', 15, 62);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Applicant Name: ${app.customerName}`, 15, 71);
      doc.text(`Registered Mobile: ${app.maskedPhone}`, 15, 78);
      doc.text(`System Capacity: ${app.expectedLoad} ${app.expectedLoadUnit} Solar PV`, 15, 85);
      doc.text(`Rooftop Type: ${app.roofType}`, 15, 92);
      doc.text(`Site Location: ${app.address}, ${app.city}, ${app.state}`, 15, 99);
      doc.text(`Classification: ${app.customerType}${app.vendorName ? ` (Fulfillment by ${app.vendorName})` : ''}`, 15, 106);
      doc.text(`Assigned Officer: ${app.assignedOfficer || 'MetaGreen Central Engineering Desk'}`, 15, 113);
      doc.text(`Current Status: ${app.status} (${app.progressPercent}% Completed)`, 15, 120);

      doc.line(15, 126, 195, 126);

      // Milestones Flow Table
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('2. End-to-End Installation & Subsidy Flow', 15, 136);

      let yPos = 145;
      APPLICATION_STAGES.forEach((st) => {
        const isCompleted = st.step <= app.currentStageIndex;
        const isCurrent = st.step === app.currentStageIndex;
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        if (isCurrent) {
          doc.setTextColor(37, 99, 235); // blue
          doc.text(`[ IN PROGRESS ] Stage ${st.step}: ${st.title}`, 15, yPos);
        } else if (isCompleted) {
          doc.setTextColor(16, 185, 129); // emerald
          doc.text(`[ COMPLETED ]   Stage ${st.step}: ${st.title}`, 15, yPos);
        } else {
          doc.setTextColor(148, 163, 184); // slate-400
          doc.text(`[ UPCOMING ]    Stage ${st.step}: ${st.title}`, 15, yPos);
        }

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(`  ${st.subtitle}`, 15, yPos + 4);

        yPos += 11;
      });

      // Footer
      doc.setDrawColor(226, 232, 240);
      doc.line(15, 250, 195, 250);
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text('MetaGreen Solar EPC Platform • Verified Public Tracking Portal • Support: support@metagreen.in', 15, 258);
      doc.text('This is a computer-generated milestone statement for consumer transparency under PM Surya Ghar guidelines.', 15, 264);

      doc.save(`MetaGreen_Application_${app.displayId}.pdf`);
    } catch (err) {
      console.error('Error generating tracking PDF:', err);
      alert('Unable to generate PDF slip. Please check your browser permissions.');
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[200] overflow-y-auto p-3 sm:p-6 flex items-center justify-center py-6 sm:py-10 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] sm:max-h-[88vh] flex flex-col min-h-0 overflow-hidden border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-900 via-teal-950 to-slate-950 text-white shrink-0 sticky top-0 z-30 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shadow-inner">
              <Zap className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black tracking-tight">
                  Track Solar Application Flow
                </h3>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Consumer Portal
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                Real-time tracking by Application ID or 10-digit registered mobile number
              </p>
            </div>
          </div>

          <button 
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-red-500 text-slate-200 hover:text-white font-bold text-xs transition-all border border-white/10 hover:border-red-500 cursor-pointer shrink-0"
            title="Close Tracker (ESC)"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Close</span>
          </button>
        </div>

        {/* Modal Body Container */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* Search Bar Widget */}
          <div className="bg-gradient-to-br from-emerald-50/70 via-teal-50/40 to-slate-50 dark:from-slate-800/80 dark:to-slate-800/40 p-4 sm:p-5 rounded-2xl border border-emerald-200/80 dark:border-slate-700 shadow-xs">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleExecuteSearch();
              }}
              className="space-y-3"
            >
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Enter Application ID or Mobile Number</span>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 lowercase">
                  (e.g. 9876543210 or APP-101)
                </span>
              </label>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Search className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Enter Application ID, Lead ID, or 10-digit Mobile Number..."
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all shadow-xs"
                    autoFocus
                  />
                  {searchInput && (
                    <button
                      type="button"
                      onClick={() => setSearchInput('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSearching}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl text-sm transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {isSearching ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Tracking...</span>
                    </>
                  ) : (
                    <>
                      <span>Track Status</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Quick Suggestion Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Quick Try:</span>
                {['9876543210', '9822012345', 'APP-101', 'LEAD-901'].map((pill) => (
                  <button
                    key={pill}
                    type="button"
                    onClick={() => {
                      setSearchInput(pill);
                      handleExecuteSearch(pill);
                    }}
                    className="text-[11px] font-semibold px-2.5 py-0.8 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-400 hover:text-emerald-600 transition-colors cursor-pointer"
                  >
                    {pill}
                  </button>
                ))}
              </div>
            </form>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 rounded-2xl flex items-start gap-3 text-red-700 dark:text-red-400 animate-in fade-in duration-200">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
              <div className="text-xs space-y-1">
                <p className="font-bold">{errorMessage}</p>
                <p className="text-[11px] opacity-80">
                  Tip: If you recently submitted your quotation or rooftop survey request, try searching by the phone number entered in the proposal.
                </p>
              </div>
            </div>
          )}

          {/* Multiple Matches Selector (if phone has multiple projects) */}
          {searchResults.length > 1 && (
            <div className="space-y-2 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
              <span className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Found {searchResults.length} Applications for this Contact:
              </span>
              <div className="flex flex-wrap gap-2">
                {searchResults.map((app, idx) => (
                  <button
                    key={app.id || idx}
                    type="button"
                    onClick={() => setSelectedApp(app)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5",
                      selectedApp?.id === app.id
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                        : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                    )}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{app.displayId} ({app.expectedLoad} {app.expectedLoadUnit})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* APPLICATION DETAILS & FLOW TIMELINE */}
          {selectedApp && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* Top Overview Card */}
              <div className="p-5 sm:p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white rounded-3xl shadow-xl space-y-4 border border-slate-800">
                
                {/* Upper Details Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-700/60">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                        {selectedApp.displayId}
                      </span>
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border",
                        selectedApp.customerType === 'Vendor Related Stock'
                          ? "bg-purple-500/20 text-purple-300 border-purple-400/30"
                          : "bg-emerald-500/20 text-emerald-300 border-emerald-400/30"
                      )}>
                        {selectedApp.customerType === 'Vendor Related Stock'
                          ? `Vendor Consignment: ${selectedApp.vendorName || 'OEM'}`
                          : 'Company Direct Stock'}
                      </span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                      {selectedApp.customerName}
                    </h2>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{selectedApp.address}, {selectedApp.city}, {selectedApp.state}</span>
                    </p>
                  </div>

                  {/* Capacity & Download Button */}
                  <div className="flex flex-col sm:items-end gap-2 shrink-0">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                        Sanctioned Solar Capacity
                      </span>
                      <span className="text-2xl font-black text-emerald-400">
                        {selectedApp.expectedLoad} {selectedApp.expectedLoadUnit}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDownloadPDFSlip(selectedApp)}
                      className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors flex items-center gap-1.5 border border-white/10 cursor-pointer shadow-xs"
                      title="Download Official PDF Milestone Summary Slip"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Download Status Slip (PDF)</span>
                    </button>
                  </div>
                </div>

                {/* Progress Bar & Current Status */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-black">
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Current Milestone: {APPLICATION_STAGES[Math.min(selectedApp.currentStageIndex - 1, 7)]?.title}
                    </span>
                    <span className="text-white">
                      {selectedApp.progressPercent}% Completed
                    </span>
                  </div>

                  <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 rounded-full transition-all duration-700 shadow-sm"
                      style={{ width: `${selectedApp.progressPercent}%` }}
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 pt-1">
                    <span>📅 Registered: {selectedApp.applicationDate}</span>
                    <span>⚡ Rooftop: {selectedApp.roofType}</span>
                    <span>📞 Phone: {selectedApp.maskedPhone}</span>
                    {selectedApp.assignedOfficer && (
                      <span className="text-emerald-300 font-bold flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5" /> Officer: {selectedApp.assignedOfficer}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 8-Stage Visual Timeline Flow */}
              <div className="space-y-4 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-emerald-600" />
                      Application Lifecycle & Installation Flow
                    </h4>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Live milestone progression under PM Surya Ghar Muft Bijli guidelines
                    </p>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                    Stage {selectedApp.currentStageIndex} of 8
                  </span>
                </div>

                <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3.5 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                  {APPLICATION_STAGES.map((st) => {
                    const isCompleted = st.step < selectedApp.currentStageIndex;
                    const isCurrent = st.step === selectedApp.currentStageIndex;
                    const StepIcon = st.icon;

                    return (
                      <div key={st.step} className="relative flex items-start gap-4 group">
                        
                        {/* Timeline Node Icon Indicator */}
                        <div className={cn(
                          "absolute -left-6 sm:-left-8 top-0.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border-2 transition-all shadow-xs shrink-0 z-10",
                          isCompleted
                            ? "bg-emerald-600 border-emerald-600 text-white"
                            : isCurrent
                            ? "bg-blue-600 border-blue-600 text-white ring-4 ring-blue-500/20 animate-pulse"
                            : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-400"
                        )}>
                          {isCompleted ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : isCurrent ? (
                            <StepIcon className="w-4 h-4" />
                          ) : (
                            <span className="text-[11px] font-black">{st.step}</span>
                          )}
                        </div>

                        {/* Milestone Card Content */}
                        <div className={cn(
                          "flex-1 p-3.5 sm:p-4 rounded-2xl border transition-all",
                          isCurrent
                            ? "bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/60 shadow-xs"
                            : isCompleted
                            ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40"
                            : "bg-slate-50/60 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 opacity-70"
                        )}>
                          <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1">
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "text-[10px] font-black uppercase px-2 py-0.5 rounded-md",
                                isCurrent
                                  ? "bg-blue-600 text-white"
                                  : isCompleted
                                  ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300"
                                  : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                              )}>
                                {st.badge}
                              </span>
                              <h5 className={cn(
                                "text-xs sm:text-sm font-black",
                                isCurrent
                                  ? "text-blue-950 dark:text-blue-200"
                                  : isCompleted
                                  ? "text-slate-900 dark:text-slate-100"
                                  : "text-slate-600 dark:text-slate-400"
                              )}>
                                {st.title}
                              </h5>
                            </div>

                            <span className={cn(
                              "text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border",
                              isCompleted
                                ? "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
                                : isCurrent
                                ? "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800"
                                : "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                            )}>
                              {isCompleted ? '✓ Completed' : isCurrent ? '⚡ In Progress' : 'Pending'}
                            </span>
                          </div>

                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            {st.subtitle}
                          </p>

                          {/* Dynamic Specific Details per stage */}
                          {st.step === 1 && (
                            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-3">
                              <span>Ref No: <strong>{selectedApp.displayId}</strong></span>
                              <span>•</span>
                              <span>Applied Load: <strong>{selectedApp.expectedLoad} {selectedApp.expectedLoadUnit}</strong></span>
                            </div>
                          )}

                          {st.step === 2 && selectedApp.assignedOfficer && (
                            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1.5 font-bold">
                              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Site Survey Engineer: {selectedApp.assignedOfficer}</span>
                            </div>
                          )}

                          {st.step === 5 && selectedApp.vendorName && (
                            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-purple-700 dark:text-purple-300 flex items-center gap-1.5 font-bold">
                              <PackageCheck className="w-3.5 h-3.5" />
                              <span>Fulfillment Partner: {selectedApp.vendorName} (Vendor Consignment Stock)</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Assistance & Helpline Box */}
              <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/60 dark:bg-slate-800/60 border border-emerald-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-center sm:text-left">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                      Have questions about your solar installation?
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      Our solar project desk is ready to assist with survey schedules, net metering & subsidy approvals.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href="tel:+919876543210"
                    className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    Call Desk
                  </a>
                  <a
                    href={`https://wa.me/919876543210?text=Hello%20MetaGreen,%20I%20would%20like%20an%20update%20on%20my%20solar%20application%20${selectedApp.displayId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/20"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    WhatsApp Update
                  </a>
                </div>
              </div>

            </div>
          )}

          {/* Empty State before any search */}
          {!hasSearched && (
            <div className="p-8 text-center bg-slate-50/70 dark:bg-slate-800/30 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 space-y-3">
              <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <Sun className="w-7 h-7" />
              </div>
              <h4 className="text-base font-black text-slate-800 dark:text-slate-200">
                Track Live Installation & PM Surya Ghar Subsidy
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Enter your 10-digit phone number or Application Reference ID above to see real-time rooftop survey reports, 3D solar layout approval, material dispatch, and DISCOM net-metering status.
              </p>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 font-medium shrink-0">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Encrypted & PM Surya Ghar Certified Milestone Tracking</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-emerald-600 transition-colors cursor-pointer"
          >
            Dismiss
          </button>
        </div>

      </div>
    </div>
  );
}
