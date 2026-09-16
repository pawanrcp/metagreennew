import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { LegalLayout, TocItem } from '@/src/components/legal/LegalLayout';

interface PageProps {
  onNavigateHome: () => void;
}

const TOC: TocItem[] = [
  { id: 'infrastructure', label: '1. Cloud Infrastructure' },
  { id: 'encryption', label: '2. Encryption Architecture' },
  { id: 'iot-security', label: '3. IoT & Inverter Edge' },
  { id: 'access-control', label: '4. Multi-Tenant Access' },
  { id: 'vulnerability', label: '5. Vulnerability Management' },
  { id: 'incident-response', label: '6. Incident Response' },
];

export function Security({ onNavigateHome }: PageProps) {
  return (
    <LegalLayout
      icon={ShieldAlert}
      eyebrow="Architecture & Defense"
      title="Security Policy"
      description="Detailed technical breakdown of MetaGreen's cloud security posture, inverter telemetry isolation, and compliance controls."
      updatedAt="September 2026"
      toc={TOC}
      onBackToHome={onNavigateHome}
    >
      <section id="infrastructure">
        <h2 className="text-xl font-bold text-slate-900 mb-3">1. Cloud Infrastructure</h2>
        <p>
          MetaGreen is hosted across sovereign Indian cloud availability zones with auto-scaling Kubernetes clusters. Production workloads operate behind DDoS-shielded web application firewalls (WAF) with 99.9% uptime guarantees.
        </p>
      </section>

      <section id="encryption">
        <h2 className="text-xl font-bold text-slate-900 mb-3">2. Encryption Architecture</h2>
        <p>
          All data in transit is protected using TLS 1.3 with Perfect Forward Secrecy (PFS). Data at rest in Firestore, Cloud Storage, and telemetry time-series databases is encrypted using AES-256 with automatically rotated cryptographic keys.
        </p>
      </section>

      <section id="iot-security">
        <h2 className="text-xl font-bold text-slate-900 mb-3">3. IoT & Inverter Edge Gateway</h2>
        <p>
          Inverter communications via Modbus RS-485, MQTT, and cellular IoT gateways utilize mutual TLS (mTLS) certificate validation to prevent grid spoofing, unauthorized firmware injection, or remote relay tampering.
        </p>
      </section>

      <section id="access-control">
        <h2 className="text-xl font-bold text-slate-900 mb-3">4. Multi-Tenant Access Controls</h2>
        <p>
          Strict role-based access control (RBAC) separates Super Admins, EPC Vendors, Survey Engineers, Installers, and End-Consumers. Each EPC tenant operates in a logically isolated partition ensuring zero data cross-leakage.
        </p>
      </section>

      <section id="vulnerability">
        <h2 className="text-xl font-bold text-slate-900 mb-3">5. Continuous Vulnerability Management</h2>
        <p>
          We conduct bi-weekly static code analysis (SAST), automated dependency scanning, and semi-annual third-party penetration testing. Identified vulnerabilities are remediated under strict SLAs based on CVSS severity scores.
        </p>
      </section>

      <section id="incident-response">
        <h2 className="text-xl font-bold text-slate-900 mb-3">6. 24/7 Incident Response</h2>
        <p>
          Our Security Operations Center maintains round-the-clock telemetry log monitoring. Security anomalies or disclosures can be reported immediately to <span className="font-semibold text-emerald-700">security@metagreen.in</span>.
        </p>
      </section>
    </LegalLayout>
  );
}
