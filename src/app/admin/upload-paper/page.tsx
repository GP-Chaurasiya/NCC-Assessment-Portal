'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Sparkles,
  Check,
  FileType,
  X,
  Layers,
  HelpCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function UploadPaperPage() {
  const { success, error: toastError } = useToast();

  const [inputMode, setInputMode] = useState<'upload' | 'text'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('NCC Military Training');
  const [rawText, setRawText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Extraction stats
  const [extractionStats, setExtractionStats] = useState<{
    total: number;
    mcq: number;
    trueFalse: number;
    fillBlanks: number;
    shortAnswer: number;
    longAnswer: number;
  } | null>(null);

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
            if (pendingPaper.rawContent) {
              setRawText(pendingPaper.rawContent);
            }
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadData();
  }, []);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleSelectedFile(file);
    }
  };

  const handleSelectedFile = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'docx', 'txt', 'doc'].includes(ext || '')) {
      toastError('Please select a PDF (.pdf), Word (.docx), or Plain Text (.txt) document.');
      return;
    }
    setSelectedFile(file);
    if (!title.trim() || title === "NCC 'C' Certificate Sample Paper 2026") {
      const cleanTitle = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_]+/g, ' ')
        .trim();
      setTitle(cleanTitle);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleSelectedFile(file);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Extract from Document (Upload)
  const handleDocumentExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toastError('Please choose or drop a question paper document first.');
      return;
    }

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', title.trim() || selectedFile.name.replace(/\.[^/.]+$/, ''));
      formData.append('subject', subject.trim() || 'NCC Military Training');

      const res = await fetch('/api/admin/upload-paper', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to extract document');

      success(data.message || `Extracted questions with high accuracy!`);
      setActivePaperId(data.paper.id);
      setStagedQuestions(data.paper.questions || []);
      if (data.rawContent) {
        setRawText(data.rawContent);
      }
      if (data.stats) {
        setExtractionStats(data.stats);
      }
    } catch (err: any) {
      toastError(err.message || 'Extraction failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Extract from Raw Text
  const handleTextExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !rawText.trim()) {
      toastError('Please provide both paper title and text content');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch('/api/admin/upload-paper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          subject: subject.trim(),
          rawContent: rawText,
          fileType: 'TXT',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to extract questions');

      success(data.message || 'Questions extracted successfully');
      setActivePaperId(data.paper.id);
      setStagedQuestions(data.paper.questions || []);
      if (data.stats) {
        setExtractionStats(data.stats);
      }
    } catch (err: any) {
      toastError(err.message || 'Extraction failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Sample template loader for quick test
  const loadSamplePaper = () => {
    setInputMode('text');
    setTitle("NCC 'C' Certificate Army Wing Exam 2026");
    setSubject('Weapon Training & Drill');
    setRawText(`NATIONAL CADET CORPS
ANNUAL TRAINING CAMP - 2026
Time: 2 Hours                                            Max Marks: 50
General Instructions:
1. All questions are compulsory.
2. Read instructions carefully.

SECTION A: WEAPON TRAINING

1. What is the caliber of the 5.56 mm INSAS rifle? [1 Mark]
A) 5.56 mm
B) 7.62 mm
C) 9 mm
D) .22 inch
Answer: A

2. What is the effective range of the 5.56 mm INSAS rifle? [1 Mark]
(a) 300 m  (b) 400 m  (c) 500 m  (d) 100 m
Ans: (b)

3. State True or False: The full form of SLR is Self Loading Rifle. [1 Mark]
Ans: True

4. The length of .22 Deluxe Rifle is ____________ inches. [2 Marks]
Answer: 43

5. Write short note on the characteristics of 7.62mm LMG. [5 Marks]

SECTION B: DRILL & NATIONAL INTEGRATION

6. Who was the first Director General of NCC? [1 Mark]
A. Col G.G. Bewoor
B. Gen K.M. Cariappa
C. Field Marshal Sam Manekshaw
D. Lt Gen Rajeev Chopra

7. What is the motto of the National Cadet Corps? [1 Mark]
A) Unity and Faith   B) Duty and Honour   C) Unity and Discipline   D) Service Before Self

ANSWER KEY:
6. A
7. C`);
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
    if (type === 'TRUE_FALSE' && (!copy[index].options || copy[index].options.length === 0)) {
      copy[index].options = ['True', 'False'];
      copy[index].correctIndex = 0;
    }
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

  const updateAcceptedAnswer = (qIndex: number, val: string) => {
    const copy = [...stagedQuestions];
    copy[qIndex].acceptedAnswers = [val];
    copy[qIndex].expectedAnswer = val;
    setStagedQuestions(copy);
  };

  const removeStagedQuestion = (index: number) => {
    setStagedQuestions(stagedQuestions.filter((_, i) => i !== index));
  };

  // Approve & Save
  const handleApproveAndSave = async () => {
    if (stagedQuestions.length === 0) {
      toastError('No staged questions to approve.');
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

      success(data.message || 'Questions approved and added to Question Bank!');
      setStagedQuestions([]);
      setRawText('');
      setSelectedFile(null);
      setExtractionStats(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      toastError(err.message || 'Failed to approve questions');
    } finally {
      setIsSavingApproved(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
          <Upload className="w-7 h-7 text-[#133E87]" />
          <span>Upload & Ingest Question Paper</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Upload exam papers in <strong>PDF</strong>, <strong>Word (.docx)</strong>, or <strong>Text (.txt)</strong> format.
          Our high-accuracy engine automatically segments questions, detects MCQs, True/False, and Fill-in-the-Blanks, correlates answer keys, and loads them into a review queue.
        </p>
      </div>

      {/* Input Mode Selector */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setInputMode('upload')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition ${
                inputMode === 'upload'
                  ? 'bg-[#133E87] text-white shadow-sm shadow-[#133E87]/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Upload Document (PDF / DOCX / TXT)</span>
            </button>
            <button
              type="button"
              onClick={() => setInputMode('text')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition ${
                inputMode === 'text'
                  ? 'bg-[#133E87] text-white shadow-sm shadow-[#133E87]/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Paste Raw Text / OCR</span>
            </button>
          </div>

          <button
            type="button"
            onClick={loadSamplePaper}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100/70 px-3 py-1.5 rounded-lg flex items-center gap-1.5 self-start sm:self-auto transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load Sample NCC Paper</span>
          </button>
        </div>

        {/* Global Paper Metadata (Title & Subject) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Paper Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. NCC Annual Training Camp 2026 Test"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#133E87] focus:outline-none transition"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Default Subject
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. NCC Military Training"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#133E87] focus:outline-none transition"
            />
          </div>
        </div>

        {/* MODE 1: DOCUMENT UPLOAD */}
        {inputMode === 'upload' && (
          <form onSubmit={handleDocumentExtract} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Upload Document File
              </label>

              {/* Drag & Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-10 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-[#133E87] bg-blue-50/60 scale-[0.99]'
                    : selectedFile
                    ? 'border-emerald-400 bg-emerald-50/40'
                    : 'border-slate-300 hover:border-slate-400 bg-slate-50/60 hover:bg-slate-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt,.doc"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {selectedFile ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
                      <FileType className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-base flex items-center justify-center gap-2">
                        <span>{selectedFile.name}</span>
                        <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          {selectedFile.name.split('.').pop()?.toUpperCase()}
                        </span>
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {(selectedFile.size / 1024).toFixed(1)} KB • Ready for high-precision extraction
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile();
                      }}
                      className="mt-1 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-100/70 transition"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Choose Different File</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#133E87] flex items-center justify-center shadow-xs">
                      <Upload className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm sm:text-base">
                        Click to browse or drag and drop your question paper
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Supported formats: <strong>PDF (.pdf)</strong>, <strong>Word (.docx)</strong>, or <strong>Plain Text (.txt)</strong>
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-200 text-slate-700">
                        PDF
                      </span>
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-200 text-slate-700">
                        DOCX
                      </span>
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-200 text-slate-700">
                        TXT
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Supports multi-line questions, inline options (A, B, C, D), and trailing answer keys.</span>
              </div>

              <button
                type="submit"
                disabled={isProcessing || !selectedFile}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#133E87] hover:bg-[#0E2F68] text-white font-bold text-sm shadow-md shadow-[#133E87]/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Extracting Questions...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Extract Questions from Document</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* MODE 2: PASTE RAW TEXT */}
        {inputMode === 'text' && (
          <form onSubmit={handleTextExtract} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Paper Content (Paste raw text, OCR output, or formatted questions)
              </label>
              <textarea
                rows={10}
                required
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste numbered questions here, for example:&#10;1. What is the caliber of the INSAS rifle? [1 Mark]&#10;A) 5.56mm&#10;B) 7.62mm&#10;Answer: A"
                className="w-full p-4 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-[#133E87] focus:outline-none leading-relaxed"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isProcessing}
                className="px-6 py-3 rounded-xl bg-[#133E87] hover:bg-[#0E2F68] text-white font-bold text-sm shadow-md shadow-[#133E87]/20 transition flex items-center gap-2 disabled:opacity-50"
              >
                {isProcessing && (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                <FileText className="w-4 h-4" />
                <span>Extract & Stage Questions</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* EXTRACTION STATS BANNER */}
      {extractionStats && stagedQuestions.length > 0 && (
        <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#133E87]" />
            <span className="text-sm font-bold text-slate-900">
              Extraction Summary: {extractionStats.total} Questions Extracted
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {extractionStats.mcq > 0 && (
              <span className="px-2.5 py-1 rounded-lg bg-white border border-blue-200 text-blue-900 font-semibold">
                MCQ: {extractionStats.mcq}
              </span>
            )}
            {extractionStats.trueFalse > 0 && (
              <span className="px-2.5 py-1 rounded-lg bg-white border border-blue-200 text-emerald-900 font-semibold">
                True/False: {extractionStats.trueFalse}
              </span>
            )}
            {extractionStats.fillBlanks > 0 && (
              <span className="px-2.5 py-1 rounded-lg bg-white border border-blue-200 text-amber-900 font-semibold">
                Fill Blanks: {extractionStats.fillBlanks}
              </span>
            )}
            {extractionStats.shortAnswer > 0 && (
              <span className="px-2.5 py-1 rounded-lg bg-white border border-blue-200 text-indigo-900 font-semibold">
                Short Answer: {extractionStats.shortAnswer}
              </span>
            )}
            {extractionStats.longAnswer > 0 && (
              <span className="px-2.5 py-1 rounded-lg bg-white border border-blue-200 text-purple-900 font-semibold">
                Long Answer: {extractionStats.longAnswer}
              </span>
            )}
          </div>
        </div>
      )}

      {/* STAGING AREA: Needs Review Workflow */}
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
              Please verify question text, answer keys, and assigned marks before approving into the repository.
            </p>
          </div>

          {/* Staged Question Items */}
          <div className="space-y-4 max-w-full">
            {stagedQuestions.map((q, qIdx) => (
              <div
                key={q.tempId || qIdx}
                className="p-3.5 sm:p-5 rounded-2xl bg-white border border-amber-200/80 shadow-xs space-y-3.5 sm:space-y-4 max-w-full overflow-hidden"
              >
                {/* Responsive Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3 border-b border-slate-100 pb-3">
                  {/* Left Badges & Type Selector */}
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0 max-w-full">
                    <span className="w-6 h-6 rounded-md bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center shrink-0">
                      {qIdx + 1}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 shrink-0">
                      Needs Review
                    </span>
                    {q.topic && (
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 truncate max-w-[120px] sm:max-w-[200px]"
                        title={q.topic}
                      >
                        {q.topic}
                      </span>
                    )}
                    <select
                      value={q.type}
                      onChange={(e) => updateQuestionType(qIdx, e.target.value)}
                      className="text-xs font-semibold px-2 py-1 rounded-md border border-slate-300 bg-white max-w-full focus:outline-none"
                    >
                      <option value="MCQ">MCQ</option>
                      <option value="TRUE_FALSE">True / False</option>
                      <option value="FILL_BLANKS">Fill in Blanks</option>
                      <option value="SHORT_ANSWER">Short Answer</option>
                      <option value="LONG_ANSWER">Long Answer</option>
                    </select>
                  </div>

                  {/* Right Controls: Marks & Delete */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="font-semibold text-slate-500">Marks:</span>
                      <input
                        type="number"
                        min="0.5"
                        step="0.5"
                        value={q.marks}
                        onChange={(e) => updateQuestionMarks(qIdx, parseFloat(e.target.value) || 1)}
                        className="w-14 px-2 py-1 rounded-md border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none"
                      />
                    </div>
                    <button
                      onClick={() => removeStagedQuestion(qIdx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                      title="Remove question"
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
                  <textarea
                    rows={2}
                    value={q.question}
                    onChange={(e) => updateQuestionText(qIdx, e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-[#133E87] focus:outline-none resize-y min-h-[52px] leading-relaxed max-w-full"
                  />
                </div>

                {/* MCQ & True/False Options */}
                {(q.type === 'MCQ' || q.type === 'TRUE_FALSE') && q.options && q.options.length > 0 && (
                  <div className="space-y-2 max-w-full">
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase">
                      Options & Correct Answer (Select radio for correct answer)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-full">
                      {q.options.map((optText: string, optIdx: number) => {
                        const isCorrect = q.correctIndex === optIdx;
                        return (
                          <div
                            key={optIdx}
                            className={`flex items-center gap-2 p-2 sm:p-2.5 rounded-xl border transition max-w-full overflow-hidden ${
                              isCorrect
                                ? 'bg-emerald-50/80 border-emerald-400 ring-1 ring-emerald-400/50'
                                : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`correct-${qIdx}`}
                              checked={isCorrect}
                              onChange={() => setCorrectOption(qIdx, optIdx)}
                              className="w-4 h-4 text-emerald-600 cursor-pointer shrink-0"
                            />
                            <span className="text-xs font-bold text-slate-400 shrink-0">
                              {String.fromCharCode(65 + optIdx)})
                            </span>
                            <input
                              type="text"
                              value={optText}
                              onChange={(e) => updateOptionText(qIdx, optIdx, e.target.value)}
                              className="flex-1 min-w-0 bg-transparent text-xs font-medium text-slate-800 focus:outline-none"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Fill in the blanks answer */}
                {q.type === 'FILL_BLANKS' && (
                  <div className="max-w-full">
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                      Accepted Correct Answer
                    </label>
                    <input
                      type="text"
                      value={q.acceptedAnswers?.[0] || q.expectedAnswer || ''}
                      onChange={(e) => updateAcceptedAnswer(qIdx, e.target.value)}
                      placeholder="Enter the correct word or phrase"
                      className="w-full min-w-0 max-w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 focus:outline-none"
                    />
                  </div>
                )}

                {/* Subjective Expected Answer */}
                {(q.type === 'SHORT_ANSWER' || q.type === 'LONG_ANSWER') && (
                  <div className="max-w-full">
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                      Expected Answer / Evaluation Guidelines (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={q.expectedAnswer || ''}
                      onChange={(e) => updateAcceptedAnswer(qIdx, e.target.value)}
                      placeholder="Expected key points or model answer for manual ANO grading"
                      className="w-full min-w-0 max-w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 focus:outline-none resize-y"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Staging Approval Actions Bar */}
          <div className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200/80 shadow-md flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 max-w-full overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                Optional: Target Exam
              </span>
              <select
                value={targetExamId}
                onChange={(e) => setTargetExamId(e.target.value)}
                className="w-full sm:w-auto px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-800 max-w-full"
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
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSavingApproved ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Importing Questions...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Approve All Questions & Import</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
