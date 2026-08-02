import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Users, 
  Sun, 
  TrendingUp, 
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  Leaf,
  Zap,
  Activity,
  Star,
  Clock
} from 'lucide-react';
import { formatCurrency, cn } from '@/src/lib/utils';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';


export default function Dashboard() {
  const [counts, setCounts] = useState({ 
    leads: 0, 
    projects: 0, 
    revenue: 0,
    pendingApprovals: 0,
    activeInstallers: 0,
    customerSat: 4.8,
    energyGen: 12500, // MWh
    carbonOffset: 8500, // Tons
    roiAvg: 18.5, // %
    projectsByStatus: { Planning: 0, 'In Progress': 0, Installation: 0 } as Record<string, number>
  });

  const [chartData, setChartData] = useState<any[]>([
    { name: 'Jan', revenue: 0, installations: 0 },
    { name: 'Feb', revenue: 0, installations: 0 },
    { name: 'Mar', revenue: 0, installations: 0 },
    { name: 'Apr', revenue: 0, installations: 0 },
    { name: 'May', revenue: 0, installations: 0 },
    { name: 'Jun', revenue: 0, installations: 0 },
    { name: 'Jul', revenue: 0, installations: 0 },
    { name: 'Aug', revenue: 0, installations: 0 },
    { name: 'Sep', revenue: 0, installations: 0 },
    { name: 'Oct', revenue: 0, installations: 0 },
    { name: 'Nov', revenue: 0, installations: 0 },
    { name: 'Dec', revenue: 0, installations: 0 },
  ]);

  useEffect(() => {
    const unsubLeads = onSnapshot(collection(db, 'leads'), (s) => setCounts(prev => ({ ...prev, leads: s.size })));
    
    const unsubProjects = onSnapshot(collection(db, 'projects'), (s) => {
      let statuses: Record<string, number> = { Planning: 0, 'In Progress': 0, Installation: 0, Completed: 0 };
      
      const newChartData = [
        { name: 'Jan', revenue: 0, installations: 0 },
        { name: 'Feb', revenue: 0, installations: 0 },
        { name: 'Mar', revenue: 0, installations: 0 },
        { name: 'Apr', revenue: 0, installations: 0 },
        { name: 'May', revenue: 0, installations: 0 },
        { name: 'Jun', revenue: 0, installations: 0 },
        { name: 'Jul', revenue: 0, installations: 0 },
        { name: 'Aug', revenue: 0, installations: 0 },
        { name: 'Sep', revenue: 0, installations: 0 },
        { name: 'Oct', revenue: 0, installations: 0 },
        { name: 'Nov', revenue: 0, installations: 0 },
        { name: 'Dec', revenue: 0, installations: 0 },
      ];

      s.docs.forEach(doc => {
        const data = doc.data();
        const status = data.status as string;
        if (statuses[status] !== undefined) {
          statuses[status]++;
        } else {
          statuses[status] = 1;
        }

        if (data.createdAt && typeof data.createdAt.toDate === 'function') {
          const date = data.createdAt.toDate();
          const month = date.getMonth();
          newChartData[month].installations += 1;
        }
      });
      setChartData(prev => newChartData.map((d, i) => ({ ...d, revenue: prev[i].revenue })));
      setCounts(prev => ({ ...prev, projects: s.size, projectsByStatus: statuses }));
    });

    const unsubFinance = onSnapshot(collection(db, 'financeTransactions'), (s) => {
      let totalRevenue = 0;
      setChartData(prev => {
        const newChartData = [...prev].map(d => ({ ...d, revenue: 0 }));
        s.docs.forEach(doc => {
          const data = doc.data();
          if (data.category === 'Income' && data.status === 'Completed') {
            totalRevenue += data.amount;
            if (data.createdAt && typeof data.createdAt.toDate === 'function') {
               const date = data.createdAt.toDate();
               const month = date.getMonth();
               newChartData[month].revenue += data.amount;
            }
          }
        });
        setCounts(c => ({ ...c, revenue: totalRevenue }));
        return newChartData;
      });
    });

    const unsubCompliance = onSnapshot(collection(db, 'complianceRecords'), (s) => {
      let pending = 0;
      s.docs.forEach(doc => {
        if (doc.data().status === 'Pending') pending++;
      });
      setCounts(prev => ({ ...prev, pendingApprovals: pending }));
    });

    const unsubEmployees = onSnapshot(collection(db, 'employees'), (s) => {
      let installers = 0;
      s.docs.forEach(doc => {
        if (doc.data().role === 'Installer') installers++;
      });
      setCounts(prev => ({ ...prev, activeInstallers: installers }));
    });

    return () => { unsubLeads(); unsubProjects(); unsubFinance(); unsubCompliance(); unsubEmployees(); };
  }, []);

  const stats = [
    { label: 'Total Projects', value: counts.projects.toString(), change: '+12%', icon: Sun, color: 'emerald' },
    { label: 'Revenue (Total)', value: formatCurrency(counts.revenue), change: '+18%', icon: Wallet, color: 'emerald' },
    { label: 'Active Leads', value: counts.leads.toString(), change: '+10%', icon: Activity, color: 'emerald' },
    { label: 'Energy Generated', value: `${counts.energyGen} MWh`, change: '+8%', icon: Zap, color: 'blue' },
    { label: 'Carbon Offset', value: `${counts.carbonOffset} Tons`, change: '+15%', icon: Leaf, color: 'emerald' },
    { label: 'Pending Approvals', value: counts.pendingApprovals.toString(), change: '-2%', icon: Clock, color: 'amber' },
    { label: 'Active Installers', value: counts.activeInstallers.toString(), change: '+4%', icon: Users, color: 'blue' },
    { label: 'Customer Sat', value: `${counts.customerSat} / 5.0`, change: '+1%', icon: Star, color: 'amber' },
  ];

  const projectStatusData = [
    { name: 'Planning', value: counts.projectsByStatus['Planning'] || 0, color: '#f59e0b' },
    { name: 'In Progress', value: counts.projectsByStatus['In Progress'] || 0, color: '#3b82f6' },
    { name: 'Installation', value: counts.projectsByStatus['Installation'] || 0, color: '#10b981' },
    { name: 'Completed', value: counts.projectsByStatus['Completed'] || 0, color: '#059669' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Executive Dashboard</h1>
          <p className="text-slate-500 mt-1 font-medium">Real-time performance analytics for solar operations.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">Export Report</button>
          <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition-all shadow-md shadow-emerald-100">Refresh Data</button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 hover:shadow-md transition-all hover:-translate-y-1 duration-300">
            <div className="flex items-start justify-between">
              <div className={cn(
                "p-3 rounded-xl shadow-sm",
                stat.color === 'emerald' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                stat.color === 'blue' ? "bg-blue-50 text-blue-600 border border-blue-100" : "bg-amber-50 text-amber-600 border border-amber-100"
              )}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div className={cn(
                "flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2 py-1 rounded-full",
                stat.change.startsWith('+') ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
              )}>
                {stat.change}
                {stat.change.startsWith('+') ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              </div>
            </div>
            <div className="mt-6">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-8 border-b border-slate-50 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Revenue Growth</h3>
              <p className="text-xs text-slate-500 font-medium">Monthly revenue trends for 2024</p>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded uppercase">Live Data</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 600}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 600}} dx={-10} width={45} />
                <Tooltip 
                  contentStyle={{backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-8 border-b border-slate-50 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Projects by Status</h3>
              <p className="text-xs text-slate-500 font-medium">Distribution of active projects</p>
            </div>
          </div>
          <div className="h-64 flex flex-col items-center justify-center relative">
            {counts.projects === 0 ? (
              <div className="text-slate-400 font-medium text-sm">No projects data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={projectStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {projectStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 600, fontSize: '12px'}}
                    itemStyle={{fontWeight: 700}}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none mt-1">
              <div className="text-center">
                <span className="block text-2xl font-black text-slate-900">{counts.projects}</span>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Total</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-4 mt-2">
            {projectStatusData.map((entry, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: entry.color}}></div>
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-8 border-b border-slate-50 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Monthly Installations</h3>
              <p className="text-xs text-slate-500 font-medium">Completed solar systems</p>
            </div>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded uppercase">YTD 2024</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 600}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 600}} dx={-10} width={25} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="installations" fill="#059669" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
