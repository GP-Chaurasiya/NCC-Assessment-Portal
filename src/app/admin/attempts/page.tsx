'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ClipboardList,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  AlertTriangle,
  FileCheck2,
} from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function AdminAttemptsPage() {
  const { error } = useToast();
  const [attempts, setAttempts] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [selectedExamId, setSelectedExamId] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = new URL('/api/admin/attempts', window.location.origin);
      if (search) url.searchParams.set('search', search);
      if (selectedExamId !== 'ALL') url.searchParams.set('examId', selectedExamId);
      if (statusFilter !== 'ALL') url.searchParams.set('status', statusFilter);

      const [attRes, exRes] = await Promise.all([
        fetch(url.toString()),
        fetch('/api/admin/exams'),
      ]);

      const attData = await attRes.json();
      const exData = await exRes.json();

      setAttempts(attData.attempts || []);
      setExams(exData.exams || []);
    } catch {
      error('Failed to load exam attempts');
    } finally {
      setIsLoading(false);
    }
  }, [search, selectedExamId, statusFilter, error]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Exam Attempts & Submissions
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Review cadet submissions, verify auto-submission timestamps, and evaluate descriptive questions.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cadet or exam..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Examinations</option>
            {exams.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="EVALUATED">Evaluated</option>
            <option value="SUBMITTED">Submitted (Pending Review)</option>
            <option value="IN_PROGRESS">In Progress</option>
          </select>
        </div>
      </div>

      {/* Attempts Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 animate-pulse">Loading attempts...</div>
        ) : attempts.length === 0 ? (
          <div className="p-12 text-center text-slate-400">No attempts found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Cadet</th>
                  <th className="px-6 py-3.5">Examination</th>
                  <th className="px-6 py-3.5">Submission Method</th>
                  <th className="px-6 py-3.5">Duration</th>
                  <th className="px-6 py-3.5">Score</th>
                  <th className="px-6 py-3.5">Result</th>
                  <th className="px-6 py-3.5 text-right">Evaluation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attempts.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{att.studentName}</div>
                      <div className="text-xs text-slate-400">{att.cadetRollNo}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{att.examTitle}</div>
                      <div className="text-xs font-mono text-slate-400">{att.examCode}</div>
                    </td>
                    <td className="px-6 py-4">
                      {att.submissionMethod === 'AUTO_TAB_SWITCH' || (att.tabSwitchViolations && att.tabSwitchViolations >= 3) ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                            Auto Submit — Tab Switch ({att.tabSwitchViolations || 3} Violations)
                          </span>
                          {att.terminationReason && (
                            <p className="text-[11px] text-red-600 max-w-xs line-clamp-1" title={att.terminationReason}>
                              {att.terminationReason}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                              att.submissionMethod === 'AUTO_EXPIRED'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            {att.submissionMethod === 'AUTO_EXPIRED'
                              ? 'Auto Submit — Time Expired'
                              : 'Manual Submit'}
                          </span>
                          {att.tabSwitchViolations > 0 && (
                            <span className="block text-[11px] text-amber-600 font-medium">
                              ⚠️ {att.tabSwitchViolations} Tab Switch Warning{att.tabSwitchViolations > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-600">
                      {att.durationMinutes ? `${att.durationMinutes} mins` : 'Active'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-900">
                        {att.totalScore} / {att.examTotalMarks}
                      </span>
                      <span className="block text-xs text-slate-400">{att.percentage}%</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          att.isPassed
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {att.isPassed ? 'Passed' : 'Failed'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/attempts/${att.id}/evaluate`}
                        className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl transition ${
                          att.pendingEvaluationsCount > 0
                            ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs'
                            : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
                        }`}
                      >
                        {att.pendingEvaluationsCount > 0 ? (
                          <>
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Grade ({att.pendingEvaluationsCount})</span>
                          </>
                        ) : (
                          <>
                            <FileCheck2 className="w-3.5 h-3.5" />
                            <span>Review</span>
                          </>
                        )}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
