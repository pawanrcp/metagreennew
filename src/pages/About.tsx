import React from 'react';
import {
  Rocket,
  Target,
  UserCheck,
  Shield,
  Users,
  Sparkles,
  ArrowRight,
  Sun,
  Leaf,
  Globe2,
  Zap
} from 'lucide-react';
import { Container } from '@/src/components/landing/Container';
import { Reveal } from '@/src/components/landing/Reveal';
import { SectionHeading } from '@/src/components/landing/SectionHeading';
import { VALUES, APPROACH } from '@/src/data/values';

interface AboutProps {
  onNavigateContact: () => void;
  onNavigateSolutions: () => void;
  onOpenDemo: () => void;
  onOpenPartner: () => void;
}

const FOUNDERS = [
  {
    name: 'Kishore Kodali',
    role: 'Founder & CEO',
    image: '/kishore.png',
    initials: 'KK',
    bio: 'Kishore founded MetaGreen to transform how renewable energy developers and solar EPCs operate. He sets product vision, engineering architecture, and clean energy ecosystem partnerships so companies can launch rooftop CAD, DISCOM approvals, and power monitoring without fragmented spreadsheets. His focus is simple: maximize clean gigawatt yields for every partner on MetaGreen.',
    highlights: [
      { icon: Rocket, label: 'Product Vision', desc: 'Sets solar OS architecture & category roadmap' },
      { icon: Target, label: 'Growth Strategy', desc: 'Scaling 250+ MW clean energy adoption' },
      { icon: UserCheck, label: 'Ecosystem Alliances', desc: 'Builds partnerships with Tier-1 OEMs & DISCOMs' },
    ],
    accent: '#10b981',
  },
  {
    name: 'Satya Kavipurapu',
    role: 'COO & Co-Founder',
    image: '/satya.png',
    initials: 'SK',
    bio: "Satya leads MetaGreen's operational execution—telemetry reliability, field installer enablement, and national DISCOM regulatory compliance. He ensures that site surveys, automated net-metering filings, and subsidy disbursals proceed with flawless precision so EPC partners scale without margin leakage.",
    highlights: [
      { icon: Shield, label: 'Operations & Reliability', desc: 'Automated DISCOM & national portal execution' },
      { icon: Users, label: 'Partner Success', desc: 'Onboarding 500+ EPCs & field crews' },
      { icon: Sparkles, label: 'Zero Grid Loss', desc: 'High-availability IoT telemetry pipelines' },
    ],
    accent: '#14b8a6',
  },
];

export function About({ onNavigateContact, onNavigateSolutions, onOpenDemo, onOpenPartner }: AboutProps) {
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
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold text-emerald-300 mb-6">
              <Leaf className="h-3.5 w-3.5" />
              Our Mission & Purpose
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Powering the intelligent{' '}
              <span className="text-gradient-dark">clean energy future</span>
            </h1>

            <p className="mt-6 text-base leading-relaxed text-slate-300 sm:text-lg">
              MetaGreen Foundation exists to remove operational friction from the global energy transition. We build mission-critical software that unifies 3D solar design, automated DISCOM net-metering, and real-time generation telemetry into one connected platform.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={onOpenDemo}
                className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-xs font-bold text-white shadow-glow hover:brightness-110 transition-all"
              >
                Experience MetaGreen
              </button>
              <button
                onClick={onNavigateSolutions}
                className="rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-xs font-semibold text-white hover:bg-white/10 transition-all"
              >
                View Solar OS Architecture
              </button>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* Core Values Section matching MetaCheck */}
      <section className="py-24 sm:py-32 bg-slate-50 border-y border-slate-200">
        <Container>
          <SectionHeading
            eyebrow="Core Values"
            title="Principles that guide"
            highlight="our engineering"
            description="Our values shape how we architect solar algorithms, structure DISCOM workflows, and treat our clean energy partners."
          />

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((val, index) => {
              const Icon = val.icon;
              return (
                <Reveal key={val.title} variant="up" delay={index * 100}>
                  <div className="group h-full rounded-2xl border border-slate-200 bg-white p-7 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-soft">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 mb-5 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">{val.title}</h3>
                    <p className="mt-2 text-xs leading-relaxed text-slate-600">{val.description}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </Container>
      </section>

      {/* 3-Step Approach matching MetaCheck */}
      <section className="py-24 sm:py-32 bg-white">
        <Container>
          <SectionHeading
            eyebrow="Our Methodology"
            title="How we approach"
            highlight="solar operations"
            description="A disciplined engineering framework that guarantees 99%+ accuracy from feasibility to 25-year generation."
          />

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {APPROACH.map((app, index) => (
              <Reveal key={app.step} variant="up" delay={index * 120}>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-8 relative overflow-hidden h-full flex flex-col justify-between">
                  <div className="absolute top-4 right-4 text-4xl font-black text-slate-200 select-none">
                    {app.step}
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">Step {app.step}</span>
                    <h3 className="text-xl font-bold text-slate-900 mt-2">{app.title}</h3>
                    <p className="text-xs leading-relaxed text-slate-600 mt-3">{app.description}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* Leadership / Founders Section matching MetaCheck */}
      <section className="py-24 sm:py-32 bg-slate-900 text-white relative overflow-hidden" id="leadership">
        <div className="pointer-events-none absolute inset-0 bg-grid-dark opacity-30" />
        <Container className="relative z-10">
          <Reveal variant="up" once className="mx-auto max-w-3xl text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">Leadership</p>
            <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl lg:text-5xl">
              Meet the founders
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              Passionate technologists and operators committed to digitizing the renewable energy frontier.
            </p>
          </Reveal>

          <div className="grid gap-10 md:grid-cols-2 max-w-5xl mx-auto">
            {FOUNDERS.map((founder, index) => (
              <Reveal key={founder.name} variant="up" delay={index * 140}>
                <div className="rounded-3xl border border-white/10 bg-slate-950 p-8 shadow-glow flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center gap-4 border-b border-white/10 pb-6">
                      <img
                        src={founder.image}
                        alt={founder.name}
                        className="h-16 w-16 rounded-2xl object-cover border-2 border-emerald-500/40 shadow-md"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div>
                        <h3 className="text-xl font-bold text-white">{founder.name}</h3>
                        <p className="text-xs font-semibold text-emerald-400">{founder.role}</p>
                      </div>
                    </div>

                    <p className="mt-5 text-xs leading-relaxed text-slate-300">{founder.bio}</p>
                  </div>

                  <div className="mt-6 pt-5 border-t border-white/10 space-y-2.5">
                    {founder.highlights.map((h) => {
                      const HIcon = h.icon;
                      return (
                        <div key={h.label} className="flex items-center gap-2.5 text-xs text-slate-400">
                          <HIcon className="h-4 w-4 text-emerald-400 shrink-0" />
                          <span className="font-semibold text-white">{h.label}:</span>
                          <span className="truncate">{h.desc}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white border-t border-slate-200 text-center">
        <Container>
          <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
            Join us in building a cleaner world
          </h2>
          <p className="mt-3 text-sm text-slate-600 max-w-xl mx-auto">
            Whether you are an EPC contractor looking to scale operations or a passionate engineer ready to build high-impact clean tech.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={onOpenPartner}
              className="rounded-xl bg-emerald-600 px-6 py-3 text-xs font-bold text-white shadow hover:bg-emerald-500 transition-all"
            >
              Partner With Us
            </button>
            <button
              onClick={onNavigateContact}
              className="rounded-xl border border-slate-300 bg-slate-50 px-6 py-3 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-all"
            >
              Contact Team
            </button>
          </div>
        </Container>
      </section>
    </div>
  );
}
