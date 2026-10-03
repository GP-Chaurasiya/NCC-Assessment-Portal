import React from 'react';
import { AdminShell } from '@/components/AdminShell';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session || session.role !== 'ADMIN') {
    redirect('/login');
  }

  return <AdminShell user={session}>{children}</AdminShell>;
}
