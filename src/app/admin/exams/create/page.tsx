'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Sparkles, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function CreateExamPage() {
  const router = useRouter();
  const { success, error } = useToast();

  const [form, setForm] = useState({
    title: '',
    description: '',
    subject: 'NCC Common Syllabus',
    course: 'Army, Navy & Air Wing Cadets',
    examCode: `NCC-EXAM-${Math.floor(100 + Math.random() * 900)}`,
    startDate: '',
    endDate: '',
    duration: 45,
    totalMarks: 50,
    passingMarks: 25,
    negativeMarking: 0.25,
    randomizeQuestions: false,
    randomizeOptions: false,
    showResultImmediately: true,
    showAnswersToStudent: true,
    allowRetake: false,
    maxAttempts: 1,
    status: 'DRAFT',
    instructions:
      '1. All questions must be answered within the allotted duration.\n2. Negative marks will be deducted for incorrect objective answers.\n3. The countdown timer is authoritative and the system will automatically submit when time expires.\n4. Do not refresh or close the tab during the exam.',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/admin/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create exam');

      success('Exam draft created successfully! Proceeding to Visual Builder...');
      router.push(`/admin/exams/${data.exam.id}/builder`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Creation failed');
      error(err.message || 'Creation failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/exams"
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create Examination</h1>
          <p className="text-xs text-slate-500">
            Define exam metadata, grading rules, and access constraints.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2.5 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Details */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-700 border-b pb-2">
            1. Basic Information
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
              Exam Title
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. NCC 'B' Certificate Annual Exam 2026"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
              Description
            </label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description of the assessment scope and cadet wings..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                Subject
              </label>
              <input
                type="text"
                required
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                Class / Course
              </label>
              <input
                type="text"
                value={form.course}
                onChange={(e) => setForm({ ...form, course: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                Exam Code
              </label>
              <input
                type="text"
                required
                value={form.examCode}
                onChange={(e) => setForm({ ...form, examCode: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono uppercase"
              />
            </div>
          </div>
        </div>

        {/* Timing and Scoring */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-700 border-b pb-2">
            2. Timing, Marks & Negative Grading
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                Duration (Minutes)
              </label>
              <input
                type="number"
                min="5"
                max="360"
                required
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value, 10) || 30 })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                Total Marks
              </label>
              <input
                type="number"
                min="1"
                required
                value={form.totalMarks}
                onChange={(e) => setForm({ ...form, totalMarks: parseFloat(e.target.value) || 50 })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                Passing Marks
              </label>
              <input
                type="number"
                min="0"
                required
                value={form.passingMarks}
                onChange={(e) => setForm({ ...form, passingMarks: parseFloat(e.target.value) || 25 })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                Negative Marking
              </label>
              <input
                type="number"
                step="0.25"
                min="0"
                value={form.negativeMarking}
                onChange={(e) => setForm({ ...form, negativeMarking: parseFloat(e.target.value) || 0 })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                Start Window (Optional)
              </label>
              <input
                type="datetime-local"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                End Window (Optional)
              </label>
              <input
                type="datetime-local"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Configuration Toggles */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-700 border-b pb-2">
            3. Security, Randomization & Delivery Controls
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={form.randomizeQuestions}
                onChange={(e) => setForm({ ...form, randomizeQuestions: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm font-medium text-slate-800">
                Randomize Questions Order
              </span>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={form.randomizeOptions}
                onChange={(e) => setForm({ ...form, randomizeOptions: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm font-medium text-slate-800">
                Randomize Answer Options
              </span>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={form.showResultImmediately}
                onChange={(e) => setForm({ ...form, showResultImmediately: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm font-medium text-slate-800">
                Show Score Immediately After Submit
              </span>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={form.showAnswersToStudent}
                onChange={(e) => setForm({ ...form, showAnswersToStudent: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm font-medium text-slate-800">
                Reveal Correct Answers on Result Page
              </span>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={form.allowRetake}
                onChange={(e) => setForm({ ...form, allowRetake: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm font-medium text-slate-800">Allow Cadet Retake</span>
            </label>

            <div className="p-3 rounded-xl border border-slate-200 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-800">Max Allowed Attempts:</span>
              <input
                type="number"
                min="1"
                max="10"
                value={form.maxAttempts}
                onChange={(e) => setForm({ ...form, maxAttempts: parseInt(e.target.value, 10) || 1 })}
                className="w-16 px-2 py-1 rounded-lg border border-slate-300 text-sm font-bold text-center"
              />
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
          <label className="block text-xs font-semibold text-slate-700 uppercase">
            Cadet Instructions (Displayed prior to starting the timer)
          </label>
          <textarea
            rows={4}
            value={form.instructions}
            onChange={(e) => setForm({ ...form, instructions: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Link
            href="/admin/exams"
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition flex items-center gap-2"
          >
            {isLoading && (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            <Save className="w-4 h-4" />
            <span>Save & Open Visual Builder</span>
          </button>
        </div>
      </form>
    </div>
  );
}
