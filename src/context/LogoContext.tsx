import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { METAGREEN_LOGO_BASE64 } from '@/src/assets/logoDataUrl';

export interface CompanyLogos {
  companyLogo?: string;
  watermarkLogo?: string;
  officialSeal?: string;
  paymentQrCode?: string;
  companyName?: string;
  tagline?: string;
}

const DEFAULT_LOGOS: CompanyLogos = {
  companyLogo: METAGREEN_LOGO_BASE64,
  watermarkLogo: METAGREEN_LOGO_BASE64,
  officialSeal: '',
  paymentQrCode: '',
  companyName: 'METAGREEN',
  tagline: 'Solar Enterprise ERP',
};

const resolveLogosWithDefaults = (savedLogos?: Partial<CompanyLogos>): CompanyLogos => {
  if (!savedLogos) return DEFAULT_LOGOS;
  return {
    ...DEFAULT_LOGOS,
    ...savedLogos,
    companyLogo: savedLogos.companyLogo || METAGREEN_LOGO_BASE64,
    watermarkLogo: savedLogos.watermarkLogo || METAGREEN_LOGO_BASE64,
    companyName: savedLogos.companyName || 'METAGREEN',
    tagline: savedLogos.tagline || 'Solar Enterprise ERP',
  };
};

interface LogoContextType {
  logos: CompanyLogos;
  updateLogos: (newLogos: Partial<CompanyLogos>) => Promise<void>;
  resetLogos: () => Promise<void>;
}

const LogoContext = createContext<LogoContextType>({
  logos: DEFAULT_LOGOS,
  updateLogos: async () => {},
  resetLogos: async () => {},
});

export const LogoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [logos, setLogos] = useState<CompanyLogos>(() => {
    try {
      const saved = localStorage.getItem('metagreen_company_logos');
      return saved ? resolveLogosWithDefaults(JSON.parse(saved)) : DEFAULT_LOGOS;
    } catch (e) {
      return DEFAULT_LOGOS;
    }
  });

  useEffect(() => {
    // Listen to Firebase branding settings
    const docRef = doc(db, 'settings', 'branding');
    const unsub = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as CompanyLogos;
        const merged = resolveLogosWithDefaults(data);
        setLogos(merged);
        try {
          localStorage.setItem('metagreen_company_logos', JSON.stringify(merged));
        } catch (e) {}
      }
    });

    return () => unsub();
  }, []);

  const updateLogos = async (newLogos: Partial<CompanyLogos>) => {
    const updated = { ...logos, ...newLogos };
    setLogos(updated);
    try {
      localStorage.setItem('metagreen_company_logos', JSON.stringify(updated));
      await setDoc(doc(db, 'settings', 'branding'), updated, { merge: true });
    } catch (error) {
      console.error('Error updating company logos:', error);
    }
  };

  const resetLogos = async () => {
    setLogos(DEFAULT_LOGOS);
    try {
      localStorage.removeItem('metagreen_company_logos');
      await setDoc(doc(db, 'settings', 'branding'), DEFAULT_LOGOS);
    } catch (error) {
      console.error('Error resetting company logos:', error);
    }
  };

  return (
    <LogoContext.Provider value={{ logos, updateLogos, resetLogos }}>
      {children}
    </LogoContext.Provider>
  );
};

export const useLogos = () => useContext(LogoContext);
