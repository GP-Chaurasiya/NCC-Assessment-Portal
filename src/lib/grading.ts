export interface GradeInput {
  questionType: string;
  maxMarks: number;
  negativeMarks: number;
  // Question definition
  options?: { id: string; text: string; isCorrect: boolean; order: number }[];
  pairs?: { id: string; leftItem: string; rightItem: string; order: number }[];
  acceptedAnswersJson?: string | null;
  caseSensitive?: boolean;
  expectedAnswer?: string | null;
  requiresManualEvaluation?: boolean;
  // Student answer
  selectedOptionIds?: string[];
  textAnswer?: string | null;
  matchedPairs?: Record<string, string>; // { leftItem or leftId : rightItem or rightId }
  orderedItemIds?: string[];
}

export interface GradeResult {
  isCorrect: boolean | null;
  marksAwarded: number;
  requiresManual: boolean;
}

export function evaluateStudentAnswer(input: GradeInput): GradeResult {
  const {
    questionType,
    maxMarks,
    negativeMarks = 0,
    options = [],
    pairs = [],
    acceptedAnswersJson,
    caseSensitive = false,
    requiresManualEvaluation = false,
    selectedOptionIds = [],
    textAnswer = '',
    matchedPairs = {},
    orderedItemIds = [],
  } = input;

  if (requiresManualEvaluation || questionType === 'SHORT_ANSWER' || questionType === 'LONG_ANSWER') {
    return {
      isCorrect: null,
      marksAwarded: 0,
      requiresManual: true,
    };
  }

  // 1. MCQ (Single or Multiple)
  if (questionType === 'MCQ') {
    const correctOptions = options.filter((o) => o.isCorrect);
    const correctIds = new Set(correctOptions.map((o) => o.id));
    const userSelected = new Set(selectedOptionIds || []);

    if (userSelected.size === 0) {
      return { isCorrect: null, marksAwarded: 0, requiresManual: false };
    }

    const isExactMatch =
      correctIds.size === userSelected.size &&
      Array.from(correctIds).every((id) => userSelected.has(id));

    if (isExactMatch) {
      return { isCorrect: true, marksAwarded: maxMarks, requiresManual: false };
    } else {
      // Apply negative marking if configured
      const penalty = negativeMarks > 0 ? -Math.abs(negativeMarks) : 0;
      return { isCorrect: false, marksAwarded: penalty, requiresManual: false };
    }
  }

  // 2. TRUE_FALSE
  if (questionType === 'TRUE_FALSE') {
    const correctOption = options.find((o) => o.isCorrect);
    if (!correctOption || !selectedOptionIds || selectedOptionIds.length === 0) {
      return { isCorrect: null, marksAwarded: 0, requiresManual: false };
    }

    const isMatch = selectedOptionIds[0] === correctOption.id;
    if (isMatch) {
      return { isCorrect: true, marksAwarded: maxMarks, requiresManual: false };
    } else {
      const penalty = negativeMarks > 0 ? -Math.abs(negativeMarks) : 0;
      return { isCorrect: false, marksAwarded: penalty, requiresManual: false };
    }
  }

  // 3. FILL_BLANKS
  if (questionType === 'FILL_BLANKS') {
    const answer = (textAnswer || '').trim();
    if (!answer) {
      return { isCorrect: null, marksAwarded: 0, requiresManual: false };
    }

    let acceptedList: string[] = [];
    try {
      if (acceptedAnswersJson) {
        acceptedList = JSON.parse(acceptedAnswersJson);
      }
    } catch {
      acceptedList = [acceptedAnswersJson || ''];
    }

    const isCorrect = acceptedList.some((accepted) => {
      const cleanAccepted = (accepted || '').trim();
      return caseSensitive
        ? cleanAccepted === answer
        : cleanAccepted.toLowerCase() === answer.toLowerCase();
    });

    if (isCorrect) {
      return { isCorrect: true, marksAwarded: maxMarks, requiresManual: false };
    } else {
      const penalty = negativeMarks > 0 ? -Math.abs(negativeMarks) : 0;
      return { isCorrect: false, marksAwarded: penalty, requiresManual: false };
    }
  }

  // 4. MATCH_FOLLOWING
  if (questionType === 'MATCH_FOLLOWING') {
    if (!pairs || pairs.length === 0) {
      return { isCorrect: true, marksAwarded: maxMarks, requiresManual: false };
    }

    let correctCount = 0;
    pairs.forEach((pair) => {
      // User matched pairs can be keyed by pair.id or pair.leftItem
      const userMatchedRight = matchedPairs[pair.id] || matchedPairs[pair.leftItem];
      if (userMatchedRight && (userMatchedRight === pair.rightItem || userMatchedRight === pair.id)) {
        correctCount++;
      }
    });

    const isAllCorrect = correctCount === pairs.length;
    const proportionalMarks = Math.round((correctCount / pairs.length) * maxMarks * 100) / 100;

    return {
      isCorrect: isAllCorrect,
      marksAwarded: proportionalMarks,
      requiresManual: false,
    };
  }

  // 5. ORDERING
  if (questionType === 'ORDERING') {
    if (!orderedItemIds || orderedItemIds.length === 0) {
      return { isCorrect: null, marksAwarded: 0, requiresManual: false };
    }

    // Sorted correct option IDs
    const expectedSortedIds = [...options].sort((a, b) => a.order - b.order).map((o) => o.id);
    const isCorrect =
      expectedSortedIds.length === orderedItemIds.length &&
      expectedSortedIds.every((id, idx) => id === orderedItemIds[idx]);

    return {
      isCorrect,
      marksAwarded: isCorrect ? maxMarks : 0,
      requiresManual: false,
    };
  }

  return { isCorrect: null, marksAwarded: 0, requiresManual: false };
}
