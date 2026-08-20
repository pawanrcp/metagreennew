import React, { useState } from 'react';
import { Mail, Lock, Sparkles, X, ShieldCheck, AlertCircle, ArrowRight, Building2, UserCheck, KeyRound } from 'lucide-react';
import { authService } from '@/src/services/auth.service';

interface LoginModalProps {
  onClose: () => void;
  onSuccess: () => void;
  onOpenSignUp: () => void;
}

export default function LoginModal({ onClose, onSuccess, onOpenSignUp }: LoginModalProps) {
  const [loginType, setLoginType] = useState<'admin' | 'vendor'>('admin');
  const [email, setEmail] = useState('admin@metagreen.com');
  const [password, setPassword] = useState('demo1234');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTabSwitch = (type: 'admin' | 'vendor') => {
    setLoginType(type);
    setError('');
    if (type === 'admin') {
      setEmail('admin@metagreen.com');
      setPassword('demo1234');
    } else {
      setEmail('vendor@vikramsolar.com');
      setPassword('demo1234');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (loginType === 'admin') {
        await authService.loginDemoUser('admin');
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

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 font-sans">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div>
            <span className="px-3 py-0.5 bg-emerald-500/10 text-emerald-400 text-xs font-black rounded-full border border-emerald-500/20 uppercase tracking-widest flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Dedicated Sign In Portal
            </span>
            <h2 className="text-xl font-black text-white mt-1">Sign In to Meta Green</h2>
          </div>

          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Separate Login Type Tabs */}
        <div className="p-2 bg-slate-950/60 border-b border-slate-800 flex gap-2">
          <button
            type="button"
            onClick={() => handleTabSwitch('admin')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              loginType === 'admin' 
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>👑 Global Admin Portal</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabSwitch('vendor')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              loginType === 'vendor' 
                ? 'bg-teal-500 text-slate-950 shadow-md font-black' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>🏪 Vendor & Staff Portal</span>
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
              {loginType === 'admin' ? '👑 Meta Green Global HQ Super Admin' : '🏪 Solar Vendor & Staff Dispatch Portal'}
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
                placeholder={loginType === 'admin' ? "admin@metagreen.com" : "vendor@vikramsolar.com"}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-white placeholder-slate-500 focus:border-emerald-500 outline-none"
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
            {loading ? 'Authenticating Credentials...' : (loginType === 'admin' ? 'Sign In as Global Admin' : 'Sign In to Vendor Portal')}
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="pt-3 text-center text-xs text-slate-400 border-t border-slate-800">
            Don't have a vendor account yet?{' '}
            <button
              type="button"
              onClick={onOpenSignUp}
              className="text-emerald-400 font-extrabold hover:underline cursor-pointer"
            >
              Sign up for 7-Day Free Trial
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
