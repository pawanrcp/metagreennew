import React from 'react';
import { Container } from './Container';
import { Reveal } from './Reveal';
import { Lock, FileClock, KeyRound, Server, Shield, Eye, Fingerprint, Cpu } from 'lucide-react';

const PILLARS = [
  {
    icon: Lock,
    title: 'Bank-Grade Data Protection',
    description: 'AES-256 encryption at rest, TLS 1.3 in transit, with strict national clean energy data governance.',
  },
  {
    icon: Server,
    title: 'Isolated IoT Telemetry',
    description: 'Hardware-isolated broker nodes securing high-throughput bidirectional inverter communication.',
  },
  {
    icon: FileClock,
    title: 'Immutable Audit Trails',
    description: 'Every 3D CAD design, DISCOM document, and subsidy disbursement is cryptographically timestamped.',
  },
  {
    icon: KeyRound,
    title: 'Role-Based Access Governance',
    description: 'Granular privileges for EPC owners, field technicians, survey engineers, and end-customers.',
  },
];

const AUDIT_LOG = [
  { time: '14:02:11', event: 'DISCOM net-metering sanction approved & signed', actor: 'discom-gateway', icon: Shield },
  { time: '14:02:08', event: '3D Roof Shading Analysis: 99.4% optimal yield verified', actor: 'solar-cad-v4', icon: Eye },
  { time: '14:01:54', event: 'EPC contractor license & KYC verified via MetaCheck', actor: 'metacheck-sync', icon: Fingerprint },
  { time: '14:01:40', event: 'Smart Inverter array telemetry synced (24.8 kW)', actor: 'iot-edge-broker', icon: Cpu },
];

export function SecuritySection() {
  return (
    <section className="relative overflow-hidden bg-[#0a0a1a] py-24 sm:py-32" id="security">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -left-24 bottom-0 h-80 w-80 rounded-full bg-emerald-500/10 blur-[100px]" />
        <div className="absolute -right-24 top-0 h-64 w-64 rounded-full bg-teal-500/10 blur-[80px]" />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-grid-dark opacity-30 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black_40%,transparent_100%)]" aria-hidden="true" />

      <Container className="relative">
        <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left Content */}
          <Reveal variant="left">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">Enterprise Security</p>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Clean energy infrastructure needs to{' '}
              <span className="text-gradient-dark">earn absolute trust</span>
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-slate-400">
              MetaGreen handles high-value government subsidies, confidential power purchase agreements (PPAs), and utility-scale solar asset telemetry. Security is engineered into our core foundation.
            </p>

            <div className="mt-10 grid gap-5 sm:grid-cols-2">
              {PILLARS.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="group flex gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-all duration-300 hover:border-emerald-500/30 hover:bg-white/[0.05]"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-400 transition-all duration-300 group-hover:scale-110">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-white">{title}</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>

          {/* Right - Terminal Audit Log matching MetaCheck */}
          <Reveal variant="right" delay={120}>
            <div className="rounded-2xl border border-white/10 bg-slate-900/80 shadow-glow backdrop-blur-xl">
              {/* Terminal header */}
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5 bg-slate-950/60">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-red-400/80" aria-hidden="true" />
                  <span className="h-3 w-3 rounded-full bg-amber-400/80" aria-hidden="true" />
                  <span className="h-3 w-3 rounded-full bg-emerald-400/80" aria-hidden="true" />
                  <span className="ml-3 text-xs font-mono text-slate-400">solar-audit-trail.log</span>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400 ring-1 ring-inset ring-emerald-500/25">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" aria-hidden="true" />
                  Cryptographically Signed
                </span>
              </div>

              {/* Log entries */}
              <ul className="divide-y divide-white/5 p-2">
                {AUDIT_LOG.map((entry, index) => (
                  <li
                    key={entry.time}
                    className="flex items-start gap-3 rounded-lg px-4 py-3.5 transition-colors hover:bg-white/5"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <entry.icon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
                    <span className="shrink-0 font-mono text-xs text-slate-500">{entry.time}</span>
                    <span className="min-w-0 flex-1 break-words font-mono text-xs text-slate-300">{entry.event}</span>
                    <span className="hidden shrink-0 rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-mono text-emerald-300 sm:block">
                      {entry.actor}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Footer */}
              <div className="border-t border-white/10 px-5 py-3.5 bg-slate-950/40">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-mono">Retained for 10 years</span>
                  <span className="font-mono text-emerald-400 font-semibold">Exportable legal evidence</span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
