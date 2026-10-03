'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  Plus,
  Search,
  Wrench,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { useToast } from '@/components/Toast';
import { ConfirmDialog } from '@/components/ConfirmDialog';

export default function AdminExamsPage() {
  const { success, error } = useToast();
  const [exams, setExams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [deleteExamId, setDeleteExamId] = useState<string | null>(null);
  const [examToDelete, setExamToDelete] = useState<any>(null);

  const loadExams = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = new URL('/api/admin/exams', window.location.origin);
      if (search) url.searchParams.set('search', search);
      if (statusFilter !== 'ALL') url.searchParams.set('status', statusFilter);

      const res = await fetch(url.toString());
      const data = await res.json();
      setExams(data.exams || []);
    } catch {
      error('Failed to load exams');
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, error]);

  useEffect(() => {
    loadExams();
  }, [loadExams]);

  const handleDelete = async () => {
    if (!deleteExamId) return;
    try {
      const res = await fetch(`/api/admin/exams/${deleteExamId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete exam');

      success('Exam deleted successfully');
      setDeleteExamId(null);
      loadExams();
    } catch (err: any) {
      error(err.message);
    }
  };

  const togglePublishStatus = async (exam: any) => {
    const nextStatus = exam.status === 'ACTIVE' ? 'DRAFT' : 'ACTIVE';
    try {
      const res = await fetch(`/api/admin/exams/${exam.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      success(`Exam status updated to ${nextStatus}`);
      loadExams();
    } catch (err: any) {
      error(err.message || 'Failed to toggle status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Examinations & Assessments
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Author, structure, schedule, and publish NCC certificate examinations.
          </p>
        </div>

        <Link
          href="/admin/exams/create"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Exam</span>
        </Link>
      </div>

      {/* Filter bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, exam code, subject..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="DRAFT">Draft</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="COMPLETED">Completed</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      {/* Exams Grid / Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full p-12 text-center text-slate-400 animate-pulse">
            Loading examinations...
          </div>
        ) : exams.length === 0 ? (
          <div className="col-span-full p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            No examinations found. Create your first exam!
          </div>
        ) : (
          exams.map((exam) => (
            <div
              key={exam.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between hover:border-slate-300 transition"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {exam.examCode}
                  </span>
                  <button
                    onClick={() => togglePublishStatus(exam)}
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full border transition ${
                      exam.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        : exam.status === 'DRAFT'
                        ? 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    {exam.status}
                  </button>
                </div>

                <h3 className="mt-3 text-lg font-bold text-slate-900 leading-snug">
                  {exam.title}
                </h3>
                <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                  {exam.description || 'No description provided.'}
                </p>

                <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-xl bg-slate-50">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Duration
                    </span>
                    <span className="font-bold text-slate-800">{exam.duration}m</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Questions
                    </span>
                    <span className="font-bold text-slate-800">{exam.questionCount}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Total Marks
                    </span>
                    <span className="font-bold text-slate-800">{exam.calculatedMarks}</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <Link
                  href={`/admin/exams/${exam.id}/builder`}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs transition"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Visual Builder</span>
                </Link>

                <button
                  onClick={() => {
                    setExamToDelete(exam);
                    setDeleteExamId(exam.id);
                  }}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                  title="Delete Exam"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteExamId)}
        title="Delete Examination"
        message={`Are you sure you want to permanently delete "${examToDelete?.title}"? All sections and student attempts for this exam will be removed.`}
        confirmLabel="Delete Exam"
        isDestructive={true}
        onConfirm={handleDelete}
        onCancel={() => setDeleteExamId(null)}
      />
    </div>
  );
}
