import React from 'react';
import { BadgeCheck, ShieldCheck } from 'lucide-react';
import { LegalLayout, TocItem } from '@/src/components/legal/LegalLayout';

interface PageProps {
  onNavigateHome: () => void;
}

const TOC: TocItem[] = [
  { id: 'standards', label: '1. Standards & Certifications' },
  { id: 'mnre', label: '2. MNRE & National Portal' },
  { id: 'discom', label: '3. DISCOM Regulatory Sync' },
  { id: 'pv-standards', label: '4. IEC & Hardware Compliance' },
  { id: 'audits', label: '5. Independent Audits' },
];

export function Compliance({ onNavigateHome }: PageProps) {
  return (
    <LegalLayout
      icon={BadgeCheck}
      eyebrow="Regulatory & Standards"
      title="Compliance & Standards"
      description="Overview of MetaGreen's certified standards, MNRE rooftop guidelines, and utility DISCOM compliance frameworks."
      updatedAt="September 2026"
      toc={TOC}
      onBackToHome={onNavigateHome}
    >
      <section id="standards">
        <h2 className="text-xl font-bold text-slate-900 mb-3">1. Standards & Certifications</h2>
        <p>MetaGreen maintains active adherence to international security and quality frameworks:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-600" /> ISO 27001:2022</h4>
            <p className="text-xs text-slate-500 mt-1">Information Security Management Systems across all cloud endpoints.</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-600" /> ISO 9001:2015</h4>
            <p className="text-xs text-slate-500 mt-1">Quality Management System for software design and customer onboarding.</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-600" /> SOC 2 Type II</h4>
            <p className="text-xs text-slate-500 mt-1">Evaluated across Security, Availability, and Confidentiality trust principles.</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-600" /> CERT-In Guidelines</h4>
            <p className="text-xs text-slate-500 mt-1">Compliant with National Cyber Security Directives and log retention rules.</p>
          </div>
        </div>
      </section>

      <section id="mnre">
        <h2 className="text-xl font-bold text-slate-900 mb-3">2. MNRE & National Portal Guidelines</h2>
        <p>
          All single-line diagrams, engineering proposals, and DCR (Domestic Content Requirement) module declarations generated through MetaGreen adhere strictly to the technical specifications outlined by the Ministry of New and Renewable Energy (MNRE) and PM-Surya Ghar: Muft Bijli Yojana.
        </p>
      </section>

      <section id="discom">
        <h2 className="text-xl font-bold text-slate-900 mb-3">3. DISCOM Regulatory Sync</h2>
        <p>
          MetaGreen&apos;s grid interconnection workflows map to State Electricity Regulatory Commission (SERC) net-metering regulations across all 28 states and union territories, ensuring zero rejection on technical documentation.
        </p>
      </section>

      <section id="pv-standards">
        <h2 className="text-xl font-bold text-slate-900 mb-3">4. IEC & Hardware Standards</h2>
        <p>
          Equipment catalogs in MetaGreen require verification against IEC 61215 / IEC 61730 for photovoltaic modules and IEC 62109 for solar string inverters, ensuring only tier-1 certified hardware is deployed.
        </p>
      </section>

      <section id="audits">
        <h2 className="text-xl font-bold text-slate-900 mb-3">5. Independent Audits & Reports</h2>
        <p>
          Enterprise customers may request our annual SOC 2 Type II report and ISO compliance summaries under non-disclosure agreement by contacting <span className="font-semibold text-emerald-700">compliance@metagreen.in</span>.
        </p>
      </section>
    </LegalLayout>
  );
}
