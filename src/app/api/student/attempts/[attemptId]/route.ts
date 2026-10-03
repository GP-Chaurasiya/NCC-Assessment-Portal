import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { evaluateStudentAnswer } from '@/lib/grading';

export async function GET(
  req: NextRequest,
  { params }: { params: { attemptId: string } }
) {
  try {
    const session = await requireAuth(['STUDENT', 'ADMIN']);
    const now = new Date();

    const attempt = await prisma.examAttempt.findUnique({
      where: { id: params.attemptId },
      include: {
        exam: {
          include: {
            sections: { orderBy: { order: 'asc' } },
            examQuestions: {
              orderBy: { order: 'asc' },
              include: {
                question: {
                  include: {
                    options: {
                      orderBy: { order: 'asc' },
                      select: { id: true, text: true, order: true },
                    },
                    pairs: {
                      orderBy: { order: 'asc' },
                      select: { id: true, leftItem: true, rightItem: true, order: true },
                    },
                  },
                },
              },
            },
          },
        },
        answers: true,
      },
    });

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    if (attempt.studentId !== session.userId) {
      return NextResponse.json({ error: 'Unauthorized to access this attempt' }, { status: 403 });
    }

    // Check if time expired and still in progress
    const isExpired = now >= new Date(attempt.expiresAt);
    if (isExpired && attempt.status === 'IN_PROGRESS') {
      // Automatic submission on time expiration
      const finalAttempt = await autoSubmitAttempt(params.attemptId);
      return NextResponse.json({
        isExpired: true,
        attempt: finalAttempt,
        serverTime: now,
      });
    }

    const remainingSeconds = Math.max(
      0,
      Math.floor((new Date(attempt.expiresAt).getTime() - now.getTime()) / 1000)
    );

    return NextResponse.json({
      attemptId: attempt.id,
      status: attempt.status,
      startedAt: attempt.startedAt,
      expiresAt: attempt.expiresAt,
      serverTime: now,
      remainingSeconds,
      isExpired: false,
      tabSwitchViolations: attempt.tabSwitchViolations || 0,
      terminationReason: attempt.terminationReason || null,
      answers: attempt.answers,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to sync attempt' },
      { status: 500 }
    );
  }
}

// Helper function to auto-submit when server time expires
async function autoSubmitAttempt(attemptId: string) {
  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    include: {
      exam: {
        include: {
          examQuestions: {
            include: {
              question: {
                include: { options: true, pairs: true },
              },
            },
          },
        },
      },
      answers: true,
    },
  });

  if (!attempt) return null;

  let totalScore = 0;
  let requiresManual = false;

  // Grade each answer
  for (const ans of attempt.answers) {
    const eq = attempt.exam.examQuestions.find((q) => q.questionId === ans.questionId);
    if (!eq) continue;

    const q = eq.question;
    const selectedOptionIds = ans.selectedOptionIdsJson
      ? JSON.parse(ans.selectedOptionIdsJson)
      : [];
    const matchedPairs = ans.matchedPairsJson ? JSON.parse(ans.matchedPairsJson) : {};
    const orderedItemIds = ans.orderedItemIdsJson ? JSON.parse(ans.orderedItemIdsJson) : [];

    const grade = evaluateStudentAnswer({
      questionType: q.type,
      maxMarks: eq.marks,
      negativeMarks: eq.negativeMarks,
      options: q.options,
      pairs: q.pairs,
      acceptedAnswersJson: q.acceptedAnswersJson,
      caseSensitive: q.caseSensitive,
      expectedAnswer: q.expectedAnswer,
      requiresManualEvaluation: q.requiresManualEvaluation,
      selectedOptionIds,
      textAnswer: ans.textAnswer,
      matchedPairs,
      orderedItemIds,
    });

    if (grade.requiresManual) {
      requiresManual = true;
    }

    await prisma.studentAnswer.update({
      where: { id: ans.id },
      data: {
        isCorrect: grade.isCorrect,
        marksAwarded: grade.marksAwarded,
      },
    });

    totalScore += grade.marksAwarded;
  }

  // Cap minimum score to 0 (cannot have negative overall exam score)
  totalScore = Math.max(0, Math.round(totalScore * 100) / 100);
  const examTotal = attempt.exam.totalMarks || 1;
  const percentage = Math.round((totalScore / examTotal) * 100 * 10) / 10;
  const isPassed = totalScore >= attempt.exam.passingMarks;

  return await prisma.examAttempt.update({
    where: { id: attemptId },
    data: {
      status: requiresManual ? 'SUBMITTED' : 'EVALUATED',
      submissionMethod: 'AUTO_EXPIRED',
      submittedAt: new Date(),
      totalScore,
      percentage,
      isPassed,
      requiresManualGrading: requiresManual,
    },
  });
}
