'use client';

import React, { useState } from 'react';
import { ArrowUp, ArrowDown, Check, Image as ImageIcon } from 'lucide-react';

export interface QuestionData {
  type: string;
  question: string;
  imageUrl?: string | null;
  marks?: number;
  negativeMarks?: number;
  isMultipleCorrect?: boolean;
  maxWordCount?: number | null;
  options?: { id: string; text: string; order?: number }[];
  pairs?: { id: string; leftItem: string; rightItem: string; order?: number }[];
}

export interface StudentAnswerState {
  selectedOptionIds?: string[];
  textAnswer?: string;
  matchedPairs?: Record<string, string>;
  orderedItemIds?: string[];
}

interface QuestionRendererProps {
  question: QuestionData;
  answer: StudentAnswerState;
  onChange: (updatedAnswer: StudentAnswerState) => void;
  disabled?: boolean;
}

export function QuestionRenderer({
  question,
  answer,
  onChange,
  disabled = false,
}: QuestionRendererProps) {
  const selectedOptionIds = answer?.selectedOptionIds || [];
  const textAnswer = answer?.textAnswer || '';
  const matchedPairs = answer?.matchedPairs || {};
  const [orderedList, setOrderedList] = useState<string[]>(() => {
    if (answer?.orderedItemIds && answer.orderedItemIds.length > 0) {
      return answer.orderedItemIds;
    }
    return (question.options || []).map((o) => o.id);
  });

  // 1. MCQ Selection Handler
  const handleOptionSelect = (optionId: string) => {
    if (disabled) return;
    if (question.isMultipleCorrect) {
      const exists = selectedOptionIds.includes(optionId);
      const next = exists
        ? selectedOptionIds.filter((id) => id !== optionId)
        : [...selectedOptionIds, optionId];
      onChange({ ...answer, selectedOptionIds: next });
    } else {
      onChange({ ...answer, selectedOptionIds: [optionId] });
    }
  };

  // 2. Ordering Shift Handler
  const moveOrderItem = (currentIndex: number, direction: 'UP' | 'DOWN') => {
    if (disabled) return;
    const targetIndex = direction === 'UP' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= orderedList.length) return;

    const copy = [...orderedList];
    const temp = copy[currentIndex];
    copy[currentIndex] = copy[targetIndex];
    copy[targetIndex] = temp;

    setOrderedList(copy);
    onChange({ ...answer, orderedItemIds: copy });
  };

  // 3. Match Pairs Handler
  const handlePairMatch = (pairId: string, matchedRightText: string) => {
    if (disabled) return;
    const nextPairs = { ...matchedPairs, [pairId]: matchedRightText };
    onChange({ ...answer, matchedPairs: nextPairs });
  };

  // Count words in long answer
  const currentWords = textAnswer.trim() ? textAnswer.trim().split(/\s+/).length : 0;

  return (
    <div className="space-y-6">
      {/* Question Header & Image */}
      <div>
        <div className="text-lg font-medium text-slate-900 dark:text-slate-100 leading-relaxed whitespace-pre-wrap">
          {question.question}
        </div>

        {question.imageUrl && (
          <div className="mt-4 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 max-w-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={question.imageUrl}
              alt="Question illustration"
              className="w-full h-auto object-cover max-h-80"
            />
          </div>
        )}
      </div>

      {/* A & B: MCQ & True/False */}
      {(question.type === 'MCQ' || question.type === 'TRUE_FALSE') && (
        <div className="space-y-3 pt-2">
          {question.isMultipleCorrect && (
            <p className="text-xs font-semibold uppercase tracking-wider text-[#133E87] dark:text-sky-300 bg-[#EEF5FC] dark:bg-sky-950/40 px-3 py-1.5 rounded-lg inline-block border border-[#133E87]/20 dark:border-sky-800/40">
              Multiple Choices: Select all that apply
            </p>
          )}

          <div className="grid gap-2.5">
            {(question.options || []).map((opt, idx) => {
              const isSelected = selectedOptionIds.includes(opt.id);
              const labelLetter = String.fromCharCode(65 + idx);

              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleOptionSelect(opt.id)}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-[#133E87]/10 dark:bg-[#133E87]/30 border-[#133E87] dark:border-sky-500 text-slate-900 dark:text-white ring-2 ring-[#133E87] dark:ring-sky-500 shadow-sm'
                      : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-[#4A90E2] dark:hover:border-slate-600 hover:bg-[#EEF5FC]/60 dark:hover:bg-slate-750'
                  }`}
                >
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition ${
                      isSelected
                        ? 'bg-[#133E87] dark:bg-sky-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {isSelected ? <Check className="w-4 h-4" /> : labelLetter}
                  </span>
                  <span className="text-sm font-medium leading-snug">{opt.text}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* C: Fill in the Blanks */}
      {question.type === 'FILL_BLANKS' && (
        <div className="pt-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Your Answer:
          </label>
          <input
            type="text"
            disabled={disabled}
            value={textAnswer}
            onChange={(e) => onChange({ ...answer, textAnswer: e.target.value })}
            placeholder="Type your answer here..."
            className="w-full max-w-lg px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#133E87] dark:focus:ring-sky-500 focus:border-[#133E87] bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-base"
          />
        </div>
      )}

      {/* D & E: Short & Long Answer */}
      {(question.type === 'SHORT_ANSWER' || question.type === 'LONG_ANSWER') && (
        <div className="pt-2 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <span>{question.type === 'LONG_ANSWER' ? 'Descriptive Response' : 'Brief Explanation'}</span>
            {question.maxWordCount && (
              <span
                className={`${
                  currentWords > question.maxWordCount ? 'text-[#B71C1C] dark:text-rose-400 font-bold' : 'text-slate-400'
                }`}
              >
                {currentWords} / {question.maxWordCount} words
              </span>
            )}
          </div>
          <textarea
            disabled={disabled}
            rows={question.type === 'LONG_ANSWER' ? 7 : 4}
            value={textAnswer}
            onChange={(e) => onChange({ ...answer, textAnswer: e.target.value })}
            placeholder={
              question.type === 'LONG_ANSWER'
                ? 'Compose your detailed descriptive response here...'
                : 'Write your concise answer here...'
            }
            className="w-full p-4 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#133E87] focus:border-[#133E87] bg-white text-slate-900 placeholder:text-slate-400 text-base sm:text-sm leading-relaxed"
          />
        </div>
      )}

      {/* F: Match the Following */}
      {question.type === 'MATCH_FOLLOWING' && (
        <div className="pt-2 space-y-4">
          <p className="text-xs text-slate-500 font-medium">
            Match each item in Column A with its correct pair in Column B:
          </p>
          <div className="grid gap-3">
            {(question.pairs || []).map((pair, idx) => (
              <div
                key={pair.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/50"
              >
                <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-800">
                  <span className="w-6 h-6 rounded-md bg-[#EEF5FC] text-[#133E87] border border-[#133E87]/20 flex items-center justify-center text-xs font-bold shrink-0">
                    {idx + 1}
                  </span>
                  <span>{pair.leftItem}</span>
                </div>
                <div className="w-full sm:w-64">
                  <select
                    disabled={disabled}
                    value={matchedPairs[pair.id] || ''}
                    onChange={(e) => handlePairMatch(pair.id, e.target.value)}
                    className="w-full px-3 py-2.5 text-base sm:text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#133E87] text-slate-800"
                  >
                    <option value="">Select match...</option>
                    {(question.pairs || []).map((p) => (
                      <option key={p.id} value={p.rightItem}>
                        {p.rightItem}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* G: Ordering / Sequence */}
      {question.type === 'ORDERING' && (
        <div className="pt-2 space-y-3">
          <p className="text-xs text-slate-500 font-medium">
            Reorder the steps into the correct sequence using the up and down arrows:
          </p>
          <div className="space-y-2">
            {orderedList.map((optId, index) => {
              const opt = (question.options || []).find((o) => o.id === optId);
              if (!opt) return null;

              return (
                <div
                  key={opt.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium text-slate-800">{opt.text}</span>
                  </div>
                  {!disabled && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => moveOrderItem(index, 'UP')}
                        aria-label="Move item up"
                        className="p-2 min-w-[36px] min-h-[36px] rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 flex items-center justify-center disabled:opacity-30 disabled:hover:bg-slate-100 transition"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        disabled={index === orderedList.length - 1}
                        onClick={() => moveOrderItem(index, 'DOWN')}
                        aria-label="Move item down"
                        className="p-2 min-w-[36px] min-h-[36px] rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 flex items-center justify-center disabled:opacity-30 disabled:hover:bg-slate-100 transition"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
