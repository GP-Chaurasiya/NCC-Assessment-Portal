'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  FolderKanban,
  Search,
  Plus,
  BookOpen,
  Filter,
  CheckSquare,
  Square,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function QuestionBankPage() {
  const { success, error } = useToast();
  const [questions, setQuestions] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('ALL');
  const [difficultyFilter, setDifficultyFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Multi-selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [targetExamId, setTargetExamId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const qUrl = new URL('/api/admin/questions', window.location.origin);
      if (search) qUrl.searchParams.set('search', search);
      if (subjectFilter !== 'ALL') qUrl.searchParams.set('subject', subjectFilter);
      if (difficultyFilter !== 'ALL') qUrl.searchParams.set('difficulty', difficultyFilter);
      if (typeFilter !== 'ALL') qUrl.searchParams.set('type', typeFilter);

      const [qRes, eRes] = await Promise.all([
        fetch(qUrl.toString()),
        fetch('/api/admin/exams'),
      ]);

      const qData = await qRes.json();
      const eData = await eRes.json();

      setQuestions(qData.questions || []);
      setExams(eData.exams || []);
    } catch {
      error('Failed to load question repository');
    } finally {
      setIsLoading(false);
    }
  }, [search, subjectFilter, difficultyFilter, typeFilter, error]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === questions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(questions.map((q) => q.id));
    }
  };

  const handleBatchAssign = async () => {
    if (!targetExamId) {
      error('Please select a target examination.');
      return;
    }
    if (selectedIds.length === 0) {
      error('Please select at least one question.');
      return;
    }

    setIsAssigning(true);
    try {
      for (const qId of selectedIds) {
        await fetch(`/api/admin/exams/${targetExamId}/builder`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'ADD_QUESTION', questionId: qId }),
        });
      }

      success(`Successfully added ${selectedIds.length} questions to the selected exam!`);
      setSelectedIds([]);
      setTargetExamId('');
    } catch {
      error('Failed to assign questions');
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Question Bank Repository
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Centralized reusable repository. Filter, search, and batch-deploy into active exams.
          </p>
        </div>

        <Link
          href="/admin/questions"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Question</span>
        </Link>
      </div>

      {/* Batch Action Strip */}
      {selectedIds.length > 0 && (
        <div className="p-4 rounded-2xl bg-indigo-600 text-white flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md animate-fade-in">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <CheckSquare className="w-4 h-4" />
            <span>{selectedIds.length} Questions Selected</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={targetExamId}
              onChange={(e) => setTargetExamId(e.target.value)}
              className="px-3 py-2 rounded-xl text-slate-900 text-xs font-semibold bg-white focus:outline-none"
            >
              <option value="">Select Target Exam...</option>
              {exams.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title} ({e.examCode})
                </option>
              ))}
            </select>

            <button
              onClick={handleBatchAssign}
              disabled={isAssigning || !targetExamId}
              className="px-4 py-2 rounded-xl bg-white text-indigo-700 font-bold text-xs hover:bg-indigo-50 transition disabled:opacity-50"
            >
              {isAssigning ? 'Deploying...' : 'Add to Exam'}
            </button>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search keywords in repository..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Types</option>
            <option value="MCQ">MCQ</option>
            <option value="TRUE_FALSE">True / False</option>
            <option value="FILL_BLANKS">Fill in Blanks</option>
            <option value="MATCH_FOLLOWING">Match Following</option>
            <option value="ORDERING">Ordering</option>
            <option value="SHORT_ANSWER">Short Answer</option>
            <option value="LONG_ANSWER">Long Answer</option>
          </select>

          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Difficulties</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>

          <button
            onClick={selectAll}
            className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-600 transition"
          >
            {selectedIds.length === questions.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>
      </div>

      {/* Question Bank Cards */}
      <div className="grid grid-cols-1 gap-3">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 animate-pulse">Loading repository...</div>
        ) : questions.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            No questions found in this category.
          </div>
        ) : (
          questions.map((q) => {
            const isSelected = selectedIds.includes(q.id);

            return (
              <div
                key={q.id}
                onClick={() => toggleSelect(q.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-50/60 border-indigo-500 shadow-xs'
                    : 'bg-white border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="pt-0.5 text-indigo-600">
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-300" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                        {q.type.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-slate-500 font-semibold">{q.subject}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          q.difficulty === 'EASY'
                            ? 'bg-emerald-50 text-emerald-700'
                            : q.difficulty === 'HARD'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {q.difficulty}
                      </span>
                      <span className="text-xs text-slate-400 ml-auto">
                        In {q._count?.examQuestions || 0} exams
                      </span>
                    </div>

                    <p className="mt-2 text-sm font-semibold text-slate-900 leading-snug">
                      {q.question}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
