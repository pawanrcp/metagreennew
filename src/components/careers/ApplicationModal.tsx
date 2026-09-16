import React, { useState } from 'react';
import { X, CheckCircle2, Loader2, ArrowRight, Upload, Briefcase, MapPin } from 'lucide-react';
import type { Job } from '@/src/data/jobs';

interface ApplicationModalProps {
  job: Job;
  onClose: () => void;
}

interface FormState {
  name: string;
  email: string;
  phone: string;
  portfolioUrl: string;
  experience: string;
  coverLetter: string;
}

const EMPTY: FormState = {
  name: '',
  email: '',
  phone: '',
  portfolioUrl: '',
  experience: '2-5 years',
  coverLetter: '',
};

export function ApplicationModal({ job, onClose }: ApplicationModalProps) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) errs.name = 'Please enter your full name.';
    if (!form.email.trim()) errs.email = 'Valid email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email address.';
    if (!form.phone.trim()) errs.phone = 'Contact phone number is required.';
    if (!form.coverLetter.trim()) errs.coverLetter = 'Please write a brief note on why this role excites you.';
    return errs;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setStatus('submitting');
    setTimeout(() => {
      setStatus('success');
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl text-white">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-white/10 bg-slate-950/70 px-6 py-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              Job Application • {job.department}
            </span>
            <h3 className="text-lg font-bold text-white">{job.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {status === 'success' ? (
          <div className="p-8 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h4 className="text-2xl font-black text-white">Application Received!</h4>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              Thank you for applying for the <span className="text-emerald-400 font-semibold">{job.title}</span> role at MetaGreen. Our talent team will review your profile and reach out within 48 hours.
            </p>
            <div className="pt-4">
              <button
                onClick={onClose}
                className="rounded-xl bg-emerald-600 px-8 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-500 transition-all"
              >
                Close & Return
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            <div className="flex items-center gap-4 rounded-xl bg-white/[0.03] p-3 text-xs text-slate-400 border border-white/5">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-emerald-400" /> {job.location} ({job.model})
              </span>
              <span className="flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5 text-teal-400" /> {job.type}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
                {errors.name && <p className="mt-1 text-[11px] text-red-400">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="priya@example.com"
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
                {errors.email && <p className="mt-1 text-[11px] text-red-400">{errors.email}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
                {errors.phone && <p className="mt-1 text-[11px] text-red-400">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Years of Experience</label>
                <select
                  value={form.experience}
                  onChange={(e) => handleChange('experience', e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="0-2 years">0-2 years (Entry/Junior)</option>
                  <option value="2-5 years">2-5 years (Mid-Level)</option>
                  <option value="5-8 years">5-8 years (Senior)</option>
                  <option value="8+ years">8+ years (Staff/Lead)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                LinkedIn / GitHub / Portfolio URL
              </label>
              <input
                type="url"
                value={form.portfolioUrl}
                onChange={(e) => handleChange('portfolioUrl', e.target.value)}
                placeholder="https://linkedin.com/in/username or https://github.com/..."
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Why are you a good fit for MetaGreen? *
              </label>
              <textarea
                rows={4}
                value={form.coverLetter}
                onChange={(e) => handleChange('coverLetter', e.target.value)}
                placeholder="Tell us about relevant clean energy, CAD, or engineering projects you've built..."
                className="w-full rounded-xl border border-white/10 bg-slate-950 p-3 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none resize-none"
              />
              {errors.coverLetter && <p className="mt-1 text-[11px] text-red-400">{errors.coverLetter}</p>}
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={status === 'submitting'}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-2.5 text-xs font-bold text-white shadow-glow hover:brightness-110 disabled:opacity-60 transition-all"
              >
                {status === 'submitting' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Submitting Application...
                  </>
                ) : (
                  <>
                    <span>Submit Application</span> <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
