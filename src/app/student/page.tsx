'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  Clock,
  Award,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Shield,
  Layers,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function StudentDashboardPage() {
  const { error } = useToast();
  const [exams, setExams] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [eRes, uRes] = await Promise.all([
          fetch('/api/student/exams'),
          fetch('/api/auth/me'),
        ]);

        const eData = await eRes.json();
        const uData = await uRes.json();

        setExams(eData.exams || []);
        setUser(uData.user);
      } catch {
        error('Failed to load student dashboard');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [error]);

  if (isLoading) {
    return <div className="p-12 text-center text-slate-400 dark:text-slate-500 animate-pulse">Loading cadet portal...</div>;
  }

  const profile = user?.studentProfile;
  const activeExam = exams.find((e) => e.hasActiveAttempt);

  return (
    <div className="space-y-8">
      {/* Cadet Welcome Profile Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-850 to-indigo-950 text-white border border-slate-700/50 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold tracking-widest text-indigo-400">
                Cadet Profile
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-xs text-emerald-400 font-semibold">Active Enrollment</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-white">
              {user?.name}
            </h1>
            <p className="text-xs text-slate-300 font-mono mt-1">
              Regimental No: <span className="font-bold text-white">{profile?.studentId || 'N/A'}</span> •{' '}
              {profile?.course || 'Senior Division'}
            </p>
          </div>
        </div>

        {/* Ongoing Attempt Alert Banner */}
        {activeExam && (
          <div className="p-4 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex flex-col sm:flex-row items-center gap-4">
            <div className="text-center sm:text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300 block">
                Ongoing Attempt Detected
              </span>
              <span className="text-sm font-semibold text-white">{activeExam.title}</span>
            </div>
            <Link
              href={`/student/exam/${activeExam.id}/take`}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-md transition flex items-center gap-1.5 shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Resume Exam</span>
            </Link>
          </div>
        )}
      </div>

      {/* Available Examinations Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Assigned & Open Examinations
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Click &apos;Start Examination&apos; to view instructions and start your timed attempt.
          </p>
        </div>

        {exams.length === 0 ? (
          <div className="p-12 text-center text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            No examinations currently scheduled or active for your battalion.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.map((exam) => (
              <div
                key={exam.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/40">
                      {exam.examCode}
                    </span>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                      {exam.subject}
                    </span>
                  </div>

                  <h3 className="mt-3 text-lg font-bold text-slate-900 dark:text-white leading-snug">
                    {exam.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {exam.description || 'Comprehensive NCC assessment.'}
                  </p>

                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                      <span className="text-slate-400 dark:text-slate-400 block text-[10px] uppercase font-semibold">
                        Duration
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-100">{exam.duration}m</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                      <span className="text-slate-400 dark:text-slate-400 block text-[10px] uppercase font-semibold">
                        Questions
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-100">{exam.totalQuestions}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                      <span className="text-slate-400 dark:text-slate-400 block text-[10px] uppercase font-semibold">
                        Total Marks
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-100">{exam.totalMarks}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                  <div>
                    {exam.bestScore !== null ? (
                      <div className="text-xs">
                        <span className="text-slate-400 dark:text-slate-400 font-medium">Best Score: </span>
                        <span
                          className={`font-bold ${
                            exam.isPassed ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {exam.bestScore} ({exam.bestPercentage}%)
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 dark:text-slate-400">Not yet attempted</span>
                    )}
                  </div>

                  {exam.canTake ? (
                    <Link
                      href={
                        exam.hasActiveAttempt
                          ? `/student/exam/${exam.id}/take`
                          : `/student/exam/${exam.id}/instructions`
                      }
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition ${
                        exam.hasActiveAttempt
                          ? 'bg-amber-500 hover:bg-amber-600'
                          : 'bg-indigo-600 hover:bg-indigo-700'
                      }`}
                    >
                      <span>{exam.hasActiveAttempt ? 'Resume' : 'Start Exam'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl">
                      Attempts Exhausted
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
