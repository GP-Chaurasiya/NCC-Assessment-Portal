'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { NccLogo } from '@/components/NccLogo';
import { Navbar } from '@/components/Navbar';

function LoginForm() {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.details ? `${data.error}: ${data.details}` : (data.error || 'Authentication failed'));
      }

      success(`Welcome back, ${data.user.name}!`);
      router.push(data.redirectUrl);
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed');
      toastError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {errorMessage && (
        <div className="mb-5 flex items-center gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit} autoComplete="off">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Email or Username
          </label>
          <div className="relative">
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Enter your email or username"
              autoComplete="off"
              className="w-full px-4 py-3 sm:py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 text-base sm:text-sm focus:ring-2 focus:ring-[#133E87] focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              className="w-full px-4 py-3 sm:py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 text-base sm:text-sm focus:ring-2 focus:ring-[#133E87] focus:outline-none transition-colors"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 rounded-xl bg-[#B71C1C] hover:bg-[#9B1414] text-white font-semibold text-sm shadow-md shadow-[#B71C1C]/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isLoading ? (
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span>Sign In to Portal</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center text-xs text-slate-500">
        Are you a new cadet?{' '}
        <Link href="/register" className="font-semibold text-[#133E87] hover:underline transition">
          Register here
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col transition-colors duration-200">
      {/* Universal Navbar */}
      <Navbar user={null} />

      <div className="flex-1 flex items-center justify-center py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl shadow-slate-200/80 border border-slate-200/90 overflow-hidden grid grid-cols-1 md:grid-cols-2">
          
          {/* Left Column: Patriotic Picture */}
          <div className="relative min-h-[300px] md:min-h-[560px] bg-slate-950 overflow-hidden">
            <img
              src="/ncc-rdc.jpg"
              alt="NCC Tri-Service Flags"
              className="absolute inset-0 w-full h-full object-cover object-top"
            />
          </div>

          {/* Right Column: Portal Sign In Form */}
          <div className="p-6 sm:p-10 lg:p-12 flex flex-col justify-center bg-white">
            <div className="mb-6 sm:mb-8 text-center">
              <div className="flex justify-center mb-3">
                <NccLogo size={56} priority />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B2545] tracking-tight">
                NCC Assessment Portal
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-500 leading-relaxed">
                Sign in to access your examinations and administrative tools
              </p>
            </div>

            <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading portal...</div>}>
              <LoginForm />
            </Suspense>
          </div>

        </div>
      </div>
    </div>
  );
}
