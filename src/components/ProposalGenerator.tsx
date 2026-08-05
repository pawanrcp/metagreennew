import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Mail, 
  Building2, 
  User, 
  Sun, 
  IndianRupee, 
  Percent, 
  Clock, 
  ShieldCheck, 
  CalendarClock,
  CheckCircle2,
  Settings,
  Zap
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';

export default function ProposalGenerator() {
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [isExporting, setIsExporting] = useState(false);
  const [isEmailing, setIsEmailing] = useState(false);

  const [proposalData, setProposalData] = useState({
    customerName: 'John Doe',
    customerAddress: '123 Solar Street, Green City',
    systemCapacity: 5, // kW
    estimatedGeneration: 7500, // kWh/year
    totalCost: 350000, // INR
    subsidy: 78000, // INR
    emiMonths: 60,
    interestRate: 8.5,
    paybackPeriod: 3.5, // years
    roi: 22, // %
    timelineDays: 14,
    panelWarranty: 25,
    inverterWarranty: 10
  });

  const netCost = proposalData.totalCost - proposalData.subsidy;
  const emiAmount = Math.round((netCost * Math.pow(1 + proposalData.interestRate / 100 / 12, proposalData.emiMonths)) / proposalData.emiMonths); // Simplified EMI calculation

  const handleExportPDF = async () => {
    const element = document.getElementById('proposal-preview-container');
    if (!element) {
      alert("Please switch to the Live Preview tab first.");
      return;
    }
    
    setIsExporting(true);
    try {
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      const pdf = new jsPDF('p', 'mm', 'a4');
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`Proposal_${proposalData.customerName.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('Error generating PDF', err);
      alert('Error generating PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleEmailProposal = async () => {
    const email = prompt("Enter customer email address to send proposal to:");
    if (!email) return;

    setIsEmailing(true);
    try {
      await addDoc(collection(db, 'mail'), {
        to: email,
        message: {
          subject: `Solar Proposal for ${proposalData.customerName}`,
          html: `<p>Dear ${proposalData.customerName},</p><p>Please find your customized solar proposal attached.</p><p>Total Cost: ₹${proposalData.totalCost}</p><p>System Capacity: ${proposalData.systemCapacity}kW</p>`,
        }
      });
      alert(`Proposal sent successfully to ${email}`);
    } catch (err) {
      console.error('Error sending email:', err);
      alert('Failed to send email.');
    } finally {
      setIsEmailing(false);
    }
  };

  const handleSaveProposal = async () => {
    try {
      await addDoc(collection(db, 'proposals'), {
        ...proposalData,
        netCost,
        emiAmount,
        createdAt: serverTimestamp()
      });
      alert('Proposal saved successfully to the database.');
    } catch (err) {
      console.error('Error saving proposal:', err);
      alert('Failed to save proposal.');
    }
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Proposal Generator</h1>
          <p className="text-slate-500 font-medium mt-1">Create, customize, and send solar proposals</p>
        </div>
        <div className="flex flex-wrap gap-2">
           <button 
             onClick={handleSaveProposal}
             className="px-4 py-2 bg-blue-50 text-blue-700 font-semibold rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2 text-sm border border-blue-200"
           >
             <ShieldCheck className="w-4 h-4" /> Save to DB
           </button>
           <button 
             onClick={handleExportPDF}
             disabled={isExporting}
             className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
           >
             {isExporting ? <Clock className="w-4 h-4 animate-spin"/> : <Download className="w-4 h-4" />} 
             {isExporting ? 'Generating PDF...' : 'Export PDF'}
           </button>
           <button 
             onClick={handleEmailProposal}
             disabled={isEmailing}
             className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 text-sm shadow-sm shadow-emerald-200 disabled:opacity-50"
           >
             {isEmailing ? <Clock className="w-4 h-4 animate-spin"/> : <Mail className="w-4 h-4" />}
             {isEmailing ? 'Sending Email...' : 'Email to Customer'}
           </button>
        </div>
      </header>

      <div className="flex overflow-x-auto pb-4 gap-2 no-scrollbar border-b border-slate-100">
        {[
          { id: 'editor', label: 'Proposal Editor', icon: Settings },
          { id: 'preview', label: 'Live Preview', icon: FileText },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap",
              activeTab === tab.id 
                ? "bg-emerald-100/80 text-emerald-800" 
                : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-200"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'editor' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                <User className="w-5 h-5 text-blue-500" /> Customer Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Customer Name</label>
                  <input type="text" value={proposalData.customerName} onChange={e => setProposalData({...proposalData, customerName: e.target.value})} className="w-full text-sm p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Address</label>
                  <input type="text" value={proposalData.customerAddress} onChange={e => setProposalData({...proposalData, customerAddress: e.target.value})} className="w-full text-sm p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                <Sun className="w-5 h-5 text-amber-500" /> System Specifications
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">System Capacity (kW)</label>
                  <input type="number" value={proposalData.systemCapacity} onChange={e => setProposalData({...proposalData, systemCapacity: Number(e.target.value)})} className="w-full text-sm p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Estimated Generation (kWh/yr)</label>
                  <input type="number" value={proposalData.estimatedGeneration} onChange={e => setProposalData({...proposalData, estimatedGeneration: Number(e.target.value)})} className="w-full text-sm p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                <IndianRupee className="w-5 h-5 text-emerald-600" /> Cost & Financials
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Total Cost (₹)</label>
                  <input type="number" value={proposalData.totalCost} onChange={e => setProposalData({...proposalData, totalCost: Number(e.target.value)})} className="w-full text-sm p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Estimated Subsidy (₹)</label>
                  <input type="number" value={proposalData.subsidy} onChange={e => setProposalData({...proposalData, subsidy: Number(e.target.value)})} className="w-full text-sm p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">EMI Tenure (Months)</label>
                  <input type="number" value={proposalData.emiMonths} onChange={e => setProposalData({...proposalData, emiMonths: Number(e.target.value)})} className="w-full text-sm p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Interest Rate (%)</label>
                  <input type="number" step="0.1" value={proposalData.interestRate} onChange={e => setProposalData({...proposalData, interestRate: Number(e.target.value)})} className="w-full text-sm p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                <Percent className="w-5 h-5 text-indigo-500" /> ROI & Payback
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Return on Investment (%)</label>
                  <input type="number" value={proposalData.roi} onChange={e => setProposalData({...proposalData, roi: Number(e.target.value)})} className="w-full text-sm p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Payback Period (Years)</label>
                  <input type="number" step="0.1" value={proposalData.paybackPeriod} onChange={e => setProposalData({...proposalData, paybackPeriod: Number(e.target.value)})} className="w-full text-sm p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" /> Warranty & Timeline
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Panel Warranty (Years)</label>
                  <input type="number" value={proposalData.panelWarranty} onChange={e => setProposalData({...proposalData, panelWarranty: Number(e.target.value)})} className="w-full text-sm p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Inverter Warranty (Years)</label>
                  <input type="number" value={proposalData.inverterWarranty} onChange={e => setProposalData({...proposalData, inverterWarranty: Number(e.target.value)})} className="w-full text-sm p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Installation Timeline (Days)</label>
                  <input type="number" value={proposalData.timelineDays} onChange={e => setProposalData({...proposalData, timelineDays: Number(e.target.value)})} className="w-full text-sm p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'preview' && (
        <div id="proposal-preview-container" className="bg-white border-2 border-slate-200 rounded-xl max-w-4xl mx-auto shadow-2xl overflow-hidden print:shadow-none print:border-none">
          {/* Cover Page */}
          <div className="p-12 border-b border-slate-100 bg-emerald-700 text-white flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-6">
              <Sun className="w-8 h-8 text-emerald-700" />
            </div>
            <h1 className="text-4xl font-black mb-4">Solar Energy Proposal</h1>
            <p className="text-emerald-100 text-lg mb-8 max-w-lg">Prepared exclusively for {proposalData.customerName} to power a sustainable and cost-effective future.</p>
            <div className="grid grid-cols-2 gap-12 text-left w-full max-w-2xl mt-8">
              <div>
                <p className="text-emerald-200 text-sm font-bold uppercase tracking-wider mb-1">Prepared For</p>
                <p className="font-medium text-lg">{proposalData.customerName}</p>
                <p className="text-emerald-100">{proposalData.customerAddress}</p>
              </div>
              <div>
                <p className="text-emerald-200 text-sm font-bold uppercase tracking-wider mb-1">Prepared By</p>
                <p className="font-medium text-lg flex items-center gap-2"><Building2 className="w-5 h-5"/> Meta Green Inc.</p>
                <p className="text-emerald-100">info@greenenergy.com</p>
              </div>
            </div>
          </div>

          <div className="p-12 space-y-12">
            {/* System Overview */}
            <div>
              <h2 className="text-2xl font-bold text-slate-900 border-b-2 border-emerald-500 pb-2 mb-6 inline-block">System Overview</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <Sun className="w-6 h-6 text-amber-500 mb-2" />
                  <p className="text-xs text-slate-500 font-bold uppercase">System Size</p>
                  <p className="text-xl font-bold text-slate-900">{proposalData.systemCapacity} kW</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <Zap className="w-6 h-6 text-blue-500 mb-2" />
                  <p className="text-xs text-slate-500 font-bold uppercase">Est. Generation</p>
                  <p className="text-xl font-bold text-slate-900">{proposalData.estimatedGeneration.toLocaleString()} kWh/yr</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <CalendarClock className="w-6 h-6 text-emerald-500 mb-2" />
                  <p className="text-xs text-slate-500 font-bold uppercase">Timeline</p>
                  <p className="text-xl font-bold text-slate-900">{proposalData.timelineDays} Days</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <ShieldCheck className="w-6 h-6 text-indigo-500 mb-2" />
                  <p className="text-xs text-slate-500 font-bold uppercase">Panel Warranty</p>
                  <p className="text-xl font-bold text-slate-900">{proposalData.panelWarranty} Years</p>
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div>
              <h2 className="text-2xl font-bold text-slate-900 border-b-2 border-emerald-500 pb-2 mb-6 inline-block">Financial Summary</h2>
              <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="font-medium">Total System Cost</span>
                    <span className="font-bold">₹{proposalData.totalCost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-emerald-600">
                    <span className="font-medium">Estimated Govt. Subsidy</span>
                    <span className="font-bold">- ₹{proposalData.subsidy.toLocaleString()}</span>
                  </div>
                  <div className="h-px bg-emerald-200 w-full my-2"></div>
                  <div className="flex justify-between items-center text-slate-900 text-lg">
                    <span className="font-bold">Net Payable Amount</span>
                    <span className="font-black">₹{netCost.toLocaleString()}</span>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm">
                    <p className="text-xs text-slate-500 font-bold uppercase mb-1 flex items-center gap-1"><IndianRupee className="w-3 h-3"/> EMI Option</p>
                    <p className="text-lg font-bold text-slate-900">₹{emiAmount.toLocaleString()} <span className="text-sm font-medium text-slate-500">/mo</span></p>
                    <p className="text-xs text-slate-400 mt-1">For {proposalData.emiMonths} months @ {proposalData.interestRate}% p.a.</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm">
                    <p className="text-xs text-slate-500 font-bold uppercase mb-1 flex items-center gap-1"><Percent className="w-3 h-3"/> Returns</p>
                    <div className="flex gap-4">
                      <div>
                        <p className="text-lg font-bold text-emerald-600">{proposalData.roi}%</p>
                        <p className="text-xs text-slate-400">ROI</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-blue-600">{proposalData.paybackPeriod} yrs</p>
                        <p className="text-xs text-slate-400">Payback</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Inclusions */}
            <div>
              <h2 className="text-2xl font-bold text-slate-900 border-b-2 border-emerald-500 pb-2 mb-6 inline-block">What's Included</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  "High Efficiency Tier-1 Solar Panels",
                  "Smart Grid-Tied Inverter",
                  "Galvanized Iron (GI) Mounting Structure",
                  "AC/DC Distribution Boxes with Surge Protection",
                  "Solar DC & AC Cables",
                  "Complete Installation & Commissioning",
                  "Net Metering Assistance & Application",
                  "1 Year Free Maintenance (AMC)"
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-slate-700 font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-12 text-center text-slate-400 text-sm italic">
              * This proposal is valid for 15 days from the date of generation. Final design and generation values may vary based on exact site conditions.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


