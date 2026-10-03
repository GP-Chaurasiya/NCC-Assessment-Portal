import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { evaluateStudentAnswer } from '@/lib/grading';

const MAX_TAB_SWITCH_VIOLATIONS = 3;

export async function POST(
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

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    if (attempt.studentId !== session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (attempt.status !== 'IN_PROGRESS') {
      return NextResponse.json({
        isTerminated: true,
        alreadySubmitted: true,
        message: 'Exam is already submitted',
        redirectUrl: `/student/exam/attempt/${attempt.id}/result`,
      });
    }

    // Increment tab switch count on server
    const updatedAttempt = await prisma.examAttempt.update({
      where: { id: params.attemptId },
      data: {
        tabSwitchViolations: {
          increment: 1,
        },
      },
      select: {
        id: true,
        tabSwitchViolations: true,
      },
    });

    const currentViolations = updatedAttempt.tabSwitchViolations;

    // Check if threshold reached (3 violations)
    if (currentViolations >= MAX_TAB_SWITCH_VIOLATIONS) {
      // Automatic immediate lock & submission
      let totalScore = 0;
      let requiresManual = false;

      for (const eq of attempt.exam.examQuestions) {
        const q = eq.question;
        const ans = attempt.answers.find((a) => a.questionId === q.id);
        if (!ans || !ans.isAnswered) continue;

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

      totalScore = Math.max(0, Math.round(totalScore * 100) / 100);
      const examTotal = attempt.exam.totalMarks || 1;
      const percentage = Math.round((totalScore / examTotal) * 100 * 10) / 10;
      const isPassed = totalScore >= attempt.exam.passingMarks;

      const terminationReason = `Exam automatically terminated and submitted due to exceeding the maximum allowed tab-switch limit (${currentViolations} tab switches detected).`;

      await prisma.examAttempt.update({
        where: { id: params.attemptId },
        data: {
          status: requiresManual ? 'SUBMITTED' : 'EVALUATED',
          submissionMethod: 'AUTO_TAB_SWITCH',
          terminationReason,
          submittedAt: now,
          totalScore,
          percentage,
          isPassed,
          requiresManualGrading: requiresManual,
        },
      });

      return NextResponse.json({
        isTerminated: true,
        violationsCount: currentViolations,
        maxViolations: MAX_TAB_SWITCH_VIOLATIONS,
        terminationReason,
        redirectUrl: `/student/exam/attempt/${params.attemptId}/result`,
      });
    }

    return NextResponse.json({
      isTerminated: false,
      violationsCount: currentViolations,
      maxViolations: MAX_TAB_SWITCH_VIOLATIONS,
      remainingWarnings: MAX_TAB_SWITCH_VIOLATIONS - currentViolations,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to record tab switch' },
      { status: 500 }
    );
  }
}
