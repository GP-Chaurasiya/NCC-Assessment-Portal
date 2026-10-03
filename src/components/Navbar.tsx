'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, LogOut, Menu, X, ArrowRight, Shield, Award, BookOpen } from 'lucide-react';
import { useToast } from './Toast';
import { NccLogo } from './NccLogo';

interface NavbarProps {
  user?: {
    name: string;
    email: string;
    role: string;
    studentProfile?: { studentId?: string | null };
  } | null;
  onMenuToggle?: () => void;
  isMenuOpen?: boolean;
}

export function Navbar({ user, onMenuToggle, isMenuOpen }: NavbarProps) {
  const router = useRouter();
  const { success, error } = useToast();
  const [internalMobileMenuOpen, setInternalMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      success('Logged out successfully');
      router.push('/login');
      router.refresh();
    } catch {
      error('Failed to logout');
    }
  };

  return (
    <header className="ncc-navbar bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* Authentic NCC Tri-Service Top Accent Ribbon */}
      <div className="h-1 w-full ncc-tri-stripe" />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        {/* Left Section: Mobile Menu Trigger (if provided) + Brand Logo & Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {onMenuToggle && (
            <button
              onClick={onMenuToggle}
              className="lg:hidden p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
              aria-label="Toggle navigation drawer"
            >
              {isMenuOpen ? <X className="w-5 h-5 text-[#B71C1C]" /> : <Menu className="w-5 h-5" />}
            </button>
          )}

          <Link
            href={user ? (user.role === 'ADMIN' ? '/admin' : '/student') : '/'}
            className="flex items-center gap-2.5 sm:gap-3 group min-w-0"
          >
            <div className="shrink-0">
              <NccLogo size={38} priority />
            </div>
            <div className="min-w-0">
              <span className="ncc-nav-title font-bold text-[#0B2545] tracking-tight text-sm sm:text-base md:text-lg block leading-tight truncate group-hover:text-[#133E87] transition">
                NCC Cadet Assessment
              </span>
              <span className="ncc-nav-subtitle text-[9px] sm:text-[10px] text-[#4A90E2] font-semibold tracking-wider uppercase block mt-0.5 truncate">
                National Cadet Corps Portal
              </span>
            </div>
          </Link>
        </div>

        {/* Right Section: Actions & Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {user ? (
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="text-right hidden sm:block max-w-[180px]">
                <div className="ncc-nav-username text-sm font-semibold text-[#0B2545] leading-tight truncate">
                  {user.name}
                </div>
                <div className="ncc-nav-role text-xs text-slate-500 flex items-center justify-end gap-1.5 mt-0.5">
                  <span
                    className={`inline-block w-2 h-2 rounded-full shrink-0 ${
                      user.role === 'ADMIN' ? 'bg-[#133E87]' : 'bg-[#D4AF37]'
                    }`}
                  />
                  <span className="font-medium text-slate-600 truncate">
                    {user.role === 'ADMIN'
                      ? 'Administrator / ANO'
                      : user.studentProfile?.studentId || 'Cadet'}
                  </span>
                </div>
              </div>

              {/* Mobile Compact User Pill */}
              <div className="sm:hidden flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-[#0B2545]">
                <span
                  className={`inline-block w-2 h-2 rounded-full shrink-0 ${
                    user.role === 'ADMIN' ? 'bg-[#133E87]' : 'bg-[#D4AF37]'
                  }`}
                />
                <span className="truncate max-w-[80px]">
                  {user.role === 'ADMIN' ? 'Admin' : (user.studentProfile?.studentId || 'Cadet')}
                </span>
              </div>

              <button
                onClick={handleLogout}
                title="Logout"
                className="ncc-nav-logout p-2 text-slate-500 hover:text-[#B71C1C] hover:bg-rose-50 rounded-xl transition"
                aria-label="Log out"
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-3">
              <Link
                href="/login"
                className="ncc-nav-link text-xs sm:text-sm font-semibold text-[#0B2545] hover:text-[#133E87] px-2.5 sm:px-3 py-2 transition"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="text-xs sm:text-sm font-semibold bg-[#B71C1C] hover:bg-[#9B1414] text-white px-3 sm:px-4 py-2 rounded-xl shadow-xs transition whitespace-nowrap"
              >
                <span className="hidden sm:inline">Cadet </span>Registration
              </Link>

              {/* Mobile Dropdown Menu Toggle for Guest */}
              {!onMenuToggle && (
                <button
                  onClick={() => setInternalMobileMenuOpen(!internalMobileMenuOpen)}
                  className="sm:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition"
                  aria-label="Toggle site links"
                >
                  {internalMobileMenuOpen ? (
                    <X className="w-5 h-5 text-[#B71C1C]" />
                  ) : (
                    <Menu className="w-5 h-5" />
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Guest Mobile Collapsible Drawer */}
      {!user && !onMenuToggle && internalMobileMenuOpen && (
        <div className="sm:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3 shadow-lg animate-in slide-in-from-top-2 duration-150">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">
            Navigation
          </div>
          <Link
            href="/"
            onClick={() => setInternalMobileMenuOpen(false)}
            className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <span>Home Portal</span>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </Link>
          <Link
            href="/login?role=student"
            onClick={() => setInternalMobileMenuOpen(false)}
            className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-[#B71C1C] bg-rose-50/50 hover:bg-rose-50 transition"
          >
            <span>Cadet (Student) Login</span>
            <ArrowRight className="w-4 h-4 text-[#B71C1C]" />
          </Link>
          <Link
            href="/login?role=admin"
            onClick={() => setInternalMobileMenuOpen(false)}
            className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-[#133E87] bg-blue-50/50 hover:bg-blue-50 transition"
          >
            <span>Admin / Officer Login</span>
            <ArrowRight className="w-4 h-4 text-[#133E87]" />
          </Link>
          <Link
            href="/register"
            onClick={() => setInternalMobileMenuOpen(false)}
            className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#B71C1C] hover:bg-[#9B1414] transition"
          >
            <span>Cadet Registration</span>
            <ArrowRight className="w-4 h-4 text-white" />
          </Link>
        </div>
      )}
    </header>
  );
}
