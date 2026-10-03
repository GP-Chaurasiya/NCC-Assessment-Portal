import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { attemptId: string } }
) {
  try {
    await requireAuth(['ADMIN']);

    const attempt = await prisma.examAttempt.findUnique({
      where: { id: params.attemptId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            studentProfile: true,
          },
        },
        exam: {
          include: {
            examQuestions: {
              include: {
                question: {
                  include: {
                    options: true,
                    pairs: true,
                  },
                },
              },
            },
          },
        },
        answers: {
          include: {
            question: {
              include: {
                options: true,
                pairs: true,
              },
            },
            manualEvaluation: {
              include: {
                evaluator: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    return NextResponse.json({ attempt });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch evaluation details' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { attemptId: string } }
) {
  try {
    const session = await requireAuth(['ADMIN']);
    const body = await req.json();

    const { studentAnswerId, marksAwarded, feedback } = body;

    if (!studentAnswerId || marksAwarded === undefined) {
      return NextResponse.json(
        { error: 'Student answer ID and marks awarded are required' },
        { status: 400 }
      );
    }

    const answer = await prisma.studentAnswer.findUnique({
      where: { id: studentAnswerId },
      include: {
        attempt: {
          include: {
            exam: {
              include: {
                examQuestions: true,
              },
            },
          },
        },
        question: true,
      },
    });

    if (!answer) {
      return NextResponse.json({ error: 'Student answer record not found' }, { status: 404 });
    }

    // Find configured max marks for this question in this exam
    const examQ = answer.attempt.exam.examQuestions.find(
      (eq) => eq.questionId === answer.questionId
    );
    const maxMarks = examQ?.marks || answer.question.defaultMarks;

    const awarded = Math.min(Math.max(0, parseFloat(marksAwarded)), maxMarks);

    // Upsert manual evaluation
    await prisma.manualEvaluation.upsert({
      where: { studentAnswerId },
      create: {
        studentAnswerId,
        evaluatorId: session.userId,
        marksAwarded: awarded,
        maxMarks,
        feedback: feedback?.trim() || null,
      },
      update: {
        evaluatorId: session.userId,
        marksAwarded: awarded,
        maxMarks,
        feedback: feedback?.trim() || null,
        evaluatedAt: new Date(),
      },
    });

    // Update StudentAnswer marksAwarded & isCorrect
    await prisma.studentAnswer.update({
      where: { id: studentAnswerId },
      data: {
        marksAwarded: awarded,
        isCorrect: awarded > 0,
      },
    });

    // Recalculate total attempt marks & percentage
    const allAnswers = await prisma.studentAnswer.findMany({
      where: { attemptId: params.attemptId },
      include: { question: true, manualEvaluation: true },
    });

    const newTotalScore = allAnswers.reduce((sum, ans) => sum + ans.marksAwarded, 0);
    const totalExamMarks = answer.attempt.exam.totalMarks || 1;
    const newPercentage =
      Math.round((newTotalScore / totalExamMarks) * 100 * 10) / 10;
    const isPassed = newTotalScore >= answer.attempt.exam.passingMarks;

    // Check if any answers still require manual evaluation
    const remainingToEvaluate = allAnswers.some(
      (ans) =>
        ans.question.requiresManualEvaluation &&
        !ans.manualEvaluation &&
        ans.isAnswered
    );

    const updatedAttempt = await prisma.examAttempt.update({
      where: { id: params.attemptId },
      data: {
        totalScore: Math.round(newTotalScore * 100) / 100,
        percentage: newPercentage,
        isPassed,
        status: remainingToEvaluate ? 'SUBMITTED' : 'EVALUATED',
        requiresManualGrading: remainingToEvaluate,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Evaluation saved and total score recalculated successfully!',
      attempt: updatedAttempt,
      awarded,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Evaluation update failed' },
      { status: 500 }
    );
  }
}
