import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
  Receipt, 
  Calculator, 
  Sparkles, 
  Search, 
  Filter, 
  Download, 
  FileSpreadsheet, 
  Eye, 
  Trash2, 
  Printer, 
  Building2, 
  User, 
  ShieldCheck, 
  Phone, 
  MapPin, 
  Calendar, 
  IndianRupee, 
  CheckCircle2, 
  Clock, 
  Copy, 
  X,
  RefreshCw,
  ExternalLink,
  LayoutGrid,
  List,
  Sun,
  ArrowUpDown
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useAuth } from '@/src/context/AuthContext';
import { useToast } from '@/src/context/ToastContext';
import { GeneratedDocument, GeneratedDocType } from '@/src/types';
import { 
  subscribeGeneratedDocuments, 
  deleteGeneratedDocument, 
  updateGeneratedDocumentStatus,
  downloadDocumentPDF
} from '@/src/services/generatedDocuments.service';
import { exportToPDF, exportToExcel } from '@/src/lib/exportUtils';
import { useLogos } from '@/src/context/LogoContext';

interface GeneratedDocumentsListProps {
  initialTypeFilter?: 'all' | GeneratedDocType;
  filterCustomerId?: string;
  onSelectDocument?: (doc: GeneratedDocument) => void;
}

export default function GeneratedDocumentsList({ 
  initialTypeFilter = 'all',
  filterCustomerId 
}: GeneratedDocumentsListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { logos } = useLogos();

  const isGlobalAdmin = !user || user.role === 'Super Admin' || user.role === 'Solar Company Admin';
  const userOrg = (user?.companyName || user?.vendorAccount?.companyName || '').trim();
  const currentUid = user?.uid || '';
  const currentEmail = (user?.email || '').trim().toLowerCase();

  const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
  const [selectedType, setSelectedType] = useState<'all' | GeneratedDocType | 'all-invoices'>(initialTypeFilter);
  const [sortBy, setSortBy] = useState<'date' | 'value-desc' | 'value-asc'>('date');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [userFilter, setUserFilter] = useState('All');
  const [companyFilter, setCompanyFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [viewingDoc, setViewingDoc] = useState<GeneratedDocument | null>(null);

  // Real-time listener
  useEffect(() => {
    const unsubscribe = subscribeGeneratedDocuments((docs) => {
      setDocuments(docs);
    });
    return () => unsubscribe();
  }, []);

  // 1. Role-Based Scoping
  const roleScopedDocs = useMemo(() => {
    return documents.filter(doc => {
      // If customer filter is applied
      if (filterCustomerId && doc.customerId !== filterCustomerId) {
        return false;
      }

      if (isGlobalAdmin) return true;

      const docCompany = (doc.companyName || '').toLowerCase();
      const myCompany = userOrg.toLowerCase();
      const docEmail = (doc.userEmail || '').toLowerCase();
      const docUid = doc.userId || '';

      // Match by company name
      if (myCompany && docCompany && (docCompany === myCompany || docCompany.includes(myCompany) || myCompany.includes(docCompany))) {
        return true;
      }

      // Match by user creator
      if (docUid === currentUid || docEmail === currentEmail) {
        return true;
      }

      return false;
    });
  }, [documents, isGlobalAdmin, userOrg, currentUid, currentEmail, filterCustomerId]);

  // Unique users and companies for admin filters
  const uniqueCreators = useMemo(() => {
    const set = new Set<string>();
    documents.forEach(d => {
      if (d.userName) set.add(d.userName);
    });
    return Array.from(set).sort();
  }, [documents]);

  const uniqueCompanies = useMemo(() => {
    const set = new Set<string>();
    documents.forEach(d => {
      if (d.companyName) set.add(d.companyName);
    });
    return Array.from(set).sort();
  }, [documents]);

  // 2. Interactive Search & Filters
  const filteredDocs = useMemo(() => {
    let result = roleScopedDocs.filter(doc => {
      // Type filter
      if (selectedType === 'all-invoices') {
        if (doc.type !== 'invoice' && doc.type !== 'tax-invoice') {
          return false;
        }
      } else if (selectedType !== 'all' && doc.type !== selectedType) {
        return false;
      }

      // User filter (for Admin)
      if (userFilter !== 'All' && doc.userName !== userFilter) {
        return false;
      }

      // Company filter (for Admin)
      if (companyFilter !== 'All' && doc.companyName !== companyFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'All' && doc.status !== statusFilter) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchDocNo = doc.docNumber?.toLowerCase().includes(q);
        const matchName = doc.customerName?.toLowerCase().includes(q);
        const matchPhone = doc.customerPhone?.toLowerCase().includes(q);
        const matchCity = doc.city?.toLowerCase().includes(q);
        const matchCreator = doc.userName?.toLowerCase().includes(q);
        const matchCompany = doc.companyName?.toLowerCase().includes(q);

        if (!matchDocNo && !matchName && !matchPhone && !matchCity && !matchCreator && !matchCompany) {
          return false;
        }
      }

      return true;
    });

    if (sortBy === 'value-desc') {
      result = [...result].sort((a, b) => Number(b.totalAmount || 0) - Number(a.totalAmount || 0));
    } else if (sortBy === 'value-asc') {
      result = [...result].sort((a, b) => Number(a.totalAmount || 0) - Number(b.totalAmount || 0));
    }

    return result;
  }, [roleScopedDocs, selectedType, userFilter, companyFilter, statusFilter, searchQuery, sortBy]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalCount = roleScopedDocs.length;
    const totalVal = roleScopedDocs.reduce((sum, d) => sum + (Number(d.totalAmount) || 0), 0);
    const quotes = roleScopedDocs.filter(d => d.type === 'quotation');
    const proposals = roleScopedDocs.filter(d => d.type === 'proposal');
    const invoices = roleScopedDocs.filter(d => d.type === 'invoice');
    const taxInvoices = roleScopedDocs.filter(d => d.type === 'tax-invoice');

    const quotesVal = quotes.reduce((sum, d) => sum + (Number(d.totalAmount) || 0), 0);
    const invoicesVal = [...invoices, ...taxInvoices].reduce((sum, d) => sum + (Number(d.totalAmount) || 0), 0);

    return {
      totalCount,
      totalVal,
      quotesCount: quotes.length,
      proposalsCount: proposals.length,
      invoicesCount: invoices.length,
      taxInvoicesCount: taxInvoices.length,
      quotesVal,
      invoicesVal
    };
  }, [roleScopedDocs]);

  const handleDelete = async (docId: string, docNo: string) => {
    if (!window.confirm(`Are you sure you want to delete document "${docNo}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteGeneratedDocument(docId);
      toast.success(`Document "${docNo}" removed successfully!`, 'Deleted');
      if (viewingDoc?.id === docId) {
        setViewingDoc(null);
      }
    } catch (err: any) {
      toast.error('Failed to delete document: ' + (err.message || err));
    }
  };

  const handleCopyDocNo = (docNo: string) => {
    navigator.clipboard.writeText(docNo);
    toast.info(`Copied "${docNo}" to clipboard!`, 'Copied');
  };

  // Re-download PDF handler - downloads previously generated client document PDF
  const handleReDownload = (docItem: GeneratedDocument) => {
    try {
      toast.info(`Preparing ${docItem.type.toUpperCase()} #${docItem.docNumber} for ${docItem.customerName}...`, 'Downloading Document');
      downloadDocumentPDF(docItem, logos);
    } catch (err: any) {
      console.error('Re-download error:', err);
      toast.error('Failed to download document PDF: ' + (err.message || err));
    }
  };

  const handleExportPDFList = () => {
    exportToPDF(
      isGlobalAdmin ? 'All Generated Documents (Global Directory)' : `${userOrg || 'My Team'} Generated Documents`,
      ['Type', 'Doc Number', 'Customer Name', 'Phone', 'Amount (Rs)', 'Created By', 'Company', 'Date'],
      filteredDocs.map(d => [
        d.type.toUpperCase(),
        d.docNumber,
        d.customerName,
        d.customerPhone || '-',
        `Rs. ${Number(d.totalAmount).toLocaleString()}`,
        d.userName,
        d.companyName,
        d.createdAt?.toDate ? d.createdAt.toDate().toLocaleDateString() : 'Recent'
      ])
    );
  };

  const handleExportExcelList = () => {
    exportToExcel(
      isGlobalAdmin ? 'All Generated Documents' : `${userOrg || 'My Team'} Documents`,
      filteredDocs.map(d => ({
        Type: d.type.toUpperCase(),
        DocNumber: d.docNumber,
        CustomerName: d.customerName,
        Phone: d.customerPhone || '',
        Address: d.customerAddress || '',
        TotalAmount: d.totalAmount,
        CapacityKw: d.systemCapacityKw || '',
        CreatedBy: d.userName,
        UserEmail: d.userEmail,
        UserRole: d.userRole,
        Company: d.companyName,
        Status: d.status
      }))
    );
  };

  const getTypeBadge = (type: GeneratedDocType) => {
    switch (type) {
      case 'quotation':
        return {
          label: 'Estimate / Quote',
          icon: Calculator,
          classes: 'bg-emerald-50 text-emerald-700 border-emerald-200'
        };
      case 'proposal':
        return {
          label: 'Solar Proposal',
          icon: Sparkles,
          classes: 'bg-purple-50 text-purple-700 border-purple-200'
        };
      case 'invoice':
        return {
          label: 'Commercial Invoice',
          icon: FileText,
          classes: 'bg-blue-50 text-blue-700 border-blue-200'
        };
      case 'tax-invoice':
        return {
          label: 'GST Tax Invoice',
          icon: Receipt,
          classes: 'bg-amber-50 text-amber-700 border-amber-200'
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Scope Banner */}
      {isGlobalAdmin ? (
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 shadow-xl border border-slate-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shadow-inner shrink-0">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-widest uppercase bg-amber-400/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                  Global HQ Directory
                </span>
                <span className="text-xs text-slate-400">All Platform Users & Organizations</span>
              </div>
              <h2 className="text-xl font-black text-white mt-1">Generated Documents & Billing History</h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Complete audit trail of all Quotations, Proposals, Commercial Invoices, and GST Tax Invoices generated across every branch and vendor.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="text-xs font-bold text-slate-300 bg-white/10 px-3.5 py-2 rounded-xl border border-white/10">
              Admin: <strong className="text-white">{user?.name}</strong>
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-emerald-700/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-400/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shadow-inner shrink-0">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-widest uppercase bg-emerald-400/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                  Team Scoped Directory
                </span>
                <span className="text-xs text-emerald-200/80">{userOrg || 'My Team'}</span>
              </div>
              <h2 className="text-xl font-black text-white mt-1">
                {userOrg ? `${userOrg} - Generated Documents` : 'My Generated Documents'}
              </h2>
              <p className="text-xs text-emerald-100/70 mt-0.5">
                Showing all quotations, proposals, and invoices generated by your team and account.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="text-xs font-bold text-emerald-100 bg-white/10 px-3.5 py-2 rounded-xl border border-white/10">
              Logged in: <strong className="text-white">{user?.name}</strong> ({user?.role})
            </span>
          </div>
        </div>
      )}

      {/* 5 Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* 1. Total Generated */}
        <button
          type="button"
          onClick={() => {
            setSelectedType('all');
            setStatusFilter('All');
            setUserFilter('All');
            setCompanyFilter('All');
            setSearchQuery('');
            setSortBy('date');
          }}
          className={cn(
            "p-4 rounded-2xl border text-left transition-all cursor-pointer shadow-xs hover:shadow-md hover:-translate-y-0.5 group",
            selectedType === 'all' && sortBy !== 'value-desc'
              ? "bg-slate-900 text-white border-slate-900 ring-2 ring-slate-900/40"
              : "bg-white text-slate-900 border-slate-200 hover:border-slate-400"
          )}
          title="Click to view all generated documents and reset filters"
        >
          <div className="flex items-center justify-between mb-1">
            <span className={cn(
              "text-[10px] font-black uppercase tracking-wider block",
              selectedType === 'all' && sortBy !== 'value-desc' ? "text-slate-300" : "text-slate-400"
            )}>
              Total Generated
            </span>
            <FileText className={cn("w-3.5 h-3.5", selectedType === 'all' && sortBy !== 'value-desc' ? "text-emerald-400" : "text-slate-400")} />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black">{metrics.totalCount}</span>
            <span className={cn("text-[11px] font-bold", selectedType === 'all' && sortBy !== 'value-desc' ? "text-slate-300" : "text-slate-500")}>docs</span>
          </div>
          <span className={cn("text-[10px] font-semibold mt-1 block", selectedType === 'all' && sortBy !== 'value-desc' ? "text-emerald-300" : "text-slate-400")}>
            Click to show all
          </span>
        </button>

        {/* 2. Total Portfolio Value */}
        <button
          type="button"
          onClick={() => {
            setSortBy(prev => prev === 'value-desc' ? 'date' : 'value-desc');
          }}
          className={cn(
            "p-4 rounded-2xl border text-left transition-all cursor-pointer shadow-xs hover:shadow-md hover:-translate-y-0.5 group",
            sortBy === 'value-desc'
              ? "bg-emerald-700 text-white border-emerald-700 ring-2 ring-emerald-500/50"
              : "bg-white text-slate-900 border-slate-200 hover:border-emerald-400"
          )}
          title="Click to sort documents by highest total value"
        >
          <div className="flex items-center justify-between mb-1">
            <span className={cn(
              "text-[10px] font-black uppercase tracking-wider block",
              sortBy === 'value-desc' ? "text-emerald-100" : "text-emerald-600"
            )}>
              Portfolio Value
            </span>
            <IndianRupee className={cn("w-3.5 h-3.5", sortBy === 'value-desc' ? "text-white" : "text-emerald-600")} />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={cn("text-xl font-black", sortBy === 'value-desc' ? "text-white" : "text-emerald-700")}>
              ₹{metrics.totalVal.toLocaleString()}
            </span>
          </div>
          <span className={cn("text-[10px] font-semibold mt-1 block", sortBy === 'value-desc' ? "text-emerald-200" : "text-emerald-600")}>
            {sortBy === 'value-desc' ? 'Sorted: Highest Value First' : 'Click to sort by value'}
          </span>
        </button>

        {/* 3. Invoices Generated */}
        <button
          type="button"
          onClick={() => {
            if (selectedType === 'all-invoices') setSelectedType('tax-invoice');
            else if (selectedType === 'tax-invoice') setSelectedType('invoice');
            else setSelectedType('all-invoices');
          }}
          className={cn(
            "p-4 rounded-2xl border text-left transition-all cursor-pointer shadow-xs hover:shadow-md hover:-translate-y-0.5 group",
            selectedType === 'all-invoices' || selectedType === 'invoice' || selectedType === 'tax-invoice'
              ? "bg-blue-700 text-white border-blue-700 ring-2 ring-blue-500/50"
              : "bg-white text-slate-900 border-slate-200 hover:border-blue-400"
          )}
          title="Click to filter by Invoices (Commercial & GST Tax Invoices)"
        >
          <div className="flex items-center justify-between mb-1">
            <span className={cn(
              "text-[10px] font-black uppercase tracking-wider block",
              selectedType === 'all-invoices' || selectedType === 'invoice' || selectedType === 'tax-invoice' ? "text-blue-100" : "text-blue-600"
            )}>
              Invoices Generated
            </span>
            <Receipt className={cn("w-3.5 h-3.5", selectedType === 'all-invoices' || selectedType === 'invoice' || selectedType === 'tax-invoice' ? "text-white" : "text-blue-600")} />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={cn("text-xl font-black", selectedType === 'all-invoices' || selectedType === 'invoice' || selectedType === 'tax-invoice' ? "text-white" : "text-blue-600")}>
              {metrics.invoicesCount + metrics.taxInvoicesCount}
            </span>
            <span className={cn("text-[10px] font-bold", selectedType === 'all-invoices' || selectedType === 'invoice' || selectedType === 'tax-invoice' ? "text-blue-100" : "text-slate-400")}>
              (₹{metrics.invoicesVal.toLocaleString()})
            </span>
          </div>
          <span className={cn("text-[10px] font-semibold mt-1 block", selectedType === 'all-invoices' || selectedType === 'invoice' || selectedType === 'tax-invoice' ? "text-blue-200" : "text-blue-600")}>
            {selectedType === 'all-invoices' ? 'Showing All Invoices' : selectedType === 'tax-invoice' ? 'Showing GST Invoices' : selectedType === 'invoice' ? 'Showing Commercial' : 'Click to filter invoices'}
          </span>
        </button>

        {/* 4. Estimates / Quotes */}
        <button
          type="button"
          onClick={() => {
            setSelectedType(selectedType === 'quotation' ? 'all' : 'quotation');
          }}
          className={cn(
            "p-4 rounded-2xl border text-left transition-all cursor-pointer shadow-xs hover:shadow-md hover:-translate-y-0.5 group",
            selectedType === 'quotation'
              ? "bg-teal-700 text-white border-teal-700 ring-2 ring-teal-500/50"
              : "bg-white text-slate-900 border-slate-200 hover:border-teal-400"
          )}
          title="Click to filter by Quotations & Estimates"
        >
          <div className="flex items-center justify-between mb-1">
            <span className={cn(
              "text-[10px] font-black uppercase tracking-wider block",
              selectedType === 'quotation' ? "text-teal-100" : "text-teal-700"
            )}>
              Estimates / Quotes
            </span>
            <Calculator className={cn("w-3.5 h-3.5", selectedType === 'quotation' ? "text-white" : "text-teal-700")} />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={cn("text-xl font-black", selectedType === 'quotation' ? "text-white" : "text-teal-700")}>
              {metrics.quotesCount}
            </span>
            <span className={cn("text-[10px] font-bold", selectedType === 'quotation' ? "text-teal-100" : "text-slate-400")}>
              (₹{metrics.quotesVal.toLocaleString()})
            </span>
          </div>
          <span className={cn("text-[10px] font-semibold mt-1 block", selectedType === 'quotation' ? "text-teal-200" : "text-teal-700")}>
            {selectedType === 'quotation' ? 'Showing Quotes' : 'Click to filter quotes'}
          </span>
        </button>

        {/* 5. Proposals */}
        <button
          type="button"
          onClick={() => {
            setSelectedType(selectedType === 'proposal' ? 'all' : 'proposal');
          }}
          className={cn(
            "p-4 rounded-2xl border text-left transition-all cursor-pointer shadow-xs hover:shadow-md hover:-translate-y-0.5 group",
            selectedType === 'proposal'
              ? "bg-purple-700 text-white border-purple-700 ring-2 ring-purple-500/50"
              : "bg-white text-slate-900 border-slate-200 hover:border-purple-400"
          )}
          title="Click to filter by Solar Proposals"
        >
          <div className="flex items-center justify-between mb-1">
            <span className={cn(
              "text-[10px] font-black uppercase tracking-wider block",
              selectedType === 'proposal' ? "text-purple-100" : "text-purple-600"
            )}>
              Proposals
            </span>
            <Sparkles className={cn("w-3.5 h-3.5", selectedType === 'proposal' ? "text-white" : "text-purple-600")} />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={cn("text-xl font-black", selectedType === 'proposal' ? "text-white" : "text-purple-600")}>
              {metrics.proposalsCount}
            </span>
            <span className={cn("text-[11px] font-bold", selectedType === 'proposal' ? "text-purple-100" : "text-slate-500")}>custom</span>
          </div>
          <span className={cn("text-[10px] font-semibold mt-1 block", selectedType === 'proposal' ? "text-purple-200" : "text-purple-600")}>
            {selectedType === 'proposal' ? 'Showing Proposals' : 'Click to filter proposals'}
          </span>
        </button>
      </div>

      {/* Type Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'All Documents', count: roleScopedDocs.length, icon: FileText },
          { id: 'quotation', label: 'Quotations / Estimates', count: metrics.quotesCount, icon: Calculator },
          { id: 'invoice', label: 'Commercial Invoices', count: metrics.invoicesCount, icon: FileText },
          { id: 'tax-invoice', label: 'GST Tax Invoices', count: metrics.taxInvoicesCount, icon: Receipt },
          { id: 'proposal', label: 'Solar Proposals', count: metrics.proposalsCount, icon: Sparkles },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = selectedType === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedType(tab.id as any)}
              className={cn(
                "px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 whitespace-nowrap transition-all border cursor-pointer",
                isActive 
                  ? "bg-slate-900 text-white border-slate-900 shadow-sm" 
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              )}
            >
              <Icon className={cn("w-3.5 h-3.5", isActive ? "text-emerald-400" : "text-slate-400")} />
              <span>{tab.label}</span>
              <span className={cn(
                "text-[10px] font-black px-1.5 py-0.2 rounded-full",
                isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
              )}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & Action Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative min-w-[220px] flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by doc no, customer, phone, creator, city..."
              className="w-full pl-9 pr-8 py-2 text-xs font-semibold border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* User Creator Filter (Admin) */}
          {isGlobalAdmin && (
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[10px] font-black text-slate-400 uppercase">User:</span>
              <select
                value={userFilter}
                onChange={e => setUserFilter(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
              >
                <option value="All">All Users</option>
                {uniqueCreators.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          )}

          {/* Company Filter (Admin) */}
          {isGlobalAdmin && (
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[10px] font-black text-slate-400 uppercase">Company:</span>
              <select
                value={companyFilter}
                onChange={e => setCompanyFilter(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
              >
                <option value="All">All Companies</option>
                {uniqueCompanies.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
            <span className="text-[10px] font-black text-slate-400 uppercase">Status:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Generated">Generated</option>
              <option value="Sent">Sent</option>
              <option value="Approved">Approved</option>
              <option value="Paid">Paid</option>
            </select>
          </div>

          {(searchQuery || userFilter !== 'All' || companyFilter !== 'All' || statusFilter !== 'All') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setUserFilter('All');
                setCompanyFilter('All');
                setStatusFilter('All');
              }}
              className="text-xs font-bold text-rose-600 hover:underline px-2 py-1"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* View Mode & Action Buttons */}
        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={cn(
                "px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                viewMode === 'cards' ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
              )}
              title="Cards Grid View - Click any card to inspect"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="text-[11px]">Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={cn(
                "px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                viewMode === 'table' ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
              )}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
              <span className="text-[11px]">Table</span>
            </button>
          </div>

          <button
            onClick={handleExportPDFList}
            className="px-3 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-1.5 text-xs shadow-xs cursor-pointer"
            title="Export list to PDF"
          >
            <Download className="w-3.5 h-3.5 text-red-500" /> PDF
          </button>
          <button
            onClick={handleExportExcelList}
            className="px-3 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold rounded-xl hover:bg-emerald-100 transition-colors flex items-center gap-1.5 text-xs shadow-xs cursor-pointer"
            title="Export list to Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Excel
          </button>
        </div>
      </div>

      {/* Documents Rendering: Cards Grid or Table */}
      {viewMode === 'cards' ? (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocs.map(docItem => {
              const badge = getTypeBadge(docItem.type);
              const BadgeIcon = badge.icon;
              const isMyDoc = docItem.userId === currentUid || (docItem.userEmail && docItem.userEmail.toLowerCase() === currentEmail);

              return (
                <div
                  key={docItem.id}
                  onClick={() => setViewingDoc(docItem)}
                  className="bg-white rounded-2xl p-5 border border-slate-200/90 hover:border-emerald-500 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col justify-between group relative"
                  title="Click anywhere on card to inspect preferred data"
                >
                  <div className="space-y-3">
                    {/* Header: Type & Status Badges */}
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn(
                        "px-2.5 py-1 rounded-xl text-[10px] font-black border inline-flex items-center gap-1.5 uppercase tracking-wider",
                        badge.classes
                      )}>
                        <BadgeIcon className="w-3 h-3" />
                        {badge.label}
                      </span>

                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border inline-flex items-center gap-1",
                        docItem.status === 'Approved' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        docItem.status === 'Paid' ? "bg-purple-50 text-purple-700 border-purple-200" :
                        docItem.status === 'Sent' ? "bg-blue-50 text-blue-700 border-blue-200" :
                        "bg-slate-100 text-slate-700 border-slate-200"
                      )}>
                        <span className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          docItem.status === 'Approved' ? "bg-emerald-500" :
                          docItem.status === 'Paid' ? "bg-purple-500" :
                          docItem.status === 'Sent' ? "bg-blue-500" : "bg-slate-400"
                        )} />
                        {docItem.status}
                      </span>
                    </div>

                    {/* Doc Number & System Capacity */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-900 text-xs">{docItem.docNumber}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyDocNo(docItem.docNumber);
                          }}
                          title="Copy Document Number"
                          className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>

                      {docItem.systemCapacityKw ? (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg text-[10px] font-black flex items-center gap-1">
                          <Sun className="w-3 h-3 text-amber-600" /> {docItem.systemCapacityKw} kW
                        </span>
                      ) : null}
                    </div>

                    {/* Customer Info */}
                    <div className="space-y-1 pt-1">
                      <h3 className="font-black text-slate-900 text-sm group-hover:text-emerald-700 transition-colors">
                        {docItem.customerName}
                      </h3>
                      {docItem.customerPhone && (
                        <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {docItem.customerPhone}
                        </p>
                      )}
                      {(docItem.city || docItem.state) && (
                        <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {docItem.city ? `${docItem.city}, ${docItem.state}` : docItem.state}
                        </p>
                      )}
                    </div>

                    {/* Financial Total */}
                    <div className="pt-3 border-t border-slate-100 flex items-baseline justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Grand Total</span>
                        <span className="text-lg font-black text-slate-900 flex items-center gap-0.5">
                          <IndianRupee className="w-4 h-4 text-emerald-600" />
                          {Number(docItem.totalAmount || 0).toLocaleString()}
                        </span>
                      </div>
                      {docItem.taxAmount ? (
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                          GST: ₹{Number(docItem.taxAmount).toLocaleString()}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Card Footer: Creator info, inspection, and Re-Download PDF */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs mt-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-lg bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                        {(docItem.userName || 'U').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="truncate max-w-[120px]">
                        <span className="font-bold text-slate-800 text-[11px] block truncate">
                          {docItem.userName || 'Admin'}
                        </span>
                        <span className="text-[9px] text-slate-400 block truncate">
                          {docItem.companyName || 'Global HQ'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingDoc(docItem);
                        }}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                        title="View Document Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReDownload(docItem);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                        title="Re-Download PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span className="text-[11px]">PDF</span>
                      </button>
                      {(isGlobalAdmin || isMyDoc) && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(docItem.id, docItem.docNumber);
                          }}
                          title="Delete Document"
                          className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredDocs.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs py-16 px-4 text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                <FileText className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-slate-900">No generated documents found</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                {searchQuery || userFilter !== 'All' || companyFilter !== 'All' || statusFilter !== 'All'
                  ? 'No documents match your active search and filter criteria.'
                  : 'No quotations, proposals, or invoices have been recorded yet.'}
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="p-4">Document / Reference</th>
                  <th className="p-4">Customer Details</th>
                  <th className="p-4">Total Amount</th>
                  <th className="p-4">Generated By (User)</th>
                  <th className="p-4">Date & Time</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDocs.map(docItem => {
                  const badge = getTypeBadge(docItem.type);
                  const BadgeIcon = badge.icon;
                  const isMyDoc = docItem.userId === currentUid || (docItem.userEmail && docItem.userEmail.toLowerCase() === currentEmail);

                  return (
                    <tr 
                      key={docItem.id} 
                      onClick={() => setViewingDoc(docItem)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      title="Click row to inspect full document details"
                    >
                      {/* Document type & Number */}
                      <td className="p-4">
                        <div className="space-y-1">
                          <span className={cn(
                            "px-2 py-0.5 rounded-lg text-[10px] font-black border inline-flex items-center gap-1 uppercase tracking-wider",
                            badge.classes
                          )}>
                            <BadgeIcon className="w-3 h-3" />
                            {badge.label}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-slate-900 text-xs">{docItem.docNumber}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyDocNo(docItem.docNumber);
                              }}
                              title="Copy Document Number"
                              className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                          {docItem.systemCapacityKw ? (
                            <span className="text-[10px] font-bold text-slate-500 block">
                              {docItem.systemCapacityKw} kW System
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Customer info */}
                      <td className="p-4">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-900 text-xs block group-hover:text-emerald-700 transition-colors">{docItem.customerName}</span>
                          {docItem.customerPhone && (
                            <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {docItem.customerPhone}
                            </span>
                          )}
                          {(docItem.city || docItem.state) && (
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {docItem.city ? `${docItem.city}, ${docItem.state}` : docItem.state}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Total Amount */}
                      <td className="p-4">
                        <div className="space-y-0.5">
                          <span className="font-black text-slate-900 text-sm flex items-center gap-0.5">
                            <IndianRupee className="w-3.5 h-3.5 text-slate-400" />
                            {Number(docItem.totalAmount || 0).toLocaleString()}
                          </span>
                          {docItem.taxAmount ? (
                            <span className="text-[10px] font-semibold text-slate-400 block">
                              Tax: ₹{Number(docItem.taxAmount).toLocaleString()}
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Creator User info */}
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-lg bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                              {(docItem.userName || 'U').slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 text-xs block truncate max-w-[130px]">
                                {docItem.userName || 'Admin'}
                              </span>
                              {isMyDoc && (
                                <span className="text-[9px] font-black uppercase text-emerald-700 bg-emerald-100 px-1 py-0.2 rounded border border-emerald-200">
                                  You
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 block truncate max-w-[150px]">
                            {docItem.companyName || 'Global HQ'}
                          </span>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="p-4 text-xs font-medium text-slate-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>
                            {docItem.createdAt?.toDate 
                              ? docItem.createdAt.toDate().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                              : 'Just now'}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border inline-flex items-center gap-1.5",
                          docItem.status === 'Approved' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                          docItem.status === 'Paid' ? "bg-purple-50 text-purple-700 border-purple-200" :
                          docItem.status === 'Sent' ? "bg-blue-50 text-blue-700 border-blue-200" :
                          "bg-slate-100 text-slate-700 border-slate-200"
                        )}>
                          <span className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            docItem.status === 'Approved' ? "bg-emerald-500" :
                            docItem.status === 'Paid' ? "bg-purple-500" :
                            docItem.status === 'Sent' ? "bg-blue-500" :
                            "bg-slate-400"
                          )} />
                          {docItem.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingDoc(docItem);
                            }}
                            title="View Document Details"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReDownload(docItem);
                            }}
                            title="Print / Re-Download PDF"
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          {(isGlobalAdmin || isMyDoc) && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(docItem.id, docItem.docNumber);
                              }}
                              title="Delete Document"
                              className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredDocs.length === 0 && (
            <div className="py-16 px-4 text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                <FileText className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-slate-900">No generated documents found</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                {searchQuery || userFilter !== 'All' || companyFilter !== 'All'
                  ? 'No documents match your active search and filter criteria.'
                  : 'No quotations, proposals, or invoices have been recorded yet.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* View Document Details Modal */}
      {viewingDoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 my-8">
            <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black">
                    {viewingDoc.type.toUpperCase()} #{viewingDoc.docNumber}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Generated for {viewingDoc.customerName}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setViewingDoc(null)} 
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs">
              {/* Top Meta info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase block">Grand Total</span>
                  <span className="text-base font-black text-emerald-700">₹{Number(viewingDoc.totalAmount).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase block">System Size</span>
                  <span className="text-xs font-bold text-slate-700">{viewingDoc.systemCapacityKw || '5'} kW</span>
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase block">Created By</span>
                  <span className="text-xs font-bold text-slate-800 truncate block">{viewingDoc.userName}</span>
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase block">Company</span>
                  <span className="text-xs font-bold text-slate-800 truncate block">{viewingDoc.companyName}</span>
                </div>
              </div>

              {/* Customer Info */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Customer Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div><strong className="text-slate-500">Name:</strong> {viewingDoc.customerName}</div>
                  <div><strong className="text-slate-500">Phone:</strong> {viewingDoc.customerPhone || 'N/A'}</div>
                  <div><strong className="text-slate-500">Address:</strong> {viewingDoc.customerAddress || 'N/A'}</div>
                  <div><strong className="text-slate-500">Location:</strong> {viewingDoc.city ? `${viewingDoc.city}, ${viewingDoc.state}` : viewingDoc.state || 'N/A'}</div>
                </div>
              </div>

              {/* Line Items */}
              {viewingDoc.items && viewingDoc.items.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Itemized Breakdown</h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-2.5">Item</th>
                          <th className="p-2.5 text-center">Qty</th>
                          <th className="p-2.5 text-right">Rate</th>
                          <th className="p-2.5 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {viewingDoc.items.map((item: any, i: number) => (
                          <tr key={i}>
                            <td className="p-2.5 font-medium text-slate-800">{item.name || item.description}</td>
                            <td className="p-2.5 text-center text-slate-600">{item.quantity || 1}</td>
                            <td className="p-2.5 text-right text-slate-600">₹{Number(item.unitPrice || item.rate || 0).toLocaleString()}</td>
                            <td className="p-2.5 text-right font-bold text-slate-900">₹{Number(item.amount || (item.quantity * item.unitPrice) || 0).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Actions Footer */}
              <div className="pt-4 border-t border-slate-100 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setViewingDoc(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handleReDownload(viewingDoc)}
                  className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-200"
                >
                  <Download className="w-4 h-4" /> Re-Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
