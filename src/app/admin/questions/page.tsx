'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  HelpCircle,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Image as ImageIcon,
  CheckCircle2,
  X,
} from 'lucide-react';
import { useToast } from '@/components/Toast';
import { QuestionBuilderForm } from '@/components/QuestionBuilderForm';
import { ConfirmDialog } from '@/components/ConfirmDialog';

export default function AdminQuestionsPage() {
  const { success, error } = useToast();
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [difficultyFilter, setDifficultyFilter] = useState('ALL');
  const [subjectFilter, setSubjectFilter] = useState('ALL');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);

  const loadQuestions = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = new URL('/api/admin/questions', window.location.origin);
      if (search) url.searchParams.set('search', search);
      if (typeFilter !== 'ALL') url.searchParams.set('type', typeFilter);
      if (difficultyFilter !== 'ALL') url.searchParams.set('difficulty', difficultyFilter);
      if (subjectFilter !== 'ALL') url.searchParams.set('subject', subjectFilter);

      const res = await fetch(url.toString());
      const data = await res.json();
      setQuestions(data.questions || []);
    } catch {
      error('Failed to load questions');
    } finally {
      setIsLoading(false);
    }
  }, [search, typeFilter, difficultyFilter, subjectFilter, error]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const handleCreate = async (formData: any) => {
    try {
      const res = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      success('Question created in Question Bank');
      setIsCreateModalOpen(false);
      loadQuestions();
    } catch (err: any) {
      error(err.message || 'Creation failed');
    }
  };

  const handleUpdate = async (formData: any) => {
    try {
      const res = await fetch(`/api/admin/questions/${selectedQuestion.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      success('Question updated successfully');
      setIsEditModalOpen(false);
      loadQuestions();
    } catch (err: any) {
      error(err.message || 'Update failed');
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/admin/questions/${selectedQuestion.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Delete failed');

      success('Question deleted from Question Bank');
      setIsDeleteDialogOpen(false);
      loadQuestions();
    } catch (err: any) {
      error(err.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Question Authoring & Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Author and maintain questions across all 8 supported question archetypes.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Author Question</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions or keywords..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Question Types</option>
            <option value="MCQ">MCQ</option>
            <option value="TRUE_FALSE">True / False</option>
            <option value="FILL_BLANKS">Fill in Blanks</option>
            <option value="MATCH_FOLLOWING">Match the Following</option>
            <option value="ORDERING">Ordering Sequence</option>
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
        </div>
      </div>

      {/* Questions Cards List */}
      <div className="space-y-3.5">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 animate-pulse">Loading questions...</div>
        ) : questions.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            No questions found. Click &apos;Author Question&apos; to add one!
          </div>
        ) : (
          questions.map((q) => (
            <div
              key={q.id}
              className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                      {q.type.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">{q.subject}</span>
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
                    {q.imageUrl && (
                      <span className="text-[10px] flex items-center gap-1 text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                        <ImageIcon className="w-3 h-3" /> Image attached
                      </span>
                    )}
                  </div>

                  <h3 className="mt-2 text-sm font-semibold text-slate-900 leading-snug">
                    {q.question}
                  </h3>

                  {/* Options/Answers Preview */}
                  {q.type === 'MCQ' && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {q.options.map((opt: any) => (
                        <span
                          key={opt.id}
                          className={`text-xs px-2.5 py-1 rounded-lg border ${
                            opt.isCorrect
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold'
                              : 'bg-slate-50 border-slate-200 text-slate-600'
                          }`}
                        >
                          {opt.text} {opt.isCorrect && '✓'}
                        </span>
                      ))}
                    </div>
                  )}

                  {q.type === 'FILL_BLANKS' && q.acceptedAnswersJson && (
                    <div className="mt-2 text-xs text-slate-500">
                      <span className="font-semibold">Accepted Answers: </span>
                      {JSON.parse(q.acceptedAnswersJson).join(', ')}
                    </div>
                  )}

                  {q.type === 'MATCH_FOLLOWING' && (
                    <div className="mt-2 text-xs text-slate-500">
                      <span className="font-semibold">Pairs: </span>
                      {q.pairs.map((p: any) => `${p.leftItem} ↔ ${p.rightItem}`).join(' | ')}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-bold bg-slate-50 border border-slate-200 text-slate-800 px-2.5 py-1 rounded-lg">
                    {q.defaultMarks} Marks
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setSelectedQuestion(q);
                        setIsEditModalOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg"
                      title="Edit Question"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedQuestion(q);
                        setIsDeleteDialogOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                      title="Delete Question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Author New Question</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-4">
              <QuestionBuilderForm
                onSubmit={handleCreate}
                onCancel={() => setIsCreateModalOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && selectedQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Edit Question</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-4">
              <QuestionBuilderForm
                initialData={selectedQuestion}
                onSubmit={handleUpdate}
                onCancel={() => setIsEditModalOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        title="Delete Question"
        message="Are you sure you want to permanently delete this question from the Question Bank?"
        confirmLabel="Delete Question"
        isDestructive={true}
        onConfirm={handleDelete}
        onCancel={() => setIsDeleteDialogOpen(false)}
      />
    </div>
  );
}
