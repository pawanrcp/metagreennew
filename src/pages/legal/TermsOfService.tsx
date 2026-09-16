import React from 'react';
import { Scale } from 'lucide-react';
import { LegalLayout, TocItem } from '@/src/components/legal/LegalLayout';

interface PageProps {
  onNavigateHome: () => void;
}

const TOC: TocItem[] = [
  { id: 'acceptance', label: '1. Acceptance of Terms' },
  { id: 'services', label: '2. Solar OS Services' },
  { id: 'partner-accounts', label: '3. EPC Partner Accounts' },
  { id: 'accuracy', label: '4. Engineering & Simulation' },
  { id: 'payment', label: '5. Subscription & Billing' },
  { id: 'ip', label: '6. Intellectual Property' },
  { id: 'liability', label: '7. Limitation of Liability' },
];

export function TermsOfService({ onNavigateHome }: PageProps) {
  return (
    <LegalLayout
      icon={Scale}
      eyebrow="Terms & Conditions"
      title="Terms of Service"
      description="The governing agreement between MetaGreen and solar developers, EPC contractors, installers, and consumers utilizing our platform."
      updatedAt="September 2026"
      toc={TOC}
      onBackToHome={onNavigateHome}
    >
      <section id="acceptance">
        <h2 className="text-xl font-bold text-slate-900 mb-3">1. Acceptance of Terms</h2>
        <p>
          By accessing or using MetaGreen OS, associated APIs, mobile survey tools, or customer portals, you agree to be bound by these Terms of Service. If you are entering into this agreement on behalf of a company or EPC entity, you warrant that you possess full authority to bind that entity.
        </p>
      </section>

      <section id="services">
        <h2 className="text-xl font-bold text-slate-900 mb-3">2. Solar OS Services</h2>
        <p>
          MetaGreen provides cloud software for solar CAD rooftop layout, bill-of-materials generation, DISCOM subsidy submission automation, quotation generation, and inverter IoT telemetry streaming.
        </p>
      </section>

      <section id="partner-accounts">
        <h2 className="text-xl font-bold text-slate-900 mb-3">3. EPC Partner Accounts</h2>
        <p>
          EPC partners must maintain accurate registration, licensing, and credential records. White-label custom domains and branded customer portals are subject to active platform subscriptions.
        </p>
      </section>

      <section id="accuracy">
        <h2 className="text-xl font-bold text-slate-900 mb-3">4. Engineering & Simulation Disclaimer</h2>
        <p>
          3D satellite simulations and irradiance projections are generated using state-of-the-art solar modeling algorithms. While highly predictive (99%+ accuracy), on-site physical engineering audits remain the final responsibility of the certified installer prior to structural drilling.
        </p>
      </section>

      <section id="payment">
        <h2 className="text-xl font-bold text-slate-900 mb-3">5. Subscription & Billing</h2>
        <p>
          Subscription plans are billed monthly or annually in advance. Invoices include applicable Goods and Services Tax (GST). Failure to maintain timely subscription payments may result in temporary restriction of cloud storage and API endpoints.
        </p>
      </section>

      <section id="ip">
        <h2 className="text-xl font-bold text-slate-900 mb-3">6. Intellectual Property</h2>
        <p>
          MetaGreen retains all rights, title, and interest in its software algorithms, design engines, CAD utilities, and proprietary telemetry protocols. EPC partners retain full ownership of customer databases, contracts, and uploaded site photographs.
        </p>
      </section>

      <section id="liability">
        <h2 className="text-xl font-bold text-slate-900 mb-3">7. Limitation of Liability</h2>
        <p>
          In no event shall MetaGreen or MetaDev Innovations be liable for indirect, punitive, or consequential damages resulting from DISCOM utility grid delays, weather anomalies, or third-party hardware inverter failures.
        </p>
      </section>
    </LegalLayout>
  );
}
