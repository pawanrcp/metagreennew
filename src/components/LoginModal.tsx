import React, { useState } from 'react';
import { Mail, Lock, Sparkles, X, ShieldCheck, AlertCircle, ArrowRight, ArrowLeft, Building2, UserCheck, KeyRound, CheckCircle2 } from 'lucide-react';
import { authService } from '@/src/services/auth.service';

interface LoginModalProps {
  onClose: () => void;
  onSuccess: () => void;
  onOpenSignUp: () => void;
}

export default function LoginModal({ onClose, onSuccess, onOpenSignUp }: LoginModalProps) {
  const [loginType, setLoginType] = useState<'admin' | 'vendor' | 'installer'>('admin');
  const [email, setEmail] = useState('admin@solar.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Forgot Password State
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState('');

  const handleTabSwitch = (type: 'admin' | 'vendor' | 'installer') => {
    setLoginType(type);
    setError('');
    if (type === 'admin') {
      setEmail('admin@solar.com');
      setPassword('admin123');
    } else if (type === 'vendor') {
      setEmail('vendor@vikramsolar.com');
      setPassword('vendor123');
    } else {
      setEmail('installer@solar.com');
      setPassword('installer123');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (loginType === 'admin') {
        await authService.loginDemoUser('admin');
      } else if (loginType === 'vendor') {
        await authService.loginDemoUser('vendor');
      } else if (loginType === 'installer') {
        await authService.loginDemoUser('installer');
      } else {
        await authService.login(email, password);
      }
      onSuccess();
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError('');
    setResetSuccess(false);

    if (!resetEmail.trim()) {
      setResetError('Please enter your registered email address.');
      setResetLoading(false);
      return;
    }

    try {
      await authService.resetPassword(resetEmail.trim());
      setResetSuccess(true);
    } catch (err: any) {
      console.error('Password reset error:', err);
      let errorMsg = 'Failed to send password reset email. Please try again.';
      if (err.code === 'auth/user-not-found') {
        errorMsg = 'No MetaGreen account found with this email address.';
      } else if (err.code === 'auth/invalid-email') {
        errorMsg = 'Please enter a valid email address.';
      } else if (err.code === 'auth/missing-email') {
        errorMsg = 'Please enter your email address.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMsg = 'Too many requests. Please wait a moment before trying again.';
      } else if (err.message) {
        errorMsg = err.message;
      }
      setResetError(errorMsg);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 font-sans">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div>
            <span className="px-3 py-0.5 bg-emerald-500/10 text-emerald-400 text-xs font-black rounded-full border border-emerald-500/20 uppercase tracking-widest flex items-center gap-1">
              {isForgotPassword ? (
                <>
                  <KeyRound className="w-3 h-3" /> Account Recovery
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3 h-3" /> Dedicated Sign In Portal
                </>
              )}
            </span>
            <h2 className="text-xl font-black text-white mt-1">
              {isForgotPassword ? 'Reset Your Password' : 'Sign In to Meta Green'}
            </h2>
          </div>

          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isForgotPassword ? (
          /* Forgot Password Recovery View */
          <div className="p-6">
            {resetSuccess ? (
              <div className="space-y-4 text-center py-2">
                <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto text-emerald-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Reset Link Dispatched</h3>
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                    We've sent a secure password reset link to <span className="text-emerald-400 font-bold">{resetEmail}</span>. Please check your inbox (and spam folder) to set a new password.
                  </p>
                </div>

                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 text-left text-[11px] text-slate-400 space-y-1">
                  <p className="font-bold text-slate-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Security Tip:
                  </p>
                  <p>The reset link expires in 1 hour. Follow the instructions in the email to regain account access.</p>
                </div>

                <div className="pt-2 space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(false);
                      setResetSuccess(false);
                    }}
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Return to Sign In</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setResetSuccess(false);
                      setResetError('');
                    }}
                    className="w-full py-1.5 text-[11px] font-bold text-slate-400 hover:text-white transition-colors"
                  >
                    Send to a different email
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Enter your registered email address and we'll send you an encrypted link to reset your account credentials.
                </p>

                {resetError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs font-bold text-red-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{resetError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Registered Email Address *
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 absolute left-3 text-slate-500" />
                    <input
                      required
                      type="email"
                      value={resetEmail}
                      onChange={e => setResetEmail(e.target.value)}
                      placeholder="user@metagreen.com"
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-white placeholder-slate-500 focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Instant Demo Accounts Reminder */}
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                  <span className="font-bold text-slate-300 flex items-center gap-1 text-[10px] uppercase tracking-wider">
                    <Sparkles className="w-3 h-3 text-emerald-400" /> Instant Demo Access?
                  </span>
                  <p className="text-[10px] leading-normal text-slate-400">
                    If testing demo roles, passwords are pre-configured:
                    <br />
                    • Admin: <span className="text-slate-200 font-mono">admin@solar.com</span> (<span className="text-emerald-400 font-mono">admin123</span>)
                    <br />
                    • Vendor: <span className="text-slate-200 font-mono">vendor@vikramsolar.com</span> (<span className="text-amber-400 font-mono">vendor123</span>)
                    <br />
                    • Installer: <span className="text-slate-200 font-mono">installer@solar.com</span> (<span className="text-teal-400 font-mono">installer123</span>)
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {resetLoading ? (
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Send Password Reset Link</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="pt-1 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(false);
                      setResetError('');
                    }}
                    className="text-xs font-bold text-slate-400 hover:text-white inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Sign In</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          /* Standard Sign In View */
          <>
            {/* Separate Login Type Tabs */}
            <div className="p-2 bg-slate-950/60 border-b border-slate-800 flex gap-1.5 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => handleTabSwitch('admin')}
                className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap ${
                  loginType === 'admin' 
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-black' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>👑 Global Admin</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabSwitch('vendor')}
                className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap ${
                  loginType === 'vendor' 
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>🏢 Vendor</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabSwitch('installer')}
                className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap ${
                  loginType === 'installer' 
                    ? 'bg-teal-500 text-slate-950 shadow-md font-black' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>🔧 Installer</span>
              </button>
            </div>

            {error && (
              <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs font-bold text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-0.5">
                <span className="text-[10px] font-black uppercase text-slate-400">Selected Portal Access</span>
                <p className="text-xs font-black text-white">
                  {loginType === 'admin' 
                    ? '👑 Meta Green Global HQ Super Admin' 
                    : loginType === 'vendor' 
                      ? '🏢 Solar Vendor & Staff Dispatch Portal' 
                      : '🔧 Lead Solar Field Installer & Contractor Portal'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Registered Email Address *</label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 absolute left-3 text-slate-500" />
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder={loginType === 'admin' ? "admin@solar.com" : loginType === 'vendor' ? "vendor@vikramsolar.com" : "installer@solar.com"}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-white placeholder-slate-500 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-300 uppercase">Password *</label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email);
                      setIsForgotPassword(true);
                      setError('');
                      setResetError('');
                      setResetSuccess(false);
                    }}
                    className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 absolute left-3 text-slate-500" />
                  <input
                    required
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-white placeholder-slate-500 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Authenticating Credentials...' : (loginType === 'admin' ? 'Sign In as Global Admin' : loginType === 'vendor' ? 'Sign In to Vendor Portal' : 'Sign In to Installer Portal')}
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Separate Sign Up Callouts for Vendor and Installer */}
              <div className="pt-3 border-t border-slate-800 space-y-2 text-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Need a New Subscription Account?</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={onOpenSignUp}
                    className="py-2 px-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <span>🏢 Sign Up Vendor</span>
                  </button>

                  <button
                    type="button"
                    onClick={onOpenSignUp}
                    className="py-2 px-3 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <span>🔧 Sign Up Installer</span>
                  </button>
                </div>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
