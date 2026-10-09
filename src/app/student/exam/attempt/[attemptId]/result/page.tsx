'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Shield,
  HelpCircle,
  FileText,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function StudentResultPage({
  params,
}: {
  params: { attemptId: string };
}) {
  const router = useRouter();
  const { error } = useToast();
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorState, setErrorState] = useState<string | null>(null);

  const loadResult = useCallback(async () => {
    setIsLoading(true);
    setErrorState(null);
    try {
      const res = await fetch(`/api/student/attempts/${params.attemptId}/result`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setResult(data.result);
    } catch (err: any) {
      const msg = err.message || 'Failed to load result';
      setErrorState(msg);
      error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [params.attemptId, error]);

  useEffect(() => {
    loadResult();
  }, [loadResult]);

  if (isLoading) {
    return <div className="p-12 text-center text-slate-400 dark:text-slate-500 animate-pulse">Loading exam result...</div>;
  }

  if (errorState || !result) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto border border-rose-200 dark:border-rose-800">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Exam Attempt Not Found</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {errorState || 'The requested exam attempt could not be found or has not been completed yet.'}
        </p>
        <div className="pt-2 flex items-center justify-center gap-3">
          <Link
            href="/student"
            className="px-5 py-2.5 rounded-xl bg-[#133E87] hover:bg-[#0E2F68] text-white text-xs font-bold transition shadow-xs"
          >
            Return to Cadet Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { counts } = result;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Top Banner */}
      <div
        className={`p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors ${
          result.isPassed
            ? 'bg-gradient-to-tr from-emerald-900 via-teal-900 to-slate-900'
            : 'bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-950'
        }`}
      >
        <div className="flex items-center gap-5">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${
              result.isPassed
                ? 'bg-emerald-500/20 border border-emerald-400/30 text-emerald-400'
                : 'bg-rose-500/20 border border-rose-400/30 text-rose-400'
            }`}
          >
            <Award className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Official Examination Result
              </span>
              {result.requiresManualGrading && (
                <span className="text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full">
                  Descriptive Review Pending
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-white">
              {result.examTitle}
            </h1>
            <p className="text-xs text-slate-300 mt-1 font-mono">
              Cadet: <span className="font-bold text-white">{result.studentName}</span> (
              {result.cadetRollNo}) • Submission: {result.submissionMethod}
            </p>
          </div>
        </div>

        {/* Score Display */}
        <div className="text-center md:text-right bg-white/5 backdrop-blur-xs p-5 rounded-2xl border border-white/10 shrink-0">
          <div className="text-xs font-bold uppercase text-slate-300">Marks Scored</div>
          <div className="text-4xl font-black text-white tracking-tight mt-1">
            {result.totalScore}
            <span className="text-lg font-medium text-slate-300"> / {result.examTotalMarks}</span>
          </div>
          <div className="mt-2">
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                result.isPassed
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-rose-500 text-white'
              }`}
            >
              {result.isPassed ? 'PASSED QUALIFIED' : 'NOT QUALIFIED'} ({result.percentage}%)
            </span>
          </div>
        </div>
      </div>

      {/* Tab Switch Early Termination Notice */}
      {(result.submissionMethod === 'AUTO_TAB_SWITCH' || result.terminationReason) && (
        <div className="p-6 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-900 shadow-sm flex items-start gap-4 animate-fade-in">
          <div className="p-3 bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 rounded-2xl shrink-0">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-600 text-white">
                Early Termination (Proctoring Violation)
              </span>
              <span className="text-xs font-bold text-rose-700 dark:text-rose-300">
                {result.tabSwitchViolations || 3} Tab Switches Recorded
              </span>
            </div>
            <h3 className="text-base font-bold text-rose-950 dark:text-rose-100">
              Exam Automatically Submitted Due to Tab Switching
            </h3>
            <p className="text-xs text-rose-800 dark:text-rose-300 leading-relaxed font-medium">
              <span className="font-bold">Official Reason: </span>
              {result.terminationReason ||
                'This examination was automatically submitted and locked because you exceeded the 2 allowed tab-switch warnings (3 tab switches detected).'}
            </p>
            <div className="text-[11px] text-rose-600 dark:text-rose-400 pt-1">
              Note: This proctoring violation has been permanently recorded in your Directorate examination record and is visible to your ANO / Administrator.
            </div>
          </div>
        </div>
      )}

      {/* Answer Performance Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-400 block">Total Questions</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
            {counts.totalQuestions}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-bold uppercase text-emerald-600 dark:text-emerald-400 block">Correct</span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
            {counts.correctCount}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-bold uppercase text-rose-600 dark:text-rose-400 block">Incorrect</span>
          <span className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 block">
            {counts.incorrectCount}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-400 block">Unanswered</span>
          <span className="text-2xl font-black text-slate-700 dark:text-slate-300 mt-1 block">
            {counts.unansweredCount}
          </span>
        </div>
      </div>

      {/* Detailed Question Review (If enabled by Admin) */}
      {result.showDetailedAnswers && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Question-by-Question Analysis</h2>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
              Official answer keys & ANO evaluations
            </span>
          </div>

          <div className="space-y-4">
            {result.questions.map((q: any, idx: number) => {
              const isCorrect = q.isCorrect;
              const hasEvaluation = Boolean(q.manualEvaluation);

              return (
                <div
                  key={q.questionId}
                  className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4"
                >
                  <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#133E87]/10 dark:bg-[#133E87]/30 text-[#133E87] dark:text-[#4A90E2] border border-[#133E87]/20 dark:border-[#4A90E2]/30">
                        {q.type.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          isCorrect === true
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40'
                            : isCorrect === false
                            ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40'
                            : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40'
                        }`}
                      >
                        {isCorrect === true
                          ? `Correct (+${q.marksAwarded})`
                          : isCorrect === false
                          ? `Incorrect (${q.marksAwarded})`
                          : hasEvaluation
                          ? `Graded (+${q.marksAwarded})`
                          : 'Pending ANO Evaluation'}
                      </span>
                      <span className="text-xs text-slate-400 font-bold">
                        / {q.marksAvailable} Marks
                      </span>
                    </div>
                  </div>

                  {/* Question */}
                  <div className="text-sm font-semibold text-slate-900 dark:text-white leading-snug">
                    {q.questionText}
                  </div>

                  {/* Cadet's Answer */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs space-y-1">
                    <span className="font-bold text-slate-500 dark:text-slate-400 uppercase block">Your Answer:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {q.studentAnswer.textAnswer ||
                        (q.studentAnswer.selectedOptionIds.length > 0
                          ? q.correctData?.options
                              ?.filter((o: any) =>
                                q.studentAnswer.selectedOptionIds.includes(o.id)
                              )
                              .map((o: any) => o.text)
                              .join(', ')
                          : 'Unanswered')}
                    </span>
                  </div>

                  {/* Correct Answer Display */}
                  {q.correctData && (
                    <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 text-xs space-y-1">
                      <span className="font-bold text-emerald-800 dark:text-emerald-400 uppercase block">
                        Correct Solution:
                      </span>
                      <span className="font-semibold text-emerald-950 dark:text-emerald-200">
                        {q.correctData.options
                          ?.filter((o: any) => o.isCorrect)
                          .map((o: any) => o.text)
                          .join(', ') ||
                          q.correctData.acceptedAnswers?.join(' OR ') ||
                          q.correctData.expectedAnswer ||
                          'Verified'}
                      </span>

                      {q.correctData.explanation && (
                        <p className="mt-2 text-emerald-800 dark:text-emerald-300 italic pt-1 border-t border-emerald-100 dark:border-emerald-900/50">
                          {q.correctData.explanation}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Evaluator Feedback if present */}
                  {q.manualEvaluation && (
                    <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs space-y-1">
                      <span className="font-bold text-amber-800 dark:text-amber-400 uppercase block">
                        Evaluator Feedback:
                      </span>
                      <p className="text-amber-950 dark:text-amber-200 font-medium">{q.manualEvaluation.feedback}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Return to Dashboard */}
      <div className="flex justify-center pt-4">
        <button
          onClick={() => {
            router.refresh();
            router.push('/student');
          }}
          className="px-6 py-3 rounded-2xl bg-[#133E87] hover:bg-[#0E2F68] text-white font-bold text-sm shadow-md transition flex items-center gap-2 cursor-pointer"
        >
          <span>Return to Cadet Portal</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
