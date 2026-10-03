import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const session = await requireAuth(['STUDENT', 'ADMIN']);

    const exams = await prisma.exam.findMany({
      where: {
        status: { in: ['ACTIVE', 'SCHEDULED'] },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        sections: { select: { id: true, name: true } },
        examQuestions: { select: { id: true, marks: true } },
        attempts: {
          where: { studentId: session.userId },
          orderBy: { attemptNumber: 'desc' },
          select: {
            id: true,
            attemptNumber: true,
            status: true,
            totalScore: true,
            percentage: true,
            isPassed: true,
            startedAt: true,
            submittedAt: true,
            expiresAt: true,
          },
        },
      },
    });

    const now = new Date();

    const formatted = exams.map((exam) => {
      const attempts = exam.attempts;
      const totalAttemptsUsed = attempts.length;
      const activeAttempt = attempts.find(
        (a) => a.status === 'IN_PROGRESS' && new Date(a.expiresAt) > now
      );

      const canTake =
        exam.status === 'ACTIVE' &&
        (exam.allowRetake || totalAttemptsUsed < exam.maxAttempts || Boolean(activeAttempt));

      const bestAttempt = [...attempts]
        .filter((a) => ['SUBMITTED', 'AUTO_SUBMITTED', 'EVALUATED'].includes(a.status))
        .sort((a, b) => b.totalScore - a.totalScore)[0];

      return {
        id: exam.id,
        title: exam.title,
        description: exam.description,
        subject: exam.subject,
        course: exam.course,
        examCode: exam.examCode,
        duration: exam.duration,
        totalMarks: exam.totalMarks,
        passingMarks: exam.passingMarks,
        negativeMarking: exam.negativeMarking,
        startDate: exam.startDate,
        endDate: exam.endDate,
        status: exam.status,
        maxAttempts: exam.maxAttempts,
        allowRetake: exam.allowRetake,
        totalQuestions: exam.examQuestions.length,
        sectionsCount: exam.sections.length,
        attemptsCount: totalAttemptsUsed,
        hasActiveAttempt: Boolean(activeAttempt),
        activeAttemptId: activeAttempt?.id || null,
        canTake,
        bestScore: bestAttempt ? bestAttempt.totalScore : null,
        bestPercentage: bestAttempt ? bestAttempt.percentage : null,
        isPassed: bestAttempt ? bestAttempt.isPassed : false,
      };
    });

    return NextResponse.json(
      { exams: formatted },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch student exams' },
      { status: 500 }
    );
  }
}
