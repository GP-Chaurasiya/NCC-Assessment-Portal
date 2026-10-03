'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  Sparkles,
  BookOpen,
  X,
  Send,
} from 'lucide-react';
import { useToast } from '@/components/Toast';
import { QuestionRenderer } from '@/components/QuestionRenderer';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { QuestionBuilderForm } from '@/components/QuestionBuilderForm';

export default function ExamBuilderPage({ params }: { params: { id: string } }) {
  const { success, error } = useToast();
  const [exam, setExam] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [validationChecklist, setValidationChecklist] = useState<any>(null);
  const [isPublishReady, setIsPublishReady] = useState(false);

  // Modals
  const [isAddFromBankOpen, setIsAddFromBankOpen] = useState(false);
  const [isCreateQuestionOpen, setIsCreateQuestionOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewQuestionIndex, setPreviewQuestionIndex] = useState(0);
  const [bankQuestions, setBankQuestions] = useState<any[]>([]);
  const [bankSearch, setBankSearch] = useState('');
  const [selectedBankQuestionId, setSelectedBankQuestionId] = useState<string | null>(null);

  // Section modal
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionInstructions, setNewSectionInstructions] = useState('');

  const loadExam = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/exams/${params.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setExam(data.exam);
      setValidationChecklist(data.validationChecklist);
      setIsPublishReady(data.isPublishReady);
    } catch (err: any) {
      error(err.message || 'Failed to load exam details');
    } finally {
      setIsLoading(false);
    }
  }, [params.id, error]);

  useEffect(() => {
    loadExam();
  }, [loadExam]);

  // Load bank questions for import modal
  const openAddFromBank = async () => {
    try {
      const res = await fetch('/api/admin/questions');
      const data = await res.json();
      setBankQuestions(data.questions || []);
      setIsAddFromBankOpen(true);
    } catch {
      error('Failed to load question bank');
    }
  };

  const handleAddQuestionToExam = async (questionId: string, sectionId?: string) => {
    try {
      const res = await fetch(`/api/admin/exams/${params.id}/builder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADD_QUESTION',
          questionId,
          sectionId: sectionId || (exam.sections[0]?.id || null),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      success('Question added to exam');
      setIsAddFromBankOpen(false);
      loadExam();
    } catch (err: any) {
      error(err.message);
    }
  };

  const handleRemoveQuestion = async (examQuestionId: string) => {
    try {
      const res = await fetch(`/api/admin/exams/${params.id}/builder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REMOVE_QUESTION',
          examQuestionId,
        }),
      });
      if (!res.ok) throw new Error('Failed to remove question');

      success('Question removed from exam');
      loadExam();
    } catch (err: any) {
      error(err.message);
    }
  };

  const handleReorder = async (currentIndex: number, direction: 'UP' | 'DOWN') => {
    const targetIndex = direction === 'UP' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= exam.examQuestions.length) return;

    const copy = [...exam.examQuestions];
    const temp = copy[currentIndex];
    copy[currentIndex] = copy[targetIndex];
    copy[targetIndex] = temp;

    const orderedIds = copy.map((eq: any) => eq.id);

    try {
      await fetch(`/api/admin/exams/${params.id}/builder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REORDER_QUESTIONS',
          orderedIds,
        }),
      });
      loadExam();
    } catch {
      error('Failed to update question order');
    }
  };

  const handleCreateNewQuestionAndAdd = async (formData: any) => {
    try {
      // 1. Create in bank
      const res = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // 2. Add to this exam
      await handleAddQuestionToExam(data.question.id);
      setIsCreateQuestionOpen(false);
      success('Question created and added to exam builder!');
    } catch (err: any) {
      error(err.message);
    }
  };

  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectionName.trim()) return;

    try {
      const res = await fetch(`/api/admin/exams/${params.id}/builder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADD_SECTION',
          name: newSectionName,
          instructions: newSectionInstructions,
        }),
      });
      if (!res.ok) throw new Error('Failed to add section');

      success('New section added');
      setIsAddSectionOpen(false);
      setNewSectionName('');
      setNewSectionInstructions('');
      loadExam();
    } catch (err: any) {
      error(err.message);
    }
  };

  const handlePublish = async () => {
    try {
      const res = await fetch(`/api/admin/exams/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACTIVE' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      success('Exam published successfully and is now ACTIVE for cadets!');
      loadExam();
    } catch (err: any) {
      error(err.message);
    }
  };

  if (isLoading || !exam) {
    return <div className="p-12 text-center text-slate-400 animate-pulse">Loading exam builder...</div>;
  }

  const calculatedTotalMarks = exam.examQuestions.reduce(
    (sum: number, eq: any) => sum + eq.marks,
    0
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/exams"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                {exam.examCode}
              </span>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  exam.status === 'ACTIVE'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {exam.status}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">{exam.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setPreviewQuestionIndex(0);
              setIsPreviewOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 shadow-xs transition"
          >
            <Eye className="w-4 h-4 text-slate-500" />
            <span>Preview Exam</span>
          </button>

          {exam.status !== 'ACTIVE' && (
            <button
              onClick={handlePublish}
              disabled={!isPublishReady}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition ${
                isPublishReady
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>Publish Exam</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs text-center">
          <span className="text-xs font-semibold uppercase text-slate-400 block">Questions</span>
          <span className="text-2xl font-black text-slate-900">{exam.examQuestions.length}</span>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs text-center">
          <span className="text-xs font-semibold uppercase text-slate-400 block">Calculated Marks</span>
          <span className="text-2xl font-black text-indigo-600">{calculatedTotalMarks}</span>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs text-center">
          <span className="text-xs font-semibold uppercase text-slate-400 block">Duration</span>
          <span className="text-2xl font-black text-slate-900">{exam.duration} mins</span>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs text-center">
          <span className="text-xs font-semibold uppercase text-slate-400 block">Sections</span>
          <span className="text-2xl font-black text-slate-900">{exam.sections.length}</span>
        </div>
      </div>

      {/* Publish Checklist Banner */}
      {validationChecklist && exam.status !== 'ACTIVE' && (
        <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200/80">
          <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-indigo-900 mb-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
            <span>Publish Validation Checklist</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              <span className={validationChecklist.hasTitle ? 'text-emerald-600' : 'text-slate-400'}>
                ✓ Title Configured
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={validationChecklist.hasDuration ? 'text-emerald-600' : 'text-slate-400'}>
                ✓ Duration Set ({exam.duration}m)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={validationChecklist.hasQuestions ? 'text-emerald-600' : 'text-rose-500 font-bold'}>
                {validationChecklist.hasQuestions ? '✓ Has Questions' : '✗ Add At Least 1 Question'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={validationChecklist.questionsConfigured ? 'text-emerald-600' : 'text-rose-500 font-bold'}>
                {validationChecklist.questionsConfigured ? '✓ Answers Validated' : '✗ Check Question Answers'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Builder Workspace */}
      <div className="space-y-6">
        {/* Sections Control */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Exam Questions & Sections</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddSectionOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Add Section</span>
            </button>
            <button
              onClick={openAddFromBank}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Add from Question Bank</span>
            </button>
            <button
              onClick={() => setIsCreateQuestionOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Question</span>
            </button>
          </div>
        </div>

        {/* Questions List */}
        {exam.examQuestions.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
            <HelpCircle className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <h3 className="text-base font-bold text-slate-700">No questions in this exam yet</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Add questions from your repository or author new questions tailored to this exam.
            </p>
            <div className="mt-4 flex justify-center gap-3">
              <button
                onClick={openAddFromBank}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition"
              >
                Select from Question Bank
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {exam.examQuestions.map((eq: any, index: number) => {
              const q = eq.question;
              return (
                <div
                  key={eq.id}
                  className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <span className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                            {q.type.replace('_', ' ')}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">
                            {q.subject}
                          </span>
                          {eq.section && (
                            <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                              {eq.section.name}
                            </span>
                          )}
                        </div>
                        <h4 className="mt-2 text-sm font-semibold text-slate-900 leading-snug">
                          {q.question}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-800 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                          {eq.marks} {eq.marks === 1 ? 'Mark' : 'Marks'}
                        </span>
                        {eq.negativeMarks > 0 && (
                          <span className="block text-[10px] text-rose-500 font-semibold mt-0.5">
                            -{eq.negativeMarks} wrong
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          disabled={index === 0}
                          onClick={() => handleReorder(index, 'UP')}
                          className="p-1.5 text-slate-400 hover:text-slate-600 disabled:opacity-20"
                          title="Move Up"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          disabled={index === exam.examQuestions.length - 1}
                          onClick={() => handleReorder(index, 'DOWN')}
                          className="p-1.5 text-slate-400 hover:text-slate-600 disabled:opacity-20"
                          title="Move Down"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveQuestion(eq.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600"
                          title="Remove from exam"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Add from Question Bank */}
      {isAddFromBankOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Add from Question Bank</h3>
              <button onClick={() => setIsAddFromBankOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-3">
              <input
                type="text"
                value={bankSearch}
                onChange={(e) => setBankSearch(e.target.value)}
                placeholder="Search questions in bank..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 py-2">
              {bankQuestions
                .filter((bq) =>
                  bq.question.toLowerCase().includes(bankSearch.toLowerCase()) ||
                  bq.subject.toLowerCase().includes(bankSearch.toLowerCase())
                )
                .map((bq) => {
                  const alreadyInExam = exam.examQuestions.some(
                    (eq: any) => eq.questionId === bq.id
                  );
                  return (
                    <div
                      key={bq.id}
                      className="p-3.5 rounded-xl border border-slate-200 flex items-center justify-between gap-3 hover:bg-slate-50"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                            {bq.type.replace('_', ' ')}
                          </span>
                          <span className="text-xs text-slate-400">{bq.subject}</span>
                        </div>
                        <p className="text-sm font-medium text-slate-800 mt-1 truncate">
                          {bq.question}
                        </p>
                      </div>

                      <button
                        disabled={alreadyInExam}
                        onClick={() => handleAddQuestionToExam(bq.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition ${
                          alreadyInExam
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                      >
                        {alreadyInExam ? 'Added ✓' : 'Add to Exam'}
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Question On the Fly */}
      {isCreateQuestionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Create & Insert Question</h3>
              <button onClick={() => setIsCreateQuestionOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-4">
              <QuestionBuilderForm
                onSubmit={handleCreateNewQuestionAndAdd}
                onCancel={() => setIsCreateQuestionOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Section */}
      {isAddSectionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Add Exam Section</h3>
            <form onSubmit={handleAddSection} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Section Name
                </label>
                <input
                  type="text"
                  required
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  placeholder="e.g. Section B: Map Reading & Field Craft"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Section Instructions (Optional)
                </label>
                <textarea
                  rows={2}
                  value={newSectionInstructions}
                  onChange={(e) => setNewSectionInstructions(e.target.value)}
                  placeholder="Instructions specific to this section..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddSectionOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs"
                >
                  Save Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Exam Preview Mode Modal (Requirement 32) */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-4xl w-full h-[88vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
            {/* Preview Banner */}
            <div className="px-6 py-3 bg-amber-500 text-slate-950 text-xs font-bold uppercase tracking-wider flex items-center justify-between">
              <span>Admin Preview Mode — Simulating Cadet View</span>
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="bg-slate-900/10 hover:bg-slate-900/20 text-slate-950 px-2.5 py-1 rounded-md"
              >
                Exit Preview ✕
              </button>
            </div>

            {/* Simulated Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-base">{exam.title}</h3>
                <span className="text-xs text-slate-500">
                  Total Marks: {calculatedTotalMarks} • Duration: {exam.duration} mins
                </span>
              </div>
              <div className="text-xs font-mono font-bold bg-slate-900 text-white px-3 py-1.5 rounded-lg">
                Time Remaining: {exam.duration}:00
              </div>
            </div>

            {/* Question Renderer Body */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8">
              {exam.examQuestions.length === 0 ? (
                <div className="text-center py-16 text-slate-400">No questions to preview.</div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                      Question {previewQuestionIndex + 1} of {exam.examQuestions.length}
                    </span>
                    <span className="text-xs font-semibold text-slate-600">
                      Marks: {exam.examQuestions[previewQuestionIndex]?.marks}
                    </span>
                  </div>

                  <QuestionRenderer
                    question={exam.examQuestions[previewQuestionIndex]?.question}
                    answer={{}}
                    onChange={() => {}}
                  />
                </div>
              )}
            </div>

            {/* Preview Navigator Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                disabled={previewQuestionIndex === 0}
                onClick={() => setPreviewQuestionIndex((i) => Math.max(0, i - 1))}
                className="px-4 py-2 text-sm font-semibold rounded-xl border border-slate-300 bg-white text-slate-700 disabled:opacity-40"
              >
                Previous Question
              </button>

              <div className="flex items-center gap-1.5 overflow-x-auto max-w-md py-1">
                {exam.examQuestions.map((_: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setPreviewQuestionIndex(idx)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition ${
                      idx === previewQuestionIndex
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>

              <button
                disabled={previewQuestionIndex === exam.examQuestions.length - 1}
                onClick={() => setPreviewQuestionIndex((i) => Math.min(exam.examQuestions.length - 1, i + 1))}
                className="px-4 py-2 text-sm font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40"
              >
                Next Question
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
