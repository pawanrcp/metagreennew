import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Users,
  HardDrive,
  Clock,
  ShieldCheck,
  Sparkles,
  Building2,
  RefreshCw,
  Sliders,
  Check,
  X,
  Calendar,
  Zap,
  ArrowRight,
  Search,
  Award,
  Tag,
  Percent,
  UserCheck,
  Copy,
  Gift,
  Mail
} from 'lucide-react';
import {
  subscriptionService,
  SubscriptionPlan,
  VendorAccount,
  SubscriptionConfig,
  SubscriptionCoupon
} from '@/src/services/subscription.service';
import { cn } from '@/src/lib/utils';

interface SubscriptionManagementProps {
  initialTab?: 'plans' | 'vendors' | 'coupons' | 'settings';
}

export default function SubscriptionManagement({ initialTab = 'plans' }: SubscriptionManagementProps) {
  const [activeTab, setActiveTab] = useState<'plans' | 'vendors' | 'coupons' | 'settings'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [vendors, setVendors] = useState<VendorAccount[]>([]);
  const [coupons, setCoupons] = useState<SubscriptionCoupon[]>([]);
  const [config, setConfig] = useState<SubscriptionConfig>({
    defaultTrialDays: 7,
    trialEnabled: true,
    extraStoragePricePerGB: 100,
    annualDiscountPercentage: 20,
    currency: 'INR'
  });

  const [loading, setLoading] = useState(true);

  // --- PLAN STATES ---
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [billingCycleView, setBillingCycleView] = useState<'annual' | 'monthly' | 'both'>('annual');
  const [planIntervalFilter, setPlanIntervalFilter] = useState<'all' | 'annual' | 'monthly'>('all');

  const [planForm, setPlanForm] = useState<SubscriptionPlan>({
    name: '',
    userLimit: 3,
    storageGBLimit: 10,
    priceMonthly: 4999,
    priceAnnual: 47990,
    billingInterval: 'both',
    annualDiscountPercentage: 20,
    trialEnabled: true,
    trialDays: 7,
    status: 'active',
    features: ['PO & Auto-Inventory Sync', '70:30 GST Quotes', 'PM Surya Ghar Subsidy']
  });
  const [newFeatureText, setNewFeatureText] = useState('');

  // --- VENDOR STATES ---
  const [vendorCycleFilter, setVendorCycleFilter] = useState<'all' | 'annual' | 'monthly' | 'trial'>('all');
  const [vendorSearch, setVendorSearch] = useState('');
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<VendorAccount | null>(null);
  const [assignForm, setAssignForm] = useState<{
    planId: string;
    billingCycle: 'monthly' | 'annual';
    userLimit: number;
    storageGBLimit: number;
    customDiscountPercentage: number;
    customDiscountAmount: number;
    appliedCouponCode: string;
  }>({
    planId: '',
    billingCycle: 'annual',
    userLimit: 3,
    storageGBLimit: 10,
    customDiscountPercentage: 0,
    customDiscountAmount: 0,
    appliedCouponCode: ''
  });

  // --- COUPON STATES ---
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<SubscriptionCoupon | null>(null);
  const [couponSearch, setCouponSearch] = useState('');
  const [couponFilter, setCouponFilter] = useState<'all' | 'active' | 'inactive' | 'targeted'>('all');

  const [couponForm, setCouponForm] = useState<{
    code: string;
    name: string;
    description: string;
    discountPercentage: number;
    applicablePlanId: string;
    applicableBillingCycle: 'all' | 'annual' | 'monthly';
    targetRole: 'all' | 'Vendor' | 'Installer';
    restrictedEmailsInput: string;
    validFrom: string;
    validTo: string;
    maxUsage: number | '';
    status: 'active' | 'inactive';
  }>({
    code: '',
    name: '',
    description: '',
    discountPercentage: 20,
    applicablePlanId: 'all',
    applicableBillingCycle: 'all',
    targetRole: 'all',
    restrictedEmailsInput: '',
    validFrom: '',
    validTo: '',
    maxUsage: 100,
    status: 'active'
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const fetchedPlans = await subscriptionService.getSubscriptionPlans();
      const fetchedVendors = await subscriptionService.getAllVendorSubscriptions();
      const fetchedCoupons = await subscriptionService.getCoupons();
      const fetchedConfig = await subscriptionService.getSubscriptionConfig();

      setPlans(fetchedPlans);
      setVendors(fetchedVendors);
      setCoupons(fetchedCoupons);
      setConfig(fetchedConfig);
    } catch (err) {
      console.error('Error loading subscription data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- PLAN ACTIONS ---
  const handleOpenPlanModal = (plan?: SubscriptionPlan) => {
    if (plan) {
      setEditingPlan(plan);
      const monthly = plan.priceMonthly || 4999;
      const annual = plan.priceAnnual ?? Math.round(monthly * 12 * 0.8);
      const discount = plan.annualDiscountPercentage ?? 20;
      setPlanForm({
        ...plan,
        priceMonthly: monthly,
        priceAnnual: annual,
        billingInterval: plan.billingInterval || 'both',
        annualDiscountPercentage: discount
      });
    } else {
      setEditingPlan(null);
      setPlanForm({
        name: '',
        userLimit: 3,
        storageGBLimit: 10,
        priceMonthly: 4999,
        priceAnnual: 47990,
        billingInterval: 'both',
        annualDiscountPercentage: 20,
        trialEnabled: true,
        trialDays: 7,
        status: 'active',
        features: ['PO & Auto-Inventory Sync', '70:30 GST Quotes', 'PM Surya Ghar Subsidy']
      });
    }
    setIsPlanModalOpen(true);
  };

  const handleAutoCalculateAnnualPrice = () => {
    const discount = planForm.annualDiscountPercentage ?? 20;
    const monthly = planForm.priceMonthly || 4999;
    const computedAnnual = Math.round(monthly * 12 * (1 - discount / 100));
    setPlanForm(prev => ({ ...prev, priceAnnual: computedAnnual }));
  };

  const handleAddFeature = () => {
    if (newFeatureText.trim()) {
      setPlanForm(prev => ({
        ...prev,
        features: [...(prev.features || []), newFeatureText.trim()]
      }));
      setNewFeatureText('');
    }
  };

  const handleRemoveFeature = (idx: number) => {
    setPlanForm(prev => ({
      ...prev,
      features: (prev.features || []).filter((_, i) => i !== idx)
    }));
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planForm.name.trim()) {
      alert('Please enter a subscription plan name.');
      return;
    }

    const payload: SubscriptionPlan = { ...planForm };

    if (payload.billingInterval === 'annual') {
      if (!payload.priceAnnual || payload.priceAnnual <= 0) {
        alert('Please enter a valid Annual Subscription Price (₹).');
        return;
      }
      if (!payload.priceMonthly || payload.priceMonthly <= 0) {
        payload.priceMonthly = Math.round(payload.priceAnnual / 12);
      }
    } else if (payload.billingInterval === 'monthly') {
      if (!payload.priceMonthly || payload.priceMonthly <= 0) {
        alert('Please enter a valid Monthly Price (₹).');
        return;
      }
      if (!payload.priceAnnual || payload.priceAnnual <= 0) {
        payload.priceAnnual = Math.round(payload.priceMonthly * 12 * 0.8);
      }
    } else {
      // 'both'
      if (!payload.priceMonthly || payload.priceMonthly <= 0) {
        alert('Please enter a valid Monthly Price (₹).');
        return;
      }
      if (!payload.priceAnnual || payload.priceAnnual <= 0) {
        const discount = payload.annualDiscountPercentage ?? 20;
        payload.priceAnnual = Math.round(payload.priceMonthly * 12 * (1 - discount / 100));
      }
    }

    try {
      await subscriptionService.savePlan(payload);
      setIsPlanModalOpen(false);
      await loadData();
      alert('✅ Subscription Plan saved successfully in Database!');
    } catch (err) {
      console.error('Error saving plan:', err);
      alert('Failed to save plan.');
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (window.confirm('Are you sure you want to delete this subscription plan?')) {
      try {
        await subscriptionService.deletePlan(planId);
        await loadData();
      } catch (err) {
        console.error('Error deleting plan:', err);
      }
    }
  };

  // --- VENDOR ACTIONS ---
  const handleActivateAnnual = async (vendor: VendorAccount) => {
    const matchedPlan = plans.find(p => p.id === vendor.planId) || plans[0] || {
      id: vendor.planId || '',
      name: vendor.planName || 'Standard Plan',
      userLimit: vendor.userLimit || 1,
      storageGBLimit: vendor.storageGBLimit || 5,
      priceMonthly: 0,
      priceAnnual: 0,
      trialEnabled: true,
      trialDays: 7,
      status: 'active',
      features: []
    };

    if (window.confirm(`Activate a 1-Year Annual Subscription for "${vendor.companyName}" (${matchedPlan.name})? This sets 365 days validity.`)) {
      try {
        await subscriptionService.activateVendorSubscription(vendor.uid, matchedPlan, 'annual');
        await loadData();
        alert(`✅ Activated 1-Year Annual Subscription for ${vendor.companyName}!`);
      } catch (err) {
        console.error('Error activating annual subscription:', err);
        alert('Failed to activate annual subscription.');
      }
    }
  };

  const handleActivateMonthly = async (vendor: VendorAccount) => {
    const matchedPlan = plans.find(p => p.id === vendor.planId) || plans[0] || {
      id: vendor.planId || '',
      name: vendor.planName || 'Standard Plan',
      userLimit: vendor.userLimit || 1,
      storageGBLimit: vendor.storageGBLimit || 5,
      priceMonthly: 0,
      priceAnnual: 0,
      trialEnabled: true,
      trialDays: 7,
      status: 'active',
      features: []
    };

    if (window.confirm(`Activate a 30-Day Monthly Subscription for "${vendor.companyName}"?`)) {
      try {
        await subscriptionService.activateVendorSubscription(vendor.uid, matchedPlan, 'monthly');
        await loadData();
        alert(`✅ Activated Monthly Subscription for ${vendor.companyName}!`);
      } catch (err) {
        console.error('Error activating monthly subscription:', err);
        alert('Failed to activate monthly subscription.');
      }
    }
  };

  const handleExtendOneYear = async (vendor: VendorAccount) => {
    try {
      const newEndDate = await subscriptionService.extendVendorSubscription(vendor.uid, vendor.subscriptionEndDate, 365);
      await loadData();
      alert(`✅ Subscription extended by 1 Year! New Expiry: ${new Date(newEndDate).toLocaleDateString('en-IN')}`);
    } catch (err) {
      console.error('Error extending subscription:', err);
      alert('Failed to extend subscription.');
    }
  };

  const handleUpdateVendorStatus = async (uid: string, newStatus: 'trial' | 'active' | 'expired') => {
    try {
      await subscriptionService.updateVendorSubscription(uid, { subscriptionStatus: newStatus });
      await loadData();
      alert(`✅ Vendor Subscription status updated to: ${newStatus.toUpperCase()}`);
    } catch (err) {
      console.error('Error updating vendor subscription:', err);
    }
  };

  const handleOpenAssignModal = (vendor: VendorAccount) => {
    setSelectedVendor(vendor);
    setAssignForm({
      planId: vendor.planId || plans[0]?.id || '',
      billingCycle: vendor.billingCycle || 'annual',
      userLimit: vendor.userLimit || 3,
      storageGBLimit: vendor.storageGBLimit || 10,
      customDiscountPercentage: vendor.customDiscountPercentage || 0,
      customDiscountAmount: vendor.customDiscountAmount || 0,
      appliedCouponCode: vendor.appliedCouponCode || ''
    });
    setAssignModalOpen(true);
  };

  const handleSaveVendorPlanAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendor) return;

    const chosenPlan = plans.find(p => p.id === assignForm.planId);
    try {
      const startDate = new Date();
      const endDate = new Date(startDate);
      if (assignForm.billingCycle === 'annual') {
        endDate.setDate(endDate.getDate() + 365);
      } else {
        endDate.setDate(endDate.getDate() + 30);
      }

      await subscriptionService.updateVendorSubscription(selectedVendor.uid, {
        planId: assignForm.planId,
        planName: chosenPlan?.name || selectedVendor.planName,
        billingCycle: assignForm.billingCycle,
        userLimit: assignForm.userLimit,
        storageGBLimit: assignForm.storageGBLimit,
        customDiscountPercentage: Number(assignForm.customDiscountPercentage) || 0,
        customDiscountAmount: Number(assignForm.customDiscountAmount) || 0,
        appliedCouponCode: assignForm.appliedCouponCode.trim().toUpperCase() || undefined,
        subscriptionStatus: 'active',
        subscriptionStartDate: startDate.toISOString(),
        subscriptionEndDate: endDate.toISOString()
      });

      setAssignModalOpen(false);
      await loadData();
      alert(`✅ Vendor subscription updated to ${assignForm.billingCycle.toUpperCase()} plan with custom discounts successfully!`);
    } catch (err) {
      console.error('Error updating vendor plan:', err);
      alert('Failed to update vendor subscription.');
    }
  };

  // --- COUPON CRUD ACTIONS ---
  const handleOpenCouponModal = (coupon?: SubscriptionCoupon) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setCouponForm({
        code: coupon.code,
        name: coupon.name || coupon.description || '',
        description: coupon.description || coupon.name || '',
        discountPercentage: coupon.discountPercentage ?? coupon.discountValue ?? 20,
        applicablePlanId: coupon.applicablePlanId || 'all',
        applicableBillingCycle: coupon.applicableBillingCycle || 'all',
        targetRole: coupon.targetRole || 'all',
        restrictedEmailsInput: (coupon.restrictedToEmails || []).join(', '),
        validFrom: coupon.validFrom || '',
        validTo: coupon.validTo || coupon.validUntil || '',
        maxUsage: coupon.maxUsage ?? coupon.maxRedemptions ?? 100,
        status: coupon.status || 'active'
      });
    } else {
      setEditingCoupon(null);
      setCouponForm({
        code: '',
        name: '',
        description: '',
        discountPercentage: 20,
        applicablePlanId: 'all',
        applicableBillingCycle: 'all',
        targetRole: 'all',
        restrictedEmailsInput: '',
        validFrom: new Date().toISOString().split('T')[0],
        validTo: '',
        maxUsage: 100,
        status: 'active'
      });
    }
    setIsCouponModalOpen(true);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponForm.code.trim()) {
      alert('Please enter a valid coupon code.');
      return;
    }

    if (!couponForm.discountPercentage || couponForm.discountPercentage <= 0 || couponForm.discountPercentage > 100) {
      alert('Please enter a valid discount percentage between 1% and 100%.');
      return;
    }

    const restrictedEmails = couponForm.restrictedEmailsInput
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean);

    const matchedPlan = plans.find(p => p.id === couponForm.applicablePlanId);
    const applicablePlanName = couponForm.applicablePlanId === 'all' 
      ? 'All Subscription Plans' 
      : (matchedPlan?.name || couponForm.applicablePlanId);

    const couponData: SubscriptionCoupon = {
      ...(editingCoupon ? { id: editingCoupon.id } : {}),
      code: couponForm.code.trim().toUpperCase(),
      name: couponForm.name.trim() || couponForm.code.trim().toUpperCase(),
      description: couponForm.description.trim(),
      discountPercentage: Number(couponForm.discountPercentage),
      discountType: 'percentage',
      discountValue: Number(couponForm.discountPercentage),
      applicablePlanId: couponForm.applicablePlanId,
      applicablePlanName,
      applicableBillingCycle: couponForm.applicableBillingCycle,
      targetRole: couponForm.targetRole,
      restrictedToEmails: restrictedEmails,
      validFrom: couponForm.validFrom || undefined,
      validTo: couponForm.validTo || undefined,
      validUntil: couponForm.validTo || undefined,
      maxUsage: couponForm.maxUsage !== '' ? Number(couponForm.maxUsage) : undefined,
      maxRedemptions: couponForm.maxUsage !== '' ? Number(couponForm.maxUsage) : undefined,
      timesRedeemed: editingCoupon ? editingCoupon.timesRedeemed : 0,
      status: couponForm.status
    };

    try {
      await subscriptionService.saveCoupon(couponData);
      setIsCouponModalOpen(false);
      await loadData();
      alert(`✅ Coupon "${couponData.code}" saved successfully with ${couponData.discountPercentage}% discount!`);
    } catch (err) {
      console.error('Error saving coupon:', err);
      alert('Failed to save coupon.');
    }
  };

  const handleDeleteCoupon = async (couponId: string, code: string) => {
    if (window.confirm(`Are you sure you want to permanently delete coupon "${code}"?`)) {
      try {
        await subscriptionService.deleteCoupon(couponId);
        await loadData();
      } catch (err) {
        console.error('Error deleting coupon:', err);
      }
    }
  };

  const handleToggleCouponStatus = async (coupon: SubscriptionCoupon) => {
    if (!coupon.id) return;
    try {
      await subscriptionService.toggleCouponStatus(coupon.id, coupon.status);
      await loadData();
    } catch (err) {
      console.error('Error toggling coupon status:', err);
    }
  };

  // --- GLOBAL CONFIG SAVE ---
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await subscriptionService.updateSubscriptionConfig(config);
      alert('✅ Global Subscription Configurations updated!');
    } catch (err) {
      console.error('Error updating config:', err);
    }
  };

  // --- FILTERED LISTS ---
  const filteredPlans = plans.filter(p => {
    if (planIntervalFilter === 'annual') {
      return p.billingInterval === 'annual' || p.billingInterval === 'both' || !p.billingInterval;
    }
    if (planIntervalFilter === 'monthly') {
      return p.billingInterval === 'monthly' || p.billingInterval === 'both' || !p.billingInterval;
    }
    return true;
  });

  const filteredVendors = vendors.filter(v => {
    const matchesSearch = !vendorSearch ||
      v.companyName.toLowerCase().includes(vendorSearch.toLowerCase()) ||
      v.contactPerson.toLowerCase().includes(vendorSearch.toLowerCase()) ||
      v.email.toLowerCase().includes(vendorSearch.toLowerCase()) ||
      (v.appliedCouponCode && v.appliedCouponCode.toLowerCase().includes(vendorSearch.toLowerCase()));

    if (!matchesSearch) return false;

    if (vendorCycleFilter === 'annual') return v.billingCycle === 'annual' && v.subscriptionStatus === 'active';
    if (vendorCycleFilter === 'monthly') return v.billingCycle === 'monthly' && v.subscriptionStatus === 'active';
    if (vendorCycleFilter === 'trial') return v.subscriptionStatus === 'trial';
    return true;
  });

  const filteredCoupons = coupons.filter(c => {
    const matchesSearch = !couponSearch ||
      c.code.toLowerCase().includes(couponSearch.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(couponSearch.toLowerCase())) ||
      (c.restrictedToEmails && c.restrictedToEmails.some(e => e.toLowerCase().includes(couponSearch.toLowerCase())));

    if (!matchesSearch) return false;

    if (couponFilter === 'active') return c.status === 'active';
    if (couponFilter === 'inactive') return c.status === 'inactive';
    if (couponFilter === 'targeted') return (c.restrictedToEmails && c.restrictedToEmails.length > 0);
    return true;
  });

  return (
    <div className="animate-in fade-in duration-500 space-y-6 font-sans">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-xs font-black rounded-full uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              Global Admin Panel
            </span>
            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-black rounded-full uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Annual Plans & Particular Person Coupons
            </span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-blue-600" /> Dynamic Subscription Plan & Trial Manager
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            Manage Annual & Monthly user plans, coupon codes, individual person discounts, and free trial terms.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'coupons' ? (
            <button
              onClick={() => handleOpenCouponModal()}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl transition-all shadow-md shadow-emerald-200 flex items-center gap-2 text-xs shrink-0 cursor-pointer"
            >
              <Gift className="w-4 h-4" /> + Create Coupon / Promo
            </button>
          ) : (
            <button
              onClick={() => handleOpenPlanModal()}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl transition-all shadow-md shadow-blue-200 flex items-center gap-2 text-xs shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> + Create Subscription Plan
            </button>
          )}
        </div>
      </header>

      {/* Tabs */}
      <div className="flex overflow-x-auto pb-2 gap-2 no-scrollbar border-b border-slate-100">
        {[
          { id: 'plans', label: `1. Subscription Plans Catalog (${plans.length})`, icon: CreditCard },
          { id: 'vendors', label: `2. Subscribed Vendors (${vendors.length})`, icon: Building2 },
          { id: 'coupons', label: `3. Coupons & Person Discounts (${coupons.length})`, icon: Gift },
          { id: 'settings', label: '4. Trial & Storage Pricing Config', icon: Sliders },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer",
              activeTab === tab.id
                ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-200"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SUBSCRIPTION PLANS CATALOG                                          */}
      {/* ========================================================================= */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          {/* Quick link banner to Coupons */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gradient-to-r from-teal-50 via-emerald-50 to-indigo-50 border border-teal-200 rounded-2xl gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-teal-600 text-white shadow-sm shrink-0">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-black text-teal-950 uppercase tracking-wide flex items-center gap-1.5">
                  Looking for Coupons & Particular Person Discounts?
                </span>
                <p className="text-xs text-teal-800 font-medium mt-0.5">
                  Manage promo codes, set % or fixed ₹ off, and restrict discounts to specific customer email addresses.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('coupons')}
              className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-black text-xs rounded-xl transition-all shadow-md shadow-teal-200 flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Gift className="w-3.5 h-3.5" /> Go to Coupons Tab (Tab 3) →
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Catalog Pricing View:
              </span>
              <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setBillingCycleView('annual')}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer",
                    billingCycleView === 'annual'
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                  ✨ Annual Plan Wise (Save ~20%)
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycleView('monthly')}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer",
                    billingCycleView === 'monthly'
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  📅 Monthly Plan Wise
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycleView('both')}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer",
                    billingCycleView === 'both'
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  🌟 Show Dual Pricing
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">Filter:</span>
              <div className="flex items-center gap-1">
                {[
                  { id: 'all', label: `All Plans (${plans.length})` },
                  { id: 'annual', label: `Annual Supported (${plans.filter(p => p.billingInterval === 'annual' || p.billingInterval === 'both' || !p.billingInterval).length})` },
                  { id: 'monthly', label: `Monthly Supported (${plans.filter(p => p.billingInterval === 'monthly' || p.billingInterval === 'both' || !p.billingInterval).length})` }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setPlanIntervalFilter(item.id as any)}
                    className={cn(
                      "px-3 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer",
                      planIntervalFilter === item.id
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Annual Plan Highlight Banner */}
          <div className="p-4 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-200 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-emerald-950">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-sm shrink-0">
                <Award className="w-5 h-5 text-yellow-300" />
              </div>
              <div>
                <h4 className="text-sm font-black text-emerald-950 flex items-center gap-2">
                  Annual Subscription Advantage (365 Days Full Access)
                  <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-black rounded-full uppercase">
                    Save 20% to 25%
                  </span>
                </h4>
                <p className="text-xs text-emerald-800 font-medium mt-0.5">
                  Annual plans guarantee uninterrupted vendor platform access, high storage quotas, and built-in upfront savings.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleOpenPlanModal()}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl transition-all shadow-sm shrink-0 cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> + New Annual Plan
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {filteredPlans.map(plan => {
              const monthlyPrice = plan.priceMonthly || 4999;
              const annualPrice = plan.priceAnnual ?? Math.round(monthlyPrice * 12 * 0.8);
              const effectiveMonthlyInAnnual = Math.round(annualPrice / 12);
              const annualSavings = (monthlyPrice * 12) - annualPrice;
              const discountPercent = plan.annualDiscountPercentage ?? 20;
              const isAnnualOnly = plan.billingInterval === 'annual';

              return (
                <div 
                  key={plan.id} 
                  className={cn(
                    "bg-white border-2 rounded-3xl p-5 shadow-sm flex flex-col justify-between relative group hover:shadow-xl transition-all duration-300",
                    isAnnualOnly 
                      ? "border-purple-300 ring-2 ring-purple-100 bg-gradient-to-b from-purple-50/20 to-white" 
                      : (billingCycleView === 'annual' ? "border-emerald-300 ring-1 ring-emerald-100" : "border-slate-200")
                  )}
                >
                  <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button
                      onClick={() => handleOpenPlanModal(plan)}
                      className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors bg-white shadow-sm border border-slate-100 cursor-pointer"
                      title="Edit Plan"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePlan(plan.id!)}
                      className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors bg-white shadow-sm border border-slate-100 cursor-pointer"
                      title="Delete Plan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2 pr-14 mb-2.5">
                      <span className={cn(
                        "text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border",
                        plan.status === 'active' ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"
                      )}>
                        {plan.status}
                      </span>

                      {isAnnualOnly ? (
                        <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm flex items-center gap-1">
                          <Award className="w-3 h-3 text-yellow-300" />
                          Annual Plan Only
                        </span>
                      ) : (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-teal-600" />
                          Annual & Monthly
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-black text-slate-900 tracking-tight leading-snug">{plan.name}</h3>

                    {/* PROMINENT ANNUAL PLAN BOX (ALWAYS VISIBLE & PROMINENT) */}
                    <div className={cn(
                      "mt-3.5 p-3.5 rounded-2xl border transition-all",
                      isAnnualOnly
                        ? "bg-gradient-to-br from-purple-50 via-indigo-50/40 to-white border-purple-200 shadow-sm"
                        : (billingCycleView === 'annual'
                            ? "bg-gradient-to-br from-emerald-50 via-teal-50/40 to-white border-emerald-300 shadow-sm ring-1 ring-emerald-200"
                            : "bg-emerald-50/70 border-emerald-200")
                    )}>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-emerald-600" /> Annual Plan
                        </span>
                        <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-black rounded-full uppercase tracking-wider shadow-sm">
                          Save {discountPercent}%
                        </span>
                      </div>

                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-slate-900 tracking-tight">₹{annualPrice.toLocaleString()}</span>
                        <span className="text-xs font-bold text-slate-500"> / year</span>
                      </div>

                      <div className="mt-1 flex items-center justify-between text-xs font-bold text-slate-600 pt-1.5 border-t border-emerald-200/50">
                        <span className="text-slate-500 text-[11px]">Effective Monthly:</span>
                        <span className="font-black text-emerald-800">₹{effectiveMonthlyInAnnual.toLocaleString()} / mo</span>
                      </div>
                      {annualSavings > 0 && (
                        <p className="text-[10px] font-extrabold text-emerald-700 mt-1">
                          🎉 Saves ₹{annualSavings.toLocaleString()} / yr!
                        </p>
                      )}
                    </div>

                    {/* MONTHLY ALTERNATIVE (IF PLAN SUPPORTS MONTHLY) */}
                    {!isAnnualOnly && (
                      <div className={cn(
                        "mt-2.5 p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all",
                        billingCycleView === 'monthly'
                          ? "bg-blue-50/80 border-blue-200 ring-1 ring-blue-100"
                          : "bg-slate-50 border-slate-200/80 text-slate-600"
                      )}>
                        <span className="font-semibold text-slate-600 text-[11px]">Monthly Flex Rate:</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-sm font-black text-slate-900">₹{monthlyPrice.toLocaleString()}</span>
                          <span className="text-[10px] font-bold text-slate-500">/ mo</span>
                        </div>
                      </div>
                    )}

                    <div className="mt-3.5 p-3 bg-slate-50 rounded-2xl space-y-2 text-xs font-bold text-slate-700 border border-slate-100">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-blue-600" /> User Seat Limit:</span>
                        <span className="text-slate-900 font-black">{plan.userLimit} Users</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 flex items-center gap-1.5"><HardDrive className="w-3.5 h-3.5 text-emerald-600" /> Storage Vault:</span>
                        <span className="text-slate-900 font-black">{plan.storageGBLimit} GB</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-amber-500" /> Free Trial:</span>
                        <span className="text-emerald-700 font-black">{plan.trialEnabled ? `${plan.trialDays} Days Included` : 'Disabled'}</span>
                      </div>
                    </div>

                    <ul className="mt-3.5 space-y-1.5">
                      {(plan.features || []).map((feat, fIdx) => (
                        <li key={fIdx} className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="line-clamp-1">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                      Term: 365 Days (Annual)
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenPlanModal(plan)}
                      className="text-xs font-extrabold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                    >
                      Edit Plan <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SUBSCRIBED VENDOR ACCOUNTS                                         */}
      {/* ========================================================================= */}
      {activeTab === 'vendors' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
              {[
                { id: 'all', label: `All Vendors (${vendors.length})` },
                { id: 'annual', label: `✨ Annual Plans (${vendors.filter(v => v.billingCycle === 'annual' && v.subscriptionStatus === 'active').length})` },
                { id: 'monthly', label: `Monthly Plans (${vendors.filter(v => v.billingCycle === 'monthly' && v.subscriptionStatus === 'active').length})` },
                { id: 'trial', label: `Active Trials (${vendors.filter(v => v.subscriptionStatus === 'trial').length})` }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setVendorCycleFilter(f.id as any)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-extrabold whitespace-nowrap transition-all border cursor-pointer",
                    vendorCycleFilter === f.id
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search vendor, coupon, email..."
                  value={vendorSearch}
                  onChange={e => setVendorSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <button
                onClick={loadData}
                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 flex items-center gap-1 shrink-0 cursor-pointer shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-white text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                  <th className="p-4">Vendor Company</th>
                  <th className="p-4">Contact Info</th>
                  <th className="p-4">Assigned Plan & Discounts</th>
                  <th className="p-4 text-center">Billing Term</th>
                  <th className="p-4 text-center">User & Storage Quota</th>
                  <th className="p-4 text-center">Status & Validity</th>
                  <th className="p-4 text-center">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {filteredVendors.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 font-bold">
                      No vendor subscriptions found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredVendors.map(v => {
                    const remainingTrial = subscriptionService.getRemainingTrialDays(v.trialEndDate);
                    const remainingSub = subscriptionService.getRemainingSubscriptionDays(v.subscriptionEndDate);
                    const isAnnual = v.billingCycle === 'annual';

                    return (
                      <tr key={v.uid} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4">
                          <span className={cn(
                            "inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider mb-1 border",
                            v.accountType === 'Installer'
                              ? "bg-amber-50 text-amber-800 border-amber-200"
                              : "bg-blue-50 text-blue-800 border-blue-200"
                          )}>
                            {v.accountType === 'Installer' ? '⚡ Solar Installer' : '🏢 Equipment Vendor'}
                          </span>
                          <p className="font-bold text-slate-900 text-sm">{v.companyName}</p>
                          <p className="text-[11px] text-slate-400">UID: {v.uid.slice(0, 10)}...</p>
                        </td>
                        <td className="p-4 text-slate-600">
                          <p className="font-bold text-slate-800">{v.contactPerson}</p>
                          <p className="text-[11px] text-slate-400">{v.email}</p>
                          {v.phone && <p className="text-[11px] text-slate-400">{v.phone}</p>}
                        </td>
                        <td className="p-4">
                          <span className="font-extrabold text-blue-600 block">{v.planName || 'Starter Vendor'}</span>

                          {/* Particular Person Custom Discount or Applied Coupon badge */}
                          <div className="flex flex-wrap gap-1 mt-1">
                            {v.appliedCouponCode && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded text-[9px] font-black uppercase">
                                <Tag className="w-2.5 h-2.5 text-amber-600" />
                                Coupon: {v.appliedCouponCode} {v.discountPercentage ? `(${v.discountPercentage}% OFF)` : ''}
                              </span>
                            )}
                            {v.discountAmount && v.discountAmount > 0 ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[9px] font-black">
                                Saved: ₹{v.discountAmount.toLocaleString()}
                              </span>
                            ) : null}
                            {v.finalAmount !== undefined ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-indigo-50 text-indigo-800 border border-indigo-200 rounded text-[9px] font-black">
                                Payable: ₹{v.finalAmount.toLocaleString()}
                              </span>
                            ) : null}
                            {v.customDiscountPercentage && v.customDiscountPercentage > 0 && !v.appliedCouponCode ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[9px] font-black">
                                <Percent className="w-2.5 h-2.5 text-emerald-600" />
                                Custom -{v.customDiscountPercentage}%
                              </span>
                            ) : null}
                            {v.customDiscountAmount && v.customDiscountAmount > 0 && !v.discountAmount ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[9px] font-black">
                                -₹{v.customDiscountAmount.toLocaleString()}
                              </span>
                            ) : null}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleOpenAssignModal(v)}
                            className="text-[10px] text-slate-500 hover:text-blue-600 font-bold underline cursor-pointer mt-1 block"
                          >
                            Change Plan & Custom Discount
                          </button>
                        </td>

                        {/* Billing Term */}
                        <td className="p-4 text-center">
                          {isAnnual ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <Sparkles className="w-3 h-3 text-emerald-600" />
                              Annual (365D)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
                              <Clock className="w-3 h-3 text-blue-600" />
                              Monthly (30D)
                            </span>
                          )}
                        </td>

                        {/* Quotas */}
                        <td className="p-4 text-center">
                          <p className="font-black text-slate-900">{v.userLimit || 3} Users Max</p>
                          <p className="text-[11px] font-semibold text-slate-500">
                            {((v.usedStorageMB || 0) / 1024).toFixed(1)} / {v.storageGBLimit || 10} GB Storage
                          </p>
                        </td>

                        {/* Status & Validity */}
                        <td className="p-4 text-center">
                          <div className="inline-block text-left">
                            <span className={cn(
                              "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border block text-center",
                              v.subscriptionStatus === 'active' ? "bg-emerald-100 text-emerald-800 border-emerald-200" :
                                v.subscriptionStatus === 'trial' ? "bg-amber-100 text-amber-800 border-amber-200" :
                                  "bg-red-100 text-red-800 border-red-200"
                            )}>
                              {v.subscriptionStatus === 'trial' ? `Trial (${remainingTrial}d left)` :
                                v.subscriptionStatus === 'active' ? `Active (${remainingSub}d left)` : 'Expired'}
                            </span>
                            {v.subscriptionEndDate && (
                              <p className="text-[10px] text-slate-400 font-semibold text-center mt-1">
                                Exp: {new Date(v.subscriptionEndDate).toLocaleDateString('en-IN')}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Action Buttons */}
                        <td className="p-4 text-center">
                          <div className="flex flex-col gap-1.5 items-center justify-center">
                            <button
                              onClick={() => handleActivateAnnual(v)}
                              className="w-full px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                              title="Activate 1-Year Annual Subscription"
                            >
                              <Zap className="w-3 h-3" /> Activate 1-Yr Annual
                            </button>

                            <div className="flex items-center gap-1 w-full justify-center">
                              <button
                                onClick={() => handleExtendOneYear(v)}
                                className="flex-1 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[10px] font-bold uppercase transition-colors cursor-pointer"
                                title="Add +365 Days to current expiry"
                              >
                                +1 Year
                              </button>

                              <button
                                onClick={() => handleActivateMonthly(v)}
                                className="flex-1 px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-md text-[10px] font-bold uppercase transition-colors cursor-pointer"
                                title="Activate 30-Day Monthly Subscription"
                              >
                                Monthly
                              </button>

                              <button
                                onClick={() => handleUpdateVendorStatus(v.uid, 'expired')}
                                className="px-2 py-0.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-md text-[10px] font-bold uppercase transition-colors cursor-pointer"
                                title="Revoke / Expire access immediately"
                              >
                                Expire
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: COUPONS & PARTICULAR PERSON DISCOUNTS (FULL CRUD)                    */}
      {/* ========================================================================= */}
      {activeTab === 'coupons' && (
        <div className="space-y-6">
          {/* Coupon Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Coupons</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{coupons.length}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Promos</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">
                {coupons.filter(c => c.status === 'active').length}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Redemptions</span>
              <p className="text-2xl font-black text-blue-600 mt-1">
                {coupons.reduce((acc, c) => acc + (c.timesRedeemed || 0), 0)}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Targeted VIP Promos</span>
              <p className="text-2xl font-black text-purple-600 mt-1">
                {coupons.filter(c => c.restrictedToEmails && c.restrictedToEmails.length > 0).length}
              </p>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
                {[
                  { id: 'all', label: `All Coupons (${coupons.length})` },
                  { id: 'active', label: 'Active' },
                  { id: 'inactive', label: 'Disabled' },
                  { id: 'targeted', label: `👤 Particular Persons Only (${coupons.filter(c => c.restrictedToEmails && c.restrictedToEmails.length > 0).length})` }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setCouponFilter(item.id as any)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-extrabold whitespace-nowrap transition-all border cursor-pointer",
                      couponFilter === item.id
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search coupon, email restriction..."
                    value={couponSearch}
                    onChange={e => setCouponSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <button
                  onClick={loadData}
                  className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 flex items-center gap-1 shrink-0 cursor-pointer shadow-sm"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </button>
              </div>
            </div>

            {/* Coupons Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[850px]">
                <thead>
                  <tr className="bg-white text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                    <th className="p-4">Coupon Code & Details</th>
                    <th className="p-4">Discount %</th>
                    <th className="p-4">Applicable Plan</th>
                    <th className="p-4">Assigned Target</th>
                    <th className="p-4 text-center">Validity Window</th>
                    <th className="p-4 text-center">Redemptions</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium">
                  {filteredCoupons.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 font-bold">
                        No coupon codes found. Click "+ Create Coupon / Promo" to generate one!
                      </td>
                    </tr>
                  ) : (
                    filteredCoupons.map(coupon => {
                      const isTargeted = coupon.restrictedToEmails && coupon.restrictedToEmails.length > 0;
                      const expiryDateStr = coupon.validTo || coupon.validUntil;
                      const isExpired = expiryDateStr && new Date(expiryDateStr) < new Date();
                      const discountPct = coupon.discountPercentage ?? coupon.discountValue ?? 0;

                      return (
                        <tr key={coupon.id} className="hover:bg-slate-50/50 transition-colors">
                          {/* Code & Name */}
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-1 bg-slate-900 text-white font-mono font-black text-xs rounded-lg tracking-wider flex items-center gap-1">
                                <Tag className="w-3 h-3 text-emerald-400" />
                                {coupon.code}
                              </span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(coupon.code);
                                  alert(`Copied "${coupon.code}" to clipboard!`);
                                }}
                                className="text-slate-400 hover:text-slate-600 p-1"
                                title="Copy Code"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            {coupon.name && coupon.name !== coupon.code && (
                              <p className="text-xs font-bold text-slate-800 mt-1">{coupon.name}</p>
                            )}
                            {coupon.description && (
                              <p className="text-[11px] text-slate-500 font-medium mt-0.5">{coupon.description}</p>
                            )}
                          </td>

                          {/* Discount % */}
                          <td className="p-4">
                            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black uppercase border border-emerald-200 inline-flex items-center gap-1">
                              <Percent className="w-3 h-3 text-emerald-600" />
                              {discountPct}% OFF
                            </span>
                          </td>

                          {/* Applicable Plan */}
                          <td className="p-4 space-y-1">
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-800 text-[10px] font-black rounded-full uppercase border border-blue-200 block w-fit">
                              📦 {coupon.applicablePlanName || (coupon.applicablePlanId === 'all' ? 'All Subscription Plans' : coupon.applicablePlanId)}
                            </span>
                            {coupon.applicableBillingCycle === 'annual' ? (
                              <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-black rounded-full uppercase border border-purple-200 block w-fit">
                                ✨ Annual Only
                              </span>
                            ) : coupon.applicableBillingCycle === 'monthly' ? (
                              <span className="px-2 py-0.5 bg-sky-100 text-sky-800 text-[10px] font-black rounded-full uppercase border border-sky-200 block w-fit">
                                Monthly Only
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-teal-50 text-teal-700 text-[10px] font-bold rounded-full uppercase border border-teal-200 block w-fit">
                                All Billing Cycles
                              </span>
                            )}
                          </td>

                          {/* Assigned Target */}
                          <td className="p-4">
                            {isTargeted ? (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-black rounded-full uppercase border border-indigo-200">
                                  <UserCheck className="w-3 h-3 text-indigo-600" />
                                  Targeted: {coupon.restrictedToEmails!.length} Person(s)
                                </span>
                                <p className="text-[10px] text-slate-500 font-mono line-clamp-1" title={coupon.restrictedToEmails!.join(', ')}>
                                  {coupon.restrictedToEmails!.join(', ')}
                                </p>
                              </div>
                            ) : coupon.targetRole === 'Vendor' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-black rounded-full uppercase border border-blue-200">
                                🏢 Equipment Vendors Only
                              </span>
                            ) : coupon.targetRole === 'Installer' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-black rounded-full uppercase border border-amber-200">
                                ⚡ Solar Installers Only
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-500 font-bold">
                                🌍 All Vendors & Installers
                              </span>
                            )}
                          </td>

                          {/* Validity Window */}
                          <td className="p-4 text-center">
                            {coupon.validFrom || expiryDateStr ? (
                              <div className="space-y-0.5">
                                {coupon.validFrom && (
                                  <span className="block text-[10px] text-slate-500">
                                    From: <strong className="text-slate-700">{new Date(coupon.validFrom).toLocaleDateString('en-IN')}</strong>
                                  </span>
                                )}
                                {expiryDateStr ? (
                                  <span className={cn(
                                    "block text-xs font-semibold",
                                    isExpired ? "text-red-500 font-bold" : "text-slate-600"
                                  )}>
                                    To: <strong>{new Date(expiryDateStr).toLocaleDateString('en-IN')}</strong>
                                    {isExpired && <span className="block text-[9px] uppercase font-black text-red-600">Expired</span>}
                                  </span>
                                ) : (
                                  <span className="block text-[10px] text-slate-400 font-bold">No Expiry</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs font-bold">Always Valid</span>
                            )}
                          </td>

                          {/* Redemptions */}
                          <td className="p-4 text-center font-bold text-slate-700">
                            {coupon.timesRedeemed || 0} / {coupon.maxUsage ?? coupon.maxRedemptions ?? '∞'}
                          </td>

                          {/* Status Toggle */}
                          <td className="p-4 text-center">
                            <button
                              onClick={() => handleToggleCouponStatus(coupon)}
                              className={cn(
                                "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border cursor-pointer transition-colors",
                                coupon.status === 'active'
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200"
                                  : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                              )}
                            >
                              {coupon.status}
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleOpenCouponModal(coupon)}
                                className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors border border-slate-100 shadow-sm cursor-pointer"
                                title="Edit Coupon"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteCoupon(coupon.id!, coupon.code)}
                                className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors border border-slate-100 shadow-sm cursor-pointer"
                                title="Delete Coupon"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: TRIAL & STORAGE PRICING CONFIG                                     */}
      {/* ========================================================================= */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm max-w-2xl">
          <div className="flex items-center gap-2 mb-4">
            <Sliders className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-black text-slate-900">Global Subscription & Annual Pricing Configuration</h3>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Default Annual Plan Discount (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={config.annualDiscountPercentage ?? 20}
                  onChange={e => setConfig({ ...config, annualDiscountPercentage: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">% OFF</span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-1">
                Recommended: 20%. Automatically calculates annual plan price as (Monthly × 12 × (1 - Discount%)).
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Default Free Trial Duration (Days)
              </label>
              <input
                type="number"
                min="1"
                max="90"
                value={config.defaultTrialDays}
                onChange={e => setConfig({ ...config, defaultTrialDays: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Additional Cloud Storage Price per GB (₹)
              </label>
              <input
                type="number"
                min="0"
                value={config.extraStoragePricePerGB}
                onChange={e => setConfig({ ...config, extraStoragePricePerGB: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="enable-trial"
                checked={config.trialEnabled}
                onChange={e => setConfig({ ...config, trialEnabled: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded cursor-pointer"
              />
              <label htmlFor="enable-trial" className="text-xs font-bold text-slate-800 cursor-pointer">
                Enable Free Trial for New Solar Vendor & EPC Registrations
              </label>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-600 text-white font-extrabold text-xs rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-200 cursor-pointer"
              >
                Save Global Subscription Configurations
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE / EDIT SUBSCRIPTION PLAN                                    */}
      {/* ========================================================================= */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  {editingPlan ? 'Edit Subscription Plan' : 'Create Subscription Plan'}
                </h3>
                <p className="text-xs text-slate-500 font-medium">Configure Annual & Monthly Pricing, Limits, & Trial parameters</p>
              </div>
              <button onClick={() => setIsPlanModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer">&times;</button>
            </div>

            <form onSubmit={handleSavePlan} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Plan Name *</label>
                <input
                  required
                  type="text"
                  value={planForm.name}
                  onChange={e => setPlanForm({ ...planForm, name: e.target.value })}
                  placeholder="e.g. Starter Solar Vendor (3 Users)"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* 1. SELECT BILLING INTERVAL MODEL */}
              <div>
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wide mb-2 flex items-center justify-between">
                  <span>1. Select Billing Model (Annual vs Monthly) *</span>
                  <span className="text-[11px] text-blue-600 font-bold">Adapts pricing fields below</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Both Option */}
                  <div
                    onClick={() => setPlanForm({ ...planForm, billingInterval: 'both' })}
                    className={cn(
                      "p-3 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between text-left",
                      planForm.billingInterval === 'both'
                        ? "bg-emerald-50/80 border-emerald-600 shadow-md ring-2 ring-emerald-500/20"
                        : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Dual Option
                        </span>
                        {planForm.billingInterval === 'both' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                      </div>
                      <h4 className="font-black text-xs text-slate-900 mt-1">Both Annual & Monthly</h4>
                      <p className="text-[10px] text-slate-500 font-medium mt-0.5 leading-snug">
                        Vendors can choose monthly or save ~20% with 365-day annual
                      </p>
                    </div>
                  </div>

                  {/* Annual Only Option */}
                  <div
                    onClick={() => setPlanForm({ ...planForm, billingInterval: 'annual' })}
                    className={cn(
                      "p-3 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between text-left",
                      planForm.billingInterval === 'annual'
                        ? "bg-purple-50/80 border-purple-600 shadow-md ring-2 ring-purple-500/20"
                        : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                          Annual Only
                        </span>
                        {planForm.billingInterval === 'annual' && <CheckCircle2 className="w-4 h-4 text-purple-600" />}
                      </div>
                      <h4 className="font-black text-xs text-slate-900 mt-1">Annual Plan Only</h4>
                      <p className="text-[10px] text-slate-500 font-medium mt-0.5 leading-snug">
                        Dedicated 365-day package with upfront annual pricing (1-Year Lock-in)
                      </p>
                    </div>
                  </div>

                  {/* Monthly Only Option */}
                  <div
                    onClick={() => setPlanForm({ ...planForm, billingInterval: 'monthly' })}
                    className={cn(
                      "p-3 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between text-left",
                      planForm.billingInterval === 'monthly'
                        ? "bg-blue-50/80 border-blue-600 shadow-md ring-2 ring-blue-500/20"
                        : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                          Monthly Only
                        </span>
                        {planForm.billingInterval === 'monthly' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                      </div>
                      <h4 className="font-black text-xs text-slate-900 mt-1">Monthly Plan Only</h4>
                      <p className="text-[10px] text-slate-500 font-medium mt-0.5 leading-snug">
                        Standard 30-day billing renewed each month
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. DYNAMIC PRICING STRUCTURE BASED ON SELECTION */}
              {planForm.billingInterval === 'both' && (
                <div className="p-4 bg-gradient-to-br from-emerald-50/40 via-teal-50/20 to-white rounded-2xl border-2 border-emerald-300/80 space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <span className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-600" /> 2. Dual Pricing Configuration (Annual & Monthly)
                    </span>
                    <button
                      type="button"
                      onClick={handleAutoCalculateAnnualPrice}
                      className="text-[11px] font-black text-emerald-800 hover:text-emerald-900 bg-emerald-100 hover:bg-emerald-200 px-3 py-1 rounded-xl transition-all flex items-center gap-1 cursor-pointer border border-emerald-300 shadow-sm"
                    >
                      <Zap className="w-3.5 h-3.5 text-emerald-600" /> ⚡ Auto-Calculate Annual Rate ({planForm.annualDiscountPercentage ?? 20}% Off)
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Monthly Price (₹ / month) *
                      </label>
                      <input
                        required
                        type="number"
                        min="1"
                        value={planForm.priceMonthly}
                        onChange={e => {
                          const monthly = Number(e.target.value);
                          const discount = planForm.annualDiscountPercentage ?? 20;
                          setPlanForm(prev => ({
                            ...prev,
                            priceMonthly: monthly,
                            priceAnnual: Math.round(monthly * 12 * (1 - discount / 100))
                          }));
                        }}
                        placeholder="e.g. 4999"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                      <span className="text-[10px] text-slate-400 font-medium">Billed 30-day recurring</span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Annual Discount (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="90"
                        value={planForm.annualDiscountPercentage ?? 20}
                        onChange={e => {
                          const discount = Number(e.target.value);
                          setPlanForm(prev => ({
                            ...prev,
                            annualDiscountPercentage: discount,
                            priceAnnual: Math.round(prev.priceMonthly * 12 * (1 - discount / 100))
                          }));
                        }}
                        placeholder="e.g. 20"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                      <span className="text-[10px] text-emerald-600 font-bold">Standard: 20% discount</span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-emerald-900 uppercase mb-1">
                        Annual Price (₹ / year) *
                      </label>
                      <input
                        required
                        type="number"
                        min="1"
                        value={planForm.priceAnnual ?? Math.round(planForm.priceMonthly * 12 * 0.8)}
                        onChange={e => setPlanForm({ ...planForm, priceAnnual: Number(e.target.value) })}
                        placeholder="e.g. 47990"
                        className="w-full px-3 py-2 bg-white border-2 border-emerald-400 rounded-xl text-xs font-black text-emerald-800 outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                      <span className="text-[10px] text-emerald-700 font-bold">365-day upfront rate</span>
                    </div>
                  </div>

                  {/* Live Summary Calculation Box */}
                  <div className="p-3 bg-white rounded-xl border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <span className="text-slate-500 font-semibold">Effective Monthly in Annual: </span>
                      <span className="font-black text-emerald-800">
                        ₹{Math.round((planForm.priceAnnual || planForm.priceMonthly * 12 * 0.8) / 12).toLocaleString()} / mo
                      </span>
                    </div>
                    <div className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg font-black text-[11px]">
                      🎉 Customer Saves ₹{((planForm.priceMonthly * 12) - (planForm.priceAnnual || Math.round(planForm.priceMonthly * 12 * 0.8))).toLocaleString()} / year ({planForm.annualDiscountPercentage ?? 20}% OFF)
                    </div>
                  </div>
                </div>
              )}

              {planForm.billingInterval === 'annual' && (
                <div className="p-4 bg-gradient-to-br from-purple-50/50 via-indigo-50/20 to-white rounded-2xl border-2 border-purple-300/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-purple-950 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-purple-600" /> 2. Annual Only Pricing (365 Days Access)
                    </span>
                    <span className="px-2.5 py-0.5 bg-purple-600 text-white text-[10px] font-black rounded-full uppercase">
                      Dedicated Annual Term
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-purple-900 uppercase mb-1">
                        Annual Subscription Price (₹ / year) *
                      </label>
                      <input
                        required
                        type="number"
                        min="1"
                        value={planForm.priceAnnual}
                        onChange={e => {
                          const annual = Number(e.target.value);
                          setPlanForm(prev => ({
                            ...prev,
                            priceAnnual: annual,
                            priceMonthly: Math.round(annual / 12)
                          }));
                        }}
                        placeholder="e.g. 479990"
                        className="w-full px-3 py-2 bg-white border-2 border-purple-400 rounded-xl text-xs font-black text-purple-900 outline-none focus:ring-2 focus:ring-purple-500/20"
                      />
                      <span className="text-[10px] text-purple-700 font-bold">Total price charged for 1-year access</span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Equivalent Monthly Display (₹ / mo)
                      </label>
                      <input
                        type="number"
                        value={planForm.priceMonthly || Math.round((planForm.priceAnnual || 0) / 12)}
                        onChange={e => setPlanForm({ ...planForm, priceMonthly: Number(e.target.value) })}
                        placeholder="e.g. 39999"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
                      />
                      <span className="text-[10px] text-slate-500 font-medium">Used for per-month marketing breakdown</span>
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-purple-200 flex items-center justify-between text-xs">
                    <span className="text-purple-900 font-bold">✨ Annual Term Package:</span>
                    <span className="font-black text-purple-900">
                      ₹{Math.round((planForm.priceAnnual || 0) / 12).toLocaleString()} / mo (Billed ₹{(planForm.priceAnnual || 0).toLocaleString()} annually)
                    </span>
                  </div>
                </div>
              )}

              {planForm.billingInterval === 'monthly' && (
                <div className="p-4 bg-gradient-to-br from-blue-50/50 via-slate-50/30 to-white rounded-2xl border-2 border-blue-300/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-blue-950 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-blue-600" /> 2. Monthly Only Pricing (30 Days Cycle)
                    </span>
                    <span className="px-2.5 py-0.5 bg-blue-600 text-white text-[10px] font-black rounded-full uppercase">
                      Monthly Recurring
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Monthly Subscription Price (₹ / month) *
                    </label>
                    <input
                      required
                      type="number"
                      min="1"
                      value={planForm.priceMonthly}
                      onChange={e => {
                        const monthly = Number(e.target.value);
                        setPlanForm(prev => ({
                          ...prev,
                          priceMonthly: monthly,
                          priceAnnual: Math.round(monthly * 12 * 0.8)
                        }));
                      }}
                      placeholder="e.g. 4999"
                      className="w-full px-3 py-2 bg-white border-2 border-blue-400 rounded-xl text-xs font-black text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <span className="text-[10px] text-blue-700 font-bold">Billed on a 30-day recurring term</span>
                  </div>
                </div>
              )}

              {/* 3. LIMITS & TRIAL PARAMETERS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">User Limit (Seats) *</label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={planForm.userLimit}
                    onChange={e => setPlanForm({ ...planForm, userLimit: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-extrabold outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Storage Vault (GB) *</label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={planForm.storageGBLimit}
                    onChange={e => setPlanForm({ ...planForm, storageGBLimit: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-extrabold outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Trial Period (Days) *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={planForm.trialDays}
                    onChange={e => setPlanForm({ ...planForm, trialDays: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-extrabold outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-1">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={planForm.trialEnabled}
                    onChange={e => setPlanForm({ ...planForm, trialEnabled: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                  />
                  Enable Free Trial
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={planForm.status === 'active'}
                    onChange={e => setPlanForm({ ...planForm, status: e.target.checked ? 'active' : 'inactive' })}
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                  />
                  Active Plan in Public Catalog
                </label>
              </div>

              {/* 4. PLAN FEATURES LIST */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                <label className="block text-xs font-black text-slate-700 uppercase">
                  Plan Features & Capabilities ({(planForm.features || []).length})
                </label>
                
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {(planForm.features || []).map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-center justify-between gap-2 p-2 bg-white rounded-xl border border-slate-200 text-xs">
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="font-semibold text-slate-700">{feat}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(fIdx)}
                        className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                        title="Remove Feature"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newFeatureText}
                    onChange={e => setNewFeatureText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddFeature();
                      }
                    }}
                    placeholder="Add feature e.g. Multi-Branch Support, Custom Logos..."
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
                  >
                    + Add Feature
                  </button>
                </div>
              </div>

              <div className="pt-3 flex gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-extrabold rounded-xl text-xs hover:bg-blue-700 shadow-md shadow-blue-200 cursor-pointer"
                >
                  Save Subscription Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE / EDIT COUPON & PARTICULAR PERSON DISCOUNT                  */}
      {/* ========================================================================= */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Gift className="w-5 h-5 text-emerald-600" />
                  {editingCoupon ? 'Edit Subscription Coupon' : 'Create Subscription Coupon'}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Configure promo code, discount amount, and optional particular person restrictions
                </p>
              </div>
              <button onClick={() => setIsCouponModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer">&times;</button>
            </div>

            <form onSubmit={handleSaveCoupon} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Coupon Code *</label>
                  <input
                    required
                    type="text"
                    value={couponForm.code}
                    onChange={e => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. ANNUAL25 or VIP50"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-black uppercase outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Coupon Name / Campaign Title *</label>
                  <input
                    required
                    type="text"
                    value={couponForm.name}
                    onChange={e => setCouponForm({ ...couponForm, name: e.target.value })}
                    placeholder="e.g. Partner Launch Discount"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description / Campaign Purpose</label>
                <input
                  type="text"
                  value={couponForm.description}
                  onChange={e => setCouponForm({ ...couponForm, description: e.target.value })}
                  placeholder="e.g. 20% discount on solar plans for authorized partners"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Discount Percentage (%) *</label>
                  <div className="relative">
                    <input
                      required
                      type="number"
                      min="1"
                      max="100"
                      value={couponForm.discountPercentage}
                      onChange={e => setCouponForm({ ...couponForm, discountPercentage: Number(e.target.value) })}
                      className="w-full pl-3 pr-8 py-2 border border-slate-200 rounded-xl text-xs font-extrabold outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Applicable Subscription Plan *</label>
                  <select
                    value={couponForm.applicablePlanId}
                    onChange={e => setCouponForm({ ...couponForm, applicablePlanId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white"
                  >
                    <option value="all">🌐 All Subscription Plans</option>
                    {plans.map(p => (
                      <option key={p.id} value={p.id}>
                        📦 {p.name} (₹{p.priceAnnual ? p.priceAnnual.toLocaleString() : Math.round((p.priceMonthly || 4999) * 12 * 0.8).toLocaleString()}/yr)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Assign Coupon To (Target Role)</label>
                  <select
                    value={couponForm.targetRole}
                    onChange={e => setCouponForm({ ...couponForm, targetRole: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white"
                  >
                    <option value="all">👥 All (Vendors & Installers)</option>
                    <option value="Vendor">🏢 Equipment Vendors Only</option>
                    <option value="Installer">⚡ Solar Field Installers Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Applicable Billing Cycle</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'all', label: 'All Cycles' },
                      { id: 'annual', label: 'Annual' },
                      { id: 'monthly', label: 'Monthly' },
                    ].map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setCouponForm({ ...couponForm, applicableBillingCycle: c.id as any })}
                        className={cn(
                          "py-2 px-1 text-center rounded-xl border text-[11px] font-extrabold transition-all cursor-pointer",
                          couponForm.applicableBillingCycle === c.id
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        )}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Particular Persons Restriction */}
              <div className="p-3.5 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-black uppercase text-indigo-900">
                  <UserCheck className="w-4 h-4 text-indigo-600" />
                  <span>Assign to Particular Persons / Authorized Emails (Optional)</span>
                </div>
                <p className="text-[11px] text-indigo-700 font-medium leading-relaxed">
                  Enter comma-separated email addresses to restrict this discount to only those particular individuals. Leave blank if open to all eligible vendors/installers.
                </p>
                <textarea
                  rows={2}
                  value={couponForm.restrictedEmailsInput}
                  onChange={e => setCouponForm({ ...couponForm, restrictedEmailsInput: e.target.value })}
                  placeholder="e.g. director@apexsolar.com, vip@greenenergy.in"
                  className="w-full p-2 bg-white border border-indigo-200 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Valid From</label>
                  <input
                    type="date"
                    value={couponForm.validFrom}
                    onChange={e => setCouponForm({ ...couponForm, validFrom: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Valid To / Expiry Date</label>
                  <input
                    type="date"
                    value={couponForm.validTo}
                    onChange={e => setCouponForm({ ...couponForm, validTo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Max Usage Limit</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Unlimited"
                    value={couponForm.maxUsage}
                    onChange={e => setCouponForm({ ...couponForm, maxUsage: e.target.value === '' ? '' : Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="coupon-active"
                  checked={couponForm.status === 'active'}
                  onChange={e => setCouponForm({ ...couponForm, status: e.target.checked ? 'active' : 'inactive' })}
                  className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                />
                <label htmlFor="coupon-active" className="text-xs font-bold text-slate-800 cursor-pointer">
                  Coupon Status: <span className={couponForm.status === 'active' ? 'text-emerald-700 font-extrabold' : 'text-slate-500 font-bold'}>{couponForm.status === 'active' ? 'Active (Ready for Registration)' : 'Inactive (Disabled)'}</span>
                </label>
              </div>

              <div className="pt-3 flex gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCouponModalOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-emerald-600 text-white font-extrabold rounded-xl text-xs hover:bg-emerald-700 shadow-md shadow-emerald-200 cursor-pointer"
                >
                  {editingCoupon ? 'Update Coupon' : 'Save Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ASSIGN / CHANGE PLAN & PARTICULAR PERSON DISCOUNT FOR VENDOR        */}
      {/* ========================================================================= */}
      {assignModalOpen && selectedVendor && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Assign Plan & Custom Discount: {selectedVendor.companyName}
                </h3>
                <p className="text-xs text-slate-500 font-medium">Configure individual term, seat limits, and tailored discounts</p>
              </div>
              <button onClick={() => setAssignModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer">&times;</button>
            </div>

            <form onSubmit={handleSaveVendorPlanAssignment} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Subscription Plan</label>
                <select
                  value={assignForm.planId}
                  onChange={e => {
                    const chosen = plans.find(p => p.id === e.target.value);
                    setAssignForm({
                      ...assignForm,
                      planId: e.target.value,
                      userLimit: chosen?.userLimit || assignForm.userLimit,
                      storageGBLimit: chosen?.storageGBLimit || assignForm.storageGBLimit
                    });
                  }}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                >
                  {plans.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} — ₹{p.priceMonthly}/mo | ₹{p.priceAnnual || Math.round(p.priceMonthly * 12 * 0.8)}/yr ({p.userLimit} Users)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Billing Term / Cycle</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAssignForm({ ...assignForm, billingCycle: 'annual' })}
                    className={cn(
                      "p-3 rounded-xl border text-left transition-all cursor-pointer",
                      assignForm.billingCycle === 'annual'
                        ? "bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20"
                        : "bg-white border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-emerald-800">✨ Annual (1 Year)</span>
                      {assignForm.billingCycle === 'annual' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium mt-1">365 Days Validity from today</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAssignForm({ ...assignForm, billingCycle: 'monthly' })}
                    className={cn(
                      "p-3 rounded-xl border text-left transition-all cursor-pointer",
                      assignForm.billingCycle === 'monthly'
                        ? "bg-blue-50 border-blue-500 ring-2 ring-blue-500/20"
                        : "bg-white border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-blue-800">Monthly (30 Days)</span>
                      {assignForm.billingCycle === 'monthly' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium mt-1">30 Days Validity from today</p>
                  </button>
                </div>
              </div>

              {/* Particular Person Custom Discounts */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-xs font-black uppercase text-slate-800 flex items-center gap-1">
                  <Percent className="w-4 h-4 text-blue-600" /> Particular Person Custom Discount
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Custom Discount (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={assignForm.customDiscountPercentage}
                      onChange={e => setAssignForm({ ...assignForm, customDiscountPercentage: Number(e.target.value) })}
                      placeholder="e.g. 15"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Custom Fixed Off (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={assignForm.customDiscountAmount}
                      onChange={e => setAssignForm({ ...assignForm, customDiscountAmount: Number(e.target.value) })}
                      placeholder="e.g. 2000"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Applied Promo Coupon Code</label>
                  <input
                    type="text"
                    value={assignForm.appliedCouponCode}
                    onChange={e => setAssignForm({ ...assignForm, appliedCouponCode: e.target.value.toUpperCase() })}
                    placeholder="e.g. ANNUAL25 or VIP50"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">User Limit (Seats)</label>
                  <input
                    type="number"
                    min="1"
                    value={assignForm.userLimit}
                    onChange={e => setAssignForm({ ...assignForm, userLimit: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Storage Limit (GB)</label>
                  <input
                    type="number"
                    min="1"
                    value={assignForm.storageGBLimit}
                    onChange={e => setAssignForm({ ...assignForm, storageGBLimit: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-extrabold rounded-xl text-xs hover:bg-blue-700 shadow-md shadow-blue-200 cursor-pointer"
                >
                  Update & Activate Subscription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
