export interface ExtractedQuestion {
  tempId: string;
  type: 'MCQ' | 'TRUE_FALSE' | 'FILL_BLANKS' | 'SHORT_ANSWER' | 'LONG_ANSWER';
  question: string;
  options?: string[];
  correctIndex?: number;
  acceptedAnswers?: string[];
  expectedAnswer?: string;
  marks: number;
  subject: string;
  topic?: string;
  status: 'NEEDS_REVIEW' | 'APPROVED' | 'REJECTED';
  rawText?: string;
}

export function parseQuestionPaperText(rawText: string, defaultSubject = 'General'): ExtractedQuestion[] {
  // 1. Normalize line endings and strip PDF/DOC pagination & artifacts
  let text = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\f/g, '\n')
    .replace(/--\s*\d+\s*of\s*\d+\s*--/gi, '')
    .replace(/Page\s+\d+\s+of\s+\d+/gi, '')
    .replace(/^-\s*\d+\s*-\s*$/gm, '');

  // 2. Extract separate Answer Key if present at the end of the document
  const answerKeyMap = new Map<number, string>();
  const answerKeyHeaderRegex = /(?:^|\n)\s*(?:ANSWER\s*KEYS?|ANSWERS|SOLUTIONS?|ANSWER\s*SHEET)[\s:\-]*\n([\s\S]*)$/i;
  const akMatch = text.match(answerKeyHeaderRegex);
  if (akMatch && akMatch.index !== undefined) {
    const akContent = akMatch[1];
    text = text.substring(0, akMatch.index);

    const akTokens = akContent.split(/[\n,;]/).map((t) => t.trim()).filter(Boolean);
    for (const token of akTokens) {
      const singleMatch = token.match(/^(?:Q\.?|Question)?\s*(\d{1,3})[\.\)\:\-\s]+\(?([A-Da-d0-9\.\_\w\s]+?)\)?$/i);
      if (singleMatch) {
        const qNum = parseInt(singleMatch[1], 10);
        const ansVal = singleMatch[2].trim();
        answerKeyMap.set(qNum, ansVal);
      }
    }
  }

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const questions: ExtractedQuestion[] = [];

  let currentTopic = '';
  let currentQuestion: {
    num: number;
    question: string;
    options: string[];
    marks: number;
    rawAnswer: string | null;
  } | null = null;
  let qSequence = 1;
  let inInstructionsBlock = false;

  const sectionRegex = /^(?:SECTION|PART|PAPER)\s*[-:]?\s*([A-Z0-9]+)\s*[:\-]?\s*(.*)$/i;
  const instructionsHeaderRegex = /^(?:GENERAL\s+INSTRUCTIONS|INSTRUCTIONS|NOTE|INSTRUCTIONS\s+FOR\s+CANDIDATES)/i;
  const headerSkipRegex = /^(?:GOVERNMENT\s+OF|DIRECTORATE\s+GENERAL|MAXIMUM\s+MARKS|TIME\s*ALLOWED|READ\s+THE\s+FOLLOWING|ROLL\s*NO|NAME\s*OF\s*THE\s*CADET|REGIMENTAL\s*NO|UNIT\s*:|TOTAL\s*MARKS)/i;
  const instructionItemRegex = /^(?:\d+[\.\)]\s*)?(?:all\s+questions\s+are\s+compulsory|read\s+(?:all\s+)?instructions|use\s+(?:blue|black)\s+pen|no\s+(?:negative\s+marking|calculators?)|each\s+question\s+carries|write\s+your\s+roll|do\s+not\s+open|mark\s+(?:the\s+)?correct|darken\s+the|attempt\s+(?:all|any)|choose\s+the\s+correct\s+alternative|there\s+(?:is|are)\s+no\s+negative|duration\s*:|time\s*:|maximum\s+marks|total\s+questions)/i;
  const questionStartRegex = /^(?:(?:(?:Q|Que|Question)\s*[\.\:\-]?\s*)?(\d{1,3})[\.\)\:\-]|(?:\((\d{1,3})\)))\s*(.*)$/i;
  const answerLineRegex = /^(?:Ans(?:wer)?|Correct\s*(?:Option|Answer)?|Key)[\s:\.\-]*\(?([A-Da-d]|True|False|.+?)\)?$/i;
  const marksRegex = /(?:\[|\()(?:\s*(?:Marks?|Pts?|Points?)?\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(?:marks?|pts?|points?|m)?)\s*(?:\]|\))$/i;

  function finalize() {
    if (!currentQuestion || !currentQuestion.question) return;

    let qText = currentQuestion.question.trim();
    let marks = currentQuestion.marks || 1;

    // Detect marks tag e.g. [1 Mark] or (2 Marks)
    const mMatch = qText.match(marksRegex);
    if (mMatch && mMatch.index !== undefined) {
      marks = parseFloat(mMatch[1]);
      qText = qText.substring(0, mMatch.index).trim();
    }

    // Check if inline answer in question text e.g. "What is X? (Ans: A)"
    const inlineAnsMatch = qText.match(/(?:\[|\()(?:\s*(?:Ans(?:wer)?|Correct\s*Option)[\s:\.\-]*([A-Da-d]|True|False|.+?))\s*(?:\]|\))$/i);
    if (inlineAnsMatch && inlineAnsMatch.index !== undefined) {
      currentQuestion.rawAnswer = inlineAnsMatch[1].trim();
      qText = qText.substring(0, inlineAnsMatch.index).trim();
    }

    let qType: 'MCQ' | 'TRUE_FALSE' | 'FILL_BLANKS' | 'SHORT_ANSWER' | 'LONG_ANSWER' = 'MCQ';
    let options: string[] = currentQuestion.options && currentQuestion.options.length > 0 ? [...currentQuestion.options] : [];
    let correctIndex: number | undefined = 0;
    let acceptedAnswers: string[] | undefined = undefined;
    let expectedAnswer: string | undefined = undefined;

    const resolvedAns = currentQuestion.rawAnswer || (currentQuestion.num ? answerKeyMap.get(currentQuestion.num) : null);

    if (options.length >= 2) {
      if (options.length === 2 && /true/i.test(options[0]) && /false/i.test(options[1])) {
        qType = 'TRUE_FALSE';
        options = ['True', 'False'];
        if (resolvedAns) {
          correctIndex = /true/i.test(resolvedAns) ? 0 : 1;
        }
      } else {
        qType = 'MCQ';
        if (resolvedAns) {
          if (/^[A-E]$/i.test(resolvedAns)) {
            correctIndex = resolvedAns.toUpperCase().charCodeAt(0) - 65;
          } else {
            const foundIdx = options.findIndex((opt) => opt.toLowerCase().trim() === resolvedAns.toLowerCase().trim());
            if (foundIdx !== -1) {
              correctIndex = foundIdx;
            } else if (/^[A-E]\b/i.test(resolvedAns)) {
              correctIndex = resolvedAns.trim()[0].toUpperCase().charCodeAt(0) - 65;
            }
          }
        }
      }
    } else if (/\btrue\s*\/\s*false\b/i.test(qText) || /state\s+true\s+or\s+false/i.test(qText) || /^(true|false)$/i.test(resolvedAns || '')) {
      qType = 'TRUE_FALSE';
      options = ['True', 'False'];
      if (resolvedAns) {
        correctIndex = /true/i.test(resolvedAns) ? 0 : 1;
      }
    } else if (qText.includes('____') || /fill\s+in\s+the\s+blank/i.test(qText) || /\[blank\]/i.test(qText)) {
      qType = 'FILL_BLANKS';
      options = [];
      correctIndex = undefined;
      if (resolvedAns) {
        acceptedAnswers = [resolvedAns.trim()];
        expectedAnswer = resolvedAns.trim();
      }
    } else {
      qType = marks >= 4 || /explain|describe|write\s+(?:an?\s+)?essay/i.test(qText) ? 'LONG_ANSWER' : 'SHORT_ANSWER';
      options = [];
      correctIndex = undefined;
      if (resolvedAns) {
        expectedAnswer = resolvedAns.trim();
        acceptedAnswers = [resolvedAns.trim()];
      }
    }

    questions.push({
      tempId: `ext-${Date.now()}-${qSequence++}`,
      type: qType,
      question: qText,
      options: options.length > 0 ? options : (qType === 'TRUE_FALSE' ? ['True', 'False'] : undefined),
      correctIndex: qType === 'MCQ' || qType === 'TRUE_FALSE' ? Math.max(0, Math.min(correctIndex ?? 0, (options.length || 2) - 1)) : undefined,
      acceptedAnswers,
      expectedAnswer,
      marks,
      subject: defaultSubject,
      topic: currentTopic || undefined,
      status: 'NEEDS_REVIEW',
    });
  }

  function parseOptionLine(lineText: string, qObj: { options: string[]; rawAnswer: string | null }): boolean {
    const regex = /(?:^|\s+)(?:\(([A-Ea-e])\)|([A-Ea-e])[\.\)]|\[([A-Ea-e])\])\s+/g;
    const matches: { letter: string; index: number; matchLen: number }[] = [];
    let m: RegExpExecArray | null;

    while ((m = regex.exec(lineText)) !== null) {
      matches.push({ letter: m[1] || m[2] || m[3], index: m.index, matchLen: m[0].length });
    }

    if (matches.length > 0) {
      if (!qObj.options) qObj.options = [];
      for (let i = 0; i < matches.length; i++) {
        const start = matches[i].index + matches[i].matchLen;
        const end = i + 1 < matches.length ? matches[i + 1].index : lineText.length;
        let optText = lineText.substring(start, end).trim();

        const ansM = optText.match(/(?:Ans(?:wer)?|Correct)[\s:\.\-]*\(?([A-Da-d]|True|False|.+?)\)?$/i);
        if (ansM && ansM.index !== undefined) {
          qObj.rawAnswer = ansM[1].trim();
          optText = optText.substring(0, ansM.index).trim();
        }
        qObj.options.push(optText);
      }
      return true;
    }

    return false;
  }

  function parseInlineOptions(qObj: { question: string; options: string[]; rawAnswer: string | null }) {
    if (!qObj.question) return;
    const firstOptMatch = qObj.question.search(/(?:\s+)(?:\(?([A-Da-d])\)|\(?([A-Da-d])\.|\[([A-Da-d])\])\s+/);
    if (firstOptMatch !== -1) {
      const qPart = qObj.question.substring(0, firstOptMatch).trim();
      const optPart = qObj.question.substring(firstOptMatch).trim();
      qObj.question = qPart;
      parseOptionLine(optPart, qObj);
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for Section header
    const secMatch = line.match(sectionRegex);
    if (secMatch) {
      if (currentQuestion) {
        finalize();
        currentQuestion = null;
      }
      inInstructionsBlock = false;
      currentTopic = (secMatch[1] + (secMatch[2] ? ' - ' + secMatch[2] : '')).trim();
      continue;
    }

    // Check instructions block
    if (instructionsHeaderRegex.test(line)) {
      inInstructionsBlock = true;
      continue;
    }
    if (inInstructionsBlock) {
      if (instructionItemRegex.test(line) || (!questionStartRegex.test(line) && !line.includes('?'))) {
        continue;
      } else {
        inInstructionsBlock = false;
      }
    }

    if (!currentQuestion && (headerSkipRegex.test(line) || instructionItemRegex.test(line))) {
      continue;
    }

    // Check if new Question starts
    const qMatch = line.match(questionStartRegex);
    if (qMatch) {
      const qNum = parseInt(qMatch[1] || qMatch[2], 10);
      const rest = qMatch[3].trim();

      if (!currentQuestion && instructionItemRegex.test(rest)) {
        continue;
      }

      if (currentQuestion) {
        finalize();
      }

      currentQuestion = {
        num: qNum,
        question: rest,
        options: [],
        marks: 1,
        rawAnswer: null,
      };

      parseInlineOptions(currentQuestion);
      continue;
    }

    if (!currentQuestion) continue;

    const ansMatch = line.match(answerLineRegex);
    if (ansMatch) {
      currentQuestion.rawAnswer = ansMatch[1].trim();
      continue;
    }

    const hasOptions = parseOptionLine(line, currentQuestion);
    if (hasOptions) {
      continue;
    }

    if (!currentQuestion.options || currentQuestion.options.length === 0) {
      currentQuestion.question += ' ' + line;
    } else {
      const lastIdx = currentQuestion.options.length - 1;
      currentQuestion.options[lastIdx] += ' ' + line;
    }
  }

  if (currentQuestion) {
    finalize();
  }

  // Fallback if no questions matched with numbering: split by double newlines
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
