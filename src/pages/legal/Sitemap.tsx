import React from 'react';
import { Map, ArrowRight } from 'lucide-react';
import { LegalLayout, TocItem } from '@/src/components/legal/LegalLayout';

interface PageProps {
  onNavigateHome: () => void;
  onNavigatePage: (path: string) => void;
}

const TOC: TocItem[] = [
  { id: 'main', label: '1. Main Platform Pages' },
  { id: 'solutions', label: '2. Solutions & Capabilities' },
  { id: 'legal', label: '3. Legal & Governance' },
  { id: 'ecosystem', label: '4. Meta Ecosystem' },
];

export function Sitemap({ onNavigateHome, onNavigatePage }: PageProps) {
  return (
    <LegalLayout
      icon={Map}
      eyebrow="Directory"
      title="Sitemap"
      description="Complete directory of pages, capabilities, and resources available across the MetaGreen platform."
      updatedAt="September 2026"
      toc={TOC}
      onBackToHome={onNavigateHome}
    >
      <section id="main">
        <h2 className="text-xl font-bold text-slate-900 mb-4">1. Main Platform Pages</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: 'Home Page', path: '/' },
            { label: 'About MetaGreen', path: '/about' },
            { label: 'Solutions & Capabilities', path: '/solutions' },
            { label: 'Careers & Open Roles', path: '/careers' },
            { label: 'Contact & Enterprise Sales', path: '/contact' },
          ].map((item) => (
            <button
              key={item.path}
              onClick={() => onNavigatePage(item.path)}
              className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all text-left text-xs font-bold text-slate-800"
            >
              <span>{item.label}</span>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600" />
            </button>
          ))}
        </div>
      </section>

      <section id="solutions">
        <h2 className="text-xl font-bold text-slate-900 mb-4">2. Solutions & Capabilities</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: '3D Rooftop CAD & Shading Simulation', path: '/solutions#design' },
            { label: 'Solar Lead CRM & Geotagged Surveys', path: '/solutions#crm' },
            { label: 'MNRE Subsidy & DISCOM Net-Metering', path: '/solutions#subsidy' },
            { label: 'Automated Quotations & Tax Invoices', path: '/solutions#finance' },
            { label: 'BOS Inventory & Serial Barcoding', path: '/solutions#inventory' },
            { label: 'IoT Inverter Telemetry Cloud Stream', path: '/solutions#telemetry' },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => onNavigatePage('/solutions')}
              className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all text-left text-xs font-bold text-slate-800"
            >
              <span>{item.label}</span>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </button>
          ))}
        </div>
      </section>

      <section id="legal">
        <h2 className="text-xl font-bold text-slate-900 mb-4">3. Legal & Governance</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: 'Privacy Policy', path: '/legal/privacy-policy' },
            { label: 'Terms of Service', path: '/legal/terms-of-service' },
            { label: 'Cancellation & Refunds', path: '/legal/cancellation' },
            { label: 'Security Architecture', path: '/legal/security' },
            { label: 'Compliance & Standards', path: '/legal/compliance' },
          ].map((item) => (
            <button
              key={item.path}
              onClick={() => onNavigatePage(item.path)}
              className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all text-left text-xs font-bold text-slate-800"
            >
              <span>{item.label}</span>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </button>
          ))}
        </div>
      </section>

      <section id="ecosystem">
        <h2 className="text-xl font-bold text-slate-900 mb-4">4. Meta Ecosystem</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: 'MetaCheck — Verification & Trust', url: 'https://metacheck.in' },
            { label: 'MetaLedger — Solar Billing & Invoicing', url: 'https://metaledger.in' },
            { label: 'MetaFlow — Approval Automation', url: 'https://metaflow.metadev.io' },
            { label: 'MetaNav — Fleet & Route Optimization', url: 'https://metanav.in' },
            { label: 'MetaIM — Inventory & Supply Chain', url: 'https://metaledger.in' },
            { label: 'MetaHire — Talent & Electricians', url: 'https://metahire.metadev.io' },
          ].map((item) => (
            <a
              key={item.label}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all text-left text-xs font-bold text-slate-800"
            >
              <span>{item.label}</span>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </a>
          ))}
        </div>
      </section>
    </LegalLayout>
  );
}
