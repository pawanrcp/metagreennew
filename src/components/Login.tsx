import React, { useState } from 'react';
import { 
  Mail, 
  Lock, 
  ArrowRight, 
  ShieldCheck, 
  Users, 
  Calculator, 
  MapPin, 
  Sun, 
  Package, 
  TrendingUp, 
  FileText,
  Headphones
} from 'lucide-react';
import { MetaGreenLogo } from './MetaGreenLogo';
import { authService } from '../services/auth.service';

export default function Login() {
  const [email, setEmail] = useState('admin@solar.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeQuickRole, setActiveQuickRole] = useState<string>('Super Admin');

  // Quick Demo Accounts
  const DEMO_ACCOUNTS = [
    { role: 'Super Admin', email: 'admin@solar.com', pass: 'admin123', label: '👑 Admin' },
    { role: 'Sales Executive', email: 'sales@solar.com', pass: 'sales123', label: '💼 Sales' },
    { role: 'Survey Engineer', email: 'survey@solar.com', pass: 'survey123', label: '📐 Survey' },
    { role: 'Design Engineer', email: 'design@solar.com', pass: 'design123', label: '🖊️ Design' },
    { role: 'Project Manager', email: 'pm@solar.com', pass: 'pm123', label: '🚀 PM' },
    { role: 'Finance Manager', email: 'finance@solar.com', pass: 'finance123', label: '💰 Finance' },
    { role: 'Installer', email: 'installer@solar.com', pass: 'installer123', label: '🔧 Installer' },
  ];

  const handleQuickLogin = (demo: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(demo.email);
    setPassword(demo.pass);
    setActiveQuickRole(demo.role);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.login(email, password);
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed' || (err.message && err.message.includes('auth/operation-not-allowed'))) {
        setError('Email/Password sign-in is disabled in Firebase Console.');
      } else {
        setError(err.message || 'Authentication failed. Please check credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen max-h-screen max-w-vw bg-slate-50 flex flex-col justify-between font-sans text-slate-800 antialiased selection:bg-emerald-500 selection:text-white overflow-hidden p-2 sm:p-3 lg:p-4 fixed inset-0">
      
      {/* Main Container */}
      <main className="flex-1 flex flex-col lg:flex-row items-stretch max-w-[1550px] w-full mx-auto gap-3 lg:gap-5 min-h-0 overflow-hidden">
        
        {/* LEFT HERO SECTION */}
        <div className="flex-1 bg-white rounded-3xl border border-slate-200/80 p-4 lg:p-5 flex flex-col justify-between shadow-xl shadow-slate-200/40 relative overflow-hidden min-h-0">
          
          {/* Subtle background grid pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none" />

          {/* Top Hero Text & Features */}
          <div className="relative z-10 space-y-2">
            <div>
              <MetaGreenLogo size="md" />
            </div>

            <h1 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight leading-tight">
              Complete Solar Business <br />
              <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                Management Platform
              </span>
            </h1>

            <p className="text-slate-600 text-xs max-w-xl font-medium leading-relaxed">
              Manage leads, proposals, projects, inventory, installation, service, and energy insights from one connected ERP.
            </p>

            {/* 3 Feature Bullets */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-0.5">
              <div className="flex items-start gap-2 p-2 bg-slate-50/80 rounded-xl border border-slate-100">
                <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg shrink-0 mt-0.5">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-[11px] font-bold text-slate-900">End-to-End Operations</h4>
                  <p className="text-[9px] text-slate-500 mt-0.5">CRM, site survey, proposals & installation.</p>
                </div>
              </div>

              <div className="flex items-start gap-2 p-2 bg-slate-50/80 rounded-xl border border-slate-100">
                <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg shrink-0 mt-0.5">
                  <Package className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-[11px] font-bold text-slate-900">Smart Inventory</h4>
                  <p className="text-[9px] text-slate-500 mt-0.5">Panels, inverters & live stock.</p>
                </div>
              </div>

              <div className="flex items-start gap-2 p-2 bg-slate-50/80 rounded-xl border border-slate-100">
                <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg shrink-0 mt-0.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-[11px] font-bold text-slate-900">Performance Analytics</h4>
                  <p className="text-[9px] text-slate-500 mt-0.5">Track generation, savings & uptime.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Central Solar Connected Satellite Diagram */}
          <div className="my-1 relative z-10 flex items-center justify-center flex-1 min-h-[170px] lg:min-h-[190px]">
            {/* Outer Concentric Animated Ring */}
            <div className="w-[180px] h-[180px] lg:w-[210px] lg:h-[210px] rounded-full border-2 border-dashed border-emerald-300/70 absolute animate-[spin_40s_linear_infinite] flex items-center justify-center">
              <div className="w-[120px] h-[120px] lg:w-[140px] lg:h-[140px] rounded-full border border-blue-200/60" />
            </div>

            {/* Center Logo Hub */}
            <div className="relative z-20 w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-white shadow-xl border-4 border-emerald-100 flex items-center justify-center p-2">
              <MetaGreenLogo size="sm" showText={false} />
            </div>

            {/* 6 Circular Satellite Badges */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {/* Node 1: CRM & Lead Management (Top) */}
              <div className="absolute -top-1 bg-white border border-blue-200 shadow-md rounded-full px-2 py-0.5 flex items-center gap-1 pointer-events-auto">
                <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[8px] font-bold">
                  <Users className="w-2.5 h-2.5" />
                </div>
                <span className="text-[8px] font-extrabold text-slate-800 uppercase tracking-tight">CRM & LEAD MANAGEMENT</span>
              </div>

              {/* Node 2: Proposal & Quote Builder (Top Right) */}
              <div className="absolute top-4 right-1 lg:right-4 bg-white border border-emerald-200 shadow-md rounded-full px-2 py-0.5 flex items-center gap-1 pointer-events-auto">
                <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[8px] font-bold">
                  <Calculator className="w-2.5 h-2.5" />
                </div>
                <span className="text-[8px] font-extrabold text-slate-800 uppercase tracking-tight">PROPOSAL & QUOTATION BUILDER</span>
              </div>

              {/* Node 3: Site Survey & Solar Design (Bottom Right) */}
              <div className="absolute bottom-4 right-1 lg:right-4 bg-white border border-teal-200 shadow-md rounded-full px-2 py-0.5 flex items-center gap-1 pointer-events-auto">
                <div className="w-4 h-4 rounded-full bg-teal-600 text-white flex items-center justify-center text-[8px] font-bold">
                  <MapPin className="w-2.5 h-2.5" />
                </div>
                <span className="text-[8px] font-extrabold text-slate-800 uppercase tracking-tight">SITE SURVEY & SOLAR DESIGN</span>
              </div>

              {/* Node 4: Project Tracking (Bottom) */}
              <div className="absolute -bottom-1 bg-white border border-amber-200 shadow-md rounded-full px-2 py-0.5 flex items-center gap-1 pointer-events-auto">
                <div className="w-4 h-4 rounded-full bg-amber-600 text-white flex items-center justify-center text-[8px] font-bold">
                  <Sun className="w-2.5 h-2.5" />
                </div>
                <span className="text-[8px] font-extrabold text-slate-800 uppercase tracking-tight">PROJECT & INSTALLATION TRACKING</span>
              </div>

              {/* Node 5: Service & AMC (Bottom Left) */}
              <div className="absolute bottom-4 left-1 lg:left-4 bg-white border border-purple-200 shadow-md rounded-full px-2 py-0.5 flex items-center gap-1 pointer-events-auto">
                <div className="w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center text-[8px] font-bold">
                  <TrendingUp className="w-2.5 h-2.5" />
                </div>
                <span className="text-[8px] font-extrabold text-slate-800 uppercase tracking-tight">SERVICE, AMC & ANALYTICS</span>
              </div>

              {/* Node 6: Inventory & Procurement (Top Left) */}
              <div className="absolute top-4 left-1 lg:left-4 bg-white border border-indigo-200 shadow-md rounded-full px-2 py-0.5 flex items-center gap-1 pointer-events-auto">
                <div className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[8px] font-bold">
                  <Package className="w-2.5 h-2.5" />
                </div>
                <span className="text-[8px] font-extrabold text-slate-800 uppercase tracking-tight">INVENTORY & PROCUREMENT</span>
              </div>
            </div>
          </div>

          {/* Bottom Hero Metrics Bar & Security Badges */}
          <div className="relative z-10 space-y-1.5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-slate-50/90 p-2 rounded-xl border border-slate-100">
              <div>
                <p className="text-sm lg:text-base font-black text-slate-900">5,000+</p>
                <p className="text-[9px] font-semibold text-slate-500">Projects Managed</p>
              </div>
              <div>
                <p className="text-sm lg:text-base font-black text-slate-900">2.5 GW+</p>
                <p className="text-[9px] font-semibold text-slate-500">Solar Capacity</p>
              </div>
              <div>
                <p className="text-sm lg:text-base font-black text-slate-900">99.8%</p>
                <p className="text-[9px] font-semibold text-slate-500">Asset Uptime</p>
              </div>
              <div>
                <p className="text-sm lg:text-base font-black text-slate-900">30%</p>
                <p className="text-[9px] font-semibold text-slate-500">Faster Operations</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[9px] font-bold text-slate-500">
              <span className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                <ShieldCheck className="w-3 h-3 text-emerald-600" /> ISO 27001 Certified
              </span>
              <span className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                <ShieldCheck className="w-3 h-3 text-blue-600" /> SOC 2 Compliant
              </span>
              <span className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                <ShieldCheck className="w-3 h-3 text-amber-600" /> Secure Cloud
              </span>
            </div>
          </div>

        </div>

        {/* RIGHT LOGIN CARD */}
        <div className="w-full lg:w-[400px] xl:w-[420px] bg-white rounded-3xl border border-slate-200/80 p-4 lg:p-5 shadow-xl shadow-slate-200/50 flex flex-col justify-between shrink-0 overflow-y-auto max-h-full">
          <div className="space-y-4">
            
            {/* Header */}
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Welcome Back!</h2>
              <p className="text-xs font-medium text-slate-500 mt-0.5">
                Sign in to continue to your <span className="text-emerald-600 font-bold">MetaGreen</span> dashboard.
              </p>
            </div>

            {/* Quick Demo Role Selector */}
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block">
                ⚡ 1-Click Quick Demo Login
              </span>
              <div className="flex flex-wrap gap-1">
                {DEMO_ACCOUNTS.map((demo) => (
                  <button
                    key={demo.role}
                    type="button"
                    onClick={() => handleQuickLogin(demo)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all border ${
                      activeQuickRole === demo.role
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {demo.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {error && (
                <div className="p-2.5 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs font-bold">
                  {error}
                </div>
              )}

              {/* Email Address */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-9 pr-10 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-[11px] font-bold"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-[11px] pt-0.5">
                <label className="flex items-center gap-1.5 cursor-pointer select-none font-medium text-slate-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 accent-emerald-600 rounded border-slate-300"
                  />
                  Remember me
                </label>
                <a href="#forgot" onClick={(e) => { e.preventDefault(); alert("Please contact system administrator to reset password."); }} className="font-bold text-blue-600 hover:underline">
                  Forgot Password?
                </a>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 group disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="text-center pt-1">
              <span className="text-[11px] text-slate-500 font-medium">New to MetaGreen? </span>
              <button 
                type="button" 
                onClick={() => alert("Please contact MetaGreen System Administrator to register a new organizational account.")}
                className="text-[11px] font-bold text-emerald-600 hover:underline"
              >
                Contact Admin
              </button>
            </div>

          </div>

          {/* Footer Copyright */}
          <div className="pt-3 border-t border-slate-100 text-center space-y-1 mt-2">
            <div className="flex items-center justify-center gap-3 text-[10px] font-bold text-slate-500">
              <a href="#privacy" onClick={(e) => e.preventDefault()} className="hover:text-slate-800">Privacy Policy</a>
              <span>•</span>
              <a href="#terms" onClick={(e) => e.preventDefault()} className="hover:text-slate-800">Terms of Service</a>
              <span>•</span>
              <a href="#support" onClick={(e) => e.preventDefault()} className="hover:text-slate-800">Support</a>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">
              © 2026 MetaGreen Technologies Pvt. Ltd. All rights reserved.
            </p>
          </div>

        </div>

      </main>
    </div>
  );
}
