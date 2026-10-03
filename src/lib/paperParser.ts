export interface ExtractedQuestion {
  tempId: string;
  type: 'MCQ' | 'TRUE_FALSE' | 'FILL_BLANKS' | 'SHORT_ANSWER' | 'LONG_ANSWER';
  question: string;
  options?: string[];
  correctIndex?: number;
  acceptedAnswers?: string[];
  marks: number;
  subject: string;
  topic?: string;
  status: 'NEEDS_REVIEW' | 'APPROVED' | 'REJECTED';
  rawText?: string;
}

export function parseQuestionPaperText(rawText: string, defaultSubject = 'General'): ExtractedQuestion[] {
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const questions: ExtractedQuestion[] = [];

  let currentQuestion: Partial<ExtractedQuestion> | null = null;
  let qCounter = 1;

  // Regex helpers
  const questionNumberRegex = /^(\d+)[\.\)]\s*(.*)$/i;
  const optionRegex = /^[A-Da-d][\.\)]\s*(.*)$/;
  const answerRegex = /^(?:Ans(?:wer)?|Correct\s*Option)[\s:\-]*([A-Da-d]|True|False|.+)$/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if new question started
    const qMatch = line.match(questionNumberRegex);
    if (qMatch) {
      if (currentQuestion && currentQuestion.question) {
        finalizeQuestion(currentQuestion, questions, defaultSubject);
      }
      currentQuestion = {
        tempId: `ext-${Date.now()}-${qCounter++}`,
        question: qMatch[2],
        options: [],
        type: 'MCQ',
        marks: 1,
        subject: defaultSubject,
        status: 'NEEDS_REVIEW',
        rawText: line,
      };
      continue;
    }

    if (!currentQuestion) {
      // First lines might be title or instructions
      continue;
    }

    // Check for Answer line
    const ansMatch = line.match(answerRegex);
    if (ansMatch) {
      const val = ansMatch[1].trim();
      if (/^[A-D]$/i.test(val)) {
        const letterIndex = val.toUpperCase().charCodeAt(0) - 65;
        currentQuestion.correctIndex = letterIndex;
      } else if (/^(true|false)$/i.test(val)) {
        currentQuestion.type = 'TRUE_FALSE';
        currentQuestion.correctIndex = val.toLowerCase() === 'true' ? 0 : 1;
      } else {
        currentQuestion.acceptedAnswers = [val];
      }
      continue;
    }

    // Check for Option line
    const optMatch = line.match(optionRegex);
    if (optMatch) {
      if (!currentQuestion.options) currentQuestion.options = [];
      currentQuestion.options.push(optMatch[1]);
      continue;
    }

    // Check if True/False options listed inline
    if (/\btrue\b.*\bfalse\b/i.test(line) && (!currentQuestion.options || currentQuestion.options.length === 0)) {
      currentQuestion.type = 'TRUE_FALSE';
      currentQuestion.options = ['True', 'False'];
      continue;
    }

    // Check for Fill in the blanks indicators (underscores)
    if (line.includes('____') || (currentQuestion.question && currentQuestion.question.includes('____'))) {
      currentQuestion.type = 'FILL_BLANKS';
    }

    // Append to current question text if no options recorded yet
    if (!currentQuestion.options || currentQuestion.options.length === 0) {
      currentQuestion.question = (currentQuestion.question ? currentQuestion.question + ' ' : '') + line;
    }
  }

  if (currentQuestion && currentQuestion.question) {
    finalizeQuestion(currentQuestion, questions, defaultSubject);
  }

  // Fallback if no questions matched cleanly: split by double newlines
  if (questions.length === 0 && rawText.trim().length > 0) {
    const blocks = rawText.split(/\n\s*\n/).filter((b) => b.trim().length > 10);
    blocks.forEach((block, idx) => {
      questions.push({
        tempId: `ext-fallback-${Date.now()}-${idx + 1}`,
        type: block.includes('____') ? 'FILL_BLANKS' : 'SHORT_ANSWER',
        question: block.trim(),
        marks: 2,
        subject: defaultSubject,
        status: 'NEEDS_REVIEW',
        rawText: block,
      });
    });
  }

  return questions;
}

function finalizeQuestion(
  q: Partial<ExtractedQuestion>,
  list: ExtractedQuestion[],
  defaultSubject: string
) {
  if (!q.question) return;

  // Determine type if ambiguous
  if (q.question.includes('____')) {
    q.type = 'FILL_BLANKS';
  } else if (q.options && q.options.length === 2 && q.options[0].toLowerCase() === 'true') {
    q.type = 'TRUE_FALSE';
  } else if (!q.options || q.options.length === 0) {
    q.type = 'SHORT_ANSWER';
  } else {
    q.type = 'MCQ';
  }

  list.push({
    tempId: q.tempId || `ext-${Date.now()}-${Math.random()}`,
    type: q.type || 'MCQ',
    question: q.question.trim(),
    options: q.options && q.options.length > 0 ? q.options : (q.type === 'TRUE_FALSE' ? ['True', 'False'] : undefined),
    correctIndex: q.correctIndex !== undefined ? q.correctIndex : (q.type === 'TRUE_FALSE' ? 0 : 0),
    acceptedAnswers: q.acceptedAnswers,
    marks: q.marks || 1,
    subject: q.subject || defaultSubject,
    status: 'NEEDS_REVIEW',
  });
}
