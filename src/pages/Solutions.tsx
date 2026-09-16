import React from 'react';
import {
  Sun,
  Zap,
  ShieldCheck,
  Activity,
  Cpu,
  Layers,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Code2,
  Globe2,
  Lock
} from 'lucide-react';
import { Container } from '@/src/components/landing/Container';
import { Reveal } from '@/src/components/landing/Reveal';
import { SectionHeading } from '@/src/components/landing/SectionHeading';

interface SolutionsProps {
  onOpenDemo: () => void;
  onOpenPartner: () => void;
  onNavigateContact: () => void;
}

const MODULES = [
  {
    icon: Sun,
    title: '3D Solar PV Layout & Irradiance Simulator',
    desc: 'Automate boundary tracing, roof pitch analysis, azimuth alignment, and hourly shadow calculations without third-party desktop CAD tools.',
    features: ['High-res satellite & LiDAR elevation sync', 'Automated string inverter DC/AC ratio checks', 'Single-line diagram (SLD) export to DXF/PDF', 'Loss diagram: soiling, thermal, mismatch, shading'],
    color: 'from-emerald-500 to-teal-600',
  },
  {
    icon: Layers,
    title: 'Solar Lead CRM & Mobile Survey Engine',
    desc: 'Empower field engineers and sales representatives with geotagged mobile surveys, shadow photography uploads, and instant feasibility reports.',
    features: ['Mobile roof survey app with offline capability', 'Geotagged site photos & electrical panel inspections', 'Automated customer WhatsApp quotation delivery', 'Lead scoring & sales representative commissions'],
    color: 'from-teal-500 to-cyan-600',
  },
  {
    icon: Zap,
    title: 'DISCOM Net-Metering & PM-Surya Ghar Automation',
    desc: 'Automate government subsidy applications, DISCOM grid feasibility filings, meter change requests, and joint inspection reports (JIR).',
    features: ['Integrated with National Solar Rooftop Portal', 'One-click DISCOM documentation generation', 'Consumer direct bank subsidy tracker', 'Automated utility escalation alerts'],
    color: 'from-cyan-500 to-blue-600',
  },
  {
    icon: Activity,
    title: 'Smart Inverter IoT & Fleet Telemetry Cloud',
    desc: 'Stream live AC/DC generation metrics, Performance Ratio (PR), temperature, and inverter error diagnostics with real-time alerting.',
    features: ['Universal Modbus RS-485 / Wi-Fi cloud bridge', 'Predictive shading & panel degradation alerts', 'White-labeled customer clean energy mobile app', 'Automated O&M ticket dispatching'],
    color: 'from-blue-500 to-indigo-600',
  },
  {
    icon: ShieldCheck,
    title: 'BOS Inventory & Automated Tax Invoicing',
    desc: 'Manage panels, inverters, structures, and cabling across central warehouses with GST e-invoicing and milestone disbursements.',
    features: ['Barcode serial number tracking for tier-1 warranties', 'Bill-of-Materials (BOM) generator from 3D layout', 'GST e-way bill & milestone progress billing', 'PPA reconciliation & solar loan EMI integration'],
    color: 'from-indigo-500 to-violet-600',
  },
];

const CODE_SAMPLE = `// Create an automated 3D Solar Project via MetaGreen API
curl -X POST https://api.metagreen.io/v1/solar/projects \\
  -H "Authorization: Bearer mg_live_9f82d1c8" \\
  -H "Content-Type: application/json" \\
  -d '{
    "client": "Apex Logistics Industrial Park",
    "roofCoordinates": {"lat": 12.9716, "lng": 77.5946},
    "monthlyBill": 85000,
    "systemType": "On-Grid C&I",
    "discom": "BESCOM_KARNATAKA",
    "autoSubsidy": true
  }'

// Response: 201 Created
{
  "projectId": "MG-88201",
  "recommendedKw": 120.5,
  "panelsCount": 220,
  "estimatedAnnualGeneration": "178,400 kWh",
  "discomFeasibility": "Approved",
  "sldPdfUrl": "https://cdn.metagreen.io/sld/MG-88201.pdf"
}`;

export function Solutions({ onOpenDemo, onOpenPartner, onNavigateContact }: SolutionsProps) {
  return (
    <div className="bg-white min-h-screen text-slate-800">
      {/* Hero Section matching MetaCheck */}
      <section className="relative overflow-hidden bg-[#050510] pt-28 pb-20 sm:pt-36 sm:pb-28 text-white">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -left-[15%] top-[10%] h-[500px] w-[500px] rounded-full bg-emerald-600/20 blur-[130px]" />
          <div className="absolute -right-[10%] top-[30%] h-[400px] w-[400px] rounded-full bg-teal-600/15 blur-[110px]" />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-grid-dark opacity-35" aria-hidden="true" />

        <Container className="relative z-10">
          <Reveal variant="up" once className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">Enterprise Solutions</p>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Clean energy technology built for{' '}
              <span className="text-gradient-dark">scale and precision</span>
            </h1>
            <p className="mt-6 text-base leading-relaxed text-slate-300 sm:text-lg">
              Explore the end-to-end software modules, automation pipelines, and developer APIs powering modern renewable developers and solar EPCs.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={onOpenDemo}
                className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3.5 text-xs font-bold text-white shadow-glow hover:brightness-110 transition-all"
              >
                Schedule Architecture Demo
              </button>
              <button
                onClick={onOpenPartner}
                className="rounded-xl border border-white/20 bg-white/5 px-6 py-3.5 text-xs font-semibold text-white hover:bg-white/10 transition-all"
              >
                Register as EPC Partner
              </button>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* Modules Deep Dive */}
      <section className="py-24 sm:py-32 bg-slate-50 border-y border-slate-200">
        <Container>
          <SectionHeading
            eyebrow="Capabilities"
            title="Every phase of the solar"
            highlight="lifecycle unified"
            description="Designed by solar engineers for high-throughput EPC operations and lifetime telemetry."
          />

          <div className="mt-16 space-y-8 max-w-5xl mx-auto">
            {MODULES.map((m, index) => {
              const Icon = m.icon;
              return (
                <Reveal key={m.title} variant="up" delay={index * 100}>
                  <div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-10 shadow-soft grid gap-8 md:grid-cols-12 md:items-center">
                    <div className="md:col-span-8">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${m.color} text-white shadow-sm`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">{m.title}</h3>
                      </div>
                      <p className="mt-3 text-xs leading-relaxed text-slate-600">{m.desc}</p>
                      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {m.features.map((f) => (
                          <div key={f} className="flex items-center gap-2 text-xs font-medium text-slate-700">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                            <span>{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="md:col-span-4 flex flex-col justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-8">
                      <button
                        onClick={onOpenDemo}
                        className="rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow hover:bg-emerald-500 transition-all text-center"
                      >
                        Request Module Demo
                      </button>
                      <p className="mt-2 text-[11px] text-center text-slate-400">Available across all standard tiers</p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Developer API Code Sample matching MetaCheck */}
      <section className="py-24 sm:py-32 bg-[#0a0a1a] text-white relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-grid-dark opacity-30" />
        <Container className="relative z-10">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-6">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300 mb-4">
                <Code2 className="h-3.5 w-3.5" /> Developer First Architecture
              </span>
              <h2 className="text-3xl font-extrabold sm:text-4xl text-white">
                Programmatic control of your solar pipeline
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-slate-300">
                Integrate MetaGreen directly into your proprietary lead funnels, ERP, accounting software, and SCADA infrastructure with authenticated REST APIs and webhooks.
              </p>

              <div className="mt-8 space-y-3 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Webhook triggers on DISCOM milestone approval
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Automated generation telemetry JSON endpoints
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" /> White-label embeddable customer solar widgets
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="rounded-2xl border border-white/10 bg-slate-900/90 shadow-glow overflow-hidden font-mono text-xs">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 bg-slate-950/70">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-red-400/80" />
                    <span className="h-3 w-3 rounded-full bg-amber-400/80" />
                    <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
                    <span className="ml-2 text-slate-400">cURL Example</span>
                  </div>
                  <span className="text-[10px] text-emerald-400">REST v1 API</span>
                </div>
                <pre className="p-5 text-slate-300 overflow-x-auto leading-relaxed whitespace-pre">
                  {CODE_SAMPLE}
                </pre>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white border-t border-slate-200 text-center">
        <Container>
          <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
            Modernize your solar EPC workflow today
          </h2>
          <p className="mt-3 text-sm text-slate-600 max-w-lg mx-auto">
            Book a personalized walkthrough with our technical architects and see MetaGreen in action.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={onOpenDemo}
              className="rounded-xl bg-emerald-600 px-6 py-3 text-xs font-bold text-white shadow hover:bg-emerald-500 transition-all"
            >
              Book Live Demo
            </button>
            <button
              onClick={onNavigateContact}
              className="rounded-xl border border-slate-300 bg-slate-50 px-6 py-3 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-all"
            >
              Contact Sales Team
            </button>
          </div>
        </Container>
      </section>
    </div>
  );
}
