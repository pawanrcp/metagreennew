import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Zap, 
  Check, 
  ArrowRight, 
  Sparkles, 
  Users, 
  HardDrive, 
  ShoppingCart, 
  FileText, 
  Sun, 
  Lock, 
  ChevronRight,
  Calculator,
  Building2,
  Phone,
  Mail,
  Award,
  Globe,
  Menu,
  X,
  Layers,
  BarChart3,
  PackageCheck
} from 'lucide-react';
import { MetaGreenLogo } from './MetaGreenLogo';
import { subscriptionService, SubscriptionPlan } from '@/src/services/subscription.service';
import VendorRegistrationModal from './VendorRegistrationModal';
import LoginModal from './LoginModal';

interface LandingPageProps {
  onLoginSuccess: () => void;
}

export default function LandingPage({ onLoginSuccess }: LandingPageProps) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function loadPlans() {
      const fetchedPlans = await subscriptionService.getSubscriptionPlans();
      setPlans(fetchedPlans);
    }
    loadPlans();
  }, []);

  const handleStartTrial = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setIsRegisterModalOpen(true);
  };

  const scrollToSection = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-emerald-500 selection:text-slate-950 overflow-x-hidden">
      {/* 1. TOP WHITE HEADER WITH LOGO BRAND COLORS */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-md transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          
          {/* Brand Logo */}
          <div className="flex items-center shrink-0">
            <MetaGreenLogo className="h-9 sm:h-10 w-auto" textSub="" />
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8 text-xs xl:text-sm font-extrabold text-slate-800">
            <button onClick={(e) => scrollToSection(e, 'features')} className="hover:text-emerald-600 transition-colors cursor-pointer">Features & Modules</button>
            <button onClick={(e) => scrollToSection(e, 'plans')} className="hover:text-emerald-600 transition-colors cursor-pointer">Subscription Plans</button>
            <button onClick={(e) => scrollToSection(e, 'procurement')} className="hover:text-emerald-600 transition-colors cursor-pointer">PO Procurement</button>
            <button onClick={(e) => scrollToSection(e, 'subsidy')} className="hover:text-emerald-600 transition-colors cursor-pointer">Surya Ghar Subsidy</button>
          </nav>

          {/* Header Action Buttons synced with logo brand colors */}
          <div className="hidden sm:flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="px-4.5 py-2.5 text-xs xl:text-sm font-extrabold text-slate-800 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 rounded-xl transition-all flex items-center gap-1.5 border border-slate-300 shadow-2xs cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              Sign In
            </button>

            <button
              onClick={() => {
                setSelectedPlan(plans[0] || null);
                setIsRegisterModalOpen(true);
              }}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs xl:text-sm rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 fill-white" />
              Vendor Sign Up
            </button>
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="px-3 py-1.5 text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg"
            >
              Sign In
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-800 hover:text-slate-950 rounded-lg hover:bg-slate-100 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="sm:hidden bg-white border-b border-slate-200 px-4 py-6 space-y-4 animate-in slide-in-from-top-4 duration-200 shadow-xl">
            <nav className="flex flex-col gap-3 font-bold text-sm text-slate-800">
              <button onClick={(e) => { setMobileMenuOpen(false); scrollToSection(e, 'features'); }} className="hover:text-emerald-600 text-left cursor-pointer">Features & Modules</button>
              <button onClick={(e) => { setMobileMenuOpen(false); scrollToSection(e, 'plans'); }} className="hover:text-emerald-600 text-left cursor-pointer">Subscription Plans</button>
              <button onClick={(e) => { setMobileMenuOpen(false); scrollToSection(e, 'procurement'); }} className="hover:text-emerald-600 text-left cursor-pointer">PO Procurement</button>
              <button onClick={(e) => { setMobileMenuOpen(false); scrollToSection(e, 'subsidy'); }} className="hover:text-emerald-600 text-left cursor-pointer">Surya Ghar Subsidy</button>
            </nav>

            <div className="pt-4 border-t border-slate-200 flex flex-col gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setSelectedPlan(plans[0] || null);
                  setIsRegisterModalOpen(true);
                }}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-md"
              >
                <Sparkles className="w-4 h-4 fill-white" /> Vendor Sign Up (7-Day Free Trial)
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 2. HIGH-IMPACT HERO SECTION */}
      <section className="relative pt-12 sm:pt-20 pb-20 sm:pb-28 overflow-hidden border-b border-slate-800/60">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-emerald-500/15 via-teal-500/5 to-transparent blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-widest mb-6 shadow-xs">
            <Zap className="w-4 h-4 fill-emerald-400 animate-pulse text-emerald-400" />
            7-Day Free Trial • No Credit Card Required
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-7xl font-black text-white tracking-tight leading-[1.12] max-w-5xl mx-auto">
            The Complete <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">Solar Enterprise Operating System</span>
          </h1>

          <p className="mt-6 text-sm sm:text-lg lg:text-xl text-slate-400 font-medium max-w-3xl mx-auto leading-relaxed">
            Manage solar leads, automated vendor PO procurement, 70:30 GST quotes, auto-inventory stocking, and PM Surya Ghar subsidy claims — under one unified platform.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => {
                setSelectedPlan(plans[0] || null);
                setIsRegisterModalOpen(true);
              }}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm sm:text-base rounded-2xl transition-all shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-3 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              Start 7-Day Free Trial
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="w-full sm:w-auto px-8 py-4 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-white font-extrabold text-sm sm:text-base rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <Building2 className="w-5 h-5 text-emerald-400" />
              Sign In to Existing Account
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 pt-10 border-t border-slate-800/60 max-w-4xl mx-auto">
            <div className="p-4 bg-slate-900/40 border border-slate-800/80 rounded-2xl">
              <p className="text-2xl sm:text-3xl font-black text-white">100%</p>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">Vendor Auto-Inventory</p>
            </div>
            <div className="p-4 bg-slate-900/40 border border-slate-800/80 rounded-2xl">
              <p className="text-2xl sm:text-3xl font-black text-emerald-400">70 : 30</p>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">Solar GST Tax Split</p>
            </div>
            <div className="p-4 bg-slate-900/40 border border-slate-800/80 rounded-2xl">
              <p className="text-2xl sm:text-3xl font-black text-white">₹78,000</p>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">Surya Ghar Subsidy</p>
            </div>
            <div className="p-4 bg-slate-900/40 border border-slate-800/80 rounded-2xl">
              <p className="text-2xl sm:text-3xl font-black text-teal-400">7 Days</p>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">Full Access Free Trial</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. DYNAMIC & RESPONSIVE SUBSCRIPTION PLANS SECTION */}
      <section id="plans" className="py-20 sm:py-28 bg-slate-900/40 relative border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="px-3.5 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-black rounded-full uppercase tracking-widest border border-emerald-500/20">
              Transparent Pricing Configured by Global Admin
            </span>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight mt-4">
              Flexible Subscription Plans for Every Solar Team
            </h2>
            <p className="text-slate-400 font-medium text-xs sm:text-sm mt-3">
              Select any plan below to activate your **7-day free trial**. Upgrade or change anytime.
            </p>

            {/* Monthly / Annual Billing Toggle */}
            <div className="mt-8 inline-flex items-center bg-slate-950 p-1.5 rounded-2xl border border-slate-800 shadow-inner">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  billingCycle === 'monthly' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Monthly Billing
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  billingCycle === 'annual' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Annual Billing (Save 20%)
              </button>
            </div>
          </div>

          {/* Subscription Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto items-stretch">
            {plans.map((plan, idx) => {
              const isPopular = plan.userLimit === 5 || idx === 1;
              const displayPrice = billingCycle === 'annual' ? Math.round(plan.priceMonthly * 0.8) : plan.priceMonthly;

              return (
                <div
                  key={plan.id || idx}
                  className={`relative bg-slate-900/90 backdrop-blur-sm border rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl ${
                    isPopular
                      ? 'border-emerald-500/80 shadow-xl shadow-emerald-500/10 ring-2 ring-emerald-500/20 transform lg:-translate-y-2'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg whitespace-nowrap">
                      Most Popular for Vendors
                    </div>
                  )}

                  <div>
                    <h3 className="text-xl font-black text-white">{plan.name}</h3>
                    <p className="text-xs font-semibold text-slate-400 mt-1">
                      Designed for solar installers & vendor teams
                    </p>

                    <div className="mt-6 flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-black text-white">₹{displayPrice.toLocaleString()}</span>
                      <span className="text-xs font-extrabold text-slate-400">/ month</span>
                    </div>

                    <div className="mt-4 p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 flex items-center justify-between">
                      <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 fill-emerald-400" /> 7-Day Free Trial
                      </span>
                      <span className="text-[10px] font-bold text-slate-300 bg-slate-950 px-2.5 py-0.5 rounded-lg border border-slate-800">
                        {plan.trialDays || 7} Days Free
                      </span>
                    </div>

                    {/* Dynamic Limit Specs */}
                    <div className="mt-6 space-y-3 pt-5 border-t border-slate-800/80">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-400 flex items-center gap-2">
                          <Users className="w-4 h-4 text-emerald-400" /> Authorized Team Users
                        </span>
                        <span className="text-white bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                          Up to {plan.userLimit} Users
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-400 flex items-center gap-2">
                          <HardDrive className="w-4 h-4 text-teal-400" /> Cloud Storage Vault
                        </span>
                        <span className="text-white bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                          {plan.storageGBLimit} GB Limit
                        </span>
                      </div>
                    </div>

                    {/* Feature Highlights */}
                    <ul className="mt-6 space-y-3">
                      {(plan.features || [
                        'Vendor PO & Inventory Sync',
                        '70:30 GST Quotation Builder',
                        'PM Surya Ghar Subsidy Release',
                        'Customer Direct Walk-in Entry'
                      ]).map((feat, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2.5 text-xs font-semibold text-slate-300">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-800/80">
                    <button
                      onClick={() => handleStartTrial(plan)}
                      className={`w-full py-3.5 font-black text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        isPopular
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/20 transform hover:-translate-y-0.5'
                          : 'bg-slate-800 hover:bg-slate-700 text-white'
                      }`}
                    >
                      Start 7-Day Free Trial
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. PLATFORM FEATURES BREAKDOWN */}
      <section id="features" className="py-20 sm:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="px-3.5 py-1 bg-teal-500/10 text-teal-400 text-xs font-black rounded-full uppercase tracking-widest border border-teal-500/20">
            Enterprise Architecture
          </span>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight mt-4">
            Engineered Specifically for Solar Installers & Vendors
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          <div id="procurement" className="bg-slate-900/80 border border-slate-800 p-6 sm:p-8 rounded-3xl space-y-4 hover:border-slate-700 transition-all scroll-mt-24">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-black">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white">Purchase Orders & Auto-Stock</h3>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              Create POs with Panel, Inverter & Cable specs. Vendor accepts PO, payment is enabled, and stock auto-updates into warehouse inventory.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-6 sm:p-8 rounded-3xl space-y-4 hover:border-slate-700 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center font-black">
              <Calculator className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white">70:30 Solar GST & Live Quotes</h3>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              Automated 70% Goods (12% GST) and 30% Services (18% GST) calculation with side-by-side live editor & instant PDF generation.
            </p>
          </div>

          <div id="subsidy" className="bg-slate-900/80 border border-slate-800 p-6 sm:p-8 rounded-3xl space-y-4 hover:border-slate-700 transition-all scroll-mt-24">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-black">
              <Sun className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white">PM Surya Ghar Subsidy Sync</h3>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              Dynamic tracking for 1kW (₹30k), 2kW (₹60k), and 3kW+ (₹78k) central solar subsidies directly linked with installer milestones.
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950 border-t border-slate-900 py-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <MetaGreenLogo className="h-8 w-auto" />
          <p>© 2026 Meta Green Enterprise ERP. All rights reserved.</p>
          <div className="flex gap-4 font-semibold text-slate-400">
            <a href="#plans" className="hover:text-white">Subscription Plans</a>
            <button onClick={() => setIsLoginModalOpen(true)} className="hover:text-white cursor-pointer">Sign In</button>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      {isRegisterModalOpen && (
        <VendorRegistrationModal
          selectedPlan={selectedPlan || plans[0]}
          allPlans={plans}
          onClose={() => setIsRegisterModalOpen(false)}
          onSuccess={() => {
            setIsRegisterModalOpen(false);
            onLoginSuccess();
          }}
        />
      )}

      {isLoginModalOpen && (
        <LoginModal
          onClose={() => setIsLoginModalOpen(false)}
          onSuccess={() => {
            setIsLoginModalOpen(false);
            onLoginSuccess();
          }}
          onOpenSignUp={() => {
            setIsLoginModalOpen(false);
            setIsRegisterModalOpen(true);
          }}
        />
      )}
    </div>
  );
}
