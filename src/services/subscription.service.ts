import { db } from '../lib/firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';

export interface SubscriptionPlan {
  id?: string;
  name: string;
  userLimit: number;
  storageGBLimit: number;
  priceMonthly: number;
  priceAnnual?: number;
  billingInterval?: 'monthly' | 'annual' | 'both';
  annualDiscountPercentage?: number;
  trialEnabled: boolean;
  trialDays: number;
  status: 'active' | 'inactive';
  features: string[];
  createdAt?: any;
  updatedAt?: any;
}

export interface SubscriptionCoupon {
  id?: string;
  code: string;
  name?: string;
  description?: string;
  discountPercentage: number;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  applicablePlanId: string; // 'all' or specific plan ID
  applicablePlanName?: string;
  applicableBillingCycle?: 'all' | 'annual' | 'monthly';
  targetRole?: 'all' | 'Vendor' | 'Installer';
  restrictedToEmails?: string[];
  validFrom?: string;
  validTo?: string;
  validUntil?: string; // backwards compatibility
  maxUsage?: number;
  maxRedemptions?: number; // backwards compatibility
  timesRedeemed: number;
  status: 'active' | 'inactive';
  createdAt?: any;
  updatedAt?: any;
}

export interface VendorAccount {
  id?: string;
  uid: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  accountType?: 'Vendor' | 'Installer';
  companyLogo?: string;
  doorNo?: string;
  companyAddress?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstin?: string;
  latitude?: string;
  longitude?: string;
  planId: string;
  planName: string;
  billingCycle?: 'monthly' | 'annual';
  // Coupon & Discount Audit Records
  couponId?: string;
  appliedCouponCode?: string;
  discountPercentage?: number;
  originalAmount?: number;
  discountAmount?: number;
  finalAmount?: number;
  customDiscountPercentage?: number;
  customDiscountAmount?: number;
  userLimit: number;
  storageGBLimit: number;
  usedStorageMB: number;
  subscriptionStatus: 'trial' | 'active' | 'expired' | 'cancelled';
  trialStartDate: string;
  trialEndDate: string;
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  createdAt?: any;
}

export interface SubscriptionConfig {
  defaultTrialDays: number;
  trialEnabled: boolean;
  extraStoragePricePerGB: number;
  annualDiscountPercentage?: number;
  currency: string;
}

const INITIAL_SEED_PLANS: SubscriptionPlan[] = [
  {
    id: 'plan-3-user',
    name: 'Starter Solar Vendor (3 Users)',
    userLimit: 3,
    storageGBLimit: 10,
    priceMonthly: 4999,
    priceAnnual: 47990,
    billingInterval: 'both',
    annualDiscountPercentage: 20,
    trialEnabled: true,
    trialDays: 7,
    status: 'active',
    features: [
      'Up to 3 Vendor Users',
      '10 GB Encrypted Storage Vault',
      '7-Day Free Trial Included',
      'PO & Auto-Inventory Sync',
      'Quotes & Tax Invoice Generator',
      'Standard Support'
    ]
  },
  {
    id: 'plan-5-user',
    name: 'Growth Solar Enterprise (5 Users)',
    userLimit: 5,
    storageGBLimit: 25,
    priceMonthly: 9999,
    priceAnnual: 95990,
    billingInterval: 'both',
    annualDiscountPercentage: 20,
    trialEnabled: true,
    trialDays: 7,
    status: 'active',
    features: [
      'Up to 5 Vendor Users',
      '25 GB Encrypted Storage Vault',
      '7-Day Free Trial Included',
      'Vendor Auto-Stock Receipt',
      'Full CRM & Proposal Engine',
      '24/7 Priority Support'
    ]
  },
  {
    id: 'plan-pro-fleet',
    name: 'Pro Fleet (15 Users)',
    userLimit: 15,
    storageGBLimit: 100,
    priceMonthly: 24999,
    priceAnnual: 239990,
    billingInterval: 'both',
    annualDiscountPercentage: 20,
    trialEnabled: true,
    trialDays: 7,
    status: 'active',
    features: [
      'Up to 15 Vendor Users',
      '100 GB Encrypted Storage Vault',
      '7-Day Free Trial Included',
      'Unlimited PO & Inventory Ingestion',
      'Custom Brand Logo Integration',
      'Dedicated Account Manager'
    ]
  },
  {
    id: 'plan-annual-unlimited',
    name: 'Annual Enterprise Powerhouse (Unlimited)',
    userLimit: 50,
    storageGBLimit: 500,
    priceMonthly: 49999,
    priceAnnual: 479990,
    billingInterval: 'annual',
    annualDiscountPercentage: 25,
    trialEnabled: true,
    trialDays: 14,
    status: 'active',
    features: [
      'Up to 50 Vendor Users',
      '500 GB Encrypted Storage Vault',
      '14-Day Free Trial Included',
      'Dedicated Cloud Cluster & SLA',
      'Multi-Branch Franchise Hierarchy',
      'Dedicated VIP Account Executive'
    ]
  }
];

export const subscriptionService = {
  // 1. Fetch Dynamic Subscription Plans from Firestore (One-time seed only if collection is empty)
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    try {
      const plansRef = collection(db, 'subscriptionPlans');
      const snapshot = await getDocs(plansRef);

      if (snapshot.empty) {
        // Initial setup only: Seed baseline templates into Firestore
        for (const plan of INITIAL_SEED_PLANS) {
          const planDocRef = doc(db, 'subscriptionPlans', plan.id || `plan-${Date.now()}`);
          await setDoc(planDocRef, {
            ...plan,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
        return INITIAL_SEED_PLANS;
      }

      // Read 100% dynamically from Firestore documents
      const dynamicPlans: SubscriptionPlan[] = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        const priceMonthly = Number(data.priceMonthly ?? 0);
        const priceAnnual = Number(data.priceAnnual ?? (priceMonthly > 0 ? Math.round(priceMonthly * 12 * 0.8) : 0));
        const billingInterval = (data.billingInterval as 'monthly' | 'annual' | 'both') || 'both';
        const annualDiscountPercentage = Number(data.annualDiscountPercentage ?? 20);

        return {
          id: docSnap.id,
          name: data.name || 'Custom Plan',
          userLimit: Number(data.userLimit ?? 1),
          storageGBLimit: Number(data.storageGBLimit ?? 5),
          priceMonthly,
          priceAnnual,
          billingInterval,
          annualDiscountPercentage,
          trialEnabled: data.trialEnabled !== undefined ? Boolean(data.trialEnabled) : true,
          trialDays: Number(data.trialDays ?? 7),
          status: (data.status as 'active' | 'inactive') || 'active',
          features: Array.isArray(data.features) ? data.features : [],
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        } as SubscriptionPlan;
      });

      return dynamicPlans;
    } catch (err) {
      console.error('Error fetching dynamic subscription plans:', err);
      return [];
    }
  },

  // 2. Global Admin: Save or Update Subscription Plan
  async savePlan(plan: SubscriptionPlan): Promise<void> {
    const dataToSave = {
      name: plan.name.trim(),
      userLimit: Number(plan.userLimit || 1),
      storageGBLimit: Number(plan.storageGBLimit || 1),
      priceMonthly: Number(plan.priceMonthly || 0),
      priceAnnual: Number(plan.priceAnnual || 0),
      billingInterval: plan.billingInterval || 'both',
      annualDiscountPercentage: Number(plan.annualDiscountPercentage ?? 20),
      trialEnabled: Boolean(plan.trialEnabled),
      trialDays: Number(plan.trialDays ?? 7),
      status: plan.status || 'active',
      features: (plan.features || []).map(f => typeof f === 'string' ? f.trim() : '').filter(Boolean),
      updatedAt: serverTimestamp()
    };

    if (plan.id) {
      await setDoc(doc(db, 'subscriptionPlans', plan.id), dataToSave, { merge: true });
    } else {
      await addDoc(collection(db, 'subscriptionPlans'), {
        ...dataToSave,
        createdAt: serverTimestamp()
      });
    }
  },

  async deleteSubscriptionPlan(planId: string): Promise<void> {
    await deleteDoc(doc(db, 'subscriptionPlans', planId));
  },

  async deletePlan(planId: string): Promise<void> {
    await deleteDoc(doc(db, 'subscriptionPlans', planId));
  },

  // 2. Fetch System Subscription Config
  async getSubscriptionConfig(): Promise<SubscriptionConfig> {
    try {
      const docRef = doc(db, 'systemSettings', 'subscriptionConfig');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as SubscriptionConfig;
      }
      return { defaultTrialDays: 7, trialEnabled: true, extraStoragePricePerGB: 100, currency: 'INR' };
    } catch (e) {
      return { defaultTrialDays: 7, trialEnabled: true, extraStoragePricePerGB: 100, currency: 'INR' };
    }
  },

  async updateSubscriptionConfig(config: Partial<SubscriptionConfig>): Promise<void> {
    const configRef = doc(db, 'systemSettings', 'subscriptionConfig');
    await setDoc(configRef, config, { merge: true });
  },

  // 5. Vendor Registration & Trial Initialization
  calculateTrialEndDate(trialDays: number): string {
    const now = new Date();
    now.setDate(now.getDate() + trialDays);
    return now.toISOString();
  },

  async registerVendorSubscription(vendorData: {
    uid: string;
    companyName: string;
    contactPerson: string;
    email: string;
    phone: string;
    companyLogo?: string;
    doorNo?: string;
    companyAddress?: string;
    city?: string;
    state?: string;
    pincode?: string;
    gstin?: string;
    latitude?: string;
    longitude?: string;
    plan: SubscriptionPlan;
    billingCycle?: 'monthly' | 'annual';
    accountType?: 'Vendor' | 'Installer';
    couponCode?: string; // Optional coupon code!
  }): Promise<VendorAccount> {
    const trialStartDate = new Date().toISOString();
    const trialDays = vendorData.plan.trialEnabled ? vendorData.plan.trialDays : 7;
    const trialEndDate = this.calculateTrialEndDate(trialDays);
    const billingCycle = vendorData.billingCycle || 'annual';
    const accountType = vendorData.accountType || 'Vendor';

    const basePrice = billingCycle === 'annual'
      ? (vendorData.plan.priceAnnual ?? (vendorData.plan.priceMonthly ? Math.round(vendorData.plan.priceMonthly * 12 * 0.8) : 0))
      : (vendorData.plan.priceMonthly ?? 0);

    let couponAudit: {
      couponId?: string;
      appliedCouponCode?: string;
      discountPercentage?: number;
      originalAmount: number;
      discountAmount: number;
      finalAmount: number;
    } = {
      originalAmount: basePrice,
      discountPercentage: 0,
      discountAmount: 0,
      finalAmount: basePrice
    };

    // If a coupon code is supplied (it is optional!), perform server-side verification
    if (vendorData.couponCode && vendorData.couponCode.trim()) {
      const vRes = await this.validateCoupon(
        vendorData.couponCode,
        vendorData.email,
        vendorData.plan,
        billingCycle,
        accountType
      );

      if (!vRes.valid) {
        throw new Error(`Invalid Coupon: ${vRes.message}`);
      }

      couponAudit = {
        couponId: vRes.coupon?.id,
        appliedCouponCode: vRes.coupon?.code,
        discountPercentage: vRes.discountPercentage,
        originalAmount: vRes.originalAmount,
        discountAmount: vRes.discountAmount,
        finalAmount: vRes.finalPrice
      };

      // Record coupon redemption
      if (vRes.coupon?.id) {
        await this.recordCouponRedemption(vRes.coupon.id);
      }
    }

    const vendorAccount: VendorAccount = {
      uid: vendorData.uid,
      companyName: vendorData.companyName,
      contactPerson: vendorData.contactPerson,
      email: vendorData.email,
      phone: vendorData.phone,
      accountType,
      companyLogo: vendorData.companyLogo,
      doorNo: vendorData.doorNo,
      companyAddress: vendorData.companyAddress,
      city: vendorData.city,
      state: vendorData.state,
      pincode: vendorData.pincode,
      gstin: vendorData.gstin,
      latitude: vendorData.latitude,
      longitude: vendorData.longitude,
      planId: vendorData.plan.id || `plan-${Date.now()}`,
      planName: vendorData.plan.name,
      billingCycle,
      // Coupon & Pricing Audit Records
      couponId: couponAudit.couponId,
      appliedCouponCode: couponAudit.appliedCouponCode,
      discountPercentage: couponAudit.discountPercentage,
      originalAmount: couponAudit.originalAmount,
      discountAmount: couponAudit.discountAmount,
      finalAmount: couponAudit.finalAmount,
      userLimit: vendorData.plan.userLimit,
      storageGBLimit: vendorData.plan.storageGBLimit,
      usedStorageMB: 0,
      subscriptionStatus: 'trial',
      trialStartDate,
      trialEndDate,
      subscriptionStartDate: trialStartDate,
      subscriptionEndDate: trialEndDate,
      createdAt: serverTimestamp()
    };

    await setDoc(doc(db, 'vendorAccounts', vendorData.uid), vendorAccount);

    // Also update User profile document with vendor sub details
    const userPayload: Record<string, any> = {
      uid: vendorData.uid,
      email: vendorData.email,
      name: vendorData.contactPerson || '',
      companyName: vendorData.companyName || '',
      role: accountType,
      vendorAccount
    };

    if (vendorData.companyLogo) userPayload.companyLogo = vendorData.companyLogo;
    if (vendorData.doorNo) userPayload.doorNo = vendorData.doorNo;
    if (vendorData.companyAddress) userPayload.companyAddress = vendorData.companyAddress;
    if (vendorData.city) userPayload.city = vendorData.city;
    if (vendorData.state) userPayload.state = vendorData.state;
    if (vendorData.pincode) userPayload.pincode = vendorData.pincode;
    if (vendorData.gstin) userPayload.gstin = vendorData.gstin;
    if (vendorData.latitude) userPayload.latitude = vendorData.latitude;
    if (vendorData.longitude) userPayload.longitude = vendorData.longitude;

    await setDoc(doc(db, 'users', vendorData.uid), userPayload, { merge: true });

    return vendorAccount;
  },

  // 6. Fetch Subscribed Vendor Account
  async getVendorAccount(uid: string): Promise<VendorAccount | null> {
    const docRef = doc(db, 'vendorAccounts', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as VendorAccount;
    }
    return null;
  },

  // 7. Global Admin: Fetch All Subscribed Vendors
  async getAllVendorSubscriptions(): Promise<VendorAccount[]> {
    try {
      const snapshot = await getDocs(collection(db, 'vendorAccounts'));
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as VendorAccount));
    } catch (err) {
      console.error('Error getting vendor subscriptions:', err);
      return [];
    }
  },

  // 8. Global Admin: Override Vendor Subscription Status / Limits
  async updateVendorSubscription(uid: string, updates: Partial<VendorAccount>): Promise<void> {
    await updateDoc(doc(db, 'vendorAccounts', uid), updates);
    const userUpdates: Record<string, any> = {};
    if (updates.subscriptionStatus !== undefined) userUpdates['vendorAccount.subscriptionStatus'] = updates.subscriptionStatus;
    if (updates.userLimit !== undefined) userUpdates['vendorAccount.userLimit'] = updates.userLimit;
    if (updates.storageGBLimit !== undefined) userUpdates['vendorAccount.storageGBLimit'] = updates.storageGBLimit;
    if (updates.billingCycle !== undefined) userUpdates['vendorAccount.billingCycle'] = updates.billingCycle;
    if (updates.planId !== undefined) userUpdates['vendorAccount.planId'] = updates.planId;
    if (updates.planName !== undefined) userUpdates['vendorAccount.planName'] = updates.planName;
    if (updates.subscriptionStartDate !== undefined) userUpdates['vendorAccount.subscriptionStartDate'] = updates.subscriptionStartDate;
    if (updates.subscriptionEndDate !== undefined) userUpdates['vendorAccount.subscriptionEndDate'] = updates.subscriptionEndDate;
    if (updates.couponId !== undefined) userUpdates['vendorAccount.couponId'] = updates.couponId;
    if (updates.appliedCouponCode !== undefined) userUpdates['vendorAccount.appliedCouponCode'] = updates.appliedCouponCode;
    if (updates.discountPercentage !== undefined) userUpdates['vendorAccount.discountPercentage'] = updates.discountPercentage;
    if (updates.originalAmount !== undefined) userUpdates['vendorAccount.originalAmount'] = updates.originalAmount;
    if (updates.discountAmount !== undefined) userUpdates['vendorAccount.discountAmount'] = updates.discountAmount;
    if (updates.finalAmount !== undefined) userUpdates['vendorAccount.finalAmount'] = updates.finalAmount;
    if (updates.customDiscountPercentage !== undefined) userUpdates['vendorAccount.customDiscountPercentage'] = updates.customDiscountPercentage;
    if (updates.customDiscountAmount !== undefined) userUpdates['vendorAccount.customDiscountAmount'] = updates.customDiscountAmount;
    
    if (Object.keys(userUpdates).length > 0) {
      await updateDoc(doc(db, 'users', uid), userUpdates);
    }
  },

  // 9. Global Admin: Activate or Renew Subscription (Annual: 365 Days, Monthly: 30 Days)
  async activateVendorSubscription(uid: string, plan: SubscriptionPlan, billingCycle: 'monthly' | 'annual'): Promise<void> {
    const startDate = new Date();
    const endDate = new Date(startDate);
    if (billingCycle === 'annual') {
      endDate.setDate(endDate.getDate() + 365);
    } else {
      endDate.setDate(endDate.getDate() + 30);
    }

    const updates: Partial<VendorAccount> = {
      subscriptionStatus: 'active',
      billingCycle,
      planId: plan.id || 'plan-custom',
      planName: plan.name,
      userLimit: plan.userLimit,
      storageGBLimit: plan.storageGBLimit,
      subscriptionStartDate: startDate.toISOString(),
      subscriptionEndDate: endDate.toISOString()
    };

    await this.updateVendorSubscription(uid, updates);
  },

  // 10. Global Admin: Extend Existing Subscription by specified days (e.g. +365 for 1 yr)
  async extendVendorSubscription(uid: string, currentEndDateStr: string | undefined, daysToAdd: number): Promise<string> {
    const baseDate = currentEndDateStr && new Date(currentEndDateStr) > new Date()
      ? new Date(currentEndDateStr)
      : new Date();
    baseDate.setDate(baseDate.getDate() + daysToAdd);
    const newEndDate = baseDate.toISOString();

    await this.updateVendorSubscription(uid, {
      subscriptionStatus: 'active',
      subscriptionEndDate: newEndDate
    });

    return newEndDate;
  },

  // 11. Calculate Remaining Days (For Trial or Subscription)
  getRemainingTrialDays(trialEndDateStr: string): number {
    if (!trialEndDateStr) return 0;
    const endDate = new Date(trialEndDateStr);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  },

  getRemainingSubscriptionDays(endDateStr: string | undefined): number {
    if (!endDateStr) return 0;
    const endDate = new Date(endDateStr);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  },

  // 12. Global Admin: Coupon Management (CRUD)
  async getCoupons(): Promise<SubscriptionCoupon[]> {
    try {
      const couponsRef = collection(db, 'subscriptionCoupons');
      const snapshot = await getDocs(couponsRef);

      const defaultCoupons: SubscriptionCoupon[] = [
        {
          id: 'coupon-annual-25',
          code: 'ANNUAL25',
          name: 'Annual Enterprise Power 25% Off',
          description: 'Special 25% Off on all Annual Enterprise Subscriptions',
          discountPercentage: 25,
          applicablePlanId: 'all',
          applicablePlanName: 'All Subscription Plans',
          applicableBillingCycle: 'annual',
          targetRole: 'all',
          maxUsage: 100,
          timesRedeemed: 3,
          status: 'active'
        },
        {
          id: 'coupon-vendor-20',
          code: 'VENDOR20',
          name: 'Vendor Partner Launch Discount',
          description: 'Exclusive 20% discount on Starter & Growth for registered Solar Equipment Vendors',
          discountPercentage: 20,
          applicablePlanId: 'all',
          applicablePlanName: 'All Subscription Plans',
          applicableBillingCycle: 'all',
          targetRole: 'Vendor',
          maxUsage: 250,
          timesRedeemed: 14,
          status: 'active'
        },
        {
          id: 'coupon-installer-15',
          code: 'INSTALLER15',
          name: 'Field Installer Onboarding Special',
          description: 'Flat 15% discount for Certified Solar Site Installers and contractors',
          discountPercentage: 15,
          applicablePlanId: 'all',
          applicablePlanName: 'All Subscription Plans',
          applicableBillingCycle: 'all',
          targetRole: 'Installer',
          maxUsage: 500,
          timesRedeemed: 22,
          status: 'active'
        },
        {
          id: 'coupon-vip-person',
          code: 'VIP50',
          name: 'Particular VIP Director Partner Pass',
          description: 'Exclusive 50% Partner Discount for Particular Authorized Directors & VIP Installers',
          discountPercentage: 50,
          applicablePlanId: 'all',
          applicablePlanName: 'All Subscription Plans',
          applicableBillingCycle: 'all',
          targetRole: 'all',
          restrictedToEmails: ['director@solarepc.com', 'vip@apexsolar.in', 'partner@sunpower.com'],
          maxUsage: 10,
          timesRedeemed: 1,
          status: 'active'
        }
      ];

      if (snapshot.empty) {
        for (const c of defaultCoupons) {
          await setDoc(doc(db, 'subscriptionCoupons', c.id!), {
            ...c,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
        return defaultCoupons;
      }

      return snapshot.docs.map(d => {
        const data = d.data();
        const discPct = Number(data.discountPercentage ?? data.discountValue ?? 0);
        return {
          id: d.id,
          ...data,
          code: (data.code || '').trim().toUpperCase(),
          name: data.name || data.description || 'Special Discount',
          discountPercentage: discPct,
          applicablePlanId: data.applicablePlanId || (Array.isArray(data.applicablePlans) && data.applicablePlans[0] ? data.applicablePlans[0] : 'all'),
          applicablePlanName: data.applicablePlanName || 'All Plans',
          applicableBillingCycle: data.applicableBillingCycle || 'all',
          targetRole: data.targetRole || 'all',
          restrictedToEmails: Array.isArray(data.restrictedToEmails) ? data.restrictedToEmails : [],
          validFrom: data.validFrom || '',
          validTo: data.validTo || data.validUntil || '',
          maxUsage: data.maxUsage !== undefined ? Number(data.maxUsage) : (data.maxRedemptions !== undefined ? Number(data.maxRedemptions) : undefined),
          timesRedeemed: Number(data.timesRedeemed || 0),
          status: data.status || 'active'
        } as SubscriptionCoupon;
      });
    } catch (err) {
      console.error('Error getting coupons:', err);
      return [];
    }
  },

  async saveCoupon(coupon: SubscriptionCoupon): Promise<void> {
    const codeClean = coupon.code.trim().toUpperCase();
    const discountPercentage = Number(coupon.discountPercentage ?? coupon.discountValue ?? 0);
    const maxUsage = coupon.maxUsage !== undefined && coupon.maxUsage !== null && String(coupon.maxUsage) !== ''
      ? Number(coupon.maxUsage)
      : (coupon.maxRedemptions ? Number(coupon.maxRedemptions) : null);

    const dataToSave = {
      code: codeClean,
      name: (coupon.name || coupon.description || codeClean).trim(),
      description: (coupon.description || coupon.name || '').trim(),
      discountPercentage,
      discountType: 'percentage',
      discountValue: discountPercentage,
      applicablePlanId: coupon.applicablePlanId || 'all',
      applicablePlanName: coupon.applicablePlanName || (coupon.applicablePlanId === 'all' ? 'All Subscription Plans' : ''),
      applicableBillingCycle: coupon.applicableBillingCycle || 'all',
      targetRole: coupon.targetRole || 'all',
      restrictedToEmails: (coupon.restrictedToEmails || []).map(e => e.trim().toLowerCase()).filter(Boolean),
      validFrom: coupon.validFrom || '',
      validTo: coupon.validTo || coupon.validUntil || '',
      validUntil: coupon.validTo || coupon.validUntil || '',
      maxUsage,
      maxRedemptions: maxUsage,
      status: coupon.status || 'active',
      updatedAt: serverTimestamp()
    };

    if (coupon.id) {
      await setDoc(doc(db, 'subscriptionCoupons', coupon.id), dataToSave, { merge: true });
    } else {
      await addDoc(collection(db, 'subscriptionCoupons'), {
        ...dataToSave,
        timesRedeemed: 0,
        createdAt: serverTimestamp()
      });
    }
  },

  async deleteCoupon(couponId: string): Promise<void> {
    await deleteDoc(doc(db, 'subscriptionCoupons', couponId));
  },

  async toggleCouponStatus(couponId: string, currentStatus: 'active' | 'inactive'): Promise<void> {
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    await updateDoc(doc(db, 'subscriptionCoupons', couponId), {
      status: nextStatus,
      updatedAt: serverTimestamp()
    });
  },

  async recordCouponRedemption(couponId: string): Promise<void> {
    try {
      const couponDoc = await getDoc(doc(db, 'subscriptionCoupons', couponId));
      if (couponDoc.exists()) {
        const currentCount = Number(couponDoc.data().timesRedeemed || 0);
        await updateDoc(doc(db, 'subscriptionCoupons', couponId), {
          timesRedeemed: currentCount + 1,
          updatedAt: serverTimestamp()
        });
      }
    } catch (err) {
      console.error('Error recording coupon redemption:', err);
    }
  },

  // 13. Validate Coupon for Vendor / Installer / Particular Person
  async validateCoupon(
    inputCode: string,
    userEmail: string,
    plan: SubscriptionPlan,
    billingCycle: 'monthly' | 'annual',
    accountType?: 'Vendor' | 'Installer'
  ): Promise<{
    valid: boolean;
    message: string;
    coupon?: SubscriptionCoupon;
    originalAmount: number;
    discountPercentage: number;
    discountAmount: number;
    finalPrice: number;
    planMismatch?: boolean;
    requiredPlanId?: string;
    requiredPlanName?: string;
  }> {
    const codeToSearch = inputCode.trim().toUpperCase();
    const originalAmount = billingCycle === 'annual'
      ? (plan.priceAnnual ?? (plan.priceMonthly ? Math.round(plan.priceMonthly * 12 * 0.8) : 0))
      : (plan.priceMonthly ?? 0);

    if (!codeToSearch) {
      return {
        valid: false,
        message: 'Please enter a coupon code.',
        originalAmount,
        discountPercentage: 0,
        discountAmount: 0,
        finalPrice: originalAmount
      };
    }

    const coupons = await this.getCoupons();
    const coupon = coupons.find(c => c.code.trim().toUpperCase() === codeToSearch);

    // 1. Check existence
    if (!coupon) {
      return {
        valid: false,
        message: `Coupon code "${codeToSearch}" does not exist.`,
        originalAmount,
        discountPercentage: 0,
        discountAmount: 0,
        finalPrice: originalAmount
      };
    }

    // 2. Check active status
    if (coupon.status !== 'active') {
      return {
        valid: false,
        message: `Coupon "${codeToSearch}" is currently inactive.`,
        originalAmount,
        discountPercentage: 0,
        discountAmount: 0,
        finalPrice: originalAmount
      };
    }

    // 3. Check validity period
    const now = new Date();
    if (coupon.validFrom) {
      const fromDate = new Date(coupon.validFrom);
      fromDate.setHours(0, 0, 0, 0);
      if (fromDate > now) {
        return {
          valid: false,
          message: `Coupon "${codeToSearch}" will be active starting ${fromDate.toLocaleDateString('en-IN')}.`,
          originalAmount,
          discountPercentage: 0,
          discountAmount: 0,
          finalPrice: originalAmount
        };
      }
    }

    const expiryDateStr = coupon.validTo || coupon.validUntil;
    if (expiryDateStr) {
      const toDate = new Date(expiryDateStr);
      toDate.setHours(23, 59, 59, 999);
      if (toDate < now) {
        return {
          valid: false,
          message: `Coupon "${codeToSearch}" expired on ${new Date(expiryDateStr).toLocaleDateString('en-IN')}.`,
          originalAmount,
          discountPercentage: 0,
          discountAmount: 0,
          finalPrice: originalAmount
        };
      }
    }

    // 4. Check maximum usage
    const maxRedemptions = coupon.maxUsage ?? coupon.maxRedemptions;
    if (maxRedemptions && coupon.timesRedeemed >= maxRedemptions) {
      return {
        valid: false,
        message: `Coupon "${codeToSearch}" has reached its maximum redemption limit (${maxRedemptions} uses).`,
        originalAmount,
        discountPercentage: 0,
        discountAmount: 0,
        finalPrice: originalAmount
      };
    }

    // 5. Check role assignment (Vendor vs Installer)
    if (coupon.targetRole && coupon.targetRole !== 'all' && accountType && coupon.targetRole !== accountType) {
      return {
        valid: false,
        message: `Coupon "${codeToSearch}" is only assigned for ${coupon.targetRole === 'Vendor' ? 'Equipment Vendors' : 'Field Installers'}.`,
        originalAmount,
        discountPercentage: 0,
        discountAmount: 0,
        finalPrice: originalAmount
      };
    }

    // 6. Check particular person / email restriction
    if (coupon.restrictedToEmails && coupon.restrictedToEmails.length > 0) {
      const normalizedEmail = (userEmail || '').trim().toLowerCase();
      const isAllowed = coupon.restrictedToEmails.some(e => e.trim().toLowerCase() === normalizedEmail);
      if (!isAllowed) {
        return {
          valid: false,
          message: `Coupon "${codeToSearch}" is a restricted partner discount not assigned to this account (${userEmail || 'unauthorized'}).`,
          originalAmount,
          discountPercentage: 0,
          discountAmount: 0,
          finalPrice: originalAmount
        };
      }
    }

    // 7. Check applicable subscription plan
    if (coupon.applicablePlanId && coupon.applicablePlanId !== 'all' && plan.id && coupon.applicablePlanId !== plan.id) {
      return {
        valid: false,
        planMismatch: true,
        requiredPlanId: coupon.applicablePlanId,
        requiredPlanName: coupon.applicablePlanName || coupon.applicablePlanId,
        message: `Coupon "${codeToSearch}" is only applicable to the "${coupon.applicablePlanName || coupon.applicablePlanId}" subscription plan.`,
        originalAmount,
        discountPercentage: 0,
        discountAmount: 0,
        finalPrice: originalAmount
      };
    }

    // 8. Check billing cycle if specified
    if (coupon.applicableBillingCycle && coupon.applicableBillingCycle !== 'all' && coupon.applicableBillingCycle !== billingCycle) {
      return {
        valid: false,
        message: `Coupon "${codeToSearch}" is only valid on ${coupon.applicableBillingCycle.toUpperCase()} subscriptions.`,
        originalAmount,
        discountPercentage: 0,
        discountAmount: 0,
        finalPrice: originalAmount
      };
    }

    // 9. Automatically fetch discount percentage and calculate server-side
    const discountPercentage = Number(coupon.discountPercentage ?? coupon.discountValue ?? 0);
    const discountAmount = Math.round((originalAmount * discountPercentage) / 100);
    const finalPrice = Math.max(0, originalAmount - discountAmount);

    return {
      valid: true,
      message: `✅ Coupon applied: ${discountPercentage}% OFF (Save ₹${discountAmount.toLocaleString()})!`,
      coupon,
      originalAmount,
      discountPercentage,
      discountAmount,
      finalPrice
    };
  }
};
