import React, { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Clock3, ShieldCheck, ArrowLeft } from 'lucide-react';

export interface TocItem {
  id: string;
  label: string;
}

interface LegalLayoutProps {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  updatedAt: string;
  toc: TocItem[];
  children: React.ReactNode;
  onBackToHome: () => void;
}

export function LegalLayout({
  icon: Icon,
  eyebrow,
  title,
  description,
  updatedAt,
  toc,
  children,
  onBackToHome,
}: LegalLayoutProps) {
  const [active, setActive] = useState(toc[0]?.id ?? '');

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(e.target.id);
        }
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
    );
    toc.forEach((t) => {
      const el = document.getElementById(t.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [toc]);

  return (
    <div className="bg-white dark:bg-slate-950 min-h-screen text-slate-800 dark:text-slate-100 font-sans transition-colors duration-300">
      {/* Hero Banner matching MetaCheck */}
      <section className="relative isolate overflow-hidden border-b border-slate-200 dark:border-slate-800 bg-[#0a0a1a] px-4 pb-14 pt-28 sm:px-6 lg:px-8 lg:pb-16 lg:pt-36 text-white">
        {/* Glow */}
        <div className="pointer-events-none absolute -left-28 -top-28 h-[420px] w-[420px] rounded-full bg-emerald-500/20 blur-[90px]" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-32 -right-28 h-[460px] w-[460px] rounded-full bg-teal-500/15 blur-[90px]" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0 bg-grid-dark opacity-30" aria-hidden="true" />

        <div className="relative mx-auto flex max-w-[860px] flex-col items-center gap-3 text-center">
          <button
            onClick={onBackToHome}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-white/70 backdrop-blur transition hover:border-white/25 hover:text-white cursor-pointer"
          >
            <ArrowLeft size={14} /> Back to Home
          </button>

          <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-400 shadow-lg mt-2">
            <Icon size={28} strokeWidth={1.8} />
          </span>

          <span className="inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-300">
            {eyebrow}
          </span>

          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-[2.6rem]">
            {title}
          </h1>

          <p className="max-w-[44rem] text-sm leading-relaxed text-slate-300">
            {description}
          </p>

          <span className="mt-2 inline-flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
            <Clock3 size={13} /> Last updated: {updatedAt}
            <span className="h-1 w-1 rounded-full bg-white/20" aria-hidden="true" />
            <ShieldCheck size={13} /> MetaGreen Foundation • MetaDev Innovations Pvt. Ltd.
          </span>
        </div>
      </section>

      {/* Main Content Layout */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[240px_1fr] lg:items-start">
          {/* Table of Contents Sidebar */}
          <aside className="hidden lg:flex flex-col gap-4 sticky top-28">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">On this page</p>
            <nav>
              <ul className="flex flex-col gap-1 text-xs">
                {toc.map((t) => (
                  <li key={t.id}>
                    <a
                      href={`#${t.id}`}
                      className={`block rounded-lg border-l-2 px-3 py-2 leading-snug transition-colors ${
                        active === t.id
                          ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 font-bold text-emerald-800 dark:text-emerald-300'
                          : 'border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {t.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* Document Content */}
          <article className="prose prose-slate dark:prose-invert max-w-none space-y-10 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            {children}
          </article>
        </div>
      </div>
    </div>
  );
}
