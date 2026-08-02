import React, { useState } from 'react';
import { Sun, Mail, Lock, LogIn } from 'lucide-react';
import { UserRole } from '@/src/types';

interface LoginProps {
  onLogin: (user: { name: string; email: string; role: UserRole }) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('Super Admin');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Dummy logic
    if (email === 'admin@solar.com' && password === 'admin123') {
      onLogin({
        name: 'Super Admin',
        email: 'admin@solar.com',
        role: 'Super Admin',
      });
      return;
    }

    // Generic fallback for testing other roles
    if (email && password.length >= 6) {
      onLogin({
        name: email.split('@')[0],
        email: email,
        role: role,
      });
      return;
    }

    setError('Invalid credentials. Use admin@solar.com / admin123 for Super Admin.');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans text-slate-800">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Sun className="w-10 h-10 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-black text-slate-900 tracking-tight">
          Meta Green
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Sign in to access your dashboard
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-100">
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 font-medium">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 sm:text-sm transition-colors outline-none"
                  placeholder="admin@solar.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 sm:text-sm transition-colors outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Simulate Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="block w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 sm:text-sm outline-none transition-colors"
              >
                <option value="Super Admin">Super Admin</option>
                <option value="Solar Company Admin">Solar Company Admin</option>
                <option value="Regional Manager">Regional Manager</option>
                <option value="Sales Executive">Sales Executive</option>
                <option value="Survey Engineer">Survey Engineer</option>
                <option value="Design Engineer">Design Engineer</option>
                <option value="Procurement Officer">Procurement Officer</option>
                <option value="Warehouse Manager">Warehouse Manager</option>
                <option value="Installer">Installer</option>
                <option value="Project Manager">Project Manager</option>
                <option value="Finance Manager">Finance Manager</option>
                <option value="Customer Support">Customer Support</option>
                <option value="Customer">Customer</option>
                <option value="Vendor">Vendor</option>
                <option value="Auditor">Auditor</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-semibold text-emerald-600 hover:text-emerald-500">
                  Forgot your password?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
              >
                <LogIn className="w-4 h-4" /> Sign in
              </button>
            </div>
            
            <div className="text-center mt-4 text-xs text-slate-500 font-medium bg-slate-50 p-3 rounded-lg border border-slate-100">
              Test super admin with <span className="font-bold text-slate-700">admin@solar.com</span> and <span className="font-bold text-slate-700">admin123</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
