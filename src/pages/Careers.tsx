import React, { useState } from 'react';
import {
  Briefcase,
  MapPin,
  Clock,
  ArrowRight,
  Target,
  TrendingUp,
  Lightbulb,
  Heart,
  CheckCircle2,
  Users
} from 'lucide-react';
import { Container } from '@/src/components/landing/Container';
import { Reveal } from '@/src/components/landing/Reveal';
import { SectionHeading } from '@/src/components/landing/SectionHeading';
import { JOBS, DEPARTMENTS, PERKS, Job } from '@/src/data/jobs';
import { ApplicationModal } from '@/src/components/careers/ApplicationModal';

const WHY_WORK = [
  { icon: Target, title: 'Meaningful Purpose', description: 'Work on software and clean energy products directly decarbonizing our planet.' },
  { icon: TrendingUp, title: 'Rapid Growth', description: 'Learn from seasoned architects, clean tech veterans, and domain experts.' },
  { icon: Lightbulb, title: 'Extreme Ownership', description: 'Take high-impact ideas from concept to production deployment.' },
  { icon: Heart, title: 'Inclusive Culture', description: 'Remote-first flexibility with genuine empathy and work-life harmony.' },
];

const HIRING_PROCESS = [
  { step: '01', title: 'Application', description: 'Submit your profile and tell us what clean energy problems you love solving.' },
  { step: '02', title: 'Initial Connect', description: 'A conversational 30-minute chat with our talent partner.' },
  { step: '03', title: 'Deep Technical Dive', description: 'Practical discussion on code, system design, or solar operations.' },
  { step: '04', title: 'Team Alignment', description: 'Meet the team and founders to discuss vision and fit.' },
  { step: '05', title: 'Offer & Onboarding', description: 'Receive your offer, welcome hardware kit, and join our mission.' },
];

export function Careers() {
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const filteredJobs = activeFilter === 'All'
    ? JOBS
    : JOBS.filter((j) => j.department === activeFilter);

  return (
    <div className="bg-white dark:bg-slate-950 min-h-screen text-slate-800 dark:text-slate-100 transition-colors duration-300">
      {/* Hero Section matching MetaCheck */}
      <section className="relative overflow-hidden bg-[#050510] pt-28 pb-20 sm:pt-36 sm:pb-28 text-white">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -left-[15%] top-[10%] h-[500px] w-[500px] rounded-full bg-emerald-600/20 blur-[130px]" />
          <div className="absolute -right-[10%] top-[30%] h-[400px] w-[400px] rounded-full bg-teal-600/15 blur-[110px]" />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-grid-dark opacity-35" aria-hidden="true" />

        <Container className="relative z-10">
          <Reveal variant="up" once className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">Careers at MetaGreen</p>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Build clean tech that{' '}
              <span className="text-gradient-dark">matters</span>
            </h1>
            <p className="mt-6 text-base leading-relaxed text-slate-300 sm:text-lg">
              Join a world-class team of engineers, solar designers, and operators creating the digital backbone for renewable energy.
            </p>
            <div className="mt-8">
              <a
                href="#open-roles"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3.5 text-xs font-bold text-white shadow-glow hover:brightness-110 transition-all cursor-pointer"
              >
                <span>View {JOBS.length} Open Positions</span>
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* Why Work With Us Section */}
      <section className="py-20 sm:py-28 bg-slate-50 dark:bg-[#070716] border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
        <Container>
          <SectionHeading
            eyebrow="Why MetaGreen"
            title="A culture built for"
            highlight="impact & growth"
            description="We prioritize autonomy, craft excellence, and mission-driven problem solving."
          />

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {WHY_WORK.map((item, index) => {
              const Icon = item.icon;
              return (
                <Reveal key={item.title} variant="up" delay={index * 100}>
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-7 transition-all hover:shadow-soft dark:hover:shadow-glow">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 mb-4">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{item.title}</h3>
                    <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{item.description}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Open Roles Section matching MetaCheck */}
      <section className="py-24 sm:py-32 bg-white dark:bg-slate-950 transition-colors duration-200" id="open-roles">
        <Container>
          <SectionHeading
            eyebrow="Open Positions"
            title="Find your role at"
            highlight="MetaGreen"
            description="We are actively hiring across engineering, operations, design, and product."
          />

          {/* Department Filter Buttons */}
          <div className="mt-12 flex flex-wrap justify-center gap-2">
            {DEPARTMENTS.map((dept) => (
              <button
                key={dept}
                onClick={() => setActiveFilter(dept)}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                  activeFilter === dept
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {dept}
              </button>
            ))}
          </div>

          {/* Job List Cards */}
          <div className="mt-12 space-y-4 max-w-4xl mx-auto">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-6 transition-all hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-white dark:hover:bg-slate-900 hover:shadow-soft dark:hover:shadow-glow"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                      {job.department}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-slate-400 dark:text-slate-500" /> {job.location} ({job.model})
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                      <Clock className="h-3 w-3 text-slate-400 dark:text-slate-500" /> {job.type}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{job.title}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xl">{job.summary}</p>
                </div>

                <button
                  onClick={() => setSelectedJob(job)}
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 transition-all shrink-0 flex items-center gap-1.5 self-start sm:self-center cursor-pointer"
                >
                  <span>Apply Now</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Perks & Benefits Section */}
      <section className="py-20 bg-slate-900 text-white relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-grid-dark opacity-20" />
        <Container className="relative z-10">
          <SectionHeading
            dark
            eyebrow="Benefits"
            title="Everything you need to"
            highlight="do your best work"
            description="We support your health, wealth, learning, and peace of mind."
          />

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {PERKS.map((perk) => (
              <div
                key={perk}
                className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 text-xs font-medium text-slate-300"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{perk}</span>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Hiring Process Section */}
      <section className="py-24 sm:py-32 bg-white dark:bg-slate-950 transition-colors duration-200">
        <Container>
          <SectionHeading
            eyebrow="Hiring Process"
            title="Transparent & fast"
            highlight="interview journey"
            description="We respect your time. Our hiring process is streamlined, collaborative, and communicative."
          />

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {HIRING_PROCESS.map((p) => (
              <div
                key={p.step}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 p-6 flex flex-col justify-between"
              >
                <div>
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{p.step}</span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-2">{p.title}</h3>
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400 mt-2">{p.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Application Modal */}
      {selectedJob && (
        <ApplicationModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
        />
      )}
    </div>
  );
}
