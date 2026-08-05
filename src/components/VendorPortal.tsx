import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  FileText, 
  IndianRupee, 
  Package, 
  CheckCircle2, 
  Upload, 
  Clock, 
  FileCheck,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { exportToPDF, exportToExcel } from '@/src/lib/exportUtils';
import { collection, query, onSnapshot, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';

type TabType = 'po' | 'invoices' | 'payments' | 'dispatch';

export default function VendorPortal() {
  const [activeTab, setActiveTab] = useState<TabType>('po');
  const [pos, setPOs] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    const unsubPOs = onSnapshot(query(collection(db, 'purchaseOrders'), orderBy('date', 'desc')), (snapshot) => {
      setPOs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubPayments = onSnapshot(query(collection(db, 'vendorPayments'), orderBy('dueDate', 'desc')), (snapshot) => {
      setPayments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubPOs(); unsubPayments(); };
  }, []);

  const handleExportPO_PDF = () => {
    const headers = ['PO Number', 'Date', 'Items', 'Amount', 'Status'];
    const data = pos.map(po => [po.displayId || po.id, po.date, po.items, po.amount, po.status]);
    exportToPDF('Purchase Orders', headers, data);
  };

  const handleExportPO_Excel = () => {
    exportToExcel('Purchase Orders', pos);
  };

  const handleExportPayments_PDF = () => {
    const headers = ['Invoice No', 'PO Ref', 'Amount', 'Due Date', 'Status'];
    const data = payments.map(p => [p.invoice, p.po, p.amount, p.dueDate, p.status]);
    exportToPDF('Payments Report', headers, data);
  };

  const handleExportPayments_Excel = () => {
    exportToExcel('Payments Report', payments);
  };

  const handleAcceptPO = async (id: string) => {
    try {
      await updateDoc(doc(db, 'purchaseOrders', id), { status: 'Accepted' });
    } catch (err) {
      console.error(err);
    }
  };


  const renderContent = () => {
    switch (activeTab) {
      case 'po':
        return (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-end items-center bg-slate-50/50 gap-2">
              <button onClick={handleExportPO_PDF} className="px-3 py-2 bg-white border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm shadow-sm" title="Export PDF">
                <Download className="w-4 h-4 text-red-500" /> Export
              </button>
              <button onClick={handleExportPO_Excel} className="px-3 py-2 bg-emerald-50 border border-emerald-100 text-emerald-700 font-semibold rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-2 text-sm shadow-sm" title="Export Excel">
                <FileSpreadsheet className="w-4 h-4" /> Export
              </button>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white text-slate-500 text-xs font-bold uppercase tracking-widest border-b border-slate-100">
                  <th className="p-4">PO Number</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Items</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pos.map(po => (
                  <tr key={po.id} className="hover:bg-slate-50/50">
                    <td className="p-4 font-bold text-slate-900">{po.id}</td>
                    <td className="p-4 text-slate-600">{po.date}</td>
                    <td className="p-4 text-sm text-slate-600">{po.items}</td>
                    <td className="p-4 font-bold">{po.amount}</td>
                    <td className="p-4 text-center">
                      <span className={cn(
                        "px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border",
                        po.status === 'Accepted' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                      )}>{po.status}</span>
                    </td>
                    <td className="p-4 text-center">
                      {po.status === 'Accepted' ? (
                        <CheckCircle2 className="w-5 h-5 mx-auto text-slate-400" />
                      ) : (
                        <button onClick={() => handleAcceptPO(po.id)} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors">Accept PO</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'invoices':
        return (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center text-slate-500">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">Invoice Upload</h3>
            <p className="max-w-md mx-auto mb-6">Vendors can upload their invoices against accepted Purchase Orders for payment processing.</p>
            <div>
              <input type="file" id="vendor-invoice-upload" className="hidden" onChange={() => alert('Invoice uploaded successfully.')} />
              <label htmlFor="vendor-invoice-upload" className="cursor-pointer px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors inline-flex items-center gap-2 text-sm shadow-sm mx-auto">
                <Upload className="w-4 h-4" /> Upload Invoice
              </label>
            </div>
          </div>
        );
      case 'payments':
        return (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-end items-center bg-slate-50/50 gap-2">
              <button onClick={handleExportPayments_PDF} className="px-3 py-2 bg-white border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm shadow-sm" title="Export PDF">
                <Download className="w-4 h-4 text-red-500" /> Export
              </button>
              <button onClick={handleExportPayments_Excel} className="px-3 py-2 bg-emerald-50 border border-emerald-100 text-emerald-700 font-semibold rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-2 text-sm shadow-sm" title="Export Excel">
                <FileSpreadsheet className="w-4 h-4" /> Export
              </button>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white text-slate-500 text-xs font-bold uppercase tracking-widest border-b border-slate-100">
                  <th className="p-4">Invoice No</th>
                  <th className="p-4">PO Ref</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Due Date</th>
                  <th className="p-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="p-4 font-bold text-slate-900">{p.invoice}</td>
                    <td className="p-4 text-slate-600">{p.po}</td>
                    <td className="p-4 font-bold">{p.amount}</td>
                    <td className="p-4 text-slate-600">{p.dueDate}</td>
                    <td className="p-4 text-center">
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md text-[10px] font-black uppercase tracking-widest border border-emerald-100">{p.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'dispatch':
        return (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center text-slate-500">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">Dispatch & Delivery Tracking</h3>
            <p className="max-w-md mx-auto">Vendors can update dispatch details (LR number, Transporter, expected ETA) for materials sent to the site.</p>
          </div>
        );
    }
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Truck className="w-8 h-8 text-emerald-600" /> Vendor Portal
          </h1>
          <p className="text-slate-500 font-medium mt-1">Vendors can manage POs, invoices, and material dispatch.</p>
        </div>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { id: 'po', label: 'Purchase Orders', icon: FileCheck },
          { id: 'invoices', label: 'Invoices', icon: FileText },
          { id: 'payments', label: 'Payments', icon: IndianRupee },
          { id: 'dispatch', label: 'Dispatch Status', icon: Package },
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
    </div>
  );
}
