import { db } from '../lib/firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';

export interface ThemeColors {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
  headerBgColor: string;
  footerBgColor: string;
}

export interface WebsiteBranding {
  websiteName: string;
  websiteTitle: string;
  tagline: string;
  logoUrl: string;
  faviconUrl: string;
  bannerImageUrl?: string;
}

export interface WebsiteContent {
  heroHeading: string;
  heroSubheading: string;
  heroCtaText: string;
  aboutTitle: string;
  aboutText: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  socialLinks: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
    youtube?: string;
  };
}

export interface WebsiteFeaturesAllowed {
  allowThemeCustomization: boolean;
  allowLogoCustomization: boolean;
  allowContentCustomization: boolean;
  allowFullCustomization: boolean;
}

export interface SubscriberWebsiteConfig {
  id: string;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  customDomain?: string;
  isGlobalDefault?: boolean;
  isActive: boolean;
  theme: ThemeColors;
  branding: WebsiteBranding;
  content: WebsiteContent;
  featuresAllowed: WebsiteFeaturesAllowed;
  createdAt?: any;
  updatedAt?: any;
}

export const GLOBAL_DEFAULT_THEME: ThemeColors = {
  primaryColor: '#059669',
  secondaryColor: '#0F172A',
  accentColor: '#14B8A6',
  backgroundColor: '#FFFFFF',
  textColor: '#0F172A',
  buttonColor: '#059669',
  buttonTextColor: '#FFFFFF',
  headerBgColor: 'rgba(5, 5, 16, 0.85)',
  footerBgColor: '#050510',
};

export const GLOBAL_DEFAULT_BRANDING: WebsiteBranding = {
  websiteName: 'MetaGreen',
  websiteTitle: 'MetaGreen • Clean Energy Enterprise Operating System',
  tagline: 'Solar EPC Operations, 3D CAD & Automated DISCOM Telemetry',
  logoUrl: '',
  faviconUrl: '',
  bannerImageUrl: '',
};

export const GLOBAL_DEFAULT_CONTENT: WebsiteContent = {
  heroHeading: 'Clean energy technology built for scale and precision',
  heroSubheading: 'Explore the end-to-end software modules, automation pipelines, and developer APIs powering modern renewable developers and solar EPCs.',
  heroCtaText: 'Schedule Architecture Demo',
  aboutTitle: 'Accelerating the Global Clean Energy Transition',
  aboutText: 'MetaGreen empowers solar installers and developers with unified tools for 3D layout simulation, PM-Surya Ghar subsidy automation, and live IoT fleet telemetry.',
  contactEmail: 'support@metagreen.in',
  contactPhone: '+91 (80) 4567-8900',
  contactAddress: 'Outer Ring Road, Bellandur, Bengaluru, Karnataka 560103, India',
  socialLinks: {
    linkedin: 'https://linkedin.com/company/metagreen',
    twitter: 'https://twitter.com/metagreen',
  },
};

export const websiteCustomizationService = {
  // 1. Fetch Tenant-Specific Website Configuration by Organization ID
  async getWebsiteConfig(organizationId: string): Promise<SubscriberWebsiteConfig | null> {
    try {
      if (!organizationId) return null;
      const docRef = doc(db, 'websiteConfigs', organizationId);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as SubscriberWebsiteConfig;
      }

      // Check by query if document ID was generated differently
      const q = query(collection(db, 'websiteConfigs'), where('organizationId', '==', organizationId));
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        return { id: querySnap.docs[0].id, ...querySnap.docs[0].data() } as SubscriberWebsiteConfig;
      }

      return null;
    } catch (err) {
      console.error('Error loading website config for organization:', err);
      return null;
    }
  },

  // 2. Real-time listener for Subscriber's Website Configuration
  subscribeWebsiteConfig(organizationId: string, callback: (config: SubscriberWebsiteConfig | null) => void) {
    if (!organizationId) return () => {};
    const docRef = doc(db, 'websiteConfigs', organizationId);
    return onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        callback({ id: snap.id, ...snap.data() } as SubscriberWebsiteConfig);
      } else {
        callback(null);
      }
    });
  },

  // 3. Resolve Live Website Configuration (Subscriber Slug or Global Default)
  async resolveLiveWebsiteConfig(slugOrOrgId?: string): Promise<SubscriberWebsiteConfig> {
    try {
      if (slugOrOrgId && slugOrOrgId !== 'default' && slugOrOrgId !== 'metagreen') {
        // Try to find active subscriber website by slug or organization ID
        const slugQuery = query(
          collection(db, 'websiteConfigs'),
          where('organizationSlug', '==', slugOrOrgId.toLowerCase())
        );
        const slugSnap = await getDocs(slugQuery);

        if (!slugSnap.empty) {
          const config = { id: slugSnap.docs[0].id, ...slugSnap.docs[0].data() } as SubscriberWebsiteConfig;
          if (config.isActive) return config;
        }

        // Try direct ID match
        const directSnap = await getDoc(doc(db, 'websiteConfigs', slugOrOrgId));
        if (directSnap.exists()) {
          const config = { id: directSnap.id, ...directSnap.data() } as SubscriberWebsiteConfig;
          if (config.isActive) return config;
        }
      }

      // Fallback to Global Default Config
      return await this.getGlobalDefaultConfig();
    } catch (err) {
      console.error('Error resolving live website config:', err);
      return this.buildDefaultFallback();
    }
  },

  // 4. Fetch Global Default Config from Firestore
  async getGlobalDefaultConfig(): Promise<SubscriberWebsiteConfig> {
    try {
      const q = query(collection(db, 'websiteConfigs'), where('isGlobalDefault', '==', true));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return { id: snap.docs[0].id, ...snap.docs[0].data() } as SubscriberWebsiteConfig;
      }
    } catch (err) {
      console.error('Error fetching global default config:', err);
    }
    return this.buildDefaultFallback();
  },

  buildDefaultFallback(): SubscriberWebsiteConfig {
    return {
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
  },

  // 5. Save or Update Subscriber-Specific Website Configuration
  async saveWebsiteConfig(
    organizationId: string,
    organizationName: string,
    updates: Partial<SubscriberWebsiteConfig>,
    planCustomizationTier: 'none' | 'basic' | 'pro' | 'enterprise' = 'pro'
  ): Promise<void> {
    const docRef = doc(db, 'websiteConfigs', organizationId);
    const snap = await getDoc(docRef);

    // Compute features allowed based on subscriber's plan tier
    const featuresAllowed: WebsiteFeaturesAllowed = {
      allowThemeCustomization: planCustomizationTier === 'pro' || planCustomizationTier === 'enterprise',
      allowLogoCustomization: planCustomizationTier !== 'none',
      allowContentCustomization: planCustomizationTier === 'pro' || planCustomizationTier === 'enterprise',
      allowFullCustomization: planCustomizationTier === 'enterprise',
    };

    const slug = organizationName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

    if (snap.exists()) {
      await updateDoc(docRef, {
        ...updates,
        organizationId, // immutable
        featuresAllowed,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(docRef, {
        organizationId,
        organizationName,
        organizationSlug: slug,
        isActive: true,
        isGlobalDefault: false,
        theme: updates.theme || GLOBAL_DEFAULT_THEME,
        branding: updates.branding || {
          ...GLOBAL_DEFAULT_BRANDING,
          websiteName: organizationName,
        },
        content: updates.content || GLOBAL_DEFAULT_CONTENT,
        featuresAllowed,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  },

  // 6. Super Admin: List all Subscriber Website Configurations
  async getAllWebsiteConfigs(): Promise<SubscriberWebsiteConfig[]> {
    try {
      const snap = await getDocs(collection(db, 'websiteConfigs'));
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as SubscriberWebsiteConfig));
    } catch (err) {
      console.error('Error fetching all website configurations:', err);
      return [];
    }
  },

  // 7. Super Admin: Override or toggle subscriber website active state
  async overrideSubscriberWebsite(
    organizationId: string,
    updates: Partial<SubscriberWebsiteConfig>
  ): Promise<void> {
    const docRef = doc(db, 'websiteConfigs', organizationId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  },

  // 8. Apply Theme Colors to Document Root CSS Variables
  applyThemeColorsToDOM(theme: ThemeColors): void {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    root.style.setProperty('--primary-color', theme.primaryColor || '#059669');
    root.style.setProperty('--secondary-color', theme.secondaryColor || '#0F172A');
    root.style.setProperty('--accent-color', theme.accentColor || '#14B8A6');
    root.style.setProperty('--button-color', theme.buttonColor || theme.primaryColor || '#059669');
    root.style.setProperty('--button-text-color', theme.buttonTextColor || '#FFFFFF');
    root.style.setProperty('--header-bg-color', theme.headerBgColor || 'rgba(5, 5, 16, 0.85)');
    root.style.setProperty('--footer-bg-color', theme.footerBgColor || '#050510');
  },
};
