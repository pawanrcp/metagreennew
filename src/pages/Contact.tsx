import React, { useState } from 'react';
import {
  Mail,
  Phone,
  MapPin,
  LifeBuoy,
  Handshake,
  UserPlus,
  Clock,
  ArrowRight,
  CheckCircle2,
  Loader2,
  ChevronDown
} from 'lucide-react';
import { Container } from '@/src/components/landing/Container';
import { Reveal } from '@/src/components/landing/Reveal';
import { SectionHeading } from '@/src/components/landing/SectionHeading';

const CHANNELS = [
  {
    icon: LifeBuoy,
    title: 'Customer Support',
    desc: 'Technical & platform assistance',
    value: 'support@metagreen.in',
    color: 'from-teal-500 to-cyan-500',
  },
  {
    icon: Handshake,
    title: 'Enterprise Partnerships',
    desc: 'Tier-1 EPCs, OEMs & DISCOMs',
    value: 'partners@metagreen.in',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    icon: UserPlus,
    title: 'Careers & Talent',
    desc: 'Join our clean energy mission',
    value: 'careers@metagreen.in',
    color: 'from-cyan-500 to-blue-500',
  },
];

const CONTACT_REASONS = [
  { value: 'demo', label: 'Request a live platform demo' },
  { value: 'pricing', label: 'EPC Pricing & subscription plans' },
  { value: 'enterprise', label: 'Enterprise / Utility-scale deployment' },
  { value: 'discom', label: 'DISCOM & PM-Surya Ghar integration' },
  { value: 'partnership', label: 'Solar OEM & hardware partnership' },
  { value: 'other', label: 'Other inquiry' },
];

const FAQ_ITEMS = [
  {
    q: 'How quickly can our EPC team be onboarded on MetaGreen?',
    a: 'Typical onboarding takes less than 48 hours. Our team assists with data migration of existing customer accounts, DISCOM portal credentials, and component price books.',
  },
  {
    q: 'Does MetaGreen support custom white-labeled vendor portals?',
    a: 'Yes! With our Professional and Enterprise plans, EPC partners receive a custom sub-domain or custom domain with their own logo, colors, and direct customer login portal.',
  },
  {
    q: 'How does the 3D Rooftop CAD engine handle complex obstacles and trees?',
    a: 'Our algorithm utilizes high-resolution satellite imagery and LiDAR surface models to detect parapet walls, water tanks, ventilation ducts, and surrounding foliage with hourly ray-traced shading loss simulations.',
  },
  {
    q: 'Is there an open REST API for ERP integration?',
    a: 'Yes, MetaGreen exposes webhook triggers and REST APIs for seamless integration with SAP, Salesforce, Zoho, and internal ERP systems.',
  },
];

export function Contact() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    size: '11-50',
    reason: 'demo',
    message: '',
  });

  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      alert('Please fill out all required fields.');
      return;
    }
    setStatus('submitting');
    setTimeout(() => {
      setStatus('success');
    }, 1200);
  };

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
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">Get in Touch</p>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Talk to our <span className="text-gradient-dark">solar experts</span>
            </h1>
            <p className="mt-6 text-base leading-relaxed text-slate-300 sm:text-lg">
              Have questions about solar OS deployment, PM-Surya Ghar integrations, or enterprise tier pricing? We are here to help.
            </p>
          </Reveal>
        </Container>
      </section>

      {/* Channel Cards Section */}
      <section className="py-14 bg-slate-50 border-b border-slate-200">
        <Container>
          <div className="grid gap-6 md:grid-cols-3">
            {CHANNELS.map((ch) => {
              const Icon = ch.icon;
              return (
                <div
                  key={ch.title}
                  className="rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:shadow-soft flex items-start gap-4"
                >
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${ch.color} text-white shadow-sm`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{ch.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{ch.desc}</p>
                    <a href={`mailto:${ch.value}`} className="text-xs font-bold text-emerald-600 hover:text-emerald-700 mt-2 block">
                      {ch.value}
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Main Contact Form & Office Info */}
      <section className="py-24 sm:py-32 bg-white">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12 lg:items-start">
            {/* Form Column */}
            <div className="lg:col-span-7">
              <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-8 sm:p-10 shadow-soft">
                <h3 className="text-2xl font-bold text-slate-900">Send us a message</h3>
                <p className="text-xs text-slate-500 mt-1">Our solar solution architects respond within 12 business hours.</p>

                {status === 'success' ? (
                  <div className="my-10 p-8 text-center bg-white rounded-2xl border border-emerald-200 space-y-3">
                    <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
                    <h4 className="text-xl font-bold text-slate-900">Thank you for reaching out!</h4>
                    <p className="text-xs text-slate-600 max-w-sm mx-auto">
                      Your inquiry has been routed to our clean energy operations team. We will get back to you shortly.
                    </p>
                    <button
                      onClick={() => setStatus('idle')}
                      className="mt-4 rounded-xl bg-emerald-600 px-6 py-2 text-xs font-bold text-white shadow hover:bg-emerald-500"
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Your Name *</label>
                        <input
                          type="text"
                          required
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          placeholder="e.g. Vikram Malhotra"
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Work Email *</label>
                        <input
                          type="email"
                          required
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          placeholder="vikram@solarepc.com"
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                        <input
                          type="tel"
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          placeholder="+91 98765 43210"
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Company / EPC Name</label>
                        <input
                          type="text"
                          value={form.company}
                          onChange={(e) => setForm({ ...form, company: e.target.value })}
                          placeholder="e.g. Surya Shakti EPC Pvt. Ltd."
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Inquiry Purpose</label>
                        <select
                          value={form.reason}
                          onChange={(e) => setForm({ ...form, reason: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                        >
                          {CONTACT_REASONS.map((r) => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Team / Company Size</label>
                        <select
                          value={form.size}
                          onChange={(e) => setForm({ ...form, size: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                        >
                          <option value="1-10">1-10 Employees</option>
                          <option value="11-50">11-50 Employees</option>
                          <option value="51-200">51-200 Employees</option>
                          <option value="200+">200+ Employees</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Message / Requirements *</label>
                      <textarea
                        rows={4}
                        required
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        placeholder="Tell us about your rooftop solar capacity, DISCOM states, or specific CAD / subsidy requirements..."
                        className="w-full rounded-xl border border-slate-200 bg-white p-3.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={status === 'submitting'}
                      className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3.5 text-xs font-bold text-white shadow-glow hover:brightness-110 disabled:opacity-60 transition-all"
                    >
                      {status === 'submitting' ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Sending Message...
                        </>
                      ) : (
                        <>
                          <span>Submit Inquiry</span> <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Office Presence & Info Column */}
            <div className="lg:col-span-5 space-y-8">
              <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900">National Headquarters</h3>
                <p className="mt-3 text-xs leading-relaxed text-slate-600 flex items-start gap-2.5">
                  <MapPin className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    MetaGreen Clean Energy Hub<br />
                    Outer Ring Road, Bellandur<br />
                    Bengaluru, Karnataka 560103, India
                  </span>
                </p>

                <div className="mt-5 space-y-2 pt-4 border-t border-slate-100 text-xs text-slate-600">
                  <p className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-slate-400" /> Monday - Friday: 9:00 AM - 7:00 PM IST
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-slate-400" /> +91 (80) 4567-8900
                  </p>
                </div>
              </div>

              {/* FAQ Accordion */}
              <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Frequently Asked Questions</h3>
                <div className="space-y-3">
                  {FAQ_ITEMS.map((item, index) => (
                    <div key={item.q} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                      <button
                        onClick={() => setOpenFaq(openFaq === index ? null : index)}
                        className="flex w-full items-center justify-between text-left text-xs font-bold text-slate-900 hover:text-emerald-700"
                      >
                        <span>{item.q}</span>
                        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${openFaq === index ? 'rotate-180 text-emerald-600' : 'text-slate-400'}`} />
                      </button>
                      {openFaq === index && (
                        <p className="mt-2 text-xs leading-relaxed text-slate-600">{item.a}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
