import React, { useState, useEffect } from 'react';
import {
  Palette,
  Globe,
  Upload,
  Check,
  Eye,
  ExternalLink,
  Save,
  Sparkles,
  Layers,
  Image as ImageIcon,
  Mail,
  Phone,
  MapPin,
  Share2,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Laptop
} from 'lucide-react';
import {
  websiteCustomizationService,
  SubscriberWebsiteConfig,
  ThemeColors,
  GLOBAL_DEFAULT_THEME,
  GLOBAL_DEFAULT_BRANDING,
  GLOBAL_DEFAULT_CONTENT,
} from '@/src/services/websiteCustomization.service';
import { useAuth } from '@/src/context/AuthContext';
import { useToast } from '@/src/context/ToastContext';
import { useTenantWebsite } from '@/src/context/TenantWebsiteContext';
import { cn } from '@/src/lib/utils';

// Curated 1-click preset color palettes
const COLOR_PRESETS: { name: string; desc: string; colors: ThemeColors }[] = [
  {
    name: 'Solar Emerald (Default)',
    desc: 'Clean green tones, dark slate headers, and energetic mint accents.',
    colors: {
      primaryColor: '#059669',
      secondaryColor: '#0F172A',
      accentColor: '#14B8A6',
      backgroundColor: '#FFFFFF',
      textColor: '#0F172A',
      buttonColor: '#059669',
      buttonTextColor: '#FFFFFF',
      headerBgColor: 'rgba(5, 5, 16, 0.85)',
      footerBgColor: '#050510',
    },
  },
  {
    name: 'Ocean Tech Blue',
    desc: 'Trustworthy sapphire blues with cyan energy highlights.',
    colors: {
      primaryColor: '#2563EB',
      secondaryColor: '#0F172A',
      accentColor: '#06B6D4',
      backgroundColor: '#F8FAFC',
      textColor: '#0F172A',
      buttonColor: '#2563EB',
      buttonTextColor: '#FFFFFF',
      headerBgColor: 'rgba(15, 23, 42, 0.9)',
      footerBgColor: '#0B1120',
    },
  },
  {
    name: 'Sunfire Amber',
    desc: 'High-energy solar amber and warm sunrise gold tones.',
    colors: {
      primaryColor: '#D97706',
      secondaryColor: '#1E1B4B',
      accentColor: '#F59E0B',
      backgroundColor: '#FFFBEB',
      textColor: '#1E293B',
      buttonColor: '#D97706',
      buttonTextColor: '#FFFFFF',
      headerBgColor: 'rgba(30, 27, 75, 0.92)',
      footerBgColor: '#111827',
    },
  },
  {
    name: 'Clean Dark Obsidian',
    desc: 'Sleek dark mode aesthetic with high-contrast neon emerald lines.',
    colors: {
      primaryColor: '#10B981',
      secondaryColor: '#090D16',
      accentColor: '#34D399',
      backgroundColor: '#050811',
      textColor: '#F8FAFC',
      buttonColor: '#10B981',
      buttonTextColor: '#050811',
      headerBgColor: 'rgba(9, 13, 22, 0.95)',
      footerBgColor: '#030509',
    },
  },
  {
    name: 'Royal Purple Power',
    desc: 'Modern fintech & clean-tech aesthetic with deep violet gradients.',
    colors: {
      primaryColor: '#7C3AED',
      secondaryColor: '#1E1B4B',
      accentColor: '#A855F7',
      backgroundColor: '#FAF5FF',
      textColor: '#0F172A',
      buttonColor: '#7C3AED',
      buttonTextColor: '#FFFFFF',
      headerBgColor: 'rgba(24, 15, 43, 0.9)',
      footerBgColor: '#0F0922',
    },
  },
];

interface SubscriberWebsiteEditorProps {
  organizationId?: string;
  organizationName?: string;
}

export function SubscriberWebsiteEditor({
  organizationId: propOrgId,
  organizationName: propOrgName,
}: SubscriberWebsiteEditorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { refreshWebsiteConfig } = useTenantWebsite();

  const orgId = propOrgId || user?.organizationId || (user?.companyName ? `org_${user.companyName.toLowerCase().replace(/[^a-z0-9]/g, '_')}` : 'default_org');
  const orgName = propOrgName || user?.companyName || 'My Solar Enterprise';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'branding' | 'colors' | 'content' | 'contact' | 'preview'>('branding');

  // Form State
  const [form, setForm] = useState<{
    organizationSlug: string;
    customDomain: string;
    isActive: boolean;
    branding: typeof GLOBAL_DEFAULT_BRANDING;
    theme: ThemeColors;
    content: typeof GLOBAL_DEFAULT_CONTENT;
    featuresAllowed: {
      allowThemeCustomization: boolean;
      allowLogoCustomization: boolean;
      allowContentCustomization: boolean;
      allowFullCustomization: boolean;
    };
  }>({
    organizationSlug: orgName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    customDomain: '',
    isActive: true,
    branding: {
      ...GLOBAL_DEFAULT_BRANDING,
      websiteName: orgName,
      websiteTitle: `${orgName} • Solar EPC & Clean Energy`,
      tagline: 'Delivering Premium Rooftop & Commercial Solar Solutions',
    },
    theme: { ...GLOBAL_DEFAULT_THEME },
    content: {
      ...GLOBAL_DEFAULT_CONTENT,
      heroHeading: `Clean Solar Energy by ${orgName}`,
      heroSubheading: 'High efficiency solar panels, smart inverter installations, and transparent subsidy management.',
      contactEmail: user?.email || 'sales@company.com',
      contactPhone: user?.phone || '+91 (80) 1234-5678',
    },
    featuresAllowed: {
      allowThemeCustomization: true,
      allowLogoCustomization: true,
      allowContentCustomization: true,
      allowFullCustomization: true,
    },
  });

  useEffect(() => {
    async function loadConfig() {
      setLoading(true);
      try {
        const config = await websiteCustomizationService.getWebsiteConfig(orgId);
        if (config) {
          setForm({
            organizationSlug: config.organizationSlug || orgName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            customDomain: config.customDomain || '',
            isActive: config.isActive !== false,
            branding: { ...GLOBAL_DEFAULT_BRANDING, ...config.branding },
            theme: { ...GLOBAL_DEFAULT_THEME, ...config.theme },
            content: { ...GLOBAL_DEFAULT_CONTENT, ...config.content },
            featuresAllowed: {
              allowThemeCustomization: config.featuresAllowed?.allowThemeCustomization ?? true,
              allowLogoCustomization: config.featuresAllowed?.allowLogoCustomization ?? true,
              allowContentCustomization: config.featuresAllowed?.allowContentCustomization ?? true,
              allowFullCustomization: config.featuresAllowed?.allowFullCustomization ?? true,
            },
          });
        }
      } catch (err) {
        console.error('Error fetching subscriber website config:', err);
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, [orgId, orgName]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await websiteCustomizationService.saveWebsiteConfig(
        orgId,
        orgName,
        {
          organizationSlug: form.organizationSlug.trim().toLowerCase(),
          customDomain: form.customDomain.trim(),
          isActive: form.isActive,
          branding: form.branding,
          theme: form.theme,
          content: form.content,
          featuresAllowed: form.featuresAllowed,
        },
        'enterprise'
      );

      // Instantly apply colors to current DOM so user sees the change
      websiteCustomizationService.applyThemeColorsToDOM(form.theme);
      await refreshWebsiteConfig();

      toast.success('Website settings published successfully!');
    } catch (err) {
      console.error('Failed to save website configuration:', err);
      toast.error('Failed to publish website settings.');
    } finally {
      setSaving(false);
    }
  };

  const applyColorPreset = (preset: typeof COLOR_PRESETS[0]) => {
    setForm(prev => ({
      ...prev,
      theme: { ...preset.colors },
    }));
    websiteCustomizationService.applyThemeColorsToDOM(preset.colors);
    toast.info(`Applied "${preset.name}" palette.`);
  };

  const previewLiveUrl = `${window.location.origin}/?org=${form.organizationSlug}`;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-600">Loading website customization profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-sm mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Dynamic Multi-Tenant Website Engine
            </div>
            <h2 className="text-2xl font-bold tracking-tight">
              Website Customization & Branding
            </h2>
            <p className="text-emerald-100 text-sm mt-1 max-w-xl">
              Customize theme colors, logos, landing page copy, and domain settings for{' '}
              <span className="font-semibold text-white underline decoration-emerald-300">{orgName}</span>.
              All changes are backed by Firebase database and rendered dynamically.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href={previewLiveUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-sm font-medium transition backdrop-blur-sm shadow-sm"
            >
              <Eye className="w-4 h-4" />
              Live Preview
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </a>

            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 text-sm font-bold shadow-md transition disabled:opacity-75"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                  Publishing...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-emerald-600" />
                  Save & Publish
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="bg-white rounded-xl border border-slate-200 p-1.5 flex flex-wrap gap-1 shadow-sm">
        <button
          onClick={() => setActiveSubTab('branding')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition',
            activeSubTab === 'branding'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          )}
        >
          <Globe className="w-4 h-4" />
          Brand & Domain
        </button>

        <button
          onClick={() => setActiveSubTab('colors')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition',
            activeSubTab === 'colors'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          )}
        >
          <Palette className="w-4 h-4" />
          Theme & Colors
        </button>

        <button
          onClick={() => setActiveSubTab('content')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition',
            activeSubTab === 'content'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          )}
        >
          <Layers className="w-4 h-4" />
          Landing Content
        </button>

        <button
          onClick={() => setActiveSubTab('contact')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition',
            activeSubTab === 'contact'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          )}
        >
          <Share2 className="w-4 h-4" />
          Contact & Social
        </button>

        <button
          onClick={() => setActiveSubTab('preview')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition',
            activeSubTab === 'preview'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          )}
        >
          <Laptop className="w-4 h-4" />
          Style Inspector
        </button>
      </div>

      {/* Tab 1: Brand & Domain */}
      {activeSubTab === 'branding' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900">Brand Identity & Meta Tags</h3>
              <p className="text-sm text-slate-500">Configure how your brand appears on page headers, title tabs, and search engines.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Website / Organization Name
                </label>
                <input
                  type="text"
                  value={form.branding.websiteName}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      branding: { ...form.branding, websiteName: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                  placeholder="e.g. Apex Solar Energy"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Browser Title Tag
                </label>
                <input
                  type="text"
                  value={form.branding.websiteTitle}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      branding: { ...form.branding, websiteTitle: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                  placeholder="e.g. Apex Solar • Premium Rooftop EPC"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Brand Tagline
              </label>
              <input
                type="text"
                value={form.branding.tagline}
                onChange={(e) =>
                  setForm({
                    ...form,
                    branding: { ...form.branding, tagline: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                placeholder="e.g. Solar EPC Operations, 3D CAD & Subsidy Automation"
              />
            </div>

            <div className="border-t border-slate-100 pt-6">
              <h4 className="text-sm font-bold text-slate-900 mb-3">Custom Subdomain & Routing</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Tenant Slug (Subdomain identifier)
                  </label>
                  <div className="flex items-center rounded-xl border border-slate-300 focus-within:ring-2 focus-within:ring-emerald-500 overflow-hidden">
                    <span className="px-3 py-2.5 bg-slate-100 text-slate-500 text-xs font-mono border-r border-slate-300">
                      ?org=
                    </span>
                    <input
                      type="text"
                      value={form.organizationSlug}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          organizationSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''),
                        })
                      }
                      className="w-full px-3 py-2.5 text-sm font-mono focus:outline-none"
                      placeholder="apex-solar"
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Visitors access your branded page via this URL param.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Custom Domain (Enterprise Plan)
                  </label>
                  <input
                    type="text"
                    value={form.customDomain}
                    onChange={(e) => setForm({ ...form, customDomain: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono"
                    placeholder="solar.apexenergy.com"
                  />
                  <p className="text-xs text-slate-400 mt-1">CNAME points to proxy gateway.</p>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-6">
              <h4 className="text-sm font-bold text-slate-900 mb-3">Brand Logo & Favicon Assets</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Logo Image URL (PNG/SVG)
                  </label>
                  <input
                    type="text"
                    value={form.branding.logoUrl}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        branding: { ...form.branding, logoUrl: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                    placeholder="https://yourdomain.com/logo.png"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Favicon URL (.ico or 32x32 PNG)
                  </label>
                  <input
                    type="text"
                    value={form.branding.faviconUrl}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        branding: { ...form.branding, faviconUrl: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                    placeholder="https://yourdomain.com/favicon.png"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Preview Card */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Live Header Preview</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">Active</span>
              </div>

              <div className="mt-6 p-4 rounded-xl bg-slate-800/80 border border-slate-700">
                <div className="flex items-center gap-3">
                  {form.branding.logoUrl ? (
                    <img src={form.branding.logoUrl} alt="Logo" className="w-10 h-10 object-contain rounded-lg bg-white p-1" />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white text-sm"
                      style={{ backgroundColor: form.theme.primaryColor }}
                    >
                      {form.branding.websiteName.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h5 className="font-bold text-white text-sm">{form.branding.websiteName || 'Your Brand'}</h5>
                    <p className="text-xs text-slate-400 truncate max-w-[180px]">{form.branding.tagline || 'Tagline here'}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Direct Share Link</span>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-emerald-400 break-all">
                  {previewLiveUrl}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition shadow-lg flex items-center justify-center gap-2"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Theme & Colors */}
      {activeSubTab === 'colors' && (
        <div className="space-y-6">
          {/* Preset Palettes */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Curated 1-Click Color Themes</h3>
                <p className="text-sm text-slate-500">Choose a designer-tested palette or manually adjust individual hex codes below.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {COLOR_PRESETS.map((preset) => (
                <div
                  key={preset.name}
                  onClick={() => applyColorPreset(preset)}
                  className="p-4 rounded-xl border border-slate-200 hover:border-emerald-500 cursor-pointer transition hover:shadow-md bg-slate-50/50 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-slate-900 text-sm group-hover:text-emerald-600 transition">
                        {preset.name}
                      </h4>
                      {form.theme.primaryColor === preset.colors.primaryColor && (
                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                          <Check className="w-3 h-3" /> Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mb-3">{preset.desc}</p>
                  </div>

                  {/* Swatches */}
                  <div className="flex items-center gap-1.5 pt-2 border-t border-slate-200/60">
                    <div className="w-6 h-6 rounded-full border border-white shadow-sm" style={{ backgroundColor: preset.colors.primaryColor }} title="Primary" />
                    <div className="w-6 h-6 rounded-full border border-white shadow-sm" style={{ backgroundColor: preset.colors.secondaryColor }} title="Secondary" />
                    <div className="w-6 h-6 rounded-full border border-white shadow-sm" style={{ backgroundColor: preset.colors.accentColor }} title="Accent" />
                    <div className="w-6 h-6 rounded-full border border-slate-300 shadow-sm" style={{ backgroundColor: preset.colors.backgroundColor }} title="Background" />
                    <div className="w-6 h-6 rounded-full border border-white shadow-sm" style={{ backgroundColor: preset.colors.footerBgColor }} title="Footer" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Granular Color Controls */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Custom Hex Color Controls</h3>
            <p className="text-sm text-slate-500 mb-6">Fine-tune every brand element. Changes update the page CSS variables dynamically.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { label: 'Primary Brand Color', key: 'primaryColor', desc: 'Main buttons, brand highlights, active badges' },
                { label: 'Secondary Dark Color', key: 'secondaryColor', desc: 'Section headings, dark contrast blocks' },
                { label: 'Accent Energy Color', key: 'accentColor', desc: 'Gradients, highlight tags, rating stars' },
                { label: 'Page Background Color', key: 'backgroundColor', desc: 'Main body canvas' },
                { label: 'Typography Text Color', key: 'textColor', desc: 'Body paragraphs and titles' },
                { label: 'Button Color', key: 'buttonColor', desc: 'Action buttons and call to action' },
                { label: 'Button Text Color', key: 'buttonTextColor', desc: 'Text inside primary buttons' },
                { label: 'Header Navigation Background', key: 'headerBgColor', desc: 'Top sticky bar background' },
                { label: 'Footer Background', key: 'footerBgColor', desc: 'Bottom footer background' },
              ].map((item) => {
                const colorVal = form.theme[item.key as keyof ThemeColors];
                return (
                  <div key={item.key} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        {item.label}
                      </label>
                      <div
                        className="w-7 h-7 rounded-lg border border-slate-300 shadow-sm"
                        style={{ backgroundColor: colorVal }}
                      />
                    </div>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="color"
                        value={colorVal.startsWith('#') ? colorVal : '#059669'}
                        onChange={(e) => {
                          const updatedTheme = { ...form.theme, [item.key]: e.target.value };
                          setForm({ ...form, theme: updatedTheme });
                          websiteCustomizationService.applyThemeColorsToDOM(updatedTheme);
                        }}
                        className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0.5 bg-white"
                      />
                      <input
                        type="text"
                        value={colorVal}
                        onChange={(e) => {
                          const updatedTheme = { ...form.theme, [item.key]: e.target.value };
                          setForm({ ...form, theme: updatedTheme });
                          websiteCustomizationService.applyThemeColorsToDOM(updatedTheme);
                        }}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Landing Content */}
      {activeSubTab === 'content' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-900">Landing Page Copy & Hero Text</h3>
            <p className="text-sm text-slate-500">Edit the primary headline, hero subtitle, and about section that your customers read.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Hero Main Headline
              </label>
              <input
                type="text"
                value={form.content.heroHeading}
                onChange={(e) =>
                  setForm({
                    ...form,
                    content: { ...form.content, heroHeading: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold"
                placeholder="e.g. High Performance Rooftop Solar for Factories & Homes"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Hero Subheading / Value Proposition
              </label>
              <textarea
                rows={3}
                value={form.content.heroSubheading}
                onChange={(e) =>
                  setForm({
                    ...form,
                    content: { ...form.content, heroSubheading: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                placeholder="Describe your company's solar engineering excellence, guarantees, and subsidy paperwork support..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Call to Action Button Text
                </label>
                <input
                  type="text"
                  value={form.content.heroCtaText}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      content: { ...form.content, heroCtaText: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                  placeholder="e.g. Calculate Solar Subsidy"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  About Section Title
                </label>
                <input
                  type="text"
                  value={form.content.aboutTitle}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      content: { ...form.content, aboutTitle: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                  placeholder="e.g. Why Choose Apex Solar Solutions"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                About Section Detailed Description
              </label>
              <textarea
                rows={3}
                value={form.content.aboutText}
                onChange={(e) =>
                  setForm({
                    ...form,
                    content: { ...form.content, aboutText: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                placeholder="Give prospective customers background on your installations, Tier-1 modules, and DISCOM certifications..."
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Contact & Social */}
      {activeSubTab === 'contact' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-900">Direct Contact & Social Media Channels</h3>
            <p className="text-sm text-slate-500">Ensure visitors can reach your engineering and sales team directly from the footer and contact modals.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Support & Sales Email
              </label>
              <div className="flex items-center rounded-xl border border-slate-300 overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500">
                <span className="px-3 py-2.5 bg-slate-50 text-slate-400 border-r border-slate-300">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  value={form.content.contactEmail}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      content: { ...form.content, contactEmail: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2.5 text-sm focus:outline-none"
                  placeholder="contact@apexsolar.in"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Helpline Phone Number
              </label>
              <div className="flex items-center rounded-xl border border-slate-300 overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500">
                <span className="px-3 py-2.5 bg-slate-50 text-slate-400 border-r border-slate-300">
                  <Phone className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={form.content.contactPhone}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      content: { ...form.content, contactPhone: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2.5 text-sm focus:outline-none"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Office / Warehouse Physical Address
            </label>
            <div className="flex items-start rounded-xl border border-slate-300 overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500">
              <span className="px-3 py-3 bg-slate-50 text-slate-400 border-r border-slate-300">
                <MapPin className="w-4 h-4" />
              </span>
              <textarea
                rows={2}
                value={form.content.contactAddress}
                onChange={(e) =>
                  setForm({
                    ...form,
                    content: { ...form.content, contactAddress: e.target.value },
                  })
                }
                className="w-full px-3 py-2 text-sm focus:outline-none"
                placeholder="Plot 42, Solar Tech Park, Industrial Area, Jaipur, Rajasthan 302013"
              />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <h4 className="text-sm font-bold text-slate-900 mb-4">Social Media Profile Links</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">LinkedIn Profile</label>
                <input
                  type="url"
                  value={form.content.socialLinks?.linkedin || ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      content: {
                        ...form.content,
                        socialLinks: { ...form.content.socialLinks, linkedin: e.target.value },
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
                  placeholder="https://linkedin.com/company/..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">X / Twitter Profile</label>
                <input
                  type="url"
                  value={form.content.socialLinks?.twitter || ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      content: {
                        ...form.content,
                        socialLinks: { ...form.content.socialLinks, twitter: e.target.value },
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
                  placeholder="https://x.com/..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Facebook Page</label>
                <input
                  type="url"
                  value={form.content.socialLinks?.facebook || ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      content: {
                        ...form.content,
                        socialLinks: { ...form.content.socialLinks, facebook: e.target.value },
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
                  placeholder="https://facebook.com/..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Instagram Handle</label>
                <input
                  type="url"
                  value={form.content.socialLinks?.instagram || ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      content: {
                        ...form.content,
                        socialLinks: { ...form.content.socialLinks, instagram: e.target.value },
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
                  placeholder="https://instagram.com/..."
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Style Inspector & Live Simulator */}
      {activeSubTab === 'preview' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Live Styling & CSS Variables Inspector</h3>
              <p className="text-sm text-slate-500">Interactive live mockup demonstrating your palette applied to buttons, cards, and headings.</p>
            </div>
            <a
              href={previewLiveUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition"
            >
              Open Full Website in New Tab
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Simulated Mini Landing Hero */}
          <div
            className="rounded-2xl p-8 transition-all border border-slate-200 relative overflow-hidden"
            style={{ backgroundColor: form.theme.backgroundColor, color: form.theme.textColor }}
          >
            {/* Nav Header */}
            <div
              className="rounded-xl px-5 py-3 flex items-center justify-between shadow-sm mb-8"
              style={{ backgroundColor: form.theme.headerBgColor }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-xs"
                  style={{ backgroundColor: form.theme.primaryColor }}
                >
                  {form.branding.websiteName.slice(0, 2).toUpperCase()}
                </div>
                <span className="font-bold text-sm text-white">{form.branding.websiteName}</span>
              </div>

              <div className="flex items-center gap-4 text-xs font-medium text-slate-200">
                <span>Solutions</span>
                <span>Subsidy Calculator</span>
                <span>Contact</span>
                <button
                  className="px-3 py-1.5 rounded-lg font-bold text-xs"
                  style={{
                    backgroundColor: form.theme.buttonColor,
                    color: form.theme.buttonTextColor,
                  }}
                >
                  Portal Login
                </button>
              </div>
            </div>

            {/* Hero Body */}
            <div className="max-w-2xl space-y-4">
              <span
                className="inline-block px-3 py-1 rounded-full text-xs font-bold"
                style={{
                  backgroundColor: `${form.theme.primaryColor}20`,
                  color: form.theme.primaryColor,
                }}
              >
                {form.branding.tagline}
              </span>

              <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: form.theme.textColor }}>
                {form.content.heroHeading}
              </h1>

              <p className="text-sm opacity-80 leading-relaxed">
                {form.content.heroSubheading}
              </p>

              <div className="flex items-center gap-3 pt-2">
                <button
                  className="px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition"
                  style={{
                    backgroundColor: form.theme.buttonColor,
                    color: form.theme.buttonTextColor,
                  }}
                >
                  {form.content.heroCtaText || 'Get Started'}
                </button>

                <button
                  className="px-4 py-2.5 rounded-xl font-bold text-sm border transition"
                  style={{
                    borderColor: form.theme.primaryColor,
                    color: form.theme.primaryColor,
                  }}
                >
                  View 3D CAD Demo
                </button>
              </div>
            </div>

            {/* Footer */}
            <div
              className="mt-12 rounded-xl p-4 flex items-center justify-between text-xs text-slate-300"
              style={{ backgroundColor: form.theme.footerBgColor }}
            >
              <span>© 2026 {form.branding.websiteName}. All rights reserved.</span>
              <span>{form.content.contactEmail} • {form.content.contactPhone}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
