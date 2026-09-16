import React from 'react';
import { Container } from './Container';
import { Reveal } from './Reveal';
import {
  ShieldCheck,
  Receipt,
  Workflow,
  Navigation,
  Package,
  UserCheck,
  Leaf,
  ArrowUpRight,
  ExternalLink
} from 'lucide-react';

import metaCheckLogo from '@/src/assets/ecosystem/metaCheck.png';
import metaLedgerLogo from '@/src/assets/ecosystem/MetaLedger.png';
import metaFlowLogo from '@/src/assets/ecosystem/metaFlow.png';
import metaNavLogo from '@/src/assets/ecosystem/MetaNav.png';
import metaImLogo from '@/src/assets/ecosystem/metaIm.png';
import metaHireLogo from '@/src/assets/ecosystem/metaHire.png';

interface EcosystemProduct {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  benefitForMetaGreen: string;
  icon: React.ElementType;
  logo: string;
  href: string;
  accent: string;
}

const COMPANIONS: EcosystemProduct[] = [
  {
    id: 'metacheck',
    name: 'MetaCheck',
    subtitle: 'Verification & Trust',
    description: 'Automated KYC, AML and credential verification.',
    benefitForMetaGreen: 'Verify EPC sub-contractors, installation crews, and DISCOM compliance credentials with audit-grade authenticity.',
    icon: ShieldCheck,
    logo: metaCheckLogo,
    href: 'https://metacheck.in',
    accent: '#F59E0B',
  },
  {
    id: 'metaledger',
    name: 'MetaLedger',
    subtitle: 'Billing & Finance',
    description: 'Invoicing & revenue reconciliation.',
    benefitForMetaGreen: 'Automate PPA billing, gross/net metering reconciliations, and tax-compliant EPC milestone disbursements.',
    icon: Receipt,
    logo: metaLedgerLogo,
    href: 'https://metaledger.in',
    accent: '#10B981',
  },
  {
    id: 'metaflow',
    name: 'MetaFlow',
    subtitle: 'Enterprise Workflow',
    description: 'Approvals & automation pipelines.',
    benefitForMetaGreen: 'Streamline multi-tier DISCOM subsidy submissions, engineering reviews, and municipal approval handoffs.',
    icon: Workflow,
    logo: metaFlowLogo,
    href: 'https://metaflow.metadev.io',
    accent: '#8B5CF6',
  },
  {
    id: 'metanav',
    name: 'MetaNav',
    subtitle: 'Fleet & Logistics',
    description: 'Route optimization & fleet dispatch.',
    benefitForMetaGreen: 'Dispatch field survey engineers and solar equipment delivery trucks with real-time GPS tracking and geofencing.',
    icon: Navigation,
    logo: metaNavLogo,
    href: 'https://metanav.in',
    accent: '#F97316',
  },
  {
    id: 'metaim',
    name: 'MetaIM',
    subtitle: 'Inventory & Supply Chain',
    description: 'Stock & catalog synchronization.',
    benefitForMetaGreen: 'Track solar PV panels, inverters, cabling, and BOS items across multiple regional warehouses with automated reorders.',
    icon: Package,
    logo: metaImLogo,
    href: 'https://metaledger.in',
    accent: '#06B6D4',
  },
  {
    id: 'metahire',
    name: 'MetaHire',
    subtitle: 'Hiring & Field Crews',
    description: 'Talent pipeline & skilled hiring.',
    benefitForMetaGreen: 'Rapidly hire and verify certified solar rooftop electricians, safety inspectors, and CAD design engineers.',
    icon: UserCheck,
    logo: metaHireLogo,
    href: 'https://metahire.metadev.io',
    accent: '#0066FF',
  },
];

interface EcosystemSectionProps {
  onPartnerClick?: () => void;
}

export function EcosystemSection({ onPartnerClick }: EcosystemSectionProps) {
  return (
    <section className="relative overflow-hidden bg-slate-50 dark:bg-slate-950 py-24 sm:py-32 transition-colors duration-200" id="ecosystem">
      {/* Decorative gradient blur */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-emerald-100/40 dark:bg-emerald-950/20 blur-[100px]" />
        <div className="absolute right-0 bottom-0 h-80 w-80 rounded-full bg-teal-100/30 dark:bg-teal-950/20 blur-[90px]" />
      </div>

      <Container className="relative">
        <Reveal variant="up" once className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">Meta Ecosystem</p>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl lg:text-5xl">
            Powering clean energy with{' '}
            <span className="text-gradient dark:text-gradient-dark">interconnected intelligence</span>
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-slate-600 dark:text-slate-300">
            MetaGreen seamlessly interconnects with the complete Meta enterprise suite — syncing contractor verification, solar billing, supply chains, and approval workflows.
          </p>
        </Reveal>

        {/* Centerpiece Banner */}
        <Reveal variant="up" delay={100} className="mt-16">
          <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 p-8 sm:p-12 text-white shadow-xl">
            <div className="absolute right-0 top-0 h-full w-1/2 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent pointer-events-none" />
            
            <div className="relative z-10 grid gap-8 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-8">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-300">
                  <Leaf className="h-3.5 w-3.5 text-emerald-400" />
                  Meta Ecosystem Central Clean Energy Hub
                </div>
                <h3 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                  MetaGreen • Enterprise Clean Energy & Solar EPC OS
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base max-w-2xl">
                  The central nervous system for renewable developers, rooftop EPCs, and solar financiers. Built natively to bridge digital verification, automated billing, and supply chain logistics.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={onPartnerClick}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-emerald-500 transition-all hover:shadow-lg"
                  >
                    Partner with MetaGreen <ArrowUpRight className="h-4 w-4" />
                  </button>
                  <a
                    href="#command-center"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition-all"
                  >
                    View Solar OS Telemetry
                  </a>
                </div>
              </div>

              <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-white/10 pt-6 lg:pt-0 lg:pl-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                    <p className="text-2xl font-black text-white tracking-tight">100%</p>
                    <p className="mt-1 text-xs text-slate-400">Automated Sync</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                    <p className="text-2xl font-black text-emerald-400 tracking-tight">&lt;48h</p>
                    <p className="mt-1 text-xs text-slate-400">Fast Setup</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center col-span-2">
                    <p className="text-xs font-semibold text-teal-300">Native Rest API & Webhooks</p>
                    <p className="mt-0.5 text-[11px] text-slate-400">Zero Custom Development Required</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Companion Ecosystem Cards matching MetaCheck */}
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {COMPANIONS.map((product, idx) => {
            const Icon = product.icon;
            return (
              <Reveal key={product.id} variant="up" delay={100 + idx * 60}>
                <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-soft">
                  {/* Top accent line */}
                  <div
                    className="absolute inset-x-0 top-0 h-[3px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{ background: `linear-gradient(90deg, ${product.accent}, transparent)` }}
                    aria-hidden="true"
                  />

                  <div className="flex items-start justify-between gap-3">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-transform duration-300 group-hover:scale-105"
                      style={{ backgroundColor: `${product.accent}15` }}
                    >
                      <Icon className="h-6 w-6" style={{ color: product.accent }} aria-hidden="true" />
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-600/10 dark:ring-emerald-500/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" /> Live Integration
                    </span>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <h4 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">{product.name}</h4>
                    <span className="text-xs font-semibold" style={{ color: product.accent }}>
                      • {product.subtitle}
                    </span>
                  </div>

                  <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300 flex-1">
                    {product.benefitForMetaGreen}
                  </p>

                  <div className="mt-4 flex items-center gap-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 text-xs text-slate-500 dark:text-slate-400 ring-1 ring-slate-100 dark:ring-slate-700">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: product.accent }} />
                    Seamless Two-Way Webhook
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
                    <a
                      href={product.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold transition-all hover:gap-2"
                      style={{ color: product.accent }}
                    >
                      Visit {product.name} <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    <img src={product.logo} alt={product.name} className="h-5 w-auto object-contain opacity-70 group-hover:opacity-100 transition-opacity" />
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
