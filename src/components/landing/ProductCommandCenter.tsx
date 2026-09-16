import React, { useState } from 'react';
import { Container } from './Container';
import { Reveal } from './Reveal';
import { Sun, CheckCircle2, Clock, Zap, TrendingUp, Layers, ChevronRight } from 'lucide-react';

const KPI_CARDS = [
  { icon: CheckCircle2, label: 'Grid Auto-Approval', value: '94.6%', delta: '+3.2 pts', positive: true, color: 'text-emerald-400' },
  { icon: Clock, label: 'Commissioning Time', value: '12 Days', delta: '-5 Days', positive: true, color: 'text-teal-400' },
  { icon: Sun, label: 'Clean Yield Rate', value: '99.8%', delta: '+0.6%', positive: true, color: 'text-amber-400' },
  { icon: TrendingUp, label: 'Active EPC Sites', value: '1,420+', delta: 'live telemetry', positive: undefined, color: 'text-cyan-400' },
];

const GENERATION_BARS = [45, 62, 58, 72, 68, 85, 76, 92, 84, 98, 91, 100];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const PROJECT_ROWS = [
  { id: '#MG-88201', client: 'Apex Textiles Industrial Park', capacity: '120 kW C&I Rooftop', status: 'Grid Synchronized', tone: 'text-emerald-400 bg-emerald-500/10 ring-emerald-500/20' },
  { id: '#MG-88198', client: 'Greenfield Cold Storage', capacity: '50 kW On-Grid Solar', status: 'Subsidy Disbursed', tone: 'text-emerald-400 bg-emerald-500/10 ring-emerald-500/20' },
  { id: '#MG-88194', client: 'Dr. Ramesh Sharma Villa', capacity: '8 kW PM-Surya Ghar', status: 'Net-Meter Installed', tone: 'text-teal-400 bg-teal-500/10 ring-teal-500/20' },
  { id: '#MG-88189', client: 'Sterling Logistics Warehouse', capacity: '250 kW Ground Mount', status: 'Inverter Testing', tone: 'text-amber-400 bg-amber-500/10 ring-amber-500/20' },
];

export function ProductCommandCenter() {
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);

  return (
    <section className="relative overflow-hidden bg-[#0a0a1a] py-24 sm:py-32" id="command-center">
      {/* Background effects matching MetaCheck */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-600/10 blur-[120px]" />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-grid-dark opacity-30 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black_40%,transparent_100%)]" aria-hidden="true" />

      <Container className="relative">
        <Reveal variant="up" once className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">One Unified OS</p>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Every solar project,{' '}
            <span className="text-gradient-dark">one command center</span>
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-slate-400">
            From 3D satellite roof layout to automated discom subsidy filings, procurement BOMs, and IoT generation telemetry — watch your clean energy enterprise scale smoothly.
          </p>
        </Reveal>

        <Reveal variant="up" delay={150} className="mt-16">
          <div className="relative mx-auto max-w-5xl">
            {/* Glow backdrop */}
            <div className="pointer-events-none absolute -inset-4 rounded-[2rem] bg-gradient-to-r from-emerald-500/20 via-teal-500/10 to-cyan-500/20 blur-3xl" aria-hidden="true" />

            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 shadow-glow-lg backdrop-blur-xl">
              {/* Window chrome header */}
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5 bg-slate-950/60">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-red-500/80" aria-hidden="true" />
                  <span className="h-3 w-3 rounded-full bg-amber-500/80" aria-hidden="true" />
                  <span className="h-3 w-3 rounded-full bg-emerald-500/80" aria-hidden="true" />
                  <span className="ml-4 hidden rounded-md bg-white/5 px-3 py-1 text-xs font-mono text-slate-400 sm:block">
                    app.metagreen.io/dashboard/solar-os
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" /> Live Data
                  </span>
                </div>
              </div>

              <div className="p-6 sm:p-8 space-y-6">
                {/* KPIs Grid */}
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {KPI_CARDS.map((kpi) => (
                    <div
                      key={kpi.label}
                      className="rounded-xl border border-white/5 bg-white/[0.03] p-4 transition-all duration-300 hover:border-emerald-500/30 hover:bg-white/[0.05]"
                    >
                      <div className="flex items-center gap-2">
                        <kpi.icon className={`h-4 w-4 ${kpi.color}`} aria-hidden="true" />
                        <p className="truncate text-[11px] font-medium text-slate-400">{kpi.label}</p>
                      </div>
                      <p className="mt-2 text-xl font-bold text-white tracking-tight">{kpi.value}</p>
                      {kpi.delta && (
                        <p className={`mt-0.5 text-[11px] font-semibold ${kpi.positive ? 'text-emerald-400' : 'text-slate-400'}`}>
                          {kpi.delta}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Interactive Chart */}
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-white">Monthly Generation & Megawatt Commissioned</p>
                      <p className="text-xs text-slate-400">Telemetry over past 12 months</p>
                    </div>
                    {hoveredMonth !== null && (
                      <div className="text-right">
                        <p className="text-xs font-bold text-emerald-400">
                          {MONTHS[hoveredMonth]}: {(GENERATION_BARS[hoveredMonth] * 18.2).toFixed(1)} MWh
                        </p>
                      </div>
                    )}
                  </div>
                  <div
                    className="mt-5 flex h-36 items-end gap-2 sm:gap-3"
                    role="img"
                    aria-label="Solar monthly generation chart"
                  >
                    {GENERATION_BARS.map((height, index) => (
                      <div
                        key={index}
                        onMouseEnter={() => setHoveredMonth(index)}
                        onMouseLeave={() => setHoveredMonth(null)}
                        className="group relative flex-1 flex flex-col items-center h-full justify-end cursor-pointer"
                      >
                        <div
                          style={{ height: `${height}%` }}
                          className={`w-full rounded-t-md transition-all duration-300 group-hover:brightness-125 ${
                            index >= GENERATION_BARS.length - 3
                              ? 'bg-gradient-to-t from-emerald-600 via-teal-500 to-cyan-400 shadow-glow'
                              : 'bg-white/15'
                          }`}
                        />
                        <span className="mt-2 text-[10px] text-slate-500 font-mono hidden sm:block">
                          {MONTHS[index]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Live Projects Table */}
                <div className="overflow-x-auto rounded-xl border border-white/5">
                  <table className="w-full min-w-[520px] text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/[0.02] text-slate-400">
                        <th scope="col" className="px-4 py-3 font-semibold">Plant ID</th>
                        <th scope="col" className="px-4 py-3 font-semibold">Client / Project</th>
                        <th scope="col" className="px-4 py-3 font-semibold">Capacity & Type</th>
                        <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {PROJECT_ROWS.map((row) => (
                        <tr key={row.id} className="transition-colors hover:bg-white/[0.04]">
                          <td className="whitespace-nowrap px-4 py-3 font-mono font-medium text-emerald-400">{row.id}</td>
                          <td className="whitespace-nowrap px-4 py-3 font-medium text-white">{row.client}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-slate-400">{row.capacity}</td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${row.tone}`}>
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
