'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Clock,
  Award,
  AlertTriangle,
  CheckCircle2,
  Shield,
  Layers,
  FileText,
} from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function ExamInstructionsPage({
  params,
}: {
  params: { examId: string };
}) {
  const router = useRouter();
  const { error } = useToast();

  const [exam, setExam] = useState<any>(null);
  const [agreed, setAgreed] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadExam() {
      try {
        const res = await fetch('/api/student/exams');
        const data = await res.json();
        const found = (data.exams || []).find((e: any) => e.id === params.examId);
        if (!found) throw new Error('Examination not found');
        setExam(found);
      } catch (err: any) {
        error(err.message || 'Failed to load exam details');
      } finally {
        setIsLoading(false);
      }
    }
    loadExam();
  }, [params.examId, error]);

  const handleStartExam = async () => {
    if (!agreed) {
      error('Please accept the examination rules to proceed.');
      return;
    }

    setIsStarting(true);
    try {
      const res = await fetch(`/api/student/exams/${params.examId}/start`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      router.push(`/student/exam/${params.examId}/take`);
    } catch (err: any) {
      error(err.message || 'Failed to start exam');
      setIsStarting(false);
    }
  };

  if (isLoading || !exam) {
    return <div className="p-12 text-center text-slate-400 dark:text-slate-500 animate-pulse">Loading instructions...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/student"
          className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/40 px-2 py-0.5 rounded">
            {exam.examCode}
          </span>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">{exam.title}</h1>
        </div>
      </div>

      {/* Rules & Overview Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6 transition-colors duration-200">
        {/* Key Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-400 block">Duration</span>
            <span className="text-xl font-black text-slate-900 dark:text-white">{exam.duration} mins</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-400 block">Questions</span>
            <span className="text-xl font-black text-slate-900 dark:text-white">{exam.totalQuestions}</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-400 block">Total Marks</span>
            <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">{exam.totalMarks}</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-400 block">Pass Mark</span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{exam.passingMarks}</span>
          </div>
        </div>

        {/* Negative marking warning if active */}
        {exam.negativeMarking > 0 && (
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-medium">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Negative Marking Scheme:</span>
              Each incorrect objective response will deduct {exam.negativeMarking} marks from your score.
              Unanswered questions carry zero penalty.
            </div>
          </div>
        )}

        {/* Official Instructions */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Cadet Examination Code of Conduct & Guidelines:
          </h2>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
            {exam.instructions ||
              `1. The exam countdown timer is synchronized with the Directorate server.
2. Answers are automatically saved continuously as you select or type them.
3. You can use the 'Mark for Review' button to flag questions and revisit them via the navigator.
4. When the remaining time hits zero, your attempt will automatically submit and lock.
5. In case of accidental browser closing or network interruption, simply return and resume.`}
          </div>
        </div>

        {/* Agreement Checkbox */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 dark:bg-slate-800 dark:border-slate-700 mt-0.5"
            />
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-normal">
              I certify that I am Cadet {exam.studentName || 'enrolled'} and agree to adhere strictly to the
              National Cadet Corps Code of Discipline during this assessment.
            </span>
          </label>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleStartExam}
            disabled={!agreed || isStarting}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-2 disabled:bg-slate-300 dark:disabled:bg-slate-800 dark:disabled:text-slate-500 disabled:cursor-not-allowed"
          >
            {isStarting && (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            <span>Begin Timed Examination</span>
          </button>
        </div>
      </div>
    </div>
  );
}
