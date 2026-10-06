import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    await requireAuth(['ADMIN']);

    const [
      totalStudents,
      totalExams,
      activeExams,
      completedExams,
      totalQuestions,
      recentAttempts,
      allEvaluatedAttempts,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.exam.count(),
      prisma.exam.count({ where: { status: 'ACTIVE' } }),
      prisma.exam.count({ where: { status: 'COMPLETED' } }),
      prisma.question.count(),
      prisma.examAttempt.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          student: { select: { name: true, email: true } },
          exam: { select: { title: true, totalMarks: true, passingMarks: true } },
        },
      }),
      prisma.examAttempt.findMany({
        where: { status: { in: ['SUBMITTED', 'AUTO_SUBMITTED', 'EVALUATED'] } },
        select: { totalScore: true, percentage: true, isPassed: true },
      }),
    ]);

    // Calculate aggregated metrics
    const totalAttempted = allEvaluatedAttempts.length;
    const passedCount = allEvaluatedAttempts.filter((a) => a.isPassed).length;
    const passPercentage =
      totalAttempted > 0 ? Math.round((passedCount / totalAttempted) * 100) : 0;

    const avgScore =
      totalAttempted > 0
        ? Math.round(
            (allEvaluatedAttempts.reduce((acc, curr) => acc + curr.percentage, 0) /
              totalAttempted) *
              10
          ) / 10
        : 0;

    const highestScore =
      totalAttempted > 0
        ? Math.max(...allEvaluatedAttempts.map((a) => a.percentage))
        : 0;

    const lowestScore =
      totalAttempted > 0
        ? Math.min(...allEvaluatedAttempts.map((a) => a.percentage))
        : 0;

    // Question distribution by type
    const questionTypes = await prisma.question.groupBy({
      by: ['type'],
      _count: { id: true },
    });

    return NextResponse.json({
      stats: {
        totalStudents,
        totalExams,
        activeExams,
        completedExams,
        totalQuestions,
        totalAttempts: totalAttempted,
        passPercentage,
        averageScore: avgScore,
        highestScore,
        lowestScore,
      },
      recentAttempts,
      questionDistribution: questionTypes.map((q) => ({
        type: q.type,
        count: q._count.id,
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch dashboard statistics' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
