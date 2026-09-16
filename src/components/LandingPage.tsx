import React, { useState, useEffect } from 'react';
import {
  Sun,
  Zap,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Users,
  FileText,
  ChevronRight,
  Building2,
  Phone,
  Mail,
  Award,
  Globe,
  Menu,
  X,
  Layers,
  BarChart3,
  TrendingUp,
  Cloud,
  Smartphone,
  Cpu,
  Settings2,
  ClipboardCheck,
  LineChart,
  Box,
  Wrench,
  HelpCircle,
  IndianRupee,
  Star,
  Quote,
  Check,
  Search,
  ArrowUpRight,
  Activity,
  AlertTriangle,
  Link2,
  ShieldAlert,
  Landmark,
  ShoppingBag,
  Handshake,
  RotateCcw,
  Scale,
  BadgeCheck,
  Map
} from 'lucide-react';

import { MetaGreenLogo } from './MetaGreenLogo';
import { subscriptionService, SubscriptionPlan } from '@/src/services/subscription.service';
import VendorRegistrationModal from './VendorRegistrationModal';
import LoginModal from './LoginModal';
import BookDemoModal from './BookDemoModal';
import ContactCareerModal, { ContactPurpose } from './ContactCareerModal';
import ApplicationTrackingModal from './ApplicationTrackingModal';

import { Container } from './landing/Container';
import { Counter } from './landing/Counter';
import { Reveal } from './landing/Reveal';
import { SectionHeading } from './landing/SectionHeading';
import { HeroCommandCard } from './landing/HeroCommandCard';
import { ProductCommandCenter } from './landing/ProductCommandCenter';
import { EcosystemSection } from './landing/EcosystemSection';
import { SecuritySection } from './landing/SecuritySection';
import { LandingFooter } from './landing/LandingFooter';

// Full Website Pages
import { About } from '@/src/pages/About';
import { Careers } from '@/src/pages/Careers';
import { Contact } from '@/src/pages/Contact';
import { Solutions } from '@/src/pages/Solutions';
import { PrivacyPolicy } from '@/src/pages/legal/PrivacyPolicy';
import { TermsOfService } from '@/src/pages/legal/TermsOfService';
import { Cancellation } from '@/src/pages/legal/Cancellation';
import { Security } from '@/src/pages/legal/Security';
import { Compliance } from '@/src/pages/legal/Compliance';
import { Sitemap } from '@/src/pages/legal/Sitemap';

export interface VendorBrandingInfo {
  uid: string;
  companyName: string;
  companyLogo?: string;
  phone?: string;
  email?: string;
  doorNo?: string;
  companyAddress?: string;
  city?: string;
  state?: string;
  pincode?: string;
  hasWebsiteSubscription?: boolean;
}

interface LandingPageProps {
  onLoginSuccess: () => void;
  vendorBranding?: VendorBrandingInfo | null;
  onExitVendorView?: () => void;
}

export default function LandingPage({ onLoginSuccess, vendorBranding, onExitVendorView }: LandingPageProps) {
  // Routing State matching MetaCheck multi-page system
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      if (path && path !== '') return path;
    }
    return '/';
  });

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [activeVendorBranding, setActiveVendorBranding] = useState<VendorBrandingInfo | null>(vendorBranding || null);
  
  // Modals state
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginModalInitialRole, setLoginModalInitialRole] = useState<'admin' | 'vendor' | 'installer' | 'customer' | 'staff'>('admin');
  const [isBookDemoOpen, setIsBookDemoOpen] = useState(false);
  const [isContactCareerOpen, setIsContactCareerOpen] = useState(false);
  const [contactPurpose, setContactPurpose] = useState<ContactPurpose>('Sales');
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [trackingInitialQuery, setTrackingInitialQuery] = useState('');
  
  // Navigation & Interactive state
  const [heroTrackInput, setHeroTrackInput] = useState('');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSolutionTab, setActiveSolutionTab] = useState<'design' | 'crm' | 'procurement' | 'finance' | 'telemetry'>('design');
  const [monthlyBill, setMonthlyBill] = useState(7500);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Router Navigator with browser history
  const navigateTo = (path: string, hash?: string) => {
    setMobileMenuOpen(false);
    if (typeof window !== 'undefined') {
      const fullUrl = hash ? `${path}#${hash}` : path;
      window.history.pushState({}, '', fullUrl);
      setCurrentPath(path);
      if (hash) {
        setTimeout(() => {
          const el = document.getElementById(hash);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname.toLowerCase() || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    async function loadPlans() {
      try {
        const fetchedPlans = await subscriptionService.getSubscriptionPlans();
        setPlans(fetchedPlans);
      } catch (e) {
        console.error('Failed to load plans:', e);
      }
    }
    loadPlans();

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (vendorBranding) {
      setActiveVendorBranding(vendorBranding);
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const vUid = params.get('vendor') || params.get('v');
    if (vUid) {
      subscriptionService.getVendorAccount(vUid).then(acc => {
        if (acc) {
          setActiveVendorBranding({
            uid: acc.uid,
            companyName: acc.companyName,
            companyLogo: acc.companyLogo,
            phone: acc.phone,
            email: acc.email,
            doorNo: acc.doorNo,
            companyAddress: acc.companyAddress,
            city: acc.city,
            state: acc.state,
            pincode: acc.pincode,
            hasWebsiteSubscription: acc.hasWebsiteSubscription
          });
        }
      }).catch(err => console.warn('Failed to load vendor branding:', err));
    }
  }, [vendorBranding]);

  const isCustomLandingActive = Boolean(activeVendorBranding?.hasWebsiteSubscription);

  const DEFAULT_FALLBACK_PLAN: SubscriptionPlan = {
    id: 'plan_starter',
    name: 'Starter Solar EPC',
    userLimit: 5,
    storageGBLimit: 50,
    priceMonthly: 4999,
    trialEnabled: true,
    trialDays: 7,
    status: 'active',
    features: [
      '3D Solar CAD Rooftop Layout Engine',
      'Solar Lead CRM & Geotagged Surveys',
      'PM Surya Ghar Govt Subsidy Tracker',
      'GST Tax Invoice & E-Way Bill Generator',
      'Real-time IoT Inverter Telemetry'
    ]
  };

  const handleOpenLogin = (role: 'admin' | 'vendor' | 'installer' | 'customer' | 'staff' = 'admin') => {
    setLoginModalInitialRole(role);
    setIsLoginModalOpen(true);
  };

  const handleStartTrial = (plan?: SubscriptionPlan) => {
    setSelectedPlan(plan || plans[0] || DEFAULT_FALLBACK_PLAN);
    setIsRegisterModalOpen(true);
  };

  const handleHeroTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTrackingInitialQuery(heroTrackInput.trim());
    setIsTrackingModalOpen(true);
  };

  // Solar ROI Calculations
  const recommendedKw = Math.max(1, Math.round((monthlyBill / 1200) * 10) / 10);
  const estimatedSubsidy = recommendedKw <= 1 ? 30000 : recommendedKw <= 2 ? 60000 : 78000;
  const annualSavings = Math.round(monthlyBill * 12 * 0.88);
  const estimatedSystemCost = Math.round(recommendedKw * 58000);
  const netInvestment = Math.max(0, estimatedSystemCost - estimatedSubsidy);
  const paybackYears = (netInvestment / Math.max(1, annualSavings)).toFixed(1);
  const lifetimeSavings = Math.round(annualSavings * 25);

  // 4 Problem Challenges matching MetaCheck
  const PROBLEMS = [
    {
      icon: AlertTriangle,
      number: '01',
      title: 'Manual CAD & Spreadsheets',
      description: 'Solar design engineering takes days in legacy CAD tools. Leads go cold while customers wait for proposals and generation estimates.',
      accent: 'from-amber-500 to-orange-500',
      bg: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
    {
      icon: ShieldAlert,
      number: '02',
      title: 'DISCOM Red Tape & Subsidy Delays',
      description: 'Navigating state DISCOM portals and PM-Surya Ghar subsidy claims without automated verification leads to months of stalled capital disbursements.',
      accent: 'from-red-500 to-rose-500',
      bg: 'bg-red-50',
      iconColor: 'text-red-600',
    },
    {
      icon: Link2,
      number: '03',
      title: 'BOM Leakage & Inventory Disconnect',
      description: 'Fragmented supply chains cause stockouts of solar modules, inverters, and structures, eroding EPC profit margins by up to 15%.',
      accent: 'from-emerald-500 to-teal-500',
      bg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      icon: Users,
      number: '04',
      title: 'Zero Post-Commissioning Visibility',
      description: 'Once installed, systems suffer silent inverter outages and grid curtailment. Without real-time IoT alerts, performance ratios collapse.',
      accent: 'from-cyan-500 to-blue-500',
      bg: 'bg-cyan-50',
      iconColor: 'text-cyan-600',
    },
  ];

  // Alternating How It Works steps matching MetaCheck
  const HOW_IT_WORKS_STEPS = [
    {
      icon: Sun,
      step: '01',
      title: 'AI Satellite Roof Survey & 3D Shading',
      description: 'Capture rooftop boundaries via satellite or drone. Automatically calculate tilt, azimuth, shade loss, and maximum panel capacity in seconds.',
      color: 'from-emerald-500 to-teal-600',
    },
    {
      icon: FileText,
      step: '02',
      title: 'Automated BOQ & Tax-Compliant Proposal',
      description: 'Generate accurate electrical single-line diagrams, engineering BOMs, and GST quotations with instant customer payback and loan EMI schedules.',
      color: 'from-teal-500 to-cyan-600',
    },
    {
      icon: Zap,
      step: '03',
      title: 'DISCOM Net-Metering & Subsidy Auto-Filing',
      description: 'Auto-fill DISCOM grid feasibility applications, net-metering sanctions, and national portal capital subsidy claims with 100% document accuracy.',
      color: 'from-cyan-500 to-blue-600',
    },
    {
      icon: Activity,
      step: '04',
      title: 'Grid Commissioning & 24/7 Smart Telemetry',
      description: 'Track field installation crews, verify grid sync compliance, and stream live kWh generation data directly into your customer portal.',
      color: 'from-emerald-600 to-green-600',
    },
  ];

  // Solutions Tabs Data
  const SOLUTION_TABS = [
    {
      id: 'design',
      label: '3D PV Engineering',
      title: 'Automated 3D Rooftop CAD & Shading Simulation',
      description: 'Generate production-ready string layouts, shading loss heatmaps, and single-line diagrams (SLD) without expensive third-party CAD licenses.',
      features: [
        'Satellite roof tracing with pitch & obstacle detection',
        '360° Sun path irradiance and hourly shadow analysis',
        'Automatic string inverter sizing & DC/AC ratio checks',
        '1-Click PDF engineering report & proposal pitchbook'
      ],
      metric: '99.8% Simulation Accuracy'
    },
    {
      id: 'crm',
      label: 'Solar CRM & Surveys',
      title: 'Geotagged Surveying & Lead Pipeline Management',
      description: 'Empower field sales executives and survey engineers with mobile-first survey tools, instant feasibility scorecards, and automated follow-ups.',
      features: [
        'Mobile app with GPS geo-tagging and roof photo uploads',
        'Multi-stage EPC sales pipeline from lead to commissioning',
        'Automated WhatsApp and SMS client milestone alerts',
        'Sales team performance metrics & commission tracking'
      ],
      metric: '3.4x Faster Proposal Delivery'
    },
    {
      id: 'procurement',
      label: 'BOM & Warehousing',
      title: 'End-to-End Solar Inventory & Supply Chain',
      description: 'Synchronize panels, inverters, cables, and earthing BOS equipment across multiple central warehouses and on-site project consignments.',
      features: [
        'Real-time barcode tracking for PV serial numbers',
        'Automated purchase order generation based on active projects',
        'Vendor price book comparisons for tier-1 components',
        'Dispatch scheduling with delivery milestone confirmations'
      ],
      metric: 'Zero On-Site Stockout Rate'
    },
    {
      id: 'finance',
      label: 'Subsidy & Invoicing',
      title: 'DISCOM Net-Metering & PM-Surya Ghar Portal',
      description: 'Cut government subsidy approval times from 90 days to under 2 weeks with automated document compliance and milestone progress billing.',
      features: [
        'Direct DISCOM application form synchronization',
        'Automated consumer subsidy claim documentation',
        'GST-compliant progressive milestone tax invoices',
        'PPA billing, net metering reconciliation, and solar EMI loans'
      ],
      metric: '99.4% First-Time Subsidy Approval'
    },
    {
      id: 'telemetry',
      label: 'IoT Asset Telemetry',
      title: 'Real-Time Generation Yield & Fleet Monitoring',
      description: 'Connect micro-inverters and central inverters to stream instantaneous generation, Performance Ratio (PR), and automated fault alerts.',
      features: [
        'Native Modbus / RS485 and Wi-Fi inverter cloud bridge',
        'Predictive shading and degradation anomaly alerts',
        'Daily, monthly, and lifetime kWh generation analytics',
        'Branded customer solar generation dashboard'
      ],
      metric: '1.2s Real-Time Inverter Sync'
    },
  ];

  // Testimonials
  const TESTIMONIALS = [
    {
      quote: "MetaGreen transformed our solar EPC business. We reduced proposal preparation from 2 days to 10 minutes, and our DISCOM subsidy approvals cleared twice as fast.",
      name: "Rajeshwar Verma",
      role: "Managing Director",
      company: "SunRay Renewables EPC (50+ MW installed)",
    },
    {
      quote: "The 3D satellite survey engine and automated BOS inventory gave us complete control over multiple commercial rooftop projects simultaneously. A truly world-class platform.",
      name: "Ananya Deshmukh",
      role: "VP Operations",
      company: "CleanVolt Solar Solutions",
    },
    {
      quote: "Our residential rooftop clients love the live tracking portal. Having contractor verification, net metering, and inverter generation unified under one roof is revolutionary.",
      name: "Saurabh Singhania",
      role: "Founder & Chief Engineer",
      company: "EcoGrid Energy Systems",
    },
  ];

  // Check which page to render
  const renderCurrentPage = () => {
    switch (currentPath) {
      case '/about':
        return (
          <About
            onNavigateContact={() => navigateTo('/contact')}
            onNavigateSolutions={() => navigateTo('/solutions')}
            onOpenDemo={() => setIsBookDemoOpen(true)}
            onOpenPartner={() => setIsRegisterModalOpen(true)}
          />
        );
      case '/careers':
        return <Careers />;
      case '/contact':
        return <Contact />;
      case '/solutions':
        return (
          <Solutions
            onOpenDemo={() => setIsBookDemoOpen(true)}
            onOpenPartner={() => setIsRegisterModalOpen(true)}
            onNavigateContact={() => navigateTo('/contact')}
          />
        );
      case '/legal/privacy-policy':
        return <PrivacyPolicy onNavigateHome={() => navigateTo('/')} />;
      case '/legal/terms-of-service':
        return <TermsOfService onNavigateHome={() => navigateTo('/')} />;
      case '/legal/cancellation':
      case '/legal/cancellation-and-refund':
      case '/legal/refund':
        return <Cancellation onNavigateHome={() => navigateTo('/')} />;
      case '/legal/security':
        return <Security onNavigateHome={() => navigateTo('/')} />;
      case '/legal/compliance':
        return <Compliance onNavigateHome={() => navigateTo('/')} />;
      case '/sitemap':
        return <Sitemap onNavigateHome={() => navigateTo('/')} onNavigatePage={navigateTo} />;
      default:
        // Render Home Page matching MetaCheck
        return (
          <>
            {/* HERO SECTION */}
            <section className="relative min-h-screen overflow-hidden bg-[#050510] pt-24 pb-20 sm:pt-28 sm:pb-28 flex items-center" id="hero">
              <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                <div className="absolute left-1/2 top-1/4 h-[550px] w-[550px] -translate-x-1/2 rounded-full bg-emerald-600/15 blur-[140px]" />
                <div className="absolute right-0 top-1/3 h-[450px] w-[450px] rounded-full bg-teal-600/10 blur-[120px]" />
                <div className="absolute left-0 bottom-0 h-[400px] w-[400px] rounded-full bg-cyan-600/10 blur-[100px]" />
              </div>
              <div className="pointer-events-none absolute inset-0 bg-grid-dark opacity-30 [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,black_30%,transparent_100%)]" aria-hidden="true" />

              <Container className="relative z-10">
                <div className="grid w-full items-center gap-12 py-10 lg:grid-cols-2 lg:gap-16">
                  <Reveal variant="left" className="max-w-2xl">
                    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 backdrop-blur-sm">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                      </span>
                      <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                        Enterprise Clean Energy & Solar EPC OS
                      </span>
                    </div>

                    <h1 className="mt-7 text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-7xl">
                      Powering a{' '}
                      <span className="relative inline-block">
                        <span className="text-gradient-dark">greener, smarter</span>
                        <svg
                          className="absolute -bottom-2 left-0 h-3 w-full"
                          viewBox="0 0 200 12"
                          fill="none"
                          aria-hidden="true"
                        >
                          <path
                            d="M2 8c30-6 70-6 100-2s60 4 96-2"
                            stroke="url(#underline-grad-green)"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                          />
                          <defs>
                            <linearGradient id="underline-grad-green" x1="0" y1="0" x2="200" y2="0" gradientUnits="userSpaceOnUse">
                              <stop stopColor="#10b981" />
                              <stop offset="0.5" stopColor="#14b8a6" />
                              <stop offset="1" stopColor="#06b6d4" />
                            </linearGradient>
                          </defs>
                        </svg>
                      </span>{' '}
                      energy future
                    </h1>

                    <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
                      MetaGreen brings technology, solar engineering intelligence, and automated compliance together — empowering developers, rooftop EPCs, and clean energy enterprises to design, install, and monitor solar at scale.
                    </p>

                    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                      <button
                        onClick={() => setIsBookDemoOpen(true)}
                        className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-6 py-3.5 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all hover:brightness-110"
                      >
                        <span>Book Live Demo</span>
                        <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                      </button>
                      <button
                        onClick={() => navigateTo('/solutions')}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white hover:bg-white/10 transition-all"
                      >
                        Explore Solutions
                      </button>
                      <button
                        onClick={() => setIsRegisterModalOpen(true)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-6 py-3.5 text-sm font-bold text-emerald-300 hover:bg-emerald-500/20 transition-all"
                      >
                        Partner With Us
                      </button>
                    </div>

                    {/* Quick Tracking Bar */}
                    <div className="mt-8 rounded-2xl border border-white/10 bg-slate-900/60 p-3 backdrop-blur-md">
                      <form onSubmit={handleHeroTrackSubmit} className="flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
                          <input
                            type="text"
                            value={heroTrackInput}
                            onChange={(e) => setHeroTrackInput(e.target.value)}
                            placeholder="Track Solar Application / Project ID / Mobile No..."
                            className="w-full rounded-xl border border-white/10 bg-black/40 pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                          />
                        </div>
                        <button
                          type="submit"
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shrink-0"
                        >
                          Track Status <ArrowUpRight className="h-3.5 w-3.5" />
                        </button>
                      </form>
                    </div>

                    <div className="mt-10 flex flex-wrap items-center gap-6 border-t border-white/10 pt-7">
                      {[
                        { icon: ShieldCheck, label: 'MNRE Certified' },
                        { icon: Zap, label: '1.2s Inverter Sync' },
                        { icon: Globe, label: '10,000+ Active Sites' },
                      ].map(({ icon: Icon, label }) => (
                        <div key={label} className="flex items-center gap-2 text-xs font-medium text-slate-400">
                          <Icon className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                          {label}
                        </div>
                      ))}
                    </div>
                  </Reveal>

                  <Reveal variant="right" delay={180} once className="hidden lg:block">
                    <HeroCommandCard />
                  </Reveal>
                </div>
              </Container>
            </section>

            {/* STATS SECTION */}
            <section className="relative overflow-hidden bg-white py-20 sm:py-28 text-slate-900" aria-label="MetaGreen in numbers">
              <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                <div className="absolute left-1/2 top-0 h-px w-[80%] -translate-x-1/2 bg-gradient-to-r from-transparent via-emerald-300 to-transparent" />
              </div>

              <Container className="relative">
                <Reveal variant="up" once className="mx-auto max-w-2xl text-center">
                  <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Proof at scale</p>
                  <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                    Numbers we&apos;re held accountable to
                  </h2>
                  <p className="mt-3 text-base text-slate-600">
                    Measured continuously across the MetaGreen clean energy and solar EPC network.
                  </p>
                </Reveal>

                <dl className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { id: '1', value: 250, suffix: '+ MW', label: 'Clean Solar Installed', detail: 'Across residential rooftops and C&I industrial plants' },
                    { id: '2', value: 99.4, suffix: '%', decimals: 1, label: 'Subsidy Clearance Rate', detail: 'Automated DISCOM & PM-Surya Ghar sanctions' },
                    { id: '3', value: 10480, prefix: '', suffix: '+', label: 'Distributed Solar Sites', detail: 'Real-time telemetry and inverter sync' },
                    { id: '4', value: 45, prefix: '₹', suffix: ' Cr+', label: 'Annual Electricity Saved', detail: 'Delivered directly to enterprise and domestic owners' },
                  ].map((metric, index) => (
                    <Reveal key={metric.id} variant="up" delay={index * 100}>
                      <div className="group relative rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-7 text-center transition-all duration-500 hover:border-emerald-300 hover:shadow-soft">
                        <div className="absolute left-1/2 top-0 h-[2px] w-12 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                        <dd className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
                          <Counter end={metric.value} prefix={metric.prefix} suffix={metric.suffix} decimals={metric.decimals} />
                        </dd>
                        <dt className="mt-3 text-sm font-bold text-emerald-800">{metric.label}</dt>
                        <p className="mt-2 text-xs leading-relaxed text-slate-500">{metric.detail}</p>
                      </div>
                    </Reveal>
                  ))}
                </dl>
              </Container>
            </section>

            {/* PROBLEM CHALLENGES */}
            <section className="relative overflow-hidden bg-slate-50 py-24 sm:py-32 text-slate-900">
              <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-emerald-100/40 blur-[100px]" />
                <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-teal-100/40 blur-[80px]" />
              </div>

              <Container className="relative">
                <Reveal variant="up" once className="mx-auto max-w-3xl text-center">
                  <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">The Challenge</p>
                  <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                    The energy transition is accelerating.{' '}
                    <span className="text-gradient">Solar operations must keep up.</span>
                  </h2>
                  <p className="mt-5 text-base leading-relaxed text-slate-600 sm:text-lg">
                    As clean energy demand explodes across residential, commercial, and utility sectors, developers and EPCs face operational bottlenecks that compromise speed, compliance, and profitability.
                  </p>
                </Reveal>

                <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {PROBLEMS.map((problem, index) => (
                    <Reveal key={problem.number} variant="up" delay={index * 120}>
                      <article className="group relative h-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-7 transition-all duration-500 hover:-translate-y-2 hover:shadow-soft">
                        <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${problem.accent} opacity-0 transition-opacity duration-500 group-hover:opacity-100`} />

                        <div className="flex items-start justify-between">
                          <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${problem.bg} transition-transform duration-500 group-hover:scale-110`}>
                            <problem.icon className={`h-6 w-6 ${problem.iconColor}`} aria-hidden="true" />
                          </span>
                          <span className="text-3xl font-black text-slate-200 transition-colors duration-500 group-hover:text-slate-300">
                            {problem.number}
                          </span>
                        </div>

                        <h3 className="mt-5 text-lg font-bold text-slate-900">{problem.title}</h3>
                        <p className="mt-3 text-xs leading-relaxed text-slate-600">{problem.description}</p>
                        <div className="absolute bottom-0 left-0 h-px w-0 bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-700 group-hover:w-full" />
                      </article>
                    </Reveal>
                  ))}
                </div>
              </Container>
            </section>

            {/* PRODUCT COMMAND CENTER */}
            <ProductCommandCenter />

            {/* META ECOSYSTEM */}
            <EcosystemSection onPartnerClick={() => setIsRegisterModalOpen(true)} />

            {/* SOLUTIONS & MODULES */}
            <section className="relative overflow-hidden bg-white py-24 sm:py-32 text-slate-900" id="solutions">
              <Container className="relative">
                <SectionHeading
                  eyebrow="Flagship Capabilities"
                  title="Engineered for"
                  highlight="every solar milestone"
                  description="From lead acquisition and 3D rooftop simulation to government subsidy disbursement and live inverter generation monitoring."
                />

                <div className="mt-14 flex flex-wrap justify-center gap-2 border-b border-slate-200 pb-4">
                  {SOLUTION_TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveSolutionTab(tab.id as any)}
                      className={`rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                        activeSolutionTab === tab.id
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {(() => {
                  const currentTab = SOLUTION_TABS.find((t) => t.id === activeSolutionTab) || SOLUTION_TABS[0];
                  return (
                    <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50/80 p-8 sm:p-12 shadow-soft">
                      <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
                        <div className="lg:col-span-7">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                            <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                            {currentTab.metric}
                          </span>
                          <h3 className="mt-4 text-2xl font-bold text-slate-900 sm:text-3xl">
                            {currentTab.title}
                          </h3>
                          <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
                            {currentTab.description}
                          </p>

                          <div className="mt-6 grid gap-3 sm:grid-cols-2">
                            {currentTab.features.map((feat) => (
                              <div key={feat} className="flex items-start gap-2.5">
                                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                                <span className="text-xs font-medium text-slate-700">{feat}</span>
                              </div>
                            ))}
                          </div>

                          <div className="mt-8 flex flex-wrap gap-3">
                            <button
                              onClick={() => setIsBookDemoOpen(true)}
                              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-emerald-500 transition-all"
                            >
                              Explore in Live Demo
                            </button>
                            <button
                              onClick={() => navigateTo('/solutions')}
                              className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all"
                            >
                              View Full Solution Architecture
                            </button>
                          </div>
                        </div>

                        <div className="lg:col-span-5">
                          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Feature Status</span>
                              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">Production Ready</span>
                            </div>
                            <div className="mt-4 space-y-3 text-xs">
                              <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                                <span className="text-slate-500">Processing Speed</span>
                                <span className="font-bold text-slate-800">&lt; 1.2 Seconds</span>
                              </div>
                              <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                                <span className="text-slate-500">DISCOM Compatibility</span>
                                <span className="font-bold text-slate-800">All Indian State Discoms</span>
                              </div>
                              <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                                <span className="text-slate-500">Export Formats</span>
                                <span className="font-bold text-slate-800">PDF, DXF, CSV, JSON API</span>
                              </div>
                              <div className="flex items-center justify-between py-1.5">
                                <span className="text-slate-500">Security Standard</span>
                                <span className="font-bold text-emerald-600">AES-256 / ISO 27001</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </Container>
            </section>

            {/* SOLAR SAVINGS CALCULATOR */}
            <section className="relative overflow-hidden bg-slate-900 py-24 sm:py-32 text-white" id="calculator">
              <div className="pointer-events-none absolute inset-0 bg-grid-dark opacity-20" />
              <div className="pointer-events-none absolute right-10 top-1/2 -translate-y-1/2 h-80 w-80 rounded-full bg-emerald-500/15 blur-[120px]" />

              <Container className="relative z-10">
                <Reveal variant="up" once className="mx-auto max-w-3xl text-center">
                  <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">Interactive Estimator</p>
                  <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
                    Calculate your solar ROI in seconds
                  </h2>
                  <p className="mt-3 text-base text-slate-400">
                    Drag the slider to your average monthly electricity bill to calculate suggested system capacity, estimated government subsidies, and lifetime savings.
                  </p>
                </Reveal>

                <div className="mt-14 max-w-4xl mx-auto rounded-3xl border border-white/10 bg-slate-950/80 p-6 sm:p-10 shadow-glow backdrop-blur-xl">
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Average Monthly Electricity Bill
                      </label>
                      <span className="text-2xl font-black text-emerald-400 tabular-nums">
                        ₹{monthlyBill.toLocaleString()}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1500}
                      max={50000}
                      step={500}
                      value={monthlyBill}
                      onChange={(e) => setMonthlyBill(Number(e.target.value))}
                      className="mt-4 w-full accent-emerald-500 cursor-pointer h-2 rounded-lg bg-white/10"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 mt-2 font-mono">
                      <span>₹1,500/mo</span>
                      <span>₹25,000/mo</span>
                      <span>₹50,000/mo</span>
                    </div>
                  </div>

                  <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                      <p className="text-xs text-slate-400">Suggested Capacity</p>
                      <p className="mt-1 text-2xl font-black text-white tracking-tight">{recommendedKw} kW</p>
                      <p className="mt-1 text-[10px] text-emerald-400 font-semibold">{(recommendedKw * 120).toFixed(0)} kWh/month</p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                      <p className="text-xs text-slate-400">Govt. Subsidy (PM-SG)</p>
                      <p className="mt-1 text-2xl font-black text-emerald-400 tracking-tight">₹{estimatedSubsidy.toLocaleString()}</p>
                      <p className="mt-1 text-[10px] text-slate-400">Direct Bank Transfer</p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                      <p className="text-xs text-slate-400">Annual Savings</p>
                      <p className="mt-1 text-2xl font-black text-teal-300 tracking-tight">₹{annualSavings.toLocaleString()}</p>
                      <p className="mt-1 text-[10px] text-teal-400 font-semibold">Payback ~{paybackYears} yrs</p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                      <p className="text-xs text-slate-400">25-Yr Lifetime ROI</p>
                      <p className="mt-1 text-2xl font-black text-cyan-300 tracking-tight">₹{lifetimeSavings.toLocaleString()}</p>
                      <p className="mt-1 text-[10px] text-slate-400">Net Clean Yield</p>
                    </div>
                  </div>

                  <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10 pt-6">
                    <div className="text-xs text-slate-400 text-center sm:text-left">
                      <span>Want an exact 3D shadow report & quotation for this {recommendedKw} kW system?</span>
                    </div>
                    <button
                      onClick={() => setIsBookDemoOpen(true)}
                      className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-xs font-bold text-white shadow-glow hover:brightness-110 transition-all shrink-0"
                    >
                      Book Free Site Feasibility Survey
                    </button>
                  </div>
                </div>
              </Container>
            </section>

            {/* HOW IT WORKS */}
            <section className="relative overflow-hidden bg-white py-24 sm:py-32 text-slate-900" id="how-it-works">
              <Container className="relative">
                <SectionHeading
                  eyebrow="Workflow Engine"
                  title="How MetaGreen simplifies"
                  highlight="the solar journey"
                  description="Four streamlined steps taking your clean energy projects from preliminary roof analysis to permanent grid generation."
                />

                <div className="relative mt-20">
                  <div
                    className="absolute left-[28px] top-0 hidden h-full w-0.5 bg-gradient-to-b from-emerald-500 via-teal-500 to-cyan-500 sm:left-1/2 sm:-translate-x-1/2 sm:block"
                    aria-hidden="true"
                  />

                  <div className="space-y-12 sm:space-y-16">
                    {HOW_IT_WORKS_STEPS.map(({ icon: Icon, step, title, description, color }, index) => {
                      const isEven = index % 2 === 0;
                      return (
                        <Reveal key={step} variant={isEven ? 'left' : 'right'} delay={index * 120}>
                          <div className="relative sm:grid sm:grid-cols-2 sm:items-center sm:gap-16">
                            <div className="absolute left-[28px] z-10 -translate-x-1/2 sm:left-1/2">
                              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${color} text-white shadow-lg`}>
                                <Icon className="h-6 w-6" aria-hidden="true" />
                              </div>
                            </div>

                            <div className={`ml-20 sm:ml-0 ${isEven ? 'sm:text-right sm:pr-16' : 'sm:col-start-2 sm:pl-16'}`}>
                              <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">Step {step}</span>
                              <h3 className="mt-2 text-2xl font-bold text-slate-900">{title}</h3>
                              <p className="mt-3 text-sm leading-relaxed text-slate-600">{description}</p>
                            </div>

                            {isEven && <div className="hidden sm:block" />}
                          </div>
                        </Reveal>
                      );
                    })}
                  </div>
                </div>
              </Container>
            </section>

            {/* SECURITY SECTION */}
            <SecuritySection />

            {/* USE CASES */}
            <section className="relative overflow-hidden bg-slate-50 py-24 sm:py-32 text-slate-900" id="use-cases">
              <Container className="relative">
                <SectionHeading
                  eyebrow="Target Verticals"
                  title="Engineered for every"
                  highlight="clean energy stakeholder"
                  description="Whether you run rooftop installations, megawatt C&I plants, or hardware manufacturing lines."
                />

                <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    {
                      icon: Landmark,
                      title: 'Commercial & Industrial EPCs',
                      description: 'Accelerate corporate solar proposals, PPA structuring, and multi-rooftop project management.',
                      stats: '4x faster commissioning',
                      color: 'from-emerald-500 to-teal-600',
                    },
                    {
                      icon: ShoppingBag,
                      title: 'Residential Rooftop Installers',
                      description: 'Streamline customer surveys, fast-track PM-Surya Ghar subsidy claims, and automate billing.',
                      stats: '92% survey clearance',
                      color: 'from-teal-500 to-cyan-600',
                    },
                    {
                      icon: Handshake,
                      title: 'Solar OEMs & Distributors',
                      description: 'Manage vendor partner networks, component serial barcode warranties, and wholesale BOM orders.',
                      stats: '100% serial traceability',
                      color: 'from-cyan-500 to-blue-600',
                    },
                    {
                      icon: Users,
                      title: 'Clean Energy IPPs & Financiers',
                      description: 'Monitor fleet-wide Performance Ratios (PR), asset health, and automated gross revenue reconciliations.',
                      stats: '99.8% asset availability',
                      color: 'from-blue-500 to-indigo-600',
                    },
                  ].map(({ icon: Icon, title, description, stats, color }, index) => (
                    <Reveal key={title} variant="up" delay={index * 110}>
                      <article className="group relative h-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-7 transition-all duration-500 hover:-translate-y-2 hover:shadow-soft">
                        <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 transition-opacity duration-500 group-hover:opacity-[0.03]`} />

                        <div className="relative">
                          <div className="flex items-start justify-between">
                            <span className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${color} text-white shadow-lg transition-transform duration-500 group-hover:scale-110`}>
                              <Icon className="h-7 w-7" aria-hidden="true" />
                            </span>
                            <ArrowUpRight className="h-5 w-5 text-slate-300 transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-emerald-600" aria-hidden="true" />
                          </div>

                          <h3 className="mt-5 text-lg font-bold text-slate-900">{title}</h3>
                          <p className="mt-2.5 text-xs leading-relaxed text-slate-600">{description}</p>

                          <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                            <span className="text-xs font-bold text-emerald-600">{stats}</span>
                            <button
                              onClick={() => setIsBookDemoOpen(true)}
                              className="text-xs font-semibold text-slate-400 group-hover:text-emerald-600 transition-colors"
                            >
                              Explore →
                            </button>
                          </div>
                        </div>
                      </article>
                    </Reveal>
                  ))}
                </div>
              </Container>
            </section>

            {/* CUSTOMER STORIES */}
            <section className="relative overflow-hidden bg-white py-24 sm:py-32 text-slate-900">
              <Container className="relative">
                <SectionHeading
                  eyebrow="Customer Stories"
                  title="Solar leaders scaling"
                  highlight="with confidence"
                  description="See why forward-thinking EPC directors and operations heads rely on MetaGreen."
                />

                <div className="mt-16 grid gap-8 lg:grid-cols-3">
                  {TESTIMONIALS.map((t, index) => (
                    <Reveal key={t.name} variant="up" delay={index * 120}>
                      <figure className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/50 p-8 transition-all duration-500 hover:-translate-y-2 hover:shadow-soft">
                        <Quote className="absolute -right-2 -top-2 h-24 w-24 text-emerald-100/60 transition-all duration-500 group-hover:text-emerald-200/80" aria-hidden="true" />

                        <div className="relative z-10 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                              ))}
                            </div>
                            <blockquote className="mt-5 text-sm leading-relaxed text-slate-700 font-medium">
                              &ldquo;{t.quote}&rdquo;
                            </blockquote>
                          </div>

                          <figcaption className="mt-8 flex items-center gap-3.5 border-t border-slate-200 pt-5">
                            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-teal-500 text-sm font-black text-white shadow-md">
                              {t.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
                            </span>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{t.name}</p>
                              <p className="text-xs text-slate-500">{t.role} • {t.company}</p>
                            </div>
                          </figcaption>
                        </div>
                      </figure>
                    </Reveal>
                  ))}
                </div>
              </Container>
            </section>

            {/* PRICING */}
            <section className="relative overflow-hidden bg-slate-900 py-24 sm:py-32 text-white" id="pricing">
              <div className="pointer-events-none absolute inset-0 bg-grid-dark opacity-30" />

              <Container className="relative z-10">
                <Reveal variant="up" once className="mx-auto max-w-3xl text-center">
                  <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">Predictable Plans</p>
                  <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
                    Transparent investment for high-growth solar EPCs
                  </h2>
                  <p className="mt-3 text-base text-slate-400">
                    Start with a 7-day fully featured free trial. Upgrade or cancel anytime with zero lock-in contracts.
                  </p>

                  <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-white/10 bg-slate-950 px-4 py-2">
                    <button
                      onClick={() => setBillingCycle('monthly')}
                      className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
                        billingCycle === 'monthly' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setBillingCycle('annual')}
                      className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors flex items-center gap-1.5 ${
                        billingCycle === 'annual' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>Annual</span>
                      <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[10px] text-emerald-300 font-extrabold">
                        Save 20%
                      </span>
                    </button>
                  </div>
                </Reveal>

                <div className="mt-14 grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
                  {(plans.length > 0 ? plans : [
                    {
                      id: 'starter',
                      name: 'Starter Solar EPC',
                      priceMonthly: 4999,
                      userLimit: 5,
                      storageGBLimit: 50,
                      trialEnabled: true,
                      trialDays: 7,
                      status: 'active',
                      features: [
                        '3D Rooftop CAD & Shading Simulation',
                        'Solar Lead Pipeline & Site Surveying',
                        'PM-Surya Ghar Subsidy Tracker',
                        'GST Tax Invoice & Quotation Engine',
                        'Standard Email Support'
                      ]
                    },
                    {
                      id: 'pro',
                      name: 'Professional EPC',
                      priceMonthly: 9999,
                      userLimit: 20,
                      storageGBLimit: 250,
                      trialEnabled: true,
                      trialDays: 14,
                      status: 'active',
                      features: [
                        'Everything in Starter, plus:',
                        'IoT Inverter Telemetry Cloud Connector',
                        'BOS Inventory & Serial Number Barcode Tracking',
                        'Direct DISCOM Net-Metering Form Sync',
                        'Custom Vendor Branded Portal (+ ₹999)',
                        'Priority 24/7 Dedicated Support'
                      ]
                    },
                    {
                      id: 'enterprise',
                      name: 'Utility & Megawatt Enterprise',
                      priceMonthly: 19999,
                      userLimit: 100,
                      storageGBLimit: 1000,
                      trialEnabled: true,
                      trialDays: 14,
                      status: 'active',
                      features: [
                        'Everything in Professional, plus:',
                        'Multi-Branch Multi-Warehouse Management',
                        'Custom ERP & REST API Webhook Integrations',
                        'Dedicated Cloud Tenant & IP Whitelisting',
                        'On-Site Engineering Training & Dedicated Account Manager',
                        'Signed SLA Guarantee (99.9% Uptime)'
                      ]
                    }
                  ]).map((plan, index) => {
                    const isFeatured = index === 1;
                    const displayPrice = billingCycle === 'annual' ? Math.round(plan.priceMonthly * 0.8) : plan.priceMonthly;

                    return (
                      <div
                        key={plan.id}
                        className={`relative flex flex-col justify-between rounded-3xl p-8 transition-all ${
                          isFeatured
                            ? 'border-2 border-emerald-500 bg-slate-950 shadow-glow-lg -translate-y-2'
                            : 'border border-white/10 bg-slate-950/60 hover:border-white/20'
                        }`}
                      >
                        {isFeatured && (
                          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-3.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-950">
                            Most Popular for EPCs
                          </div>
                        )}

                        <div>
                          <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                          <p className="mt-2 text-xs text-slate-400">Up to {plan.userLimit} team seats • {plan.storageGBLimit} GB Cloud Storage</p>

                          <div className="mt-6 flex items-baseline gap-1">
                            <span className="text-4xl font-black text-white tracking-tight">₹{displayPrice.toLocaleString()}</span>
                            <span className="text-xs text-slate-400">/ month</span>
                          </div>
                          {billingCycle === 'annual' && (
                            <p className="text-[11px] text-emerald-400 font-medium mt-1">Billed annually (Save ₹{(plan.priceMonthly * 12 * 0.2).toLocaleString()}/yr)</p>
                          )}

                          <div className="mt-8 space-y-3">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Included Features:</p>
                            {plan.features.map((f: string) => (
                              <div key={f} className="flex items-start gap-2.5 text-xs text-slate-300">
                                <Check className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                                <span>{f}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/10">
                          <button
                            onClick={() => handleStartTrial(plan as any)}
                            className={`w-full py-3 rounded-xl font-bold text-xs transition-all shadow-md ${
                              isFeatured
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-glow'
                                : 'bg-white/10 hover:bg-white/15 text-white'
                            }`}
                          >
                            Start {plan.trialDays || 7}-Day Free Trial
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Container>
            </section>

            {/* CTA BANNER */}
            <section className="relative overflow-hidden bg-[#0a0a1a] py-20 sm:py-28">
              <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-emerald-600/20 blur-[130px]" />
              </div>

              <Container className="relative z-10">
                <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-950 p-8 sm:p-14 text-center shadow-glow-lg">
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold text-emerald-300 mb-6">
                    <Sparkles className="h-4 w-4 text-emerald-400" />
                    Modernize Your Clean Energy Enterprise
                  </div>

                  <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl max-w-2xl mx-auto">
                    Ready to scale your solar operations?
                  </h2>

                  <p className="mt-4 text-base leading-relaxed text-slate-400 max-w-xl mx-auto">
                    Join over 500+ forward-thinking clean energy companies, rooftop installers, and solar developers running on MetaGreen OS.
                  </p>

                  <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
                    <button
                      onClick={() => setIsBookDemoOpen(true)}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-3.5 text-sm font-bold text-white shadow-glow hover:brightness-110 transition-all"
                    >
                      <span>Book a Guided Demo</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setIsRegisterModalOpen(true)}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-8 py-3.5 text-sm font-semibold text-white hover:bg-white/10 transition-all"
                    >
                      Register as EPC Partner
                    </button>
                    <button
                      onClick={() => handleOpenLogin('admin')}
                      className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-8 py-3.5 text-sm font-bold text-emerald-300 hover:bg-emerald-500/20 transition-all"
                    >
                      Sign In to OS
                    </button>
                  </div>
                </div>
              </Container>
            </section>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 antialiased selection:bg-emerald-500 selection:text-slate-950">
      
      {/* ========================================================================= */}
      {/* STICKY GLASS NAVBAR (Matching MetaCheck with Active Nav Highlighting)      */}
      {/* ========================================================================= */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          isScrolled || mobileMenuOpen
            ? 'bg-[#0a0a1a]/95 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.4)]'
            : 'bg-[#0a0a1a]/80 backdrop-blur-md'
        }`}
      >
        <div
          className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-emerald-500/50 via-teal-500/50 to-cyan-500/50"
          aria-hidden="true"
        />

        <nav className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:h-[72px] lg:px-8">
          {/* Logo */}
          <div className="flex items-center gap-3">
            {isCustomLandingActive && activeVendorBranding ? (
              <div className="flex items-center gap-3">
                {activeVendorBranding.companyLogo ? (
                  <img
                    src={activeVendorBranding.companyLogo}
                    alt={activeVendorBranding.companyName}
                    className="h-10 w-auto object-contain rounded-lg bg-white p-1"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-xl bg-emerald-600 flex items-center justify-center font-bold text-white shadow-md">
                    {activeVendorBranding.companyName.charAt(0)}
                  </div>
                )}
                <div>
                  <span className="font-extrabold text-base tracking-tight text-white block">
                    {activeVendorBranding.companyName}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase block">
                    Powered by MetaGreen OS
                  </span>
                </div>
              </div>
            ) : (
              <button onClick={() => navigateTo('/')} className="flex items-center gap-2.5 group text-left cursor-pointer">
                <MetaGreenLogo className="h-10 sm:h-11 w-auto transition-transform group-hover:scale-105" />
              </button>
            )}
          </div>

          {/* Desktop Nav Links matching MetaCheck: Home, About, Solutions, Careers, Contact */}
          <ul className="hidden items-center gap-1 md:flex">
            {[
              { label: 'Home', path: '/' },
              { label: 'About', path: '/about' },
              { label: 'Solutions', path: '/solutions' },
              { label: 'Careers', path: '/careers' },
              { label: 'Contact', path: '/contact' },
            ].map((item) => {
              const isActive = currentPath === item.path;
              return (
                <li key={item.path}>
                  <button
                    onClick={() => navigateTo(item.path)}
                    className={`relative rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-white shadow-glow'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span>{item.label}</span>
                    {isActive && (
                      <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Right Action Buttons */}
          <div className="hidden items-center gap-2.5 sm:flex">
            <button
              onClick={() => {
                setTrackingInitialQuery('');
                setIsTrackingModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-teal-500/30 bg-teal-500/10 px-3 py-2 text-xs font-semibold text-teal-300 hover:bg-teal-500/20 transition-all"
            >
              <Search className="h-3.5 w-3.5" />
              Track Solar
            </button>

            <button
              onClick={() => handleOpenLogin('admin')}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10 hover:text-white transition-all"
            >
              Sign In
            </button>

            <button
              onClick={() => setIsRegisterModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3.5 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/25 transition-all"
            >
              Partner
            </button>

            <button
              onClick={() => setIsBookDemoOpen(true)}
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-4 py-2 text-xs font-bold text-white shadow-glow hover:shadow-glow-lg transition-all hover:brightness-110"
            >
              <span>Book Demo</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-white hover:bg-white/10 md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="border-t border-white/10 bg-[#0a0a1a]/95 px-5 py-5 backdrop-blur-xl md:hidden space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Home', path: '/' },
                { label: 'About', path: '/about' },
                { label: 'Solutions', path: '/solutions' },
                { label: 'Careers', path: '/careers' },
                { label: 'Contact', path: '/contact' },
              ].map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigateTo(item.path)}
                  className={`rounded-lg p-2.5 text-left text-xs font-semibold ${
                    currentPath === item.path
                      ? 'bg-emerald-500/20 text-emerald-400 font-bold'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsTrackingModalOpen(true);
                }}
                className="w-full py-2.5 rounded-xl bg-teal-500/15 text-teal-300 font-bold text-xs border border-teal-500/30 flex items-center justify-center gap-2"
              >
                <Search className="h-4 w-4" /> Track Solar Application
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleOpenLogin('admin');
                }}
                className="w-full py-2.5 rounded-xl bg-white/5 text-white font-semibold text-xs border border-white/10"
              >
                Sign In to Portal
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsRegisterModalOpen(true);
                }}
                className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md"
              >
                Partner with MetaGreen
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsBookDemoOpen(true);
                }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs shadow-glow"
              >
                Book Live Demonstration
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ========================================================================= */}
      {/* RENDER CURRENT PAGE ROUTE                                                 */}
      {/* ========================================================================= */}
      <main className="min-h-screen">
        {renderCurrentPage()}
      </main>

      {/* ========================================================================= */}
      {/* COMMON FOOTER (Matching MetaCheck Footer)                                 */}
      {/* ========================================================================= */}
      <LandingFooter
        onOpenLogin={handleOpenLogin}
        onOpenDemo={() => setIsBookDemoOpen(true)}
        onOpenPartner={() => setIsRegisterModalOpen(true)}
        onOpenTracking={() => {
          setTrackingInitialQuery('');
          setIsTrackingModalOpen(true);
        }}
        onOpenContact={() => navigateTo('/contact')}
        onNavigatePage={navigateTo}
      />

      {/* ========================================================================= */}
      {/* MODALS                                                                    */}
      {/* ========================================================================= */}
      {isRegisterModalOpen && (
        <VendorRegistrationModal
          selectedPlan={selectedPlan || plans[0] || DEFAULT_FALLBACK_PLAN}
          allPlans={plans.length > 0 ? plans : [DEFAULT_FALLBACK_PLAN]}
          onClose={() => setIsRegisterModalOpen(false)}
          onSuccess={() => {
            setIsRegisterModalOpen(false);
            onLoginSuccess();
          }}
        />
      )}

      {isLoginModalOpen && (
        <LoginModal
          initialRole={loginModalInitialRole}
          onClose={() => setIsLoginModalOpen(false)}
          onSuccess={() => {
            setIsLoginModalOpen(false);
            onLoginSuccess();
          }}
          onOpenSignUp={() => {
            setIsLoginModalOpen(false);
            handleStartTrial();
          }}
        />
      )}

      {isBookDemoOpen && (
        <BookDemoModal
          onClose={() => setIsBookDemoOpen(false)}
          onOpenSignUp={() => {
            setIsBookDemoOpen(false);
            handleStartTrial();
          }}
        />
      )}

      {isContactCareerOpen && (
        <ContactCareerModal
          initialPurpose={contactPurpose}
          onClose={() => setIsContactCareerOpen(false)}
        />
      )}

      {isTrackingModalOpen && (
        <ApplicationTrackingModal
          isOpen={isTrackingModalOpen}
          onClose={() => setIsTrackingModalOpen(false)}
          initialQuery={trackingInitialQuery}
        />
      )}

      {/* Scroll to Top Float */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-50 p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xl transition-all cursor-pointer hover:scale-105 flex items-center gap-1.5 text-xs font-bold border border-emerald-400/40"
          title="Back to Top"
        >
          <ChevronRight className="w-4 h-4 -rotate-90" />
          <span className="hidden sm:inline">Top</span>
        </button>
      )}

    </div>
  );
}
