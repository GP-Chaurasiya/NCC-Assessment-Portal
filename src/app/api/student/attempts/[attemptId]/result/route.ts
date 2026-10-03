import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { attemptId: string } }
) {
  try {
    const session = await requireAuth();

    const attempt = await prisma.examAttempt.findUnique({
      where: { id: params.attemptId },
      include: {
        student: {
          select: { id: true, name: true, email: true, studentProfile: true },
        },
        exam: {
          include: {
            sections: { orderBy: { order: 'asc' } },
            examQuestions: {
              orderBy: { order: 'asc' },
              include: {
                question: {
                  include: {
                    options: { orderBy: { order: 'asc' } },
                    pairs: { orderBy: { order: 'asc' } },
                  },
                },
                section: true,
              },
            },
          },
        },
        answers: {
          include: {
            manualEvaluation: true,
          },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    // Role check: Admin can view any attempt, student can only view their own
    if (session.role === 'STUDENT' && attempt.studentId !== session.userId) {
      return NextResponse.json({ error: 'Unauthorized to view this result' }, { status: 403 });
    }

    const showAnswers =
      session.role === 'ADMIN' || attempt.exam.showAnswersToStudent;

    // Detailed question breakdown
    const questionsBreakdown = attempt.exam.examQuestions.map((eq) => {
      const q = eq.question;
      const ans = attempt.answers.find((a) => a.questionId === q.id);

      return {
        examQuestionId: eq.id,
        questionId: q.id,
        sectionName: eq.section?.name || 'General Section',
        type: q.type,
        questionText: q.question,
        imageUrl: q.imageUrl,
        marksAvailable: eq.marks,
        negativeMarks: eq.negativeMarks,
        marksAwarded: ans?.marksAwarded || 0,
        isAnswered: ans?.isAnswered || false,
        isCorrect: ans?.isCorrect,
        isMarkedForReview: ans?.isMarkedForReview || false,
        studentAnswer: {
          selectedOptionIds: ans?.selectedOptionIdsJson ? JSON.parse(ans.selectedOptionIdsJson) : [],
          textAnswer: ans?.textAnswer || '',
          matchedPairs: ans?.matchedPairsJson ? JSON.parse(ans.matchedPairsJson) : {},
          orderedItemIds: ans?.orderedItemIdsJson ? JSON.parse(ans.orderedItemIdsJson) : [],
        },
        // Only disclose correct answers/explanations if enabled or admin
        correctData: showAnswers
          ? {
              correctOptionIds: q.options.filter((o) => o.isCorrect).map((o) => o.id),
              options: q.options,
              pairs: q.pairs,
              acceptedAnswers: q.acceptedAnswersJson ? JSON.parse(q.acceptedAnswersJson) : null,
              expectedAnswer: q.expectedAnswer,
              explanation: q.explanation,
            }
          : null,
        manualEvaluation: ans?.manualEvaluation || null,
      };
    });

    const totalQuestions = attempt.exam.examQuestions.length;
    const answeredCount = attempt.answers.filter((a) => a.isAnswered).length;
    const correctCount = attempt.answers.filter((a) => a.isCorrect === true).length;
    const incorrectCount = attempt.answers.filter((a) => a.isCorrect === false).length;
    const unansweredCount = totalQuestions - answeredCount;

    return NextResponse.json({
      result: {
        attemptId: attempt.id,
        examId: attempt.exam.id,
        examTitle: attempt.exam.title,
        examCode: attempt.exam.examCode,
        subject: attempt.exam.subject,
        studentName: attempt.student.name,
        studentEmail: attempt.student.email,
        cadetRollNo: attempt.student.studentProfile?.studentId || 'N/A',
        totalScore: attempt.totalScore,
        examTotalMarks: attempt.exam.totalMarks,
        passingMarks: attempt.exam.passingMarks,
        percentage: attempt.percentage,
        isPassed: attempt.isPassed,
        status: attempt.status,
        submissionMethod: attempt.submissionMethod || 'MANUAL',
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
        requiresManualGrading: attempt.requiresManualGrading,
        tabSwitchViolations: attempt.tabSwitchViolations || 0,
        terminationReason: attempt.terminationReason || null,
        counts: {
          totalQuestions,
          answeredCount,
          correctCount,
          incorrectCount,
          unansweredCount,
        },
        showDetailedAnswers: showAnswers,
        questions: questionsBreakdown,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch result' },
      { status: 500 }
    );
  }
}
