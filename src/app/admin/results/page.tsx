'use client';

import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Award,
  Users,
  Download,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
} from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function AdminResultsPage() {
  const { success } = useToast();
  const [stats, setStats] = useState<any>(null);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [sRes, aRes] = await Promise.all([
          fetch('/api/admin/stats'),
          fetch('/api/admin/attempts'),
        ]);
        const sData = await sRes.json();
        const aData = await aRes.json();

        setStats(sData.stats);
        setAttempts(aData.attempts || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleExportCSV = () => {
    if (attempts.length === 0) return;

    const headers = [
      'Cadet Name',
      'Cadet Roll No',
      'Exam Title',
      'Exam Code',
      'Total Score',
      'Percentage',
      'Result',
      'Submission Method',
      'Submitted Date',
    ];

    const rows = attempts.map((a) => [
      `"${a.studentName}"`,
      `"${a.cadetRollNo}"`,
      `"${a.examTitle}"`,
      `"${a.examCode}"`,
      a.totalScore,
      `${a.percentage}%`,
      a.isPassed ? 'Passed' : 'Failed',
      a.submissionMethod,
      a.submittedAt ? new Date(a.submittedAt).toLocaleDateString() : 'N/A',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `NCC_Exam_Results_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    success('CSV results exported successfully!');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Directorate Analytics & Results
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Cadet performance metrics, passing distribution, and result export center.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 shadow-xs transition"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Export Results (CSV)</span>
        </button>
      </div>

      {/* Analytics KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Average Score
          </span>
          <div className="mt-2 text-3xl font-black text-slate-900">{stats?.averageScore || 0}%</div>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Pass Percentage
          </span>
          <div className="mt-2 text-3xl font-black text-emerald-600">
            {stats?.passPercentage || 0}%
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Highest Score
          </span>
          <div className="mt-2 text-3xl font-black text-indigo-600">{stats?.highestScore || 0}%</div>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Submissions
          </span>
          <div className="mt-2 text-3xl font-black text-slate-900">{stats?.totalAttempts || 0}</div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Official Cadet Merit Listing</h2>
          <span className="text-xs text-slate-400">{attempts.length} attempts recorded</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-3.5">Cadet Name</th>
                <th className="px-6 py-3.5">Roll No</th>
                <th className="px-6 py-3.5">Exam</th>
                <th className="px-6 py-3.5">Marks Obtained</th>
                <th className="px-6 py-3.5">Percentage</th>
                <th className="px-6 py-3.5">Pass/Fail</th>
                <th className="px-6 py-3.5 text-right">Method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {attempts.map((att) => (
                <tr key={att.id} className="hover:bg-slate-50/60 transition">
                  <td className="px-6 py-4 font-semibold text-slate-900">{att.studentName}</td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-600">{att.cadetRollNo}</td>
                  <td className="px-6 py-4 font-medium text-slate-700">{att.examTitle}</td>
                  <td className="px-6 py-4 font-bold text-slate-900">{att.totalScore}</td>
                  <td className="px-6 py-4 font-bold text-indigo-600">{att.percentage}%</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                        att.isPassed
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {att.isPassed ? 'PASSED' : 'NOT PASSED'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-right">
                    {att.submissionMethod === 'AUTO_TAB_SWITCH' ? (
                      <span className="inline-flex items-center gap-1 font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                        ⚠️ Auto (Tab Switch)
                      </span>
                    ) : att.submissionMethod === 'AUTO_EXPIRED' ? (
                      <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-medium">
                        Auto (Time Expired)
                      </span>
                    ) : (
                      <span className="text-slate-500 font-medium">Manual Submit</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
