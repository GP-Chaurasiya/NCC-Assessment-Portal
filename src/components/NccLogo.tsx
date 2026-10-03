'use client';

import React from 'react';
import Image from 'next/image';

interface NccLogoProps {
  className?: string;
  size?: number;
  priority?: boolean;
  variant?: 'badge' | 'plain';
}

export function NccLogo({
  className = '',
  size = 36,
  priority = false,
  variant = 'badge',
}: NccLogoProps) {
  const isBadge = variant === 'badge';

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 overflow-hidden transition-transform ${
        isBadge
          ? 'bg-white rounded-xl p-1 shadow-sm border border-slate-200/80 hover:scale-105'
          : ''
      } ${className}`}
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/ncc-logo.png"
        alt="National Cadet Corps (NCC) Official Logo"
        width={size}
        height={size}
        className="w-full h-full object-contain"
        loading={priority ? 'eager' : 'lazy'}
      />
    </div>
  );
}
