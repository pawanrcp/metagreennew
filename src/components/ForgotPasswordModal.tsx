import React, { useState } from 'react';
import { Mail, KeyRound, CheckCircle2, AlertCircle, X, ArrowRight, ArrowLeft, ShieldCheck, Sparkles } from 'lucide-react';
import { authService } from '../services/auth.service';
import { useToast } from '../context/ToastContext';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBackToLogin?: () => void;
  defaultEmail?: string;
}

export default function ForgotPasswordModal({
  isOpen,
  onClose,
  onBackToLogin,
  defaultEmail = ''
}: ForgotPasswordModalProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState(defaultEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Sync default email if opened with different value
  React.useEffect(() => {
    if (defaultEmail && !email) {
      setEmail(defaultEmail);
    }
  }, [defaultEmail]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your registered email address.');
      return;
    }

    setLoading(true);

    try {
      await authService.resetPassword(email.trim());
      setSuccess(true);
      toast.success('Password reset link sent to your email!', 'Email Dispatched');
    } catch (err: any) {
      console.error('Password reset error:', err);
      let errorMsg = 'Failed to send password reset email. Please try again.';

      if (err.code === 'auth/user-not-found') {
        errorMsg = 'No MetaGreen account was found with this email address.';
      } else if (err.code === 'auth/invalid-email') {
        errorMsg = 'Please enter a valid email address format.';
      } else if (err.code === 'auth/missing-email') {
        errorMsg = 'Please enter your email address.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMsg = 'Too many requests. Please wait a moment before trying again.';
      } else if (err.message) {
        errorMsg = err.message;
      }

      setError(errorMsg);
      toast.error(errorMsg, 'Reset Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReturnToLogin = () => {
    if (onBackToLogin) {
      onBackToLogin();
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[220] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 font-sans">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div>
            <span className="px-3 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-black rounded-full border border-emerald-500/20 uppercase tracking-widest flex items-center gap-1">
              <KeyRound className="w-3.5 h-3.5" /> Account Recovery
            </span>
            <h2 className="text-xl font-black text-white mt-1">Forgot Password</h2>
          </div>

          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {success ? (
            <div className="space-y-5 text-center py-2">
              <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto text-emerald-400 shadow-inner">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-base font-black text-white">Reset Link Dispatched</h3>
                <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                  We've sent a password reset link to <span className="text-emerald-400 font-bold">{email}</span>. Please check your inbox (and spam folder) to set a new password.
                </p>
              </div>

              <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800/80 text-left text-[11px] text-slate-400 space-y-1">
                <p className="font-bold text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Security Tip:
                </p>
                <p>The reset link expires in 1 hour. If you didn't receive it, verify your email address and request again.</p>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={handleReturnToLogin}
                  className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Return to Sign In</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSuccess(false);
                    setError('');
                  }}
                  className="w-full py-2 text-[11px] font-bold text-slate-400 hover:text-white transition-colors"
                >
                  Send to a different email
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Enter the email address registered with your MetaGreen account. We'll send you an encrypted link to reset your credentials.
              </p>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs font-bold text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@metagreen.com"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-white placeholder-slate-500 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Quick Demo Reminder Note */}
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                <span className="font-bold text-slate-300 flex items-center gap-1 text-[10px] uppercase tracking-wider">
                  <Sparkles className="w-3 h-3 text-emerald-400" /> Testing Demo Accounts?
                </span>
                <p className="text-[10px] leading-normal text-slate-400">
                  Standard demo credentials are pre-configured:
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
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Send Password Reset Link</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={handleReturnToLogin}
                  className="text-xs font-bold text-slate-400 hover:text-white inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
