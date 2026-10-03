'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Clock,
  Shield,
  CheckCircle2,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Send,
  Sparkles,
  Menu,
  X,
} from 'lucide-react';
import { Timer } from '@/components/Timer';
import { QuestionRenderer, StudentAnswerState } from '@/components/QuestionRenderer';
import { useToast } from '@/components/Toast';
import { NccLogo } from '@/components/NccLogo';

export default function TakeExamPage({ params }: { params: { examId: string } }) {
  const router = useRouter();
  const { success, error: toastError, warning } = useToast();

  const [examData, setExamData] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Answers map keyed by questionId
  const [answers, setAnswers] = useState<Record<string, StudentAnswerState & { answerId?: string; isMarkedForReview?: boolean; isAnswered?: boolean; isVisited?: boolean }>>({});
  
  // Attempt info
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  // Tab switch violation tracking
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [warningModal, setWarningModal] = useState<{
    warningNumber: number;
    title: string;
    message: string;
  } | null>(null);
  const [terminatedModal, setTerminatedModal] = useState<{
    reason: string;
  } | null>(null);
  const lastTabSwitchTimeRef = useRef<number>(0);

  // States
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'IDLE' | 'SAVING' | 'SAVED' | 'ERROR'>('IDLE');
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Debounce ref for auto-saving
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Initialize Exam / Restore Attempt
  const initExam = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/student/exams/${params.examId}/start`, {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to initialize exam');
      }

      setExamData(data.exam);
      setQuestions(data.questions);
      setSections(data.exam.sections || []);
      setAttemptId(data.attemptId);
      setExpiresAt(data.expiresAt);
      setTabSwitchCount(data.tabSwitchViolations || 0);

      if (data.exam.sections && data.exam.sections.length > 0) {
        setActiveSectionId(data.exam.sections[0].id);
      }

      // Populate answers from saved state
      const initialAnswers: Record<string, any> = {};
      (data.savedAnswers || []).forEach((sa: any) => {
        initialAnswers[sa.questionId] = {
          answerId: sa.id,
          selectedOptionIds: sa.selectedOptionIdsJson ? JSON.parse(sa.selectedOptionIdsJson) : [],
          textAnswer: sa.textAnswer || '',
          matchedPairs: sa.matchedPairsJson ? JSON.parse(sa.matchedPairsJson) : {},
          orderedItemIds: sa.orderedItemIdsJson ? JSON.parse(sa.orderedItemIdsJson) : [],
          isMarkedForReview: Boolean(sa.isMarkedForReview),
          isAnswered: Boolean(sa.isAnswered),
          isVisited: Boolean(sa.isVisited),
        };
      });

      // Ensure every question has an entry
      data.questions.forEach((q: any) => {
        if (!initialAnswers[q.questionId]) {
          initialAnswers[q.questionId] = {
            selectedOptionIds: [],
            textAnswer: '',
            matchedPairs: {},
            orderedItemIds: [],
            isMarkedForReview: false,
            isAnswered: false,
            isVisited: false,
          };
        }
      });

      setAnswers(initialAnswers);
    } catch (err: any) {
      toastError(err.message);
      router.push('/student');
    } finally {
      setIsLoading(false);
    }
  }, [params.examId, router, toastError]);

  useEffect(() => {
    initExam();
  }, [initExam]);

  // Current Question
  const currentQuestion = questions[currentIndex];

  // 2. Autosave answer implementation
  const triggerSaveAnswer = useCallback(
    async (qId: string, updatedState: any) => {
      if (!attemptId) return;

      setSaveStatus('SAVING');
      try {
        const res = await fetch(`/api/student/attempts/${attemptId}/save-answer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questionId: qId,
            ...updatedState,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          if (data.expired) {
            handleTimeExpired();
            return;
          }
          throw new Error(data.error);
        }

        setSaveStatus('SAVED');
        setTimeout(() => setSaveStatus('IDLE'), 2000);
      } catch {
        setSaveStatus('ERROR');
      }
    },
    [attemptId]
  );

  const handleAnswerChange = (newAnswer: StudentAnswerState) => {
    if (!currentQuestion) return;

    const hasOptions = newAnswer.selectedOptionIds && newAnswer.selectedOptionIds.length > 0;
    const hasText = Boolean(newAnswer.textAnswer && newAnswer.textAnswer.trim().length > 0);
    const hasPairs = Boolean(newAnswer.matchedPairs && Object.keys(newAnswer.matchedPairs).length > 0);
    const hasOrder = Boolean(newAnswer.orderedItemIds && newAnswer.orderedItemIds.length > 0);

    const isAnswered = hasOptions || hasText || hasPairs || hasOrder;

    const updated = {
      ...answers[currentQuestion.questionId],
      ...newAnswer,
      isAnswered,
      isVisited: true,
    };

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.questionId]: updated,
    }));

    // Debounce save request by 400ms
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      triggerSaveAnswer(currentQuestion.questionId, updated);
    }, 400);
  };

  // 3. Mark for Review Toggle
  const toggleMarkForReview = () => {
    if (!currentQuestion) return;
    const current = answers[currentQuestion.questionId] || {};
    const nextMarked = !current.isMarkedForReview;

    const updated = {
      ...current,
      isMarkedForReview: nextMarked,
      isVisited: true,
    };

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.questionId]: updated,
    }));

    triggerSaveAnswer(currentQuestion.questionId, updated);
  };

  // 4. Navigation Handlers
  const goToQuestion = (index: number) => {
    if (index < 0 || index >= questions.length) return;
    // Mark current question as visited
    if (currentQuestion) {
      setAnswers((prev) => ({
        ...prev,
        [currentQuestion.questionId]: {
          ...prev[currentQuestion.questionId],
          isVisited: true,
        },
      }));
    }
    setCurrentIndex(index);
    setIsMobileNavOpen(false);
  };

  // 5. Submit Exam Handler
  const handleFinalSubmit = async (isAutoExpired = false) => {
    if (!attemptId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/student/attempts/${attemptId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAutoExpired }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      success('Examination successfully submitted!');
      router.push(`/student/exam/attempt/${attemptId}/result`);
    } catch (err: any) {
      toastError(err.message || 'Submission failed');
      setIsSubmitting(false);
    }
  };

  // 6. Time Expiration Handler
  const handleTimeExpired = () => {
    warning('Time has expired! Automatically saving and submitting your examination...');
    handleFinalSubmit(true);
  };

  // 7. Tab Switch Anti-Cheating Detection Handler
  const onTabSwitchDetected = useCallback(async () => {
    const now = Date.now();
    // 2.5 second cooldown to avoid double firing on visibilitychange + blur
    if (now - lastTabSwitchTimeRef.current < 2500) {
      return;
    }
    lastTabSwitchTimeRef.current = now;

    if (!attemptId || isSubmitting || isLoading) return;

    try {
      const res = await fetch(`/api/student/attempts/${attemptId}/tab-switch`, {
        method: 'POST',
      });
      const data = await res.json();

      if (data.isTerminated) {
        setIsSubmitting(true);
        setTabSwitchCount(data.violationsCount || 3);
        setTerminatedModal({
          reason:
            data.terminationReason ||
            'Exam terminated automatically due to repeated tab switching (3 violations).',
        });
        setTimeout(() => {
          router.push(data.redirectUrl || `/student/exam/attempt/${attemptId}/result`);
        }, 3500);
        return;
      }

      setTabSwitchCount(data.violationsCount);
      if (data.violationsCount === 1) {
        setWarningModal({
          warningNumber: 1,
          title: '⚠️ WARNING 1 OF 2: Tab Switch Detected!',
          message:
            'You have navigated away from the active examination window. Tab switching, opening external applications, or minimizing your browser is strictly prohibited. You have 1 warning remaining. On the 3rd violation, your exam will be automatically submitted and locked.',
        });
      } else if (data.violationsCount === 2) {
        setWarningModal({
          warningNumber: 2,
          title: '🚨 FINAL WARNING (2 OF 2): Tab Switch Detected!',
          message:
            'CRITICAL WARNING: This is your LAST warning. You have switched tabs 2 times. If you leave this examination window ONE MORE TIME (3rd violation), your exam will be terminated immediately and locked permanently.',
        });
      }
    } catch (err) {
      console.error('Error logging tab switch', err);
    }
  }, [attemptId, isSubmitting, isLoading, router]);

  useEffect(() => {
    if (!attemptId || isSubmitting || isLoading) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        onTabSwitchDetected();
      }
    };

    const handleWindowBlur = () => {
      onTabSwitchDetected();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [attemptId, isSubmitting, isLoading, onTabSwitchDetected]);

  if (isLoading || !examData || !currentQuestion) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white p-6">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-[#133E87]/30 border-t-[#133E87] rounded-full animate-spin mx-auto" />
          <h2 className="text-lg font-bold">Synchronizing with Examination Server...</h2>
          <p className="text-xs text-slate-400">Loading questions, options, and timer state</p>
        </div>
      </div>
    );
  }

  // Answer stats for submit confirmation
  const totalQuestions = questions.length;
  const answeredCount = Object.values(answers).filter((a) => a.isAnswered).length;
  const markedCount = Object.values(answers).filter((a) => a.isMarkedForReview).length;
  const unansweredCount = totalQuestions - answeredCount;

  const currentAnswerState = answers[currentQuestion.questionId] || {};

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col -m-4 sm:-m-6 lg:-m-8 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* EXAM HEADER */}
      <header className="ncc-navbar bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        {/* Tri-Service Top Accent Ribbon */}
        <div className="h-1 w-full ncc-tri-stripe" />
        <div className="px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="shrink-0">
              <NccLogo size={34} priority />
            </div>
            <div className="min-w-0">
              <h1 className="text-xs sm:text-base font-bold tracking-tight truncate max-w-[120px] xs:max-w-[180px] sm:max-w-md text-[#0B2545]">
                {examData.title}
              </h1>
              <span className="text-[9px] sm:text-[10px] text-[#4A90E2] font-mono block truncate">
                Code: {examData.examCode || 'NCC-EXAM'}
              </span>
            </div>
          </div>

          {/* Center / Right: Live Timer & Actions */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {expiresAt && (
              <Timer expiresAt={expiresAt} onExpire={handleTimeExpired} />
            )}

            {/* Autosave Status */}
            <div className="hidden md:flex items-center text-xs font-semibold">
              {saveStatus === 'SAVING' && (
                <span className="text-[#4A90E2] flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#4A90E2] animate-ping" /> Saving...
                </span>
              )}
              {saveStatus === 'SAVED' && (
                <span className="text-emerald-500 flex items-center gap-1">Saved ✓</span>
              )}
              {saveStatus === 'ERROR' && (
                <span className="text-rose-500 flex items-center gap-1">Retrying...</span>
              )}
            </div>

            {/* Tab Switch Warning Badge */}
            {tabSwitchCount > 0 && (
              <div className="flex items-center gap-1 px-2 sm:px-3 py-1 rounded-xl text-[10px] sm:text-xs font-bold bg-[#D4AF37]/20 text-amber-700 border border-[#D4AF37]/40 animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="hidden sm:inline">
                  Tab Switches: {tabSwitchCount}/2 {tabSwitchCount === 2 ? '(FINAL WARNING!)' : 'Warnings'}
                </span>
                <span className="sm:hidden font-mono">{tabSwitchCount}/2</span>
              </div>
            )}

            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-[#B71C1C] hover:bg-[#9B1414] text-white font-bold text-xs sm:text-sm shadow-md shadow-[#B71C1C]/30 transition flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden xs:inline sm:inline">Submit</span>
              <span className="hidden sm:inline"> Exam</span>
            </button>

            {/* Mobile question navigator toggle */}
            <button
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
              className="p-2 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 md:hidden flex items-center justify-center hover:bg-slate-200 transition"
              aria-label="Toggle question palette"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* SUB-HEADER: SECTION TABS */}
      {sections.length > 1 && (
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-2 flex items-center gap-2 overflow-x-auto transition-colors duration-200">
          <span className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mr-2 shrink-0">Sections:</span>
          {sections.map((sec) => {
            const isSecActive =
              activeSectionId === sec.id ||
              (currentQuestion && currentQuestion.sectionId === sec.id);

            return (
              <button
                key={sec.id}
                onClick={() => {
                  setActiveSectionId(sec.id);
                  const firstInSec = questions.findIndex((q) => q.sectionId === sec.id);
                  if (firstInSec !== -1) goToQuestion(firstInSec);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  isSecActive
                    ? 'bg-[#133E87] dark:bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-[#EEF5FC] dark:hover:bg-slate-700 hover:text-[#4A90E2]'
                }`}
              >
                {sec.name}
              </button>
            );
          })}
        </div>
      )}

      {/* MAIN EXAM WORKSPACE */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-4 sm:p-6 gap-6">
        {/* Left: Question Box */}
        <div className="flex-1 flex flex-col justify-between bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xs transition-colors duration-200">
          <div>
            {/* Question Info Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider bg-[#EEF5FC] dark:bg-sky-950/60 text-[#133E87] dark:text-sky-300 border border-[#133E87]/20 dark:border-sky-800/40 px-3 py-1 rounded-xl">
                  Question {currentIndex + 1} of {totalQuestions}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {currentQuestion.type.replace('_', ' ')}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-amber-800 dark:text-amber-300 bg-[#D4AF37]/15 dark:bg-amber-950/40 border border-[#D4AF37]/40 dark:border-amber-800/40 px-3 py-1 rounded-xl">
                  +{currentQuestion.marks} {currentQuestion.marks === 1 ? 'Mark' : 'Marks'}
                </span>
                {currentQuestion.negativeMarks > 0 && (
                  <span className="text-[11px] font-bold text-[#B71C1C] dark:text-rose-400 bg-red-50 dark:bg-rose-950/40 px-2 py-0.5 rounded border border-red-200 dark:border-rose-900/60">
                    -{currentQuestion.negativeMarks} Wrong
                  </span>
                )}
              </div>
            </div>

            {/* Interactive Question Renderer */}
            <QuestionRenderer
              question={currentQuestion}
              answer={currentAnswerState}
              onChange={handleAnswerChange}
            />
          </div>

          {/* Action Bar (Prev / Next / Mark for Review) */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              onClick={toggleMarkForReview}
              className={`w-full sm:w-auto px-4 py-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                currentAnswerState.isMarkedForReview
                  ? 'bg-[#D4AF37] text-slate-950 border-[#D4AF37] shadow-xs'
                  : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>
                {currentAnswerState.isMarkedForReview
                  ? 'Marked for Review ✓'
                  : 'Mark for Review'}
              </span>
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                disabled={currentIndex === 0}
                onClick={() => goToQuestion(currentIndex - 1)}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 flex items-center justify-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <button
                disabled={currentIndex === totalQuestions - 1}
                onClick={() => goToQuestion(currentIndex + 1)}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-[#133E87] hover:bg-[#0E2F68] dark:bg-sky-600 dark:hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5 disabled:opacity-40"
              >
                <span>Next Question</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Question Navigator Palette */}
        <aside
          className={`fixed md:static inset-0 z-50 md:z-auto bg-slate-900/60 md:bg-transparent backdrop-blur-xs md:backdrop-blur-none p-4 md:p-0 flex justify-end md:block transition-all ${
            isMobileNavOpen ? 'block' : 'hidden md:block'
          }`}
        >
          <div className="w-80 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between h-full md:h-auto max-h-[85vh] overflow-y-auto transition-colors duration-200">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Question Palette</h3>
                <button
                  onClick={() => setIsMobileNavOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 md:hidden"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Legend */}
              <div className="grid grid-cols-2 gap-2 text-[11px] mb-4 font-medium text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-md bg-[#133E87] dark:bg-sky-600" />
                  <span>Answered ({answeredCount})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-md bg-[#D4AF37]" />
                  <span>Review ({markedCount})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-md bg-slate-200 dark:bg-slate-700" />
                  <span>Unanswered ({unansweredCount})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-md ring-2 ring-[#4A90E2] bg-white dark:bg-slate-800" />
                  <span>Current</span>
                </div>
              </div>

              {/* Navigator Buttons Grid */}
              <div className="grid grid-cols-5 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                {questions.map((q, idx) => {
                  const ans = answers[q.questionId] || {};
                  const isCurrent = idx === currentIndex;
                  const isAnswered = ans.isAnswered;
                  const isMarked = ans.isMarkedForReview;

                  let bgClass = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700';
                  if (isMarked) {
                    bgClass = 'bg-[#D4AF37] text-slate-950 font-bold';
                  } else if (isAnswered) {
                    bgClass = 'bg-[#133E87] dark:bg-sky-600 text-white font-bold';
                  } else if (ans.isVisited) {
                    bgClass = 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200';
                  }

                  return (
                    <button
                      key={q.questionId}
                      onClick={() => goToQuestion(idx)}
                      className={`h-9 rounded-xl text-xs font-bold transition flex items-center justify-center relative ${bgClass} ${
                        isCurrent
                          ? 'ring-2 ring-offset-2 ring-[#4A90E2] scale-105 z-10 shadow-sm'
                          : ''
                      }`}
                    >
                      {idx + 1}
                      {isMarked && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-300 ring-2 ring-white" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit Trigger inside sidebar */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setIsSubmitModalOpen(true)}
                className="w-full py-3 rounded-2xl bg-[#B71C1C] hover:bg-[#9B1414] text-white font-extrabold text-xs shadow-md shadow-[#B71C1C]/20 transition flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Submit Final Exam</span>
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* SUBMISSION CONFIRMATION MODAL */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-6 text-slate-900 dark:text-white transition-colors">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#133E87]/10 dark:bg-[#133E87]/30 text-[#133E87] dark:text-[#4A90E2] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Confirm Exam Submission</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Are you ready to submit your exam? Once submitted, answers cannot be edited.
                </p>
              </div>
            </div>

            {/* Answer Summary */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex items-center justify-between font-medium">
                <span className="text-slate-600 dark:text-slate-400">Total Questions:</span>
                <span className="font-bold text-slate-900 dark:text-white">{totalQuestions}</span>
              </div>
              <div className="flex items-center justify-between font-medium">
                <span className="text-emerald-700 dark:text-emerald-400">Answered Questions:</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400">{answeredCount}</span>
              </div>
              <div className="flex items-center justify-between font-medium">
                <span className="text-rose-600 dark:text-rose-400">Unanswered Questions:</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">{unansweredCount}</span>
              </div>
              <div className="flex items-center justify-between font-medium">
                <span className="text-amber-700 dark:text-amber-400">Marked for Review:</span>
                <span className="font-bold text-amber-700 dark:text-amber-400">{markedCount}</span>
              </div>
            </div>

            {unansweredCount > 0 && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-medium">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Warning: You have {unansweredCount} unanswered questions remaining.
                </span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(false)}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Continue Exam
              </button>
              <button
                type="button"
                onClick={() => handleFinalSubmit(false)}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-[#B71C1C] hover:bg-[#9B1414] text-white text-xs font-bold shadow-md shadow-[#B71C1C]/20 flex items-center gap-2"
              >
                {isSubmitting && (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                <span>Confirm & Submit</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB SWITCH WARNING MODAL (Warnings 1 and 2) */}
      {warningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border-2 border-amber-400 dark:border-amber-500 space-y-5 text-slate-900 dark:text-white transition-colors">
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  warningModal.warningNumber === 2
                    ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                    : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                }`}
              >
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <span
                  className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    warningModal.warningNumber === 2
                      ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                      : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                  }`}
                >
                  {warningModal.warningNumber === 2 ? 'Final Notice' : 'Proctoring Warning'}
                </span>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
                  {warningModal.title}
                </h3>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
              {warningModal.message}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setWarningModal(null)}
                className={`w-full py-3 px-4 rounded-xl text-white font-extrabold text-xs shadow-md transition ${
                  warningModal.warningNumber === 2
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                I Understand & Resume Exam
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB SWITCH TERMINATED MODAL (3rd Violation) */}
      {terminatedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-lg animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-8 shadow-2xl border-4 border-rose-500 text-center space-y-6 text-slate-900 dark:text-white transition-colors">
            <div className="w-16 h-16 rounded-3xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="w-8 h-8 animate-bounce" />
            </div>

            <div>
              <span className="text-xs font-black uppercase tracking-widest text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-3 py-1 rounded-full">
                Anti-Cheating Limit Exceeded
              </span>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-3">
                Examination Terminated & Locked
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                {terminatedModal.reason}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs font-semibold text-rose-900 dark:text-rose-200">
              Your answers have been automatically collected and submitted. You will now be redirected to the result analysis page.
            </div>

            <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400 dark:text-slate-500">
              <span className="w-4 h-4 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
              <span>Redirecting to result screen...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
