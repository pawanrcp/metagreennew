import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  SubscriberWebsiteConfig,
  websiteCustomizationService,
  GLOBAL_DEFAULT_THEME,
  GLOBAL_DEFAULT_BRANDING,
  GLOBAL_DEFAULT_CONTENT,
} from '../services/websiteCustomization.service';
import { useAuth } from './AuthContext';

interface TenantWebsiteContextType {
  config: SubscriberWebsiteConfig;
  loading: boolean;
  tenantSlug: string;
  isSubscriberSite: boolean;
  setTenantSlug: (slug: string) => void;
  updateLocalConfig: (updates: Partial<SubscriberWebsiteConfig>) => void;
  refreshConfig: () => Promise<void>;
  refreshWebsiteConfig: () => Promise<void>;
}

const fallbackConfig: SubscriberWebsiteConfig = {
  id: 'global_default',
  organizationId: 'org_super_admin',
  organizationName: 'MetaGreen',
  organizationSlug: 'default',
  isGlobalDefault: true,
  isActive: true,
  theme: GLOBAL_DEFAULT_THEME,
  branding: GLOBAL_DEFAULT_BRANDING,
  content: GLOBAL_DEFAULT_CONTENT,
  featuresAllowed: {
    allowThemeCustomization: true,
    allowLogoCustomization: true,
    allowContentCustomization: true,
    allowFullCustomization: true,
  },
};

const TenantWebsiteContext = createContext<TenantWebsiteContextType>({
  config: fallbackConfig,
  loading: true,
  tenantSlug: 'default',
  isSubscriberSite: false,
  setTenantSlug: () => {},
  updateLocalConfig: () => {},
  refreshConfig: async () => {},
  refreshWebsiteConfig: async () => {},
});

export const TenantWebsiteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  // Detect tenant slug from query parameter (?tenant=vikram-solar) or session storage
  const [tenantSlug, setTenantSlug] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const queryTenant = params.get('tenant') || params.get('org');
      if (queryTenant) {
        sessionStorage.setItem('metagreen_tenant_slug', queryTenant);
        return queryTenant;
      }
      return sessionStorage.getItem('metagreen_tenant_slug') || 'default';
    }
    return 'default';
  });

  const [config, setConfig] = useState<SubscriberWebsiteConfig>(fallbackConfig);
  const [loading, setLoading] = useState(true);

  // 1. Resolve and load active configuration
  const loadConfig = async () => {
    try {
      setLoading(true);
      // If logged in as a vendor/subscriber, prioritize their own organization config
      const targetIdOrSlug = (user && !user.isSuperAdmin && user.role === 'Vendor')
        ? (user.organizationId || user.uid)
        : tenantSlug;

      const resolved = await websiteCustomizationService.resolveLiveWebsiteConfig(targetIdOrSlug);
      setConfig(resolved);

      // Apply dynamic CSS variables
      if (resolved.theme) {
        websiteCustomizationService.applyThemeColorsToDOM(resolved.theme);
      }
    } catch (err) {
      console.error('Error loading tenant website config:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, [tenantSlug, user?.organizationId, user?.uid]);

  // 2. Real-time subscription to subscriber's live config if logged in
  useEffect(() => {
    if (!user || user.isSuperAdmin) return;
    const orgId = user.organizationId || user.uid;
    const unsubscribe = websiteCustomizationService.subscribeWebsiteConfig(orgId, (liveConfig) => {
      if (liveConfig) {
        setConfig(liveConfig);
        if (liveConfig.theme) {
          websiteCustomizationService.applyThemeColorsToDOM(liveConfig.theme);
        }
      }
    });

    return () => unsubscribe();
  }, [user?.organizationId, user?.uid]);

  const updateLocalConfig = (updates: Partial<SubscriberWebsiteConfig>) => {
    setConfig((prev) => {
      const merged = { ...prev, ...updates };
      if (merged.theme) {
        websiteCustomizationService.applyThemeColorsToDOM(merged.theme);
      }
      return merged;
    });
  };

  const isSubscriberSite = Boolean(config && !config.isGlobalDefault && config.isActive);

  return (
    <TenantWebsiteContext.Provider
      value={{
        config,
        loading,
        tenantSlug,
        isSubscriberSite,
        setTenantSlug,
        updateLocalConfig,
        refreshConfig: loadConfig,
        refreshWebsiteConfig: loadConfig,
      }}
    >
      {children}
    </TenantWebsiteContext.Provider>
  );
};

export const useTenantWebsite = () => useContext(TenantWebsiteContext);
