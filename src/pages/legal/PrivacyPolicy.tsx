import React from 'react';
import { Lock } from 'lucide-react';
import { LegalLayout, TocItem } from '@/src/components/legal/LegalLayout';

interface PageProps {
  onNavigateHome: () => void;
}

const TOC: TocItem[] = [
  { id: 'introduction', label: '1. Introduction' },
  { id: 'data-collection', label: '2. Information We Collect' },
  { id: 'usage', label: '3. How We Use Data' },
  { id: 'discom-sharing', label: '4. DISCOM & Subsidy Filing' },
  { id: 'security', label: '5. Data Security & Storage' },
  { id: 'rights', label: '6. Your Rights & Retention' },
  { id: 'contact', label: '7. Privacy Inquiries' },
];

export function PrivacyPolicy({ onNavigateHome }: PageProps) {
  return (
    <LegalLayout
      icon={Lock}
      eyebrow="Legal & Privacy"
      title="Privacy Policy"
      description="How MetaGreen collects, protects, and handles consumer, EPC partner, and solar generation telemetry data across our clean energy platforms."
      updatedAt="September 2026"
      toc={TOC}
      onBackToHome={onNavigateHome}
    >
      <section id="introduction">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">1. Introduction</h2>
        <p>
          MetaGreen (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;), operated under MetaDev Innovations Pvt. Ltd., is dedicated to protecting the privacy of our EPC partners, solar installers, developers, and rooftop solar consumers. This Privacy Policy explains our practices regarding the collection, processing, and protection of information obtained through our Solar Enterprise Operating System and web interfaces.
        </p>
      </section>

      <section id="data-collection">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">2. Information We Collect</h2>
        <p>We collect information strictly necessary to provide accurate solar engineering, DISCOM permits, and IoT generation telemetry:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-600 dark:text-slate-300">
          <li><strong>EPC Partner & Vendor Profile:</strong> Company registration, GSTIN, PAN, bank payout coordinates, authorized personnel contacts.</li>
          <li><strong>Consumer & Site Information:</strong> Property address, electricity bill consumer numbers (CA/RR numbers), sanctioned load, sanctioned roof coordinates.</li>
          <li><strong>Engineering Telemetry:</strong> Inverter serial numbers, real-time AC/DC power outputs, solar irradiance data, and system health error codes.</li>
        </ul>
      </section>

      <section id="usage">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">3. How We Use Data</h2>
        <p>
          Data collected is utilized solely to power 3D rooftop simulation, generate single-line diagrams, execute DISCOM net-metering synchronization, file PM-Surya Ghar subsidy claims, and trigger predictive maintenance notifications.
        </p>
      </section>

      <section id="discom-sharing">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">4. DISCOM & Subsidy Filing</h2>
        <p>
          To facilitate government capital subsidies and net-metering grid interconnections, required consumer documents and engineering drawings are transmitted via encrypted API gateways directly to respective State Electricity Distribution Companies (DISCOMs) and the National Solar Rooftop Portal.
        </p>
      </section>

      <section id="security">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">5. Data Security & Storage</h2>
        <p>
          MetaGreen enforces bank-grade AES-256 encryption at rest and TLS 1.3 in transit. All customer and telemetry databases are isolated in high-availability Indian data centers conforming to ISO 27001 and CERT-In security standards.
        </p>
      </section>

      <section id="rights">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">6. Your Rights & Retention</h2>
        <p>
          Under the Digital Personal Data Protection (DPDP) Act and applicable renewable energy regulations, consumers and EPCs retain the right to access, rectify, or request deletion of personal identifiers, subject to statutory 5-year solar warranty and DISCOM audit mandates.
        </p>
      </section>

      <section id="contact">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">7. Privacy Inquiries</h2>
        <p>
          For questions regarding telemetry telemetry policies or data subject rights, contact our Data Protection Officer at{' '}
          <a href="mailto:privacy@metagreen.in" className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline">
            privacy@metagreen.in
          </a>.
        </p>
      </section>
    </LegalLayout>
  );
}
