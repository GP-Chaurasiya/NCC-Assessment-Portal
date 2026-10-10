'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useToast } from '@/components/Toast';
import { NccLogo } from '@/components/NccLogo';
import { Navbar } from '@/components/Navbar';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();

  const [identifier, setIdentifier] = useState('');
  const [verificationValue, setVerificationValue] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{ userName?: string; message?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier,
          verificationValue,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setIsSuccess(true);
      setSuccessInfo({
        userName: data.userName,
        message: data.message || 'Password updated successfully!',
      });
      toastSuccess('Password reset successfully!');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to reset password');
      toastError(err.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

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

          {/* Right Column: Reset Password Form */}
          <div className="p-6 sm:p-10 lg:p-12 flex flex-col justify-center bg-white">
            <div className="mb-6 sm:mb-8 text-center">
              <div className="flex justify-center mb-3">
                <NccLogo size={56} priority />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B2545] tracking-tight">
                Reset Password
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-500 leading-relaxed">
                Verify your cadet account to establish a new password
              </p>
            </div>

            {isSuccess ? (
              <div className="py-6 text-center space-y-5 animate-in fade-in duration-300">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-200 shadow-sm">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900">
                    Password Reset Complete!
                  </h4>
                  <p className="mt-1 text-xs sm:text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
                    {successInfo.message || 'Your account password has been successfully updated.'}
                  </p>
                </div>

                <div className="pt-2">
                  <Link
                    href="/login"
                    className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#133E87] hover:bg-[#0B2545] text-white font-semibold text-sm shadow-md shadow-[#133E87]/20 transition"
                  >
                    <span>Proceed to Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ) : (
              <div>
                {errorMessage && (
                  <div className="mb-5 flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <form className="space-y-4" onSubmit={handleSubmit} autoComplete="off">
                  {/* Account Identifier */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Email or Username
                    </label>
                    <input
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="e.g. cadet_aarav or student@example.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 text-sm focus:ring-2 focus:ring-[#133E87] focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Cadet Regimental ID or Verification */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Cadet Regimental ID or Email
                      </label>
                    </div>
                    <input
                      type="text"
                      required
                      value={verificationValue}
                      onChange={(e) => setVerificationValue(e.target.value)}
                      placeholder="e.g. NCC-SD-2026-007 or registered email"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 text-sm focus:ring-2 focus:ring-[#133E87] focus:outline-none transition-colors"
                    />
                    <p className="mt-1 text-[11px] text-slate-400">
                      Cadets: enter Roll/Regimental ID or email. Officers: enter registered email.
                    </p>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimum 6 characters"
                        className="w-full px-4 py-2.5 pr-10 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 text-sm focus:ring-2 focus:ring-[#133E87] focus:outline-none transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm New Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Confirm New Password
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 text-sm focus:ring-2 focus:ring-[#133E87] focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 px-4 rounded-xl bg-[#B71C1C] hover:bg-[#9B1414] text-white font-semibold text-sm shadow-md shadow-[#B71C1C]/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <KeyRound className="w-4 h-4" />
                          <span>Update Password</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                <div className="mt-6 flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-100">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 font-semibold text-[#133E87] hover:underline transition"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Sign In</span>
                  </Link>

                  <Link href="/register" className="text-slate-500 hover:text-slate-800 transition">
                    New Cadet Registration
                  </Link>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
