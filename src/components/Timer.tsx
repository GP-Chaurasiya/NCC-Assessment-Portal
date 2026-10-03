'use client';

import React, { useEffect, useState } from 'react';
import { Clock, AlertTriangle, AlertOctagon } from 'lucide-react';

interface TimerProps {
  expiresAt: string | Date;
  onExpire?: () => void;
  className?: string;
}

export function Timer({ expiresAt, onExpire, className = '' }: TimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    const end = new Date(expiresAt).getTime();
    const now = Date.now();
    return Math.max(0, Math.floor((end - now) / 1000));
  });

  useEffect(() => {
    const end = new Date(expiresAt).getTime();

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((end - now) / 1000));
      setRemainingSeconds(diff);

      if (diff <= 0) {
        clearInterval(interval);
        if (onExpire) {
          onExpire();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;

  const formattedTime = [
    hours > 0 ? String(hours).padStart(2, '0') : null,
    String(minutes).padStart(2, '0'),
    String(seconds).padStart(2, '0'),
  ]
    .filter(Boolean)
    .join(':');

  // Stages
  const isUrgent = remainingSeconds < 60; // < 1 minute
  const isWarning = remainingSeconds < 300 && !isUrgent; // < 5 minutes

  return (
    <div
      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono text-base font-bold shadow-xs transition-all duration-300 ${
        isUrgent
          ? 'bg-[#B71C1C] text-white animate-urgent shadow-lg shadow-[#B71C1C]/40'
          : isWarning
          ? 'bg-[#D4AF37]/20 text-amber-700 dark:text-amber-300 border border-[#D4AF37]/60'
          : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700'
      } ${className}`}
    >
      {isUrgent ? (
        <AlertOctagon className="w-4 h-4 animate-bounce text-white" />
      ) : isWarning ? (
        <AlertTriangle className="w-4 h-4 text-[#D4AF37]" />
      ) : (
        <Clock className="w-4 h-4 text-[#4A90E2]" />
      )}
      <span>{formattedTime}</span>
      {isUrgent && <span className="text-xs uppercase font-sans tracking-wider font-extrabold">Final Minute!</span>}
    </div>
  );
}
