import React, { useState, useEffect } from 'react';
import {
  Globe,
  Palette,
  ExternalLink,
  Edit2,
  CheckCircle2,
  XCircle,
  Eye,
  Loader2,
  Check,
  Building2,
  Search,
  Sparkles,
  Sliders,
} from 'lucide-react';
import {
  websiteCustomizationService,
  SubscriberWebsiteConfig,
  ThemeColors,
  GLOBAL_DEFAULT_THEME,
} from '@/src/services/websiteCustomization.service';
import { useToast } from '@/src/context/ToastContext';
import { cn } from '@/src/lib/utils';

export function SubscriberWebsitesManager() {
  const { toast } = useToast();
  const [configs, setConfigs] = useState<SubscriberWebsiteConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingConfig, setEditingConfig] = useState<SubscriberWebsiteConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadConfigs = async () => {
    setLoading(true);
    try {
      const all = await websiteCustomizationService.getAllWebsiteConfigs();
      setConfigs(all);
    } catch (err) {
      console.error('Error fetching subscriber websites:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfigs();
  }, []);

  const handleToggleActive = async (config: SubscriberWebsiteConfig) => {
    try {
      const updatedStatus = !config.isActive;
      await websiteCustomizationService.overrideSubscriberWebsite(config.organizationId, {
        isActive: updatedStatus,
      });
      toast.success(
        `Website for "${config.organizationName}" is now ${updatedStatus ? 'Active' : 'Disabled'}.`,
        'Website Status Updated'
      );
      setConfigs((prev) =>
        prev.map((c) => (c.id === config.id ? { ...c, isActive: updatedStatus } : c))
      );
    } catch (err) {
      console.error('Error toggling website status:', err);
      toast.error('Failed to update website status', 'Error');
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingConfig) return;

    try {
      setIsSaving(true);
      await websiteCustomizationService.overrideSubscriberWebsite(
        editingConfig.organizationId,
        editingConfig
      );
      toast.success(
        `Website configuration for "${editingConfig.organizationName}" updated successfully!`,
        'Config Saved'
      );
      setConfigs((prev) =>
        prev.map((c) => (c.id === editingConfig.id ? editingConfig : c))
      );
      setEditingConfig(null);
    } catch (err) {
      console.error('Error saving website config:', err);
      toast.error('Failed to save website config', 'Error');
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = configs.filter(
    (c) =>
      c.organizationName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.organizationSlug?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.branding?.websiteTitle?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            <Globe className="w-4 h-4" /> Multi-Tenant Web Engine
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            Subscriber Website Configurations
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Each subscriber that purchases the website add-on possesses an independent website setup. Super Admins can inspect active subscriber sites, override branding, or adjust the global default template.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search subscriber websites..."
              className="pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Grid of Subscriber Websites */}
      {loading ? (
        <div className="p-16 text-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-emerald-500" />
          <p className="text-xs">Loading subscriber website configurations...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <Globe className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            No subscriber website configurations found.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((config) => {
            const liveUrl = `${window.location.origin}/?tenant=${config.organizationSlug}`;
            const theme: ThemeColors = config.theme || GLOBAL_DEFAULT_THEME;

            return (
              <div
                key={config.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col justify-between"
              >
                {/* Header Preview Bar */}
                <div
                  className="h-20 p-4 flex items-center justify-between text-white relative overflow-hidden"
                  style={{
                    backgroundColor: theme.headerBgColor || theme.secondaryColor || '#0F172A',
                  }}
                >
                  <div className="relative z-10">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black tracking-wide">
                        {config.branding?.websiteName || config.organizationName}
                      </span>
                      {config.isGlobalDefault && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-white/20 text-white">
                          Global Default
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-white/70 line-clamp-1">
                      {config.branding?.tagline || 'Solar EPC Platform'}
                    </p>
                  </div>

                  {/* Primary Color Badge Indicator */}
                  <div
                    className="w-6 h-6 rounded-full border-2 border-white shadow-sm shrink-0"
                    style={{ backgroundColor: theme.primaryColor || '#059669' }}
                    title={`Primary Theme Color: ${theme.primaryColor}`}
                  />
                </div>

                {/* Body Details */}
                <div className="p-5 space-y-3 flex-1">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                      Tenant Slug: {config.organizationSlug}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                      {config.organizationName}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {config.content?.heroHeading || 'Custom clean energy platform'}
                    </p>
                  </div>

                  {/* Color Swatches */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-semibold">Palette:</span>
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-4 h-4 rounded-md border border-black/10"
                        style={{ backgroundColor: theme.primaryColor }}
                        title={`Primary: ${theme.primaryColor}`}
                      />
                      <div
                        className="w-4 h-4 rounded-md border border-black/10"
                        style={{ backgroundColor: theme.secondaryColor }}
                        title={`Secondary: ${theme.secondaryColor}`}
                      />
                      <div
                        className="w-4 h-4 rounded-md border border-black/10"
                        style={{ backgroundColor: theme.accentColor }}
                        title={`Accent: ${theme.accentColor}`}
                      />
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleToggleActive(config)}
                    className={cn(
                      'px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1',
                      config.isActive
                        ? 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                        : 'text-slate-400 hover:bg-slate-100'
                    )}
                  >
                    {config.isActive ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Active
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5" /> Inactive
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <a
                      href={liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-600 transition-colors"
                      title="Preview Live Subscriber Website"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    <button
                      onClick={() => setEditingConfig(JSON.parse(JSON.stringify(config)))}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 shadow-sm transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* EDIT SUBSCRIBER CONFIG MODAL */}
      {editingConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-slate-900 dark:text-white space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Super Admin Override
                </span>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                  Edit Website Configuration: {editingConfig.organizationName}
                </h3>
              </div>
              <button
                onClick={() => setEditingConfig(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 overflow-y-auto pr-1 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Primary Theme Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editingConfig.theme?.primaryColor || '#059669'}
                      onChange={(e) =>
                        setEditingConfig({
                          ...editingConfig,
                          theme: { ...editingConfig.theme, primaryColor: e.target.value },
                        })
                      }
                      className="w-8 h-8 rounded border border-slate-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={editingConfig.theme?.primaryColor || '#059669'}
                      onChange={(e) =>
                        setEditingConfig({
                          ...editingConfig,
                          theme: { ...editingConfig.theme, primaryColor: e.target.value },
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Secondary Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editingConfig.theme?.secondaryColor || '#0F172A'}
                      onChange={(e) =>
                        setEditingConfig({
                          ...editingConfig,
                          theme: { ...editingConfig.theme, secondaryColor: e.target.value },
                        })
                      }
                      className="w-8 h-8 rounded border border-slate-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={editingConfig.theme?.secondaryColor || '#0F172A'}
                      onChange={(e) =>
                        setEditingConfig({
                          ...editingConfig,
                          theme: { ...editingConfig.theme, secondaryColor: e.target.value },
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Accent Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editingConfig.theme?.accentColor || '#14B8A6'}
                      onChange={(e) =>
                        setEditingConfig({
                          ...editingConfig,
                          theme: { ...editingConfig.theme, accentColor: e.target.value },
                        })
                      }
                      className="w-8 h-8 rounded border border-slate-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={editingConfig.theme?.accentColor || '#14B8A6'}
                      onChange={(e) =>
                        setEditingConfig({
                          ...editingConfig,
                          theme: { ...editingConfig.theme, accentColor: e.target.value },
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Website Name
                  </label>
                  <input
                    type="text"
                    value={editingConfig.branding?.websiteName || ''}
                    onChange={(e) =>
                      setEditingConfig({
                        ...editingConfig,
                        branding: { ...editingConfig.branding, websiteName: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Website Title Tag
                  </label>
                  <input
                    type="text"
                    value={editingConfig.branding?.websiteTitle || ''}
                    onChange={(e) =>
                      setEditingConfig({
                        ...editingConfig,
                        branding: { ...editingConfig.branding, websiteTitle: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tagline
                </label>
                <input
                  type="text"
                  value={editingConfig.branding?.tagline || ''}
                  onChange={(e) =>
                    setEditingConfig({
                      ...editingConfig,
                      branding: { ...editingConfig.branding, tagline: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Hero Heading
                </label>
                <input
                  type="text"
                  value={editingConfig.content?.heroHeading || ''}
                  onChange={(e) =>
                    setEditingConfig({
                      ...editingConfig,
                      content: { ...editingConfig.content, heroHeading: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Hero Subheading
                </label>
                <textarea
                  rows={2}
                  value={editingConfig.content?.heroSubheading || ''}
                  onChange={(e) =>
                    setEditingConfig({
                      ...editingConfig,
                      content: { ...editingConfig.content, heroSubheading: e.target.value },
                    })
                  }
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 resize-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingConfig(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow cursor-pointer disabled:opacity-60"
                >
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
