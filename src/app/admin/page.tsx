'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  GraduationCap,
  HelpCircle,
  Award,
  Plus,
  Upload,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Layers,
  ChevronRight,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch('/api/admin/stats');
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error('Failed to load stats', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const recentAttempts = data?.recentAttempts || [];
  const questionDistribution = data?.questionDistribution || [];

  return (
    <div className="space-y-8">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Directorate Command Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time overview of NCC cadet examinations, question repository, and performance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/upload-paper"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-750 shadow-xs transition"
          >
            <Upload className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>Upload Paper</span>
          </Link>
          <Link
            href="/admin/exams/create"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Exam</span>
          </Link>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Enrolled Cadets
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {stats.totalStudents || 0}
          </div>
          <div className="mt-2 flex items-center text-xs text-slate-500 dark:text-slate-400">
            <Link href="/admin/students" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
              View all cadets →
            </Link>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Active Examinations
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {stats.activeExams || 0}
            <span className="text-sm font-normal text-slate-500 dark:text-slate-400 ml-2">
              / {stats.totalExams || 0} total
            </span>
          </div>
          <div className="mt-2 flex items-center text-xs text-slate-500 dark:text-slate-400">
            <Link href="/admin/exams" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
              Manage exams →
            </Link>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Questions in Bank
            </span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {stats.totalQuestions || 0}
          </div>
          <div className="mt-2 flex items-center text-xs text-slate-500 dark:text-slate-400">
            <Link href="/admin/question-bank" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
              Browse repository →
            </Link>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Pass Rate & Avg Score
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {stats.passPercentage || 0}%
            <span className="text-sm font-normal text-slate-500 dark:text-slate-400 ml-2">
              (Avg {stats.averageScore || 0}%)
            </span>
          </div>
          <div className="mt-2 flex items-center text-xs text-slate-500 dark:text-slate-400">
            <Link href="/admin/results" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
              View analytics →
            </Link>
          </div>
        </div>
      </div>

      {/* Row: Recent Submissions & Question Bank Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Submissions Table */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Recent Exam Attempts</h2>
            <Link
              href="/admin/attempts"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentAttempts.length === 0 ? (
            <div className="text-center py-10 text-slate-400 dark:text-slate-500 text-sm">
              No exam attempts recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
                    <th className="pb-3">Cadet</th>
                    <th className="pb-3">Exam</th>
                    <th className="pb-3">Score</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {recentAttempts.map((att: any) => (
                    <tr key={att.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 font-medium text-slate-900 dark:text-white">
                        {att.student?.name}
                        <span className="block text-xs font-normal text-slate-400 dark:text-slate-500">
                          {att.student?.email}
                        </span>
                      </td>
                      <td className="py-3 text-slate-700 dark:text-slate-300 font-medium">
                        {att.exam?.title}
                      </td>
                      <td className="py-3 font-bold text-slate-800 dark:text-slate-200">
                        {att.totalScore} / {att.exam?.totalMarks}
                        <span className="block text-xs font-normal text-slate-400 dark:text-slate-500">
                          {att.percentage}%
                        </span>
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            att.status === 'EVALUATED' || att.status === 'SUBMITTED'
                              ? att.isPassed
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50'
                                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50'
                              : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50'
                          }`}
                        >
                          {att.status === 'IN_PROGRESS'
                            ? 'In Progress'
                            : att.isPassed
                            ? 'Passed'
                            : 'Failed'}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <Link
                          href={`/admin/attempts/${att.id}/evaluate`}
                          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                        >
                          Review →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Question Type Breakdown */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">Question Archetypes</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Distribution of question types in your reusable bank
            </p>

            <div className="space-y-3">
              {questionDistribution.map((q: any) => (
                <div key={q.type} className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    {q.type.replace('_', ' ')}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                    {q.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Link
              href="/admin/questions"
              className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/40 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Question</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
