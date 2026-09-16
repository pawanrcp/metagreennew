import React from 'react';
import { Container } from './Container';
import { MetaGreenLogo } from '../MetaGreenLogo';
import {
  ShieldCheck,
  BadgeCheck,
  Lock,
  Sun,
  Award,
  Globe,
  CheckCircle2,
  Zap,
  ArrowUpRight
} from 'lucide-react';

import metaCheckLogo from '@/src/assets/ecosystem/metaCheck.png';
import metaLedgerLogo from '@/src/assets/ecosystem/MetaLedger.png';
import metaFlowLogo from '@/src/assets/ecosystem/metaFlow.png';
import metaNavLogo from '@/src/assets/ecosystem/MetaNav.png';
import metaImLogo from '@/src/assets/ecosystem/metaIm.png';
import metaHireLogo from '@/src/assets/ecosystem/metaHire.png';

interface LandingFooterProps {
  onOpenLogin: (role?: 'admin' | 'vendor' | 'installer' | 'customer' | 'staff') => void;
  onOpenDemo: () => void;
  onOpenPartner: () => void;
  onOpenTracking: () => void;
  onOpenContact: () => void;
  onNavigatePage: (path: string) => void;
}

const ECOSYSTEM_LINKS = [
  { name: 'MetaCheck', desc: 'Vendor KYC & Trust', logo: metaCheckLogo, href: 'https://metacheck.in' },
  { name: 'MetaLedger', desc: 'Solar Invoicing & Net Metering', logo: metaLedgerLogo, href: 'https://metaledger.in' },
  { name: 'MetaFlow', desc: 'Approval & Subsidy Pipelines', logo: metaFlowLogo, href: 'https://metaflow.metadev.io' },
  { name: 'MetaNav', desc: 'Field Fleet & Survey Dispatch', logo: metaNavLogo, href: 'https://metanav.in' },
  { name: 'MetaIM', desc: 'PV Panels & BOS Inventory', logo: metaImLogo, href: 'https://metaledger.in' },
  { name: 'MetaHire', desc: 'Certified Solar Workforce', logo: metaHireLogo, href: 'https://metahire.metadev.io' },
];

const COMPLIANCE_BADGES = [
  { label: 'ISO 27001', detail: 'Information Security' },
  { label: 'ISO 9001', detail: 'Quality Management' },
  { label: 'MNRE Certified', detail: 'Govt. of India' },
  { label: 'IEC 61215', detail: 'PV Module Reliability' },
  { label: 'CE Certified', detail: 'European Conformity' },
  { label: 'SOC 2 Type II', detail: 'Cloud Security' },
];

export function LandingFooter({
  onOpenLogin,
  onOpenDemo,
  onOpenPartner,
  onOpenTracking,
  onOpenContact,
  onNavigatePage,
}: LandingFooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden bg-[#050510] text-slate-400 pt-20 pb-12 border-t border-white/10">
      {/* Background Watermark matching MetaCheck */}
      <div
        className="pointer-events-none absolute -bottom-10 left-1/2 -translate-x-1/2 select-none text-[18vw] font-black tracking-tighter text-white/[0.015] whitespace-nowrap"
        aria-hidden="true"
      >
        METAGREEN
      </div>

      <Container className="relative z-10">
        {/* Main Footer Links */}
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand Col */}
          <div className="col-span-2">
            <button onClick={() => onNavigatePage('/')} className="flex items-center gap-3 text-left">
              <MetaGreenLogo className="h-10 w-auto" />
            </button>
            <p className="mt-4 text-xs leading-relaxed text-slate-400 max-w-sm">
              MetaGreen is the next-generation clean energy operating system. Powering high-efficiency solar EPCs, automated DISCOM net-metering, 3D PV engineering, and IoT generation telemetry at scale.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <button
                onClick={() => onOpenLogin('admin')}
                className="rounded-lg bg-emerald-600/20 px-3 py-1.5 text-xs font-bold text-emerald-400 hover:bg-emerald-600/30 transition-colors border border-emerald-500/30"
              >
                Admin Portal
              </button>
              <button
                onClick={() => onOpenLogin('vendor')}
                className="rounded-lg bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10 transition-colors border border-white/10"
              >
                Partner Login
              </button>
              <button
                onClick={onOpenTracking}
                className="rounded-lg bg-teal-500/20 px-3 py-1.5 text-xs font-bold text-teal-300 hover:bg-teal-500/30 transition-colors border border-teal-500/30"
              >
                Track Application
              </button>
            </div>
          </div>

          {/* Solutions Col */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-white">Solar Solutions</h4>
            <ul className="mt-4 space-y-2 text-xs">
              <li><button onClick={() => onNavigatePage('/solutions')} className="hover:text-emerald-400 transition-colors text-left">3D Solar PV Design</button></li>
              <li><button onClick={() => onNavigatePage('/solutions')} className="hover:text-emerald-400 transition-colors text-left">Smart Solar CRM</button></li>
              <li><button onClick={() => onNavigatePage('/solutions')} className="hover:text-emerald-400 transition-colors text-left">MNRE Subsidy Automation</button></li>
              <li><button onClick={() => onNavigatePage('/solutions')} className="hover:text-emerald-400 transition-colors text-left">Automated Quotations</button></li>
              <li><button onClick={() => onNavigatePage('/solutions')} className="hover:text-emerald-400 transition-colors text-left">BOS Inventory & Warehousing</button></li>
              <li><button onClick={() => onNavigatePage('/solutions')} className="hover:text-emerald-400 transition-colors text-left">IoT Inverter Telemetry</button></li>
            </ul>
          </div>

          {/* Company Col */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-white">Company</h4>
            <ul className="mt-4 space-y-2 text-xs">
              <li><button onClick={() => onNavigatePage('/about')} className="hover:text-emerald-400 transition-colors text-left">About MetaGreen</button></li>
              <li><button onClick={() => onNavigatePage('/careers')} className="hover:text-emerald-400 transition-colors text-left">Careers & Hiring</button></li>
              <li><button onClick={() => onNavigatePage('/contact')} className="hover:text-emerald-400 transition-colors text-left">Contact & Offices</button></li>
              <li><button onClick={() => onNavigatePage('/legal/security')} className="hover:text-emerald-400 transition-colors text-left">Security Architecture</button></li>
              <li><button onClick={() => onNavigatePage('/legal/compliance')} className="hover:text-emerald-400 transition-colors text-left">Compliance & Standards</button></li>
              <li><button onClick={onOpenDemo} className="hover:text-emerald-400 transition-colors text-left">Book Live Demo</button></li>
            </ul>
          </div>

          {/* Meta Ecosystem Col */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-white">Meta Ecosystem</h4>
            <ul className="mt-4 space-y-2.5 text-xs">
              {ECOSYSTEM_LINKS.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between hover:text-white transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <img src={item.logo} alt={item.name} className="h-3.5 w-auto object-contain opacity-70 group-hover:opacity-100 transition-opacity" />
                      <span className="font-semibold">{item.name}</span>
                    </span>
                    <ArrowUpRight className="h-3 w-3 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Compliance Badges Row matching MetaCheck */}
        <div className="mt-14 border-t border-white/10 pt-8">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 text-center sm:text-left mb-4">
            Certified Standards & Industry Compliance
          </p>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2.5">
              {COMPLIANCE_BADGES.map((b) => (
                <div
                  key={b.label}
                  className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-slate-300"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  <span>{b.label}</span>
                </div>
              ))}
            </div>

            <button
              onClick={onOpenPartner}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Become an Authorized EPC Partner <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Bottom copyright & legal links */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 text-xs text-slate-500 sm:flex-row">
          <p>© {currentYear} MetaGreen Clean Energy Platform • MetaDev Innovations. All rights reserved.</p>
          <div className="flex flex-wrap gap-5 text-xs">
            <button onClick={() => onNavigatePage('/legal/privacy-policy')} className="hover:text-slate-300 transition-colors">Privacy Policy</button>
            <button onClick={() => onNavigatePage('/legal/terms-of-service')} className="hover:text-slate-300 transition-colors">Terms of Service</button>
            <button onClick={() => onNavigatePage('/legal/cancellation')} className="hover:text-slate-300 transition-colors">Cancellation & Refunds</button>
            <button onClick={() => onNavigatePage('/legal/security')} className="hover:text-slate-300 transition-colors">Security</button>
            <button onClick={() => onNavigatePage('/legal/compliance')} className="hover:text-slate-300 transition-colors">Compliance</button>
            <button onClick={() => onNavigatePage('/sitemap')} className="hover:text-slate-300 transition-colors">Sitemap</button>
          </div>
        </div>
      </Container>
    </footer>
  );
}
