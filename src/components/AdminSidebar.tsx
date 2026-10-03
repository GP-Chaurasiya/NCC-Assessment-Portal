'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  HelpCircle,
  FolderKanban,
  Upload,
  BarChart3,
  ClipboardList,
  Settings,
  LogOut,
  X,
} from 'lucide-react';
import { useToast } from './Toast';
import { NccLogo } from './NccLogo';

const navItems = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Students', href: '/admin/students', icon: Users },
  { name: 'Exams', href: '/admin/exams', icon: GraduationCap },
  { name: 'Questions', href: '/admin/questions', icon: HelpCircle },
  { name: 'Question Bank', href: '/admin/question-bank', icon: FolderKanban },
  { name: 'Upload Paper', href: '/admin/upload-paper', icon: Upload },
  { name: 'Results', href: '/admin/results', icon: BarChart3 },
  { name: 'Exam Attempts', href: '/admin/attempts', icon: ClipboardList },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function AdminSidebar({ isOpen = false, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { success, error } = useToast();

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
    <>
      {/* Mobile Drawer Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-200"
          aria-label="Close menu overlay"
        />
      )}

      {/* Sidebar element: docked on large screens, off-canvas animated drawer on mobile/tablet */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 lg:w-64 bg-white text-slate-700 flex flex-col shrink-0 border-r border-slate-200 min-h-screen transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Tri-Service Top Accent Ribbon */}
        <div className="h-1 w-full ncc-tri-stripe" />

        {/* Brand Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-white transition-colors duration-200">
          <div className="flex items-center gap-3">
            <NccLogo size={42} priority />
            <div>
              <div className="font-bold text-slate-900 text-base tracking-tight leading-none">
                NCC Directorate
              </div>
              <div className="text-[11px] text-[#133E87] font-semibold uppercase tracking-wider mt-1">
                Exam & Question Bank
              </div>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Nav List */}
        <nav className="flex-1 p-3 sm:p-4 space-y-1 sm:space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#133E87] text-white shadow-md shadow-[#133E87]/20 border-l-4 border-[#4A90E2]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#D4AF37]' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer & Logout */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50 transition-colors duration-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 transition"
          >
            <LogOut className="w-4 h-4 shrink-0 text-[#B71C1C]" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
