import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Download, 
  FileSpreadsheet, 
  TrendingUp, 
  Users, 
  Sun, 
  Wrench, 
  Package, 
  IndianRupee, 
  HeartHandshake, 
  Landmark, 
  UserCheck 
} from 'lucide-react';
import { exportToPDF, exportToExcel } from '@/src/lib/exportUtils';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';

const reports = [
  { id: 'sales', title: 'Sales & Lead Conversion', icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-50', desc: 'Lead win rate, salesperson performance, revenue pipeline.' },
  { id: 'installation', title: 'Installation Progress', icon: Sun, color: 'text-amber-500', bg: 'bg-amber-50', desc: 'Average installation time, active projects, delays.' },
  { id: 'revenue', title: 'Revenue & Finance', icon: IndianRupee, color: 'text-emerald-500', bg: 'bg-emerald-50', desc: 'Cash flow, pending payments, invoice aging, profitability.' },
  { id: 'inventory', title: 'Inventory Levels', icon: Package, color: 'text-indigo-500', bg: 'bg-indigo-50', desc: 'Stock availability, reorder alerts, material consumption.' },
  { id: 'amc', title: 'AMC & Maintenance', icon: Wrench, color: 'text-slate-500', bg: 'bg-slate-50', desc: 'Upcoming scheduled maintenance, support ticket resolution.' },
  { id: 'energy', title: 'Energy Generation', icon: Sun, color: 'text-orange-500', bg: 'bg-orange-50', desc: 'Actual vs predicted yield across commissioned sites.' },
  { id: 'csat', title: 'Customer Satisfaction', icon: HeartHandshake, color: 'text-pink-500', bg: 'bg-pink-50', desc: 'NPS scores, feedback ratings from completed projects.' },
  { id: 'subsidy', title: 'Subsidy Status', icon: Landmark, color: 'text-teal-500', bg: 'bg-teal-50', desc: 'Applications filed, approved, amount disbursed.' },
  { id: 'productivity', title: 'Employee Productivity', icon: UserCheck, color: 'text-violet-500', bg: 'bg-violet-50', desc: 'Installer efficiency, attendance, site survey completion rates.' }
];

export default function Reporting() {
  const [metrics, setMetrics] = useState([
    { Month: 'Jan', Value: 0 },
    { Month: 'Feb', Value: 0 },
    { Month: 'Mar', Value: 0 },
    { Month: 'Apr', Value: 0 },
    { Month: 'May', Value: 0 },
    { Month: 'Jun', Value: 0 },
    { Month: 'Jul', Value: 0 },
    { Month: 'Aug', Value: 0 },
    { Month: 'Sep', Value: 0 },
    { Month: 'Oct', Value: 0 },
    { Month: 'Nov', Value: 0 },
    { Month: 'Dec', Value: 0 }
  ]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'projects'), (snapshot) => {
      const newMetrics = [
        { Month: 'Jan', Value: 0 },
        { Month: 'Feb', Value: 0 },
        { Month: 'Mar', Value: 0 },
        { Month: 'Apr', Value: 0 },
        { Month: 'May', Value: 0 },
        { Month: 'Jun', Value: 0 },
        { Month: 'Jul', Value: 0 },
        { Month: 'Aug', Value: 0 },
        { Month: 'Sep', Value: 0 },
        { Month: 'Oct', Value: 0 },
        { Month: 'Nov', Value: 0 },
        { Month: 'Dec', Value: 0 }
      ];
      
      let maxVal = 0;
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.createdAt && typeof data.createdAt.toDate === 'function') {
          const month = data.createdAt.toDate().getMonth();
          newMetrics[month].Value += 1;
          if (newMetrics[month].Value > maxVal) maxVal = newMetrics[month].Value;
        }
      });
      
      // Normalize values to 0-100% for the chart if maxVal > 0
      if (maxVal > 0) {
        newMetrics.forEach(m => {
          m.Value = Math.round((m.Value / maxVal) * 100);
        });
      }
      setMetrics(newMetrics);
    });

    return () => unsub();
  }, []);

  const handleExportPDF = () => {
    const headers = ['Report Category', 'Description'];
    const data = reports.map(r => [r.title, r.desc]);
    exportToPDF('Available Reports Overview', headers, data);
  };

  const handleExportExcel = () => {
    const data = reports.map(r => ({
      'Report Category': r.title,
      'Description': r.desc
    }));
    exportToExcel('Available Reports Overview', data);
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <BarChart className="w-8 h-8 text-emerald-600" /> Reports & Analytics
          </h1>
          <p className="text-slate-500 font-medium mt-1">Generate and export comprehensive business reports.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportPDF} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm shadow-sm">
            <Download className="w-4 h-4 text-red-500" /> Export PDF
          </button>
          <button onClick={handleExportExcel} className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 text-sm shadow-sm">
            <FileSpreadsheet className="w-4 h-4" /> Export Excel
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((report) => (
          <div key={report.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:border-emerald-200 hover:shadow-md transition-all group cursor-pointer">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${report.bg}`}>
              <report.icon className={`w-6 h-6 ${report.color}`} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-emerald-700 transition-colors">{report.title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed mb-4">{report.desc}</p>
            <div className="flex items-center text-xs font-bold uppercase tracking-widest text-emerald-600">
              View Report <TrendingUp className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        ))}
      </div>
      
      {/* Mock Chart Area */}
      <div className="mt-8 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-6">Overview Metrics (Live Projects)</h3>
        <div className="h-64 flex items-end justify-between gap-2 border-b border-slate-100 pb-4">
          {metrics.map((m, i) => (
            <div key={i} className="w-full bg-emerald-100 rounded-t-sm hover:bg-emerald-500 transition-colors relative group" style={{ height: `${Math.max(m.Value, 2)}%` }}>
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                {m.Value}%
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">
          <span>Jan</span>
          <span>Feb</span>
          <span>Mar</span>
          <span>Apr</span>
          <span>May</span>
          <span>Jun</span>
          <span>Jul</span>
          <span>Aug</span>
          <span>Sep</span>
          <span>Oct</span>
          <span>Nov</span>
          <span>Dec</span>
        </div>
      </div>
    </div>
  );
}
