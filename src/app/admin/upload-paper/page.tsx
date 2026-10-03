'use client';

import React, { useState, useEffect } from 'react';
import {
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Edit2,
  Trash2,
  ArrowRight,
  Sparkles,
  Save,
  Check,
} from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function UploadPaperPage() {
  const { success, error } = useToast();

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('NCC Military Training');
  const [rawText, setRawText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Staged questions
  const [stagedQuestions, setStagedQuestions] = useState<any[]>([]);
  const [activePaperId, setActivePaperId] = useState<string | null>(null);

  // Target exam
  const [exams, setExams] = useState<any[]>([]);
  const [targetExamId, setTargetExamId] = useState('');
  const [isSavingApproved, setIsSavingApproved] = useState(false);

  // Load existing papers and exams
  useEffect(() => {
    async function loadData() {
      try {
        const [papersRes, examsRes] = await Promise.all([
          fetch('/api/admin/upload-paper'),
          fetch('/api/admin/exams'),
        ]);
        const pData = await papersRes.json();
        const eData = await examsRes.json();

        setExams(eData.exams || []);

        // Load existing pending review questions if any
        if (pData.papers && pData.papers.length > 0) {
          const pendingPaper = pData.papers.find((p: any) => p.status === 'PENDING_REVIEW');
          if (pendingPaper) {
            setActivePaperId(pendingPaper.id);
            setStagedQuestions(pendingPaper.questions || []);
            setTitle(pendingPaper.title);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadData();
  }, []);

  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !rawText.trim()) {
      error('Please provide both paper title and text content');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch('/api/admin/upload-paper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          subject,
          rawContent: rawText,
          fileType: 'TXT',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      success(data.message);
      setActivePaperId(data.paper.id);
      setStagedQuestions(data.paper.questions);
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Sample template loader for quick test
  const loadSamplePaper = () => {
    setTitle("NCC 'C' Certificate Sample Paper 2026");
    setSubject('Weapon Training & Drill');
    setRawText(`1. What is the effective range of the 5.56mm INSAS rifle?
A) 200 meters
B) 400 meters
C) 600 meters
D) 800 meters
Answer: B

2. In open order drill, the squad marches with an interval of 30 inches between ranks.
A) True
B) False
Ans: True

3. The compass used in Indian military navigation is known as the ______ compass.
Ans: Liquid Prismatic

4. What is the length of pace in standard Quick March?
A) 30 inches
B) 33 inches
C) 40 inches
D) 25 inches
Answer: A`);
  };

  // Staging edits
  const updateQuestionText = (index: number, text: string) => {
    const copy = [...stagedQuestions];
    copy[index].question = text;
    setStagedQuestions(copy);
  };

  const updateQuestionType = (index: number, type: any) => {
    const copy = [...stagedQuestions];
    copy[index].type = type;
    setStagedQuestions(copy);
  };

  const updateQuestionMarks = (index: number, marks: number) => {
    const copy = [...stagedQuestions];
    copy[index].marks = marks;
    setStagedQuestions(copy);
  };

  const updateOptionText = (qIndex: number, optIndex: number, text: string) => {
    const copy = [...stagedQuestions];
    copy[qIndex].options[optIndex] = text;
    setStagedQuestions(copy);
  };

  const setCorrectOption = (qIndex: number, optIndex: number) => {
    const copy = [...stagedQuestions];
    copy[qIndex].correctIndex = optIndex;
    setStagedQuestions(copy);
  };

  const removeStagedQuestion = (index: number) => {
    setStagedQuestions(stagedQuestions.filter((_, i) => i !== index));
  };

  // Approve & Save
  const handleApproveAndSave = async () => {
    if (stagedQuestions.length === 0) {
      error('No staged questions to approve.');
      return;
    }

    setIsSavingApproved(true);
    try {
      const res = await fetch('/api/admin/upload-paper/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paperId: activePaperId,
          approvedQuestions: stagedQuestions,
          examId: targetExamId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      success(data.message);
      setStagedQuestions([]);
      setRawText('');
      setTitle('');
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsSavingApproved(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Upload Existing Question Paper
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Import and extract questions from legacy PDF, DOCX, or scanned papers. Review and verify
          every item in staging before approving into the repository.
        </p>
      </div>

      {/* Upload & Extraction Input Box */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <Upload className="w-4 h-4 text-indigo-600" />
            <span>1. Question Paper Input</span>
          </h2>
          <button
            type="button"
            onClick={loadSamplePaper}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Load Sample Paper Text
          </button>
        </div>

        <form onSubmit={handleExtract} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Paper Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. NCC Annual Training Camp 2025 Test"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Default Subject
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Paper Content (Paste raw text, OCR output, or formatted questions)
            </label>
            <textarea
              rows={8}
              required
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste numbered questions here, for example:&#10;1. What is the caliber of the INSAS rifle?&#10;A) 5.56mm&#10;B) 7.62mm&#10;Answer: A"
              className="w-full p-4 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isProcessing}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm transition flex items-center gap-2"
            >
              {isProcessing && (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              <FileText className="w-4 h-4" />
              <span>Extract & Stage Questions</span>
            </button>
          </div>
        </form>
      </div>

      {/* STAGING AREA: Needs Review Workflow (Requirement 8) */}
      {stagedQuestions.length > 0 && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-amber-900 font-semibold text-sm">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>
                {stagedQuestions.length} Questions Extracted — All Items Marked &quot;Needs Review&quot;
              </span>
            </div>
            <p className="text-xs text-amber-700 max-w-md">
              Please verify question text, answer keys, and assigned marks before publishing.
            </p>
          </div>

          {/* Staged Question Items */}
          <div className="space-y-4">
            {stagedQuestions.map((q, qIdx) => (
              <div
                key={q.tempId || qIdx}
                className="p-5 rounded-2xl bg-white border border-amber-200/80 shadow-xs space-y-4"
              >
                <div className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center">
                      {qIdx + 1}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800">
                      Needs Review
                    </span>
                    <select
                      value={q.type}
                      onChange={(e) => updateQuestionType(qIdx, e.target.value)}
                      className="text-xs font-semibold px-2 py-1 rounded-md border border-slate-300 bg-white"
                    >
                      <option value="MCQ">MCQ</option>
                      <option value="TRUE_FALSE">True / False</option>
                      <option value="FILL_BLANKS">Fill in Blanks</option>
                      <option value="SHORT_ANSWER">Short Answer</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="font-semibold text-slate-500">Marks:</span>
                      <input
                        type="number"
                        min="0.5"
                        step="0.5"
                        value={q.marks}
                        onChange={(e) => updateQuestionMarks(qIdx, parseFloat(e.target.value) || 1)}
                        className="w-14 px-2 py-0.5 rounded border border-slate-300 text-xs font-bold"
                      />
                    </div>
                    <button
                      onClick={() => removeStagedQuestion(qIdx)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Editable Question Text */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Question Text
                  </label>
                  <input
                    type="text"
                    value={q.question}
                    onChange={(e) => updateQuestionText(qIdx, e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900"
                  />
                </div>

                {/* Editable Options & Answers */}
                {q.options && q.options.length > 0 && (
                  <div className="space-y-2">
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase">
                      Options & Correct Answer (Select the radio to mark correct option)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((optText: string, optIdx: number) => {
                        const isCorrect = q.correctIndex === optIdx;
                        return (
                          <div
                            key={optIdx}
                            className={`flex items-center gap-2 p-2 rounded-xl border ${
                              isCorrect
                                ? 'bg-emerald-50 border-emerald-300'
                                : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`correct-${qIdx}`}
                              checked={isCorrect}
                              onChange={() => setCorrectOption(qIdx, optIdx)}
                              className="w-4 h-4 text-emerald-600"
                            />
                            <input
                              type="text"
                              value={optText}
                              onChange={(e) => updateOptionText(qIdx, optIdx, e.target.value)}
                              className="flex-1 bg-transparent text-xs font-medium text-slate-800 focus:outline-none"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Staging Approval Actions Bar */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Optional: Add Directly to Exam
              </span>
              <select
                value={targetExamId}
                onChange={(e) => setTargetExamId(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-800"
              >
                <option value="">Do not attach to an exam (Save to Bank only)</option>
                {exams.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title} ({e.examCode})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleApproveAndSave}
              disabled={isSavingApproved}
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition flex items-center gap-2 disabled:opacity-50"
            >
              {isSavingApproved && (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              <Check className="w-4 h-4" />
              <span>Approve All Questions & Import</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
