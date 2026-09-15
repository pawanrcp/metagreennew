import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  X, 
  Users, 
  HardDrive, 
  AlertCircle, 
  MapPin, 
  Compass, 
  LocateFixed, 
  Loader2, 
  Wrench, 
  Tag, 
  Gift, 
  Percent 
} from 'lucide-react';
import { subscriptionService, SubscriptionPlan, SubscriptionCoupon } from '@/src/services/subscription.service';
import { authService } from '@/src/services/auth.service';
import { cn } from '@/src/lib/utils';
import { useToast } from '@/src/context/ToastContext';

interface VendorRegistrationModalProps {
  selectedPlan: SubscriptionPlan;
  allPlans: SubscriptionPlan[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function VendorRegistrationModal({
  selectedPlan,
  allPlans,
  onClose,
  onSuccess
}: VendorRegistrationModalProps) {
  const { toast } = useToast();
  const [activeStep, setActiveStep] = useState<1 | 2>(1);
  const [chosenPlan, setChosenPlan] = useState<SubscriptionPlan>(selectedPlan);
  const [billingCycle, setBillingCycle] = useState<'annual' | 'monthly'>('annual');

  // Coupon & Discount states (Coupon is completely optional)
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<SubscriptionCoupon | null>(null);
  const [couponBreakdown, setCouponBreakdown] = useState<{
    originalAmount: number;
    discountPercentage: number;
    discountAmount: number;
    finalPrice: number;
  } | null>(null);
  const [couponFeedback, setCouponFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [mismatchPlanSuggestion, setMismatchPlanSuggestion] = useState<{
    requiredPlanId: string;
    requiredPlanName: string;
  } | null>(null);

  const handleApplyCoupon = async (explicitCode?: string) => {
    const code = (explicitCode !== undefined ? explicitCode : couponCodeInput).trim();
    if (!code) return;
    setIsValidatingCoupon(true);
    setCouponFeedback(null);
    setMismatchPlanSuggestion(null);
    try {
      const res = await subscriptionService.validateCoupon(
        code,
        formData.email,
        chosenPlan,
        billingCycle,
        formData.accountType
      );
      if (res.valid && res.coupon) {
        setAppliedCoupon(res.coupon);
        setCouponBreakdown({
          originalAmount: res.originalAmount,
          discountPercentage: res.discountPercentage,
          discountAmount: res.discountAmount,
          finalPrice: res.finalPrice
        });
        setCouponFeedback({ type: 'success', message: res.message });
      } else {
        setAppliedCoupon(null);
        setCouponBreakdown(null);
        setCouponFeedback({ type: 'error', message: res.message });
        if (res.planMismatch && res.requiredPlanId) {
          setMismatchPlanSuggestion({
            requiredPlanId: res.requiredPlanId,
            requiredPlanName: res.requiredPlanName || res.requiredPlanId
          });
        }
      }
    } catch (err: any) {
      setCouponFeedback({ type: 'error', message: err.message || 'Failed to validate coupon code.' });
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponBreakdown(null);
    setCouponCodeInput('');
    setCouponFeedback(null);
    setMismatchPlanSuggestion(null);
  };

  const handleSwitchToRequiredPlan = (planId: string) => {
    const matched = allPlans.find(p => p.id === planId);
    if (matched) {
      setChosenPlan(matched);
      setMismatchPlanSuggestion(null);
      setTimeout(() => {
        handleApplyCoupon(couponCodeInput);
      }, 100);
    }
  };

  // Automatically recalculate coupon discount if user changes chosen plan or billing cycle
  useEffect(() => {
    if (appliedCoupon) {
      handleApplyCoupon(appliedCoupon.code);
    }
  }, [chosenPlan, billingCycle]);

  const [formData, setFormData] = useState({
    accountType: 'Vendor' as 'Vendor' | 'Installer',
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    companyLogo: '',
    doorNo: '',
    companyAddress: '',
    city: '',
    state: 'Telangana',
    pincode: '',
    gstin: '',
    latitude: '',
    longitude: ''
  });

  const [loading, setLoading] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setFormData(prev => ({ ...prev, companyLogo: evt.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Reverse Geocoding: Coordinates (Lat/Lon) -> Detailed Address
  const fetchAddressFromCoords = async (lat: number, lon: number) => {
    setIsDetectingLocation(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
      const data = await res.json();
      if (data && data.address) {
        const addr = data.address;
        const door = addr.house_number || addr.building || addr.unit || addr.house || '';
        const street = [addr.road, addr.suburb, addr.neighbourhood, addr.industrial].filter(Boolean).join(', ') || data.display_name?.split(',')[0] || '';
        const city = addr.city || addr.town || addr.village || addr.county || addr.district || '';
        const state = addr.state || 'Telangana';
        const postcode = addr.postcode || '';

        setFormData(prev => ({
          ...prev,
          latitude: lat.toFixed(6),
          longitude: lon.toFixed(6),
          doorNo: door || prev.doorNo,
          companyAddress: street || prev.companyAddress,
          city: city || prev.city,
          state: state || prev.state,
          pincode: postcode || prev.pincode
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          latitude: lat.toFixed(6),
          longitude: lon.toFixed(6)
        }));
      }
    } catch (err) {
      console.warn('Reverse geocoding error:', err);
    } finally {
      setIsDetectingLocation(false);
    }
  };

  // Auto-Detect Current GPS Location
  const handleDetectCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.warning('Geolocation is not supported by your browser.', 'Location Error');
      return;
    }

    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        fetchAddressFromCoords(latitude, longitude);
      },
      (err) => {
        setIsDetectingLocation(false);
        console.warn('Geolocation failed:', err.message);
        toast.warning('Could not detect location automatically. Please type in your address.', 'GPS Permission Required');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName || !formData.email || !formData.contactPerson || !formData.phone || !formData.password) {
      setErrorMessage('Please fill in all required company fields.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }
    if (formData.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }
    setErrorMessage('');
    setActiveStep(2);
  };

  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      // 1. Create Auth User & User Document
      const assignedRole = formData.accountType === 'Installer' ? 'Installer' : 'Vendor';
      const userProfile = await authService.register(
        formData.email,
        formData.password,
        formData.contactPerson,
        assignedRole,
        formData.companyName
      );

      // 2. Initialize Subscription & Free Trial (Coupon Code is strictly optional)
      await subscriptionService.registerVendorSubscription({
        uid: userProfile.uid,
        companyName: formData.companyName,
        contactPerson: formData.contactPerson,
        email: formData.email,
        phone: formData.phone,
        companyLogo: formData.companyLogo,
        doorNo: formData.doorNo,
        companyAddress: formData.companyAddress,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        gstin: formData.gstin,
        latitude: formData.latitude,
        longitude: formData.longitude,
        plan: chosenPlan,
        billingCycle,
        accountType: formData.accountType,
        couponCode: appliedCoupon?.code
      });

      toast.success(
        `🎉 ${formData.accountType === 'Installer' ? 'Solar Installer Contractor' : 'Equipment Vendor'} Account registered successfully! Free Trial for ${chosenPlan.name} (${billingCycle === 'annual' ? 'Annual Plan' : 'Monthly Plan'}${appliedCoupon ? ` with ${appliedCoupon.code} discount` : ''}) is now active.`,
        'Account Registered'
      );
      onSuccess();
    } catch (err: any) {
      console.error('Registration error:', err);
      const msg = err.message || 'Failed to complete registration.';
      setErrorMessage(msg);
      toast.error(msg, 'Registration Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div>
            <span className="px-3 py-0.5 bg-emerald-500/10 text-emerald-400 text-xs font-black rounded-full border border-emerald-500/20 uppercase tracking-widest">
              Step {activeStep} of 2 • Vendor Registration
            </span>
            <h2 className="text-xl font-black text-white mt-1">
              {activeStep === 1 ? 'Enter Company & Contact Details' : 'Select Subscription Plan & 7-Day Free Trial'}
            </h2>
          </div>

          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs font-bold text-red-400 flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: VENDOR & INSTALLER DETAILS FORM */}
        {activeStep === 1 && (
          <form onSubmit={handleNextStep} className="p-6 space-y-4 overflow-y-auto flex-1 font-sans">
            {/* Account Role Selector */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Select Registration Category</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, accountType: 'Vendor' }))}
                  className={cn(
                    "p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer text-xs font-bold",
                    formData.accountType === 'Vendor' 
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md" 
                      : "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800"
                  )}
                >
                  <Building2 className="w-5 h-5" />
                  <span>🏢 Solar Supplier</span>
                  <span className="text-[10px] font-normal text-slate-400">POs, Stock & Hardware Supply</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, accountType: 'Installer' }))}
                  className={cn(
                    "p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer text-xs font-bold",
                    formData.accountType === 'Installer' 
                      ? "bg-teal-500/20 text-teal-300 border-teal-500/50 shadow-md" 
                      : "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800"
                  )}
                >
                  <Wrench className="w-5 h-5" />
                  <span>🔧 Solar Installer</span>
                  <span className="text-[10px] font-normal text-slate-400">Projects, Site Survey & Installation</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">{formData.accountType === 'Installer' ? 'Solar Installer Agency Name *' : 'Solar Supplier Company Name *'}</label>
                <div className="relative flex items-center">
                  <Building2 className="w-4 h-4 absolute left-3 text-slate-500" />
                  <input
                    required
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder={formData.accountType === 'Installer' ? 'e.g. Apex Solar Field Installers' : 'e.g. Vikram Solar Services'}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-white placeholder-slate-500 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-300 uppercase">Company Logo (Optional)</label>
                  {formData.companyLogo && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, companyLogo: '' }))}
                      className="text-[10px] text-red-400 hover:text-red-300 font-bold underline cursor-pointer"
                    >
                      ✕ Remove Logo
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-slate-800 file:text-emerald-400 hover:file:bg-slate-700 cursor-pointer"
                  />
                  {formData.companyLogo ? (
                    <div className="w-10 h-10 rounded-xl border border-emerald-500/40 bg-slate-900 p-1 shrink-0 flex items-center justify-center relative group">
                      <img src={formData.companyLogo} alt="Logo Preview" className="max-h-full max-w-full object-contain" />
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-semibold shrink-0">No logo uploaded</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Contact Person Name *</label>
                <div className="relative flex items-center">
                  <User className="w-4 h-4 absolute left-3 text-slate-500" />
                  <input
                    required
                    type="text"
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleChange}
                    placeholder="e.g. Rajesh Sharma"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-white placeholder-slate-500 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Business Email Address *</label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 absolute left-3 text-slate-500" />
                  <input
                    required
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="vendor@company.com"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-white placeholder-slate-500 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Phone Number *</label>
                <div className="relative flex items-center">
                  <Phone className="w-4 h-4 absolute left-3 text-slate-500" />
                  <input
                    required
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-white placeholder-slate-500 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Vendor Official Address Section */}
              <div className="sm:col-span-2 p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                  <span className="text-[11px] font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    Official Vendor Registered Address & Tax Details
                  </span>

                  <button
                    type="button"
                    onClick={handleDetectCurrentLocation}
                    disabled={isDetectingLocation}
                    className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-[11px] font-black rounded-xl hover:from-emerald-400 hover:to-teal-400 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10 cursor-pointer disabled:opacity-50 shrink-0"
                    title="Auto-detect current GPS location and fetch full street address details"
                  >
                    {isDetectingLocation ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Fetching Address...
                      </>
                    ) : (
                      <>
                        <LocateFixed className="w-3.5 h-3.5" /> 📍 Drop Pin / Auto-Detect Location
                      </>
                    )}
                  </button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Door / Plot / Flat No. *</label>
                    <input
                      required
                      type="text"
                      name="doorNo"
                      value={formData.doorNo}
                      onChange={handleChange}
                      placeholder="e.g. H.No: 4-12/A, Plot 45"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono font-bold text-emerald-400 placeholder-slate-500 focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Street Address & Area Landmark *</label>
                    <input
                      required
                      type="text"
                      name="companyAddress"
                      value={formData.companyAddress}
                      onChange={handleChange}
                      placeholder="e.g. Phase 3, Industrial Development Park"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-medium text-white placeholder-slate-500 focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">City / District *</label>
                    <input
                      required
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="e.g. Hyderabad"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-medium text-white placeholder-slate-500 focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">State *</label>
                    <select
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-white outline-none focus:border-emerald-500"
                    >
                      <option value="Telangana">Telangana</option>
                      <option value="Andhra Pradesh">Andhra Pradesh</option>
                      <option value="Maharashtra">Maharashtra</option>
                      <option value="Karnataka">Karnataka</option>
                      <option value="Gujarat">Gujarat</option>
                      <option value="Tamil Nadu">Tamil Nadu</option>
                      <option value="Delhi">Delhi NCR</option>
                      <option value="Rajasthan">Rajasthan</option>
                      <option value="Uttar Pradesh">Uttar Pradesh</option>
                      <option value="Madhya Pradesh">Madhya Pradesh</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">PIN Code *</label>
                    <input
                      required
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                      placeholder="e.g. 500032"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-medium text-white placeholder-slate-500 focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">GSTIN Number (For 70:30 Tax Invoices)</label>
                  <input
                    type="text"
                    name="gstin"
                    value={formData.gstin}
                    onChange={handleChange}
                    placeholder="e.g. 36AAACV1234F1Z9"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono font-bold text-emerald-400 placeholder-slate-500 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Password *</label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 absolute left-3 text-slate-500" />
                  <input
                    required
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-white placeholder-slate-500 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Confirm Password *</label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 absolute left-3 text-slate-500" />
                  <input
                    required
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-white placeholder-slate-500 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <button type="button" onClick={onClose} className="px-5 py-2.5 bg-slate-800 text-slate-300 font-extrabold text-xs rounded-xl hover:bg-slate-700 transition-colors">
                Cancel
              </button>
              <button type="submit" className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs rounded-xl hover:from-emerald-400 hover:to-teal-400 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20">
                Continue to Subscription Plan
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: SELECT SUBSCRIPTION PLAN */}
        {activeStep === 2 && (
          <form onSubmit={handleCompleteRegistration} className="p-6 space-y-6 overflow-y-auto flex-1 font-sans">
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="block text-xs font-extrabold text-slate-300 uppercase">
                  Select Subscription Plan
                </label>

                {/* Annual vs Monthly Billing Switch */}
                <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setBillingCycle('annual')}
                    className={cn(
                      "px-3 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1 cursor-pointer",
                      billingCycle === 'annual'
                        ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                        : "text-slate-400 hover:text-white"
                    )}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                    Annual (Save 20%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingCycle('monthly')}
                    className={cn(
                      "px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer",
                      billingCycle === 'monthly'
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                        : "text-slate-400 hover:text-white"
                    )}
                  >
                    Monthly
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                {allPlans.map(plan => {
                  const isSelected = chosenPlan.id === plan.id;
                  const monthlyRate = plan.priceMonthly || 4999;
                  const annualRate = plan.priceAnnual ?? Math.round(monthlyRate * 12 * 0.8);
                  const effectiveMonthly = Math.round(annualRate / 12);
                  const discountPercent = plan.annualDiscountPercentage ?? 20;

                  return (
                    <div
                      key={plan.id}
                      onClick={() => setChosenPlan(plan)}
                      className={`cursor-pointer p-4 rounded-2xl border transition-all ${
                        isSelected
                          ? 'bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/20'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-black text-white">{plan.name}</h4>
                        {isSelected && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
                      </div>

                      {billingCycle === 'annual' ? (
                        <div className="mt-2">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-xl font-black text-white">₹{annualRate.toLocaleString()}</span>
                            <span className="text-[10px] text-slate-400 font-bold">/ year</span>
                            <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-[9px] font-black rounded-full uppercase ml-auto">
                              Save {discountPercent}%
                            </span>
                          </div>
                          <p className="text-[10px] text-emerald-400 font-bold mt-0.5">
                            Effective ₹{effectiveMonthly.toLocaleString()}/mo billed annually
                          </p>
                        </div>
                      ) : (
                        <div className="mt-2 flex items-baseline gap-1">
                          <span className="text-xl font-black text-white">₹{monthlyRate.toLocaleString()}</span>
                          <span className="text-[10px] text-slate-400 font-bold">/ month</span>
                        </div>
                      )}

                      <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-slate-300 pt-2 border-t border-slate-800">
                        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-emerald-400" /> {plan.userLimit} Users</span>
                        <span className="flex items-center gap-1"><HardDrive className="w-3.5 h-3.5 text-teal-400" /> {plan.storageGBLimit} GB Storage</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Promo / Particular Person Coupon Code Input (Optional) */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-black uppercase text-slate-200 flex items-center gap-1.5">
                    <Gift className="w-3.5 h-3.5 text-emerald-400" />
                    Coupon Code <span className="text-slate-500 font-bold normal-case">(Optional)</span>
                  </span>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                    Have an authorized promo or partner discount code? Enter it below. (Coupons are completely optional)
                  </p>
                </div>
                {appliedCoupon && (
                  <span className="text-[10px] font-black text-emerald-400 uppercase bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1 shrink-0">
                    <CheckCircle2 className="w-3 h-3" /> Coupon Active
                  </span>
                )}
              </div>

              {!appliedCoupon ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Tag className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="e.g. ANNUAL25 or VIP50 (Optional)"
                        value={couponCodeInput}
                        onChange={e => {
                          setCouponCodeInput(e.target.value.toUpperCase());
                          if (couponFeedback) setCouponFeedback(null);
                          if (mismatchPlanSuggestion) setMismatchPlanSuggestion(null);
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleApplyCoupon();
                          }
                        }}
                        className="w-full pl-8 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono font-bold uppercase text-white outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleApplyCoupon()}
                      disabled={isValidatingCoupon || !couponCodeInput.trim()}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs rounded-xl transition-colors shrink-0 disabled:opacity-50 cursor-pointer shadow-sm"
                    >
                      {isValidatingCoupon ? (
                        <span className="flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" /> Verifying...
                        </span>
                      ) : (
                        'Apply Code'
                      )}
                    </button>
                  </div>

                  {couponFeedback && (
                    <p className={cn(
                      "text-[11px] font-bold",
                      couponFeedback.type === 'success' ? "text-emerald-400" : "text-rose-400"
                    )}>
                      {couponFeedback.message}
                    </p>
                  )}

                  {mismatchPlanSuggestion && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between gap-2 mt-2">
                      <div className="text-[11px] text-amber-300 font-semibold">
                        This coupon is exclusive to the <strong className="text-white">{mismatchPlanSuggestion.requiredPlanName}</strong> plan.
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSwitchToRequiredPlan(mismatchPlanSuggestion.requiredPlanId)}
                        className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black rounded-lg cursor-pointer shrink-0 transition-colors"
                      >
                        Switch to {mismatchPlanSuggestion.requiredPlanName}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {/* Dynamic Calculation Breakdown */}
                  <div className="p-3.5 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/30 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-emerald-400" />
                        <div>
                          <span className="text-xs font-black text-emerald-300 font-mono tracking-wide">
                            {appliedCoupon.code}
                          </span>
                          {appliedCoupon.name && (
                            <span className="text-[10px] text-slate-400 ml-1.5 font-semibold">
                              ({appliedCoupon.name})
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-[11px] font-bold text-rose-400 hover:text-rose-300 underline cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-400">
                        <span>Selected Plan ({chosenPlan.name} • {billingCycle === 'annual' ? 'Annual' : 'Monthly'}):</span>
                        <span className="font-bold text-white">₹{couponBreakdown?.originalAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-emerald-400 font-medium">
                        <span>Coupon Discount ({couponBreakdown?.discountPercentage}%):</span>
                        <span className="font-bold">-₹{couponBreakdown?.discountAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-black pt-1.5 border-t border-slate-800 text-white">
                        <span>Final Payable Amount:</span>
                        <span className="text-emerald-400 text-base">
                          ₹{couponBreakdown?.finalPrice.toLocaleString()}
                          <span className="text-[10px] text-slate-400 font-bold ml-1">
                            {billingCycle === 'annual' ? '/year' : '/month'}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {couponFeedback && couponFeedback.type === 'success' && (
                    <p className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {couponFeedback.message}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Trial Banner Confirmation */}
            <div className="p-4 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-emerald-400 uppercase flex items-center gap-1">
                  <Sparkles className="w-4 h-4" /> Free Trial Included • {billingCycle === 'annual' ? 'Annual Plan Selection' : 'Monthly Plan'}
                </span>
                <p className="text-[11px] text-slate-300 font-medium mt-0.5">
                  You will not be charged today. Full access for {chosenPlan.trialDays || 7} days under {chosenPlan.name}.
                </p>
              </div>
              <span className="text-xs font-black bg-emerald-500 text-slate-950 px-3 py-1.5 rounded-xl uppercase shrink-0">
                ₹0 Today
              </span>
            </div>

            <div className="pt-2 flex justify-between gap-3">
              <button
                type="button"
                onClick={() => setActiveStep(1)}
                className="px-5 py-2.5 bg-slate-800 text-slate-300 font-extrabold text-xs rounded-xl hover:bg-slate-700 transition-colors"
              >
                Back to Details
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs rounded-xl hover:from-emerald-400 hover:to-teal-400 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : 'Activate 7-Day Free Trial & Sign Up'}
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
