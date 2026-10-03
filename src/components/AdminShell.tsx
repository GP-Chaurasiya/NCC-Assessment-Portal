'use client';

import React, { useState } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { Navbar } from './Navbar';

interface AdminShellProps {
  user: any;
  children: React.ReactNode;
}

export function AdminShell({ user, children }: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Responsive Admin Sidebar: Off-canvas drawer on mobile/tablet, docked on desktop */}
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Universal Navbar with mobile sidebar toggle */}
        <Navbar
          user={user}
          onMenuToggle={() => setSidebarOpen((prev) => !prev)}
          isMenuOpen={sidebarOpen}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
