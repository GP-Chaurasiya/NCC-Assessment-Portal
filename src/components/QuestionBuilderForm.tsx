'use client';

import React, { useState } from 'react';
import { Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

interface QuestionFormState {
  type: string;
  question: string;
  subject: string;
  topic: string;
  difficulty: string;
  defaultMarks: number;
  negativeMarks: number;
  explanation: string;
  imageUrl: string;
  isMultipleCorrect: boolean;
  caseSensitive: boolean;
  acceptedAnswers: string[];
  expectedAnswer: string;
  maxWordCount: number;
  options: { text: string; isCorrect: boolean }[];
  pairs: { leftItem: string; rightItem: string }[];
}

interface QuestionBuilderFormProps {
  initialData?: any;
  onSubmit: (formData: any) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function QuestionBuilderForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: QuestionBuilderFormProps) {
  const [form, setForm] = useState<QuestionFormState>(() => {
    if (initialData) {
      return {
        type: initialData.type || 'MCQ',
        question: initialData.question || '',
        subject: initialData.subject || 'NCC General',
        topic: initialData.topic || '',
        difficulty: initialData.difficulty || 'MEDIUM',
        defaultMarks: initialData.defaultMarks || 1,
        negativeMarks: initialData.negativeMarks || 0,
        explanation: initialData.explanation || '',
        imageUrl: initialData.imageUrl || '',
        isMultipleCorrect: initialData.isMultipleCorrect || false,
        caseSensitive: initialData.caseSensitive || false,
        acceptedAnswers: initialData.acceptedAnswersJson
          ? JSON.parse(initialData.acceptedAnswersJson)
          : [''],
        expectedAnswer: initialData.expectedAnswer || '',
        maxWordCount: initialData.maxWordCount || 200,
        options:
          initialData.options && initialData.options.length > 0
            ? initialData.options.map((o: any) => ({
                text: o.text,
                isCorrect: Boolean(o.isCorrect),
              }))
            : [
                { text: '', isCorrect: true },
                { text: '', isCorrect: false },
                { text: '', isCorrect: false },
                { text: '', isCorrect: false },
              ],
        pairs:
          initialData.pairs && initialData.pairs.length > 0
            ? initialData.pairs.map((p: any) => ({
                leftItem: p.leftItem,
                rightItem: p.rightItem,
              }))
            : [
                { leftItem: '', rightItem: '' },
                { leftItem: '', rightItem: '' },
              ],
      };
    }

    return {
      type: 'MCQ',
      question: '',
      subject: 'NCC General',
      topic: '',
      difficulty: 'MEDIUM',
      defaultMarks: 2,
      negativeMarks: 0.5,
      explanation: '',
      imageUrl: '',
      isMultipleCorrect: false,
      caseSensitive: false,
      acceptedAnswers: [''],
      expectedAnswer: '',
      maxWordCount: 200,
      options: [
        { text: '', isCorrect: true },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
      ],
      pairs: [
        { leftItem: '', rightItem: '' },
        { leftItem: '', rightItem: '' },
      ],
    };
  });

  const [validationError, setValidationError] = useState<string | null>(null);

  // Type change helper
  const handleTypeChange = (newType: string) => {
    let nextOptions = [...form.options];
    if (newType === 'TRUE_FALSE') {
      nextOptions = [
        { text: 'True', isCorrect: true },
        { text: 'False', isCorrect: false },
      ];
    } else if (newType === 'MCQ' && nextOptions.length < 2) {
      nextOptions = [
        { text: '', isCorrect: true },
        { text: '', isCorrect: false },
      ];
    }
    setForm({ ...form, type: newType, options: nextOptions });
  };

  // Option operations
  const addOption = () => {
    setForm({
      ...form,
      options: [...form.options, { text: '', isCorrect: false }],
    });
  };

  const removeOption = (idx: number) => {
    if (form.options.length <= 2) return;
    setForm({
      ...form,
      options: form.options.filter((_, i) => i !== idx),
    });
  };

  const updateOptionText = (idx: number, text: string) => {
    const copy = [...form.options];
    copy[idx].text = text;
    setForm({ ...form, options: copy });
  };

  const toggleOptionCorrect = (idx: number) => {
    const copy = [...form.options];
    if (form.isMultipleCorrect) {
      copy[idx].isCorrect = !copy[idx].isCorrect;
    } else {
      copy.forEach((o, i) => {
        o.isCorrect = i === idx;
      });
    }
    setForm({ ...form, options: copy });
  };

  // Pairs operations
  const addPair = () => {
    setForm({
      ...form,
      pairs: [...form.pairs, { leftItem: '', rightItem: '' }],
    });
  };

  const removePair = (idx: number) => {
    if (form.pairs.length <= 1) return;
    setForm({
      ...form,
      pairs: form.pairs.filter((_, i) => i !== idx),
    });
  };

  const updatePair = (idx: number, field: 'leftItem' | 'rightItem', value: string) => {
    const copy = [...form.pairs];
    copy[idx][field] = value;
    setForm({ ...form, pairs: copy });
  };

  // Accepted answers for fill in the blank
  const addAcceptedAnswer = () => {
    setForm({ ...form, acceptedAnswers: [...form.acceptedAnswers, ''] });
  };

  const updateAcceptedAnswer = (idx: number, val: string) => {
    const copy = [...form.acceptedAnswers];
    copy[idx] = val;
    setForm({ ...form, acceptedAnswers: copy });
  };

  const removeAcceptedAnswer = (idx: number) => {
    if (form.acceptedAnswers.length <= 1) return;
    setForm({ ...form, acceptedAnswers: form.acceptedAnswers.filter((_, i) => i !== idx) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!form.question.trim()) {
      setValidationError('Question text is required.');
      return;
    }

    if (!form.subject.trim()) {
      setValidationError('Subject is required.');
      return;
    }

    // Type specific checks
    if (form.type === 'MCQ' || form.type === 'TRUE_FALSE') {
      const hasCorrect = form.options.some((o) => o.isCorrect);
      if (!hasCorrect) {
        setValidationError('Please mark at least one correct option.');
        return;
      }
      const hasEmpty = form.options.some((o) => !o.text.trim());
      if (hasEmpty) {
        setValidationError('All options must contain text.');
        return;
      }
    }

    if (form.type === 'FILL_BLANKS') {
      const cleanAccepted = form.acceptedAnswers.filter((a) => a.trim().length > 0);
      if (cleanAccepted.length === 0) {
        setValidationError('At least one accepted answer is required for Fill in the Blanks.');
        return;
      }
    }

    if (form.type === 'MATCH_FOLLOWING') {
      const hasEmpty = form.pairs.some((p) => !p.leftItem.trim() || !p.rightItem.trim());
      if (hasEmpty) {
        setValidationError('All match pairs must have both Column A and Column B values.');
        return;
      }
    }

    await onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {validationError && (
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Row 1: Type & Subject & Difficulty */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Question Type
          </label>
          <select
            value={form.type}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="MCQ">Multiple Choice Question (MCQ)</option>
            <option value="TRUE_FALSE">True / False</option>
            <option value="FILL_BLANKS">Fill in the Blanks</option>
            <option value="SHORT_ANSWER">Short Answer</option>
            <option value="LONG_ANSWER">Long Answer / Descriptive</option>
            <option value="MATCH_FOLLOWING">Match the Following</option>
            <option value="ORDERING">Ordering / Arrange in Order</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Subject
          </label>
          <input
            type="text"
            required
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            placeholder="e.g. Weapon Training, Map Reading"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Difficulty
          </label>
          <select
            value={form.difficulty}
            onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>
        </div>
      </div>

      {/* Row 2: Marks & Negative Marking */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Marks Awarded
          </label>
          <input
            type="number"
            step="0.5"
            min="0.5"
            value={form.defaultMarks}
            onChange={(e) => setForm({ ...form, defaultMarks: parseFloat(e.target.value) || 1 })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Negative Marks (Deduction)
          </label>
          <input
            type="number"
            step="0.25"
            min="0"
            value={form.negativeMarks}
            onChange={(e) => setForm({ ...form, negativeMarks: parseFloat(e.target.value) || 0 })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Topic (Optional)
          </label>
          <input
            type="text"
            value={form.topic}
            onChange={(e) => setForm({ ...form, topic: e.target.value })}
            placeholder="e.g. Compass, Rifle Range"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Question Text */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
          Question Text
        </label>
        <textarea
          rows={3}
          required
          value={form.question}
          onChange={(e) => setForm({ ...form, question: e.target.value })}
          placeholder={
            form.type === 'FILL_BLANKS'
              ? 'Enter question with blank placeholder, e.g. "The primary rifle used is ______."'
              : 'Write your question description here...'
          }
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        />
      </div>

      {/* Optional Image URL */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
          Image URL (Optional illustration: JPG, PNG, WEBP)
        </label>
        <input
          type="text"
          value={form.imageUrl}
          onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
          placeholder="https://... or /images/..."
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        />
      </div>

      {/* DYNAMIC FIELD SECTION BASED ON QUESTION TYPE */}

      {/* 1. MCQ Dynamic Fields */}
      {form.type === 'MCQ' && (
        <div className="space-y-4 pt-2 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-800">Options & Correct Answer</span>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isMultipleCorrect}
                onChange={(e) => setForm({ ...form, isMultipleCorrect: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              Allow Multiple Correct Answers
            </label>
          </div>

          <div className="space-y-2.5">
            {form.options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => toggleOptionCorrect(idx)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${
                    opt.isCorrect
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {opt.isCorrect ? 'Correct ✓' : 'Mark Correct'}
                </button>
                <input
                  type="text"
                  required
                  value={opt.text}
                  onChange={(e) => updateOptionText(idx, e.target.value)}
                  placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                {form.options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(idx)}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addOption}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg"
          >
            <Plus className="w-4 h-4" /> Add Another Option
          </button>
        </div>
      )}

      {/* 2. TRUE_FALSE Dynamic Fields */}
      {form.type === 'TRUE_FALSE' && (
        <div className="space-y-3 pt-2 border-t border-slate-200">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Correct Answer
          </label>
          <div className="flex gap-4">
            {form.options.map((opt, idx) => (
              <label
                key={idx}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border cursor-pointer font-medium text-sm transition ${
                  opt.isCorrect
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-900 font-bold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="tf-correct"
                  checked={opt.isCorrect}
                  onChange={() => toggleOptionCorrect(idx)}
                  className="w-4 h-4 text-indigo-600"
                />
                {opt.text}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* 3. FILL_BLANKS Dynamic Fields */}
      {form.type === 'FILL_BLANKS' && (
        <div className="space-y-4 pt-2 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-800">
              Accepted Answers (Students get full marks if their input matches any of these)
            </span>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={form.caseSensitive}
                onChange={(e) => setForm({ ...form, caseSensitive: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              Case-Sensitive Matching
            </label>
          </div>

          <div className="space-y-2">
            {form.acceptedAnswers.map((ans, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  required
                  value={ans}
                  onChange={(e) => updateAcceptedAnswer(idx, e.target.value)}
                  placeholder={`Accepted Answer ${idx + 1}`}
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                {form.acceptedAnswers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeAcceptedAnswer(idx)}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addAcceptedAnswer}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg"
          >
            <Plus className="w-4 h-4" /> Add Alternative Accepted Answer
          </button>
        </div>
      )}

      {/* 4. MATCH_FOLLOWING Dynamic Fields */}
      {form.type === 'MATCH_FOLLOWING' && (
        <div className="space-y-4 pt-2 border-t border-slate-200">
          <span className="text-sm font-semibold text-slate-800">
            Define Matching Pairs (Column A ↔ Column B)
          </span>

          <div className="space-y-2.5">
            {form.pairs.map((pair, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <input
                  type="text"
                  required
                  value={pair.leftItem}
                  onChange={(e) => updatePair(idx, 'leftItem', e.target.value)}
                  placeholder={`Column A (Item ${idx + 1})`}
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <span className="text-slate-400 font-bold">↔</span>
                <input
                  type="text"
                  required
                  value={pair.rightItem}
                  onChange={(e) => updatePair(idx, 'rightItem', e.target.value)}
                  placeholder={`Column B (Match ${idx + 1})`}
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                {form.pairs.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePair(idx)}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addPair}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg"
          >
            <Plus className="w-4 h-4" /> Add Pair
          </button>
        </div>
      )}

      {/* 5. ORDERING Dynamic Fields */}
      {form.type === 'ORDERING' && (
        <div className="space-y-4 pt-2 border-t border-slate-200">
          <span className="text-sm font-semibold text-slate-800">
            Items to Arrange (Enter in their CORRECT chronological/logical order)
          </span>

          <div className="space-y-2.5">
            {form.options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <input
                  type="text"
                  required
                  value={opt.text}
                  onChange={(e) => updateOptionText(idx, e.target.value)}
                  placeholder={`Sequence Step ${idx + 1}`}
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                {form.options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(idx)}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addOption}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg"
          >
            <Plus className="w-4 h-4" /> Add Sequence Step
          </button>
        </div>
      )}

      {/* 6. SHORT & LONG ANSWER Dynamic Fields */}
      {(form.type === 'SHORT_ANSWER' || form.type === 'LONG_ANSWER') && (
        <div className="space-y-4 pt-2 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-800">
              Descriptive Evaluation Configuration
            </span>
            {form.type === 'LONG_ANSWER' && (
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-slate-600">Max Word Limit:</label>
                <input
                  type="number"
                  min="50"
                  max="2000"
                  value={form.maxWordCount}
                  onChange={(e) => setForm({ ...form, maxWordCount: parseInt(e.target.value, 10) || 200 })}
                  className="w-20 px-2 py-1 rounded-lg border border-slate-300 text-xs"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Expected Model Answer (Shown to Admin during manual grading)
            </label>
            <textarea
              rows={3}
              value={form.expectedAnswer}
              onChange={(e) => setForm({ ...form, expectedAnswer: e.target.value })}
              placeholder="Outline the key points or standard answer expected for full marks..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Explanation / Solution */}
      <div className="pt-2 border-t border-slate-200">
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
          Explanation / Solution Notes (Revealed on student result page if enabled)
        </label>
        <textarea
          rows={2}
          value={form.explanation}
          onChange={(e) => setForm({ ...form, explanation: e.target.value })}
          placeholder="Brief educational explanation of the correct answer..."
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-100 transition"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition flex items-center gap-2"
        >
          {isLoading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
          Save Question
        </button>
      </div>
    </form>
  );
}
