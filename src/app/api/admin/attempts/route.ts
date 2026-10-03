import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(['ADMIN']);
    const searchParams = req.nextUrl.searchParams;
    const examId = searchParams.get('examId') || '';
    const status = searchParams.get('status') || '';
    const search = searchParams.get('search')?.trim() || '';

    const where: any = {};
    if (examId && examId !== 'ALL') where.examId = examId;
    if (status && status !== 'ALL') where.status = status;

    if (search) {
      where.OR = [
        { student: { name: { contains: search } } },
        { student: { email: { contains: search } } },
        { exam: { title: { contains: search } } },
      ];
    }

    const attempts = await prisma.examAttempt.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            studentProfile: true,
          },
        },
        exam: {
          select: {
            id: true,
            title: true,
            examCode: true,
            totalMarks: true,
            passingMarks: true,
            duration: true,
          },
        },
        answers: {
          include: {
            question: { select: { type: true, requiresManualEvaluation: true } },
            manualEvaluation: true,
          },
        },
      },
    });

    const formatted = attempts.map((a) => {
      let durationMinutes = null;
      if (a.submittedAt) {
        const diffMs = new Date(a.submittedAt).getTime() - new Date(a.startedAt).getTime();
        durationMinutes = Math.round((diffMs / 60000) * 10) / 10;
      }

      const pendingEvaluations = a.answers.filter(
        (ans) =>
          ans.question.requiresManualEvaluation &&
          !ans.manualEvaluation &&
          ans.isAnswered
      ).length;

      return {
        id: a.id,
        examId: a.examId,
        examTitle: a.exam.title,
        examCode: a.exam.examCode,
        examTotalMarks: a.exam.totalMarks,
        examPassingMarks: a.exam.passingMarks,
        studentId: a.studentId,
        studentName: a.student.name,
        studentEmail: a.student.email,
        cadetRollNo: a.student.studentProfile?.studentId || 'N/A',
        attemptNumber: a.attemptNumber,
        startedAt: a.startedAt,
        submittedAt: a.submittedAt,
        durationMinutes,
        status: a.status,
        submissionMethod: a.submissionMethod || 'MANUAL',
        totalScore: a.totalScore,
        percentage: a.percentage,
        isPassed: a.isPassed,
        requiresManualGrading: a.requiresManualGrading,
        tabSwitchViolations: a.tabSwitchViolations || 0,
        terminationReason: a.terminationReason || null,
        pendingEvaluationsCount: pendingEvaluations,
      };
    });

    return NextResponse.json({ attempts: formatted });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch exam attempts' },
      { status: 500 }
    );
  }
}
