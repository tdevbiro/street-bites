import React, { useState } from 'react';
import { Mail, Lock, User, Briefcase, UserCircle2, Loader2 } from 'lucide-react';
import { auth } from '../lib/supabase';

interface AuthFormProps {
  onSuccess: () => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ onSuccess }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'customer' | 'owner'>('customer');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        if (!name.trim()) {
          throw new Error('Name is required');
        }
        await auth.signUp(email, password, name, role);
      } else {
        await auth.signIn(email, password);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
      console.error('Auth error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center mx-auto mb-4 shadow-2xl">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-orange-600"
            >
              <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
              <path d="M7 2v20" />
              <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
            </svg>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter">StreetBites</h1>
          <p className="text-white/70 text-sm font-bold mt-2">
            Discover Moving Businesses Nearby
          </p>
        </div>

        {/* Auth Form */}
        <div className="bg-white rounded-[3rem] shadow-2xl p-8">
          {/* Mode Toggle */}
          <div className="flex gap-2 mb-8 bg-orange-50 p-2 rounded-2xl">
            <button
              onClick={() => setMode('signin')}
              className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${
                mode === 'signin'
                  ? 'bg-orange-500 text-white shadow-lg'
                  : 'text-slate-400'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${
                mode === 'signup'
                  ? 'bg-orange-500 text-white shadow-lg'
                  : 'text-slate-400'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name (signup only) */}
            {mode === 'signup' && (
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-100 focus:border-orange-500 outline-none font-bold text-sm"
                  required
                />
              </div>
            )}

            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-100 focus:border-orange-500 outline-none font-bold text-sm"
                required
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-100 focus:border-orange-500 outline-none font-bold text-sm"
                required
                minLength={6}
              />
            </div>

            {/* Role Selection (signup only) */}
            {mode === 'signup' && (
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  I am a...
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('customer')}
                    className={`p-4 rounded-2xl border-2 transition-all ${
                      role === 'customer'
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-slate-100 bg-white'
                    }`}
                  >
                    <UserCircle2 size={24} className={role === 'customer' ? 'text-orange-500' : 'text-slate-300'} />
                    <span className={`block mt-2 font-black text-xs ${role === 'customer' ? 'text-orange-900' : 'text-slate-400'}`}>
                      Customer
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('owner')}
                    className={`p-4 rounded-2xl border-2 transition-all ${
                      role === 'owner'
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-slate-100 bg-white'
                    }`}
                  >
                    <Briefcase size={24} className={role === 'owner' ? 'text-orange-500' : 'text-slate-300'} />
                    <span className={`block mt-2 font-black text-xs ${role === 'owner' ? 'text-orange-900' : 'text-slate-400'}`}>
                      Business Owner
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-100">
                <p className="text-red-600 text-sm font-bold">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-2xl bg-orange-500 text-white font-black uppercase text-sm tracking-wider shadow-lg hover:bg-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  {mode === 'signin' ? 'Signing In...' : 'Creating Account...'}
                </>
              ) : (
                <>{mode === 'signin' ? 'Sign In' : 'Create Account'}</>
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-xs text-slate-400 mt-6">
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              className="text-orange-500 font-black hover:underline"
            >
              {mode === 'signin' ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>

        {/* Demo Info */}
        <div className="mt-6 p-6 bg-white/10 backdrop-blur-sm rounded-3xl border border-white/20">
          <p className="text-white/90 text-xs font-bold text-center">
            🚀 <strong>Demo Mode:</strong> Use any email/password to test the app
          </p>
        </div>
      </div>
    </div>
  );
};
