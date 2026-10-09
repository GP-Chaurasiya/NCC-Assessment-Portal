'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  FileText,
  Save,
  Clock,
  Award,
  Sparkles,
  AlertTriangle,
  ShieldAlert,
} from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function ManualEvaluationPage({
  params,
}: {
  params: { attemptId: string };
}) {
  const { success, error } = useToast();
  const [attempt, setAttempt] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorState, setErrorState] = useState<string | null>(null);

  // Evaluation form state keyed by answerId
  const [evalForms, setEvalForms] = useState<Record<string, { marks: number; feedback: string }>>({});
  const [savingAnswerId, setSavingAnswerId] = useState<string | null>(null);

  const loadAttempt = useCallback(async () => {
    setIsLoading(true);
    setErrorState(null);
    try {
      const res = await fetch(`/api/admin/attempts/${params.attemptId}/evaluate`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setAttempt(data.attempt);

      // Pre-fill forms
      const initialForms: Record<string, { marks: number; feedback: string }> = {};
      data.attempt.answers.forEach((ans: any) => {
        initialForms[ans.id] = {
          marks: ans.manualEvaluation ? ans.manualEvaluation.marksAwarded : ans.marksAwarded || 0,
          feedback: ans.manualEvaluation?.feedback || '',
        };
      });
      setEvalForms(initialForms);
    } catch (err: any) {
      const msg = err.message || 'Failed to load attempt details';
      setErrorState(msg);
      error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [params.attemptId, error]);

  useEffect(() => {
    loadAttempt();
  }, [loadAttempt]);

  const handleSaveEvaluation = async (answerId: string) => {
    const formData = evalForms[answerId];
    if (!formData) return;

    setSavingAnswerId(answerId);
    try {
      const res = await fetch(`/api/admin/attempts/${params.attemptId}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentAnswerId: answerId,
          marksAwarded: formData.marks,
          feedback: formData.feedback,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      success(data.message);
      // Reload attempt to get updated total score and percentage
      loadAttempt();
    } catch (err: any) {
      error(err.message);
    } finally {
      setSavingAnswerId(null);
    }
  };

  if (isLoading) {
    return <div className="p-12 text-center text-slate-400 animate-pulse">Loading evaluation...</div>;
  }

  if (errorState || !attempt) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto border border-rose-200 dark:border-rose-800">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Attempt Not Found</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {errorState || 'This attempt could not be found or has been deleted.'}
        </p>
        <div className="pt-2 flex items-center justify-center gap-3">
          <Link
            href="/admin/attempts"
            className="px-5 py-2.5 rounded-xl bg-[#133E87] hover:bg-[#0E2F68] text-white text-xs font-bold transition shadow-xs"
          >
            Back to Attempts
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/attempts"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Attempt Evaluation & Review
            </h1>
            <p className="text-xs text-slate-500">
              Cadet: <span className="font-semibold text-slate-800">{attempt.student?.name}</span> •{' '}
              {attempt.exam?.title}
            </p>
          </div>
        </div>

        {/* Live Score Badge */}
        <div className="text-right bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-400 uppercase">Recalculated Score</div>
          <div className="text-xl font-black text-slate-900">
            {attempt.totalScore} / {attempt.exam?.totalMarks}{' '}
            <span
              className={`text-xs font-bold ml-1 ${
                attempt.isPassed ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              ({attempt.percentage}%)
            </span>
          </div>
        </div>
      </div>

      {/* Proctoring & Anti-Cheating Tab-Switch Report */}
      {(attempt.tabSwitchViolations > 0 ||
        attempt.submissionMethod === 'AUTO_TAB_SWITCH' ||
        attempt.terminationReason) && (
        <div
          className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-start gap-4 ${
            attempt.submissionMethod === 'AUTO_TAB_SWITCH' || (attempt.tabSwitchViolations && attempt.tabSwitchViolations >= 3)
              ? 'bg-red-50/80 border-red-200 text-red-950'
              : 'bg-amber-50/80 border-amber-200 text-amber-950'
          }`}
        >
          <div
            className={`p-2.5 rounded-xl shrink-0 ${
              attempt.submissionMethod === 'AUTO_TAB_SWITCH' || (attempt.tabSwitchViolations && attempt.tabSwitchViolations >= 3)
                ? 'bg-red-100 text-red-700'
                : 'bg-amber-100 text-amber-700'
            }`}
          >
            <ShieldAlert className="w-6 h-6" />
          </div>

          <div className="flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold tracking-tight">
                {attempt.submissionMethod === 'AUTO_TAB_SWITCH' || (attempt.tabSwitchViolations && attempt.tabSwitchViolations >= 3)
                  ? 'Anti-Cheating Violation: Attempt Automatically Terminated'
                  : 'Proctoring Notice: Cadet Tab Switches Recorded'}
              </h3>
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                  attempt.submissionMethod === 'AUTO_TAB_SWITCH' || (attempt.tabSwitchViolations && attempt.tabSwitchViolations >= 3)
                    ? 'bg-red-200 text-red-900'
                    : 'bg-amber-200 text-amber-900'
                }`}
              >
                {attempt.tabSwitchViolations || 3} Tab Switch{(attempt.tabSwitchViolations || 3) > 1 ? 'es' : ''} Logged
              </span>
            </div>

            {attempt.terminationReason && (
              <p className="text-xs font-semibold leading-relaxed text-red-700">
                <span className="font-bold underline">Official Termination Reason:</span> {attempt.terminationReason}
              </p>
            )}

            <div className="text-[11px] opacity-80 flex items-center gap-2">
              <span>Submission Method:</span>
              <span className="font-mono font-bold bg-white/70 px-2 py-0.5 rounded border border-current">
                {attempt.submissionMethod === 'AUTO_TAB_SWITCH'
                  ? 'AUTO_TAB_SWITCH (Exceeded 2 Warnings Limit)'
                  : attempt.submissionMethod}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Answers List */}
      <div className="space-y-6">
        {attempt.answers.map((ans: any, idx: number) => {
          const q = ans.question;
          const isDescriptive =
            q.type === 'SHORT_ANSWER' || q.type === 'LONG_ANSWER' || q.requiresManualEvaluation;

          const eq = attempt.exam.examQuestions.find((item: any) => item.questionId === q.id);
          const maxMarks = eq?.marks || q.defaultMarks;

          return (
            <div
              key={ans.id}
              className={`p-6 rounded-2xl border shadow-xs space-y-4 ${
                isDescriptive
                  ? 'bg-white border-indigo-200 ring-1 ring-indigo-100'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                    {q.type.replace('_', ' ')}
                  </span>
                  {isDescriptive && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                      Manual Evaluation Required
                    </span>
                  )}
                </div>

                <span className="text-xs font-bold text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                  Max Marks: {maxMarks}
                </span>
              </div>

              {/* Question Text */}
              <div className="text-sm font-semibold text-slate-900 leading-relaxed">
                {q.question}
              </div>

              {/* Student's Submitted Answer */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Cadet&apos;s Answer:
                </span>
                <p className="text-sm text-slate-800 font-medium whitespace-pre-wrap">
                  {ans.textAnswer || (ans.selectedOptionIdsJson ? 'Options selected' : 'Unanswered')}
                </p>
              </div>

              {/* Expected Model Answer */}
              {q.expectedAnswer && (
                <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 block">
                    Expected Key Answer:
                  </span>
                  <p className="text-xs text-indigo-950 font-medium leading-relaxed">
                    {q.expectedAnswer}
                  </p>
                </div>
              )}

              {/* MANUAL EVALUATION FORM */}
              {isDescriptive ? (
                <div className="mt-4 pt-4 border-t border-slate-200 space-y-3 bg-indigo-50/20 p-4 rounded-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-bold text-slate-700 uppercase">
                        Award Marks:
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={maxMarks}
                        step="0.5"
                        value={evalForms[ans.id]?.marks ?? 0}
                        onChange={(e) =>
                          setEvalForms({
                            ...evalForms,
                            [ans.id]: {
                              ...evalForms[ans.id],
                              marks: parseFloat(e.target.value) || 0,
                            },
                          })
                        }
                        className="w-20 px-3 py-1.5 rounded-xl border border-slate-300 font-bold text-sm bg-white text-slate-900"
                      />
                      <span className="text-xs font-semibold text-slate-500">/ {maxMarks}</span>
                    </div>

                    <button
                      onClick={() => handleSaveEvaluation(ans.id)}
                      disabled={savingAnswerId === ans.id}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {savingAnswerId === ans.id && (
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      )}
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Grade</span>
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Evaluator Feedback (Visible to cadet):
                    </label>
                    <textarea
                      rows={2}
                      value={evalForms[ans.id]?.feedback || ''}
                      onChange={(e) =>
                        setEvalForms({
                          ...evalForms,
                          [ans.id]: {
                            ...evalForms[ans.id],
                            feedback: e.target.value,
                          },
                        })
                      }
                      placeholder="e.g. Well articulated point on map scale, but missed magnetic declination formula..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-800"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between text-xs font-medium pt-2 border-t text-slate-600">
                  <span>Autograded:</span>
                  <span
                    className={`font-bold ${
                      ans.isCorrect ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {ans.isCorrect ? 'Correct ✓' : 'Incorrect ✗'} ({ans.marksAwarded} Marks)
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
