import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Calendar, 
  CheckCircle, 
  Wrench, 
  HelpCircle, 
  Activity, 
  Zap,
  CreditCard,
  FileCheck,
  Shield,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import jsPDF from 'jspdf';

export default function CustomerPortal() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'status' | 'documents' | 'payments' | 'monitoring' | 'support'>('status');

  const handleDownloadDoc = (docTitle: string) => {
    const pdf = new jsPDF();
    pdf.text(`Document: ${docTitle}`, 10, 10);
    pdf.text('This is a dynamically generated document.', 10, 20);
    pdf.save(`${docTitle.replace(/\s+/g, '_')}.pdf`);
  };

  const handleDownloadReceipt = (date: string, desc: string, amount: string) => {
    const pdf = new jsPDF();
    pdf.setFontSize(20);
    pdf.text('Payment Receipt', 10, 20);
    pdf.setFontSize(12);
    pdf.text(`Date: ${date}`, 10, 40);
    pdf.text(`Description: ${desc}`, 10, 50);
    pdf.text(`Amount: ${amount}`, 10, 60);
    pdf.text('Thank you for your business with Meta Green Solutions.', 10, 80);
    pdf.save(`Receipt_${date.replace(/\s+/g, '_')}.pdf`);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginEmail && loginPassword) {
      setIsLoggedIn(true);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Customer Portal</h2>
            <p className="text-slate-500 mt-2 text-sm">Login to track your solar installation</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email / Project ID</label>
              <input 
                type="text" 
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input 
                type="password"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none" 
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition-colors mt-2"
            >
              Secure Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'status':
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Installation Timeline</h3>
              <div className="relative">
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-100"></div>
                <div className="space-y-8">
                  {[
                    { title: 'Contract Signed', date: 'Oct 12, 2024', status: 'completed' },
                    { title: 'Site Inspection & Design', date: 'Oct 15, 2024', status: 'completed' },
                    { title: 'Permit Approval', date: 'Oct 28, 2024', status: 'completed' },
                    { title: 'Equipment Delivery', date: 'Nov 5, 2024', status: 'current' },
                    { title: 'Installation Scheduled', date: 'Nov 12, 2024 (Upcoming)', status: 'pending' },
                    { title: 'Grid Connection & Activation', date: 'TBD', status: 'pending' }
                  ].map((step, i) => (
                    <div key={i} className="flex gap-6 relative">
                      <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center shrink-0 border-4 border-white shadow-sm z-10",
                        step.status === 'completed' ? "bg-emerald-500 text-white" :
                        step.status === 'current' ? "bg-blue-500 text-white animate-pulse" :
                        "bg-slate-100 text-slate-400"
                      )}>
                        {step.status === 'completed' ? <CheckCircle className="w-5 h-5" /> : 
                         step.status === 'current' ? <Wrench className="w-5 h-5" /> : 
                         <Calendar className="w-5 h-5" />}
                      </div>
                      <div className="pt-2">
                        <h4 className={cn("font-bold text-lg", step.status === 'pending' ? "text-slate-400" : "text-slate-900")}>
                          {step.title}
                        </h4>
                        <p className="text-sm font-medium text-slate-500 mt-1">{step.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      case 'documents':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: 'Project Proposal', type: 'PDF', size: '2.4 MB', icon: FileText, date: 'Oct 10, 2024' },
              { title: 'Official Quotation', type: 'PDF', size: '1.1 MB', icon: FileCheck, date: 'Oct 12, 2024' },
              { title: 'System Warranty', type: 'PDF', size: '3.5 MB', icon: Shield, date: 'Pending Activation' },
              { title: 'Advance Invoice', type: 'PDF', size: '0.8 MB', icon: FileText, date: 'Oct 12, 2024' }
            ].map((doc, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                  <doc.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900">{doc.title}</h4>
                  <p className="text-xs font-medium text-slate-500 mt-1">{doc.date} • {doc.type} • {doc.size}</p>
                </div>
                <button onClick={() => handleDownloadDoc(doc.title)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <Download className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        );
      case 'payments':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                <p className="text-sm font-bold text-emerald-800 mb-1">Total System Cost</p>
                <h3 className="text-2xl font-black text-emerald-900">₹4,50,000</h3>
              </div>
              <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                <p className="text-sm font-bold text-blue-800 mb-1">Amount Paid</p>
                <h3 className="text-2xl font-black text-blue-900">₹1,50,000</h3>
              </div>
              <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100">
                <p className="text-sm font-bold text-amber-800 mb-1">Balance Remaining</p>
                <h3 className="text-2xl font-black text-amber-900">₹3,00,000</h3>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">Payment History & EMI</h3>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-6 py-4 font-bold text-slate-500">Date</th>
                    <th className="px-6 py-4 font-bold text-slate-500">Description</th>
                    <th className="px-6 py-4 font-bold text-slate-500">Amount</th>
                    <th className="px-6 py-4 font-bold text-slate-500">Status</th>
                    <th className="px-6 py-4 font-bold text-slate-500">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">Oct 12, 2024</td>
                    <td className="px-6 py-4 text-slate-600">Advance Payment (Booking)</td>
                    <td className="px-6 py-4 font-bold text-slate-900">₹1,50,000</td>
                    <td className="px-6 py-4"><span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 font-bold text-xs uppercase tracking-wider rounded-full">Paid</span></td>
                    <td className="px-6 py-4"><button onClick={() => handleDownloadReceipt('Oct 12, 2024', 'Advance Payment (Booking)', '₹1,50,000')} className="text-blue-600 font-medium hover:underline text-xs flex items-center gap-1"><Download className="w-3 h-3"/> Receipt</button></td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 transition-colors bg-amber-50/10">
                    <td className="px-6 py-4 font-medium text-slate-900">Nov 15, 2024</td>
                    <td className="px-6 py-4 text-slate-600">Equipment Delivery Milestone</td>
                    <td className="px-6 py-4 font-bold text-slate-900">₹1,50,000</td>
                    <td className="px-6 py-4"><span className="px-2.5 py-1 bg-amber-100 text-amber-700 font-bold text-xs uppercase tracking-wider rounded-full">Due Soon</span></td>
                    <td className="px-6 py-4"><button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition-colors">Pay Now</button></td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">Dec 15, 2024</td>
                    <td className="px-6 py-4 text-slate-600">Installation Completion</td>
                    <td className="px-6 py-4 font-bold text-slate-900">₹1,50,000</td>
                    <td className="px-6 py-4"><span className="px-2.5 py-1 bg-slate-100 text-slate-500 font-bold text-xs uppercase tracking-wider rounded-full">Pending</span></td>
                    <td className="px-6 py-4"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'monitoring':
        return (
          <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100">
              <Activity className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Monitoring Not Active</h3>
            <p className="text-slate-500 max-w-md mx-auto">Live generation monitoring will become available here once your system is installed and connected to the grid.</p>
          </div>
        );
      case 'support':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-xl font-bold text-slate-900 mb-6">Raise a Support Ticket</h3>
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Issue Category</label>
                    <select className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none bg-white">
                      <option>Installation Query</option>
                      <option>Payment & Invoicing</option>
                      <option>Technical Support</option>
                      <option>Warranty Claim</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                    <textarea 
                      rows={4}
                      placeholder="Please describe your issue in detail..."
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none resize-none"
                    ></textarea>
                  </div>
                  <button type="button" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-xl transition-colors">
                    Submit Ticket
                  </button>
                </form>
              </div>
            </div>
            <div>
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 h-full">
                <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><HelpCircle className="w-5 h-5 text-emerald-600"/> Contact Info</h4>
                <div className="space-y-4 text-sm font-medium text-slate-600">
                  <p><strong>Support Phone:</strong><br/> 1-800-SOLAR-NOW</p>
                  <p><strong>Email:</strong><br/> support@greenenergy.com</p>
                  <p><strong>Working Hours:</strong><br/> Mon - Sat, 9:00 AM - 6:00 PM</p>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Welcome, Sarah!</h1>
          <p className="text-slate-500 font-medium mt-1">Project ID: #PRJ-7829 • 5kW Premium System</p>
        </div>
        <button 
          onClick={() => setIsLoggedIn(false)}
          className="text-sm font-bold text-slate-400 hover:text-slate-700 transition-colors"
        >
          Logout
        </button>
      </header>

      <div className="flex overflow-x-auto pb-4 mb-6 gap-2 no-scrollbar border-b border-slate-100">
        {[
          { id: 'status', label: 'Project Status', icon: Calendar },
          { id: 'documents', label: 'Documents', icon: FileText },
          { id: 'payments', label: 'Payments & EMI', icon: CreditCard },
          { id: 'monitoring', label: 'Live Monitoring', icon: Activity },
          { id: 'support', label: 'Support', icon: HelpCircle },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap",
              activeTab === tab.id 
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-200" 
                : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-200"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {renderContent()}
    </div>
  );
}
