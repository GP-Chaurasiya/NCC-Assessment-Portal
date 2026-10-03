import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(['ADMIN']);
    const body = await req.json();

    const { paperId, approvedQuestions, examId, sectionId } = body;

    if (!approvedQuestions || !Array.isArray(approvedQuestions) || approvedQuestions.length === 0) {
      return NextResponse.json(
        { error: 'No approved questions provided for import' },
        { status: 400 }
      );
    }

    const createdQuestions: any[] = [];

    // Save each approved question into Question Bank
    for (const q of approvedQuestions) {
      const isMCQ = q.type === 'MCQ' || q.type === 'TRUE_FALSE';
      const isFillBlank = q.type === 'FILL_BLANKS';

      let optionsCreate = undefined;
      if (isMCQ && q.options && q.options.length > 0) {
        optionsCreate = {
          create: q.options.map((optText: string, idx: number) => ({
            text: optText.trim(),
            isCorrect: idx === q.correctIndex,
            order: idx,
          })),
        };
      }

      let acceptedAnswersJson = null;
      if (isFillBlank) {
        acceptedAnswersJson = q.acceptedAnswers
          ? JSON.stringify(q.acceptedAnswers)
          : JSON.stringify([q.correctAnswer || '']);
      }

      const newQ = await prisma.question.create({
        data: {
          type: q.type,
          question: q.question.trim(),
          subject: q.subject || 'General',
          topic: q.topic || null,
          difficulty: q.difficulty || 'MEDIUM',
          defaultMarks: parseFloat(q.marks || 1),
          negativeMarks: parseFloat(q.negativeMarks || 0),
          explanation: q.explanation || null,
          acceptedAnswersJson,
          expectedAnswer: q.expectedAnswer || null,
          requiresManualEvaluation: q.type === 'SHORT_ANSWER' || q.type === 'LONG_ANSWER',
          createdById: session.userId,
          options: optionsCreate,
        },
      });

      createdQuestions.push(newQ);

      // If examId provided, add directly to the exam
      if (examId) {
        const count = await prisma.examQuestion.count({ where: { examId } });
        await prisma.examQuestion.create({
          data: {
            examId,
            sectionId: sectionId || null,
            questionId: newQ.id,
            marks: newQ.defaultMarks,
            negativeMarks: newQ.negativeMarks,
            order: count,
          },
        });
      }
    }

    // If an exam was targeted, recalculate its total marks
    if (examId) {
      const allEq = await prisma.examQuestion.findMany({ where: { examId } });
      const newTotal = allEq.reduce((acc, eq) => acc + eq.marks, 0);
      await prisma.exam.update({ where: { id: examId }, data: { totalMarks: newTotal } });
    }

    // Update UploadedQuestionPaper record status
    if (paperId) {
      await prisma.uploadedQuestionPaper.update({
        where: { id: paperId },
        data: { status: 'FULLY_APPROVED' },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully approved and saved ${createdQuestions.length} questions to the Question Bank!`,
      importedCount: createdQuestions.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to approve questions' },
      { status: 500 }
    );
  }
}
