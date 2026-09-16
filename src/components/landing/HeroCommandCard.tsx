import React from 'react';
import { Sun, Zap, CheckCircle2, ShieldCheck, Activity } from 'lucide-react';

export function HeroCommandCard() {
  return (
    <div className="relative">
      {/* Glow behind */}
      <div
        className="pointer-events-none absolute -inset-8 rounded-3xl bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-cyan-500/20 blur-3xl"
        aria-hidden="true"
      />

      {/* Main glass card */}
      <div className="relative rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-glow-lg backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 shadow-sm">
              <Sun className="h-5 w-5 text-slate-950" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Solar Generation Engine</p>
              <p className="text-xs text-slate-400">Live Grid & EPC Telemetry</p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 ring-1 ring-inset ring-emerald-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            99.8% Grid Yield
          </span>
        </div>

        {/* Real-time Metrics */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          {[
            { label: 'Active Yield', value: '142.8 MWh', trend: '+18.4%' },
            { label: 'Subsidy Cleared', value: '99.4%', trend: '+0.4%' },
            { label: 'Commissioning', value: '12 Days', trend: '-45%' },
          ].map((metric) => (
            <div
              key={metric.label}
              className="rounded-xl border border-white/5 bg-white/[0.03] p-3 transition-colors hover:bg-white/[0.06]"
            >
              <p className="text-[11px] font-medium text-slate-400">{metric.label}</p>
              <p className="mt-1 text-lg font-bold text-white tracking-tight">{metric.value}</p>
              <p className="text-[11px] font-semibold text-emerald-400">{metric.trend}</p>
            </div>
          ))}
        </div>

        {/* Live Activity Feed */}
        <div className="mt-5 space-y-2">
          {[
            { status: 'approved', text: '3D Rooftop Survey Cleared — 25 kW C&I Plant', time: '2s ago' },
            { status: 'processing', text: 'Inverter array sync — 18.2 kW active output', time: '6s ago' },
            { status: 'approved', text: 'MNRE Subsidy Sanctioned — ₹78,000 Discom Direct', time: '14s ago' },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5 transition-colors hover:bg-white/[0.05]"
            >
              <span
                className={`h-2 w-2 rounded-full shrink-0 ${
                  item.status === 'approved' ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
                }`}
              />
              <span className="flex-1 truncate text-xs text-slate-300">{item.text}</span>
              <span className="text-[10px] text-slate-500 shrink-0 font-mono">{item.time}</span>
            </div>
          ))}
        </div>

        {/* Bottom stats indicator */}
        <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-emerald-400" /> 10,480+ Connected Smart Inverters
          </span>
          <span className="text-emerald-400 font-semibold">Zero Transmission Loss</span>
        </div>
      </div>

      {/* Floating badge top-right */}
      <div className="absolute -right-5 -top-6 animate-float rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">MNRE Certified</p>
            <p className="text-[10px] text-emerald-400 font-medium">Discom Direct Sanction</p>
          </div>
        </div>
      </div>

      {/* Floating badge bottom-left */}
      <div className="absolute -bottom-5 -left-5 animate-float-slow rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-500/20 text-teal-400">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">1.2s Fast Telemetry</p>
            <p className="text-[10px] text-teal-300 font-medium">Auto BOM & Net Metering</p>
          </div>
        </div>
      </div>
    </div>
  );
}
