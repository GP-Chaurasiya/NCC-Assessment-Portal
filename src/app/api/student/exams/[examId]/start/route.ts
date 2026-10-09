import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatExamDateTime } from '@/lib/dateUtils';

export async function POST(
  req: NextRequest,
  { params }: { params: { examId: string } }
) {
  try {
    const session = await requireAuth(['STUDENT', 'ADMIN']);
    const now = new Date();

    const exam = await prisma.exam.findUnique({
      where: { id: params.examId },
      include: {
        sections: { orderBy: { order: 'asc' } },
        examQuestions: {
          orderBy: { order: 'asc' },
          include: {
            question: {
              include: {
                options: {
                  orderBy: { order: 'asc' },
                  select: { id: true, text: true, order: true }, // Omits isCorrect for integrity!
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
    });

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    if (exam.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'This exam is not currently active.' },
        { status: 403 }
      );
    }

    // Check availability window
    if (exam.startDate && now < new Date(exam.startDate)) {
      return NextResponse.json(
        { error: `This exam has not opened yet. It is scheduled to start on ${formatExamDateTime(exam.startDate)}.` },
        { status: 403 }
      );
    }

    if (exam.endDate && now > new Date(exam.endDate)) {
      return NextResponse.json(
        { error: `This exam window has closed (ended on ${formatExamDateTime(exam.endDate)}).` },
        { status: 403 }
      );
    }

    if (exam.examQuestions.length === 0) {
      return NextResponse.json(
        { error: 'This exam has no questions configured yet.' },
        { status: 400 }
      );
    }

    // Check existing attempts
    const existingAttempts = await prisma.examAttempt.findMany({
      where: {
        examId: exam.id,
        studentId: session.userId,
      },
      orderBy: { attemptNumber: 'desc' },
      include: {
        answers: true,
      },
    });

    // Check for an active (in-progress) attempt that hasn't expired
    const activeAttempt = existingAttempts.find(
      (a) => a.status === 'IN_PROGRESS' && new Date(a.expiresAt) > now
    );

    if (activeAttempt) {
      // Restore existing attempt seamlessly
      return NextResponse.json({
        success: true,
        message: 'Restoring your active exam attempt',
        attemptId: activeAttempt.id,
        startedAt: activeAttempt.startedAt,
        expiresAt: activeAttempt.expiresAt,
        serverTime: now,
        tabSwitchViolations: activeAttempt.tabSwitchViolations || 0,
        exam: {
          id: exam.id,
          title: exam.title,
          description: exam.description,
          duration: exam.duration,
          totalMarks: exam.totalMarks,
          negativeMarking: exam.negativeMarking,
          instructions: exam.instructions,
          sections: exam.sections,
        },
        savedAnswers: activeAttempt.answers,
        questions: exam.examQuestions.map((eq) => ({
          examQuestionId: eq.id,
          questionId: eq.question.id,
          sectionId: eq.sectionId,
          marks: eq.marks,
          negativeMarks: eq.negativeMarks,
          order: eq.order,
          type: eq.question.type,
          question: eq.question.question,
          subject: eq.question.subject,
          imageUrl: eq.question.imageUrl,
          isMultipleCorrect: eq.question.isMultipleCorrect,
          maxWordCount: eq.question.maxWordCount,
          options: eq.question.options,
          pairs: eq.question.pairs,
        })),
      });
    }

    // Check max attempts limit
    if (!exam.allowRetake && existingAttempts.length >= exam.maxAttempts) {
      return NextResponse.json(
        { error: `You have reached the maximum allowed attempts (${exam.maxAttempts}) for this exam.` },
        { status: 403 }
      );
    }

    // Ensure student exists in database (prevents foreign key violation across ephemeral containers)
    let student = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true },
    });

    if (!student) {
      student = await prisma.user.findFirst({
        where: {
          OR: [
            { email: session.email.toLowerCase() },
            { username: session.username.toLowerCase() },
          ],
        },
        select: { id: true },
      });
    }

    if (!student) {
      student = await prisma.user.create({
        data: {
          id: session.userId,
          email: session.email.toLowerCase(),
          username: session.username.toLowerCase(),
          name: session.name,
          password: 'cadet_restored_hash',
          role: session.role || 'STUDENT',
          status: 'ACTIVE',
          studentProfile: {
            create: {
              studentId: (session as any).studentId || 'NCC-CADET',
              course: (session as any).course || 'Senior Division Army Wing',
              batch: (session as any).batch || '2025-2026',
              unit: (session as any).unit || '1 Delhi Composite Battalion',
            },
          },
        },
      });
    }

    // Filter valid exam questions to avoid null question foreign keys
    const validQuestions = exam.examQuestions.filter(
      (eq) => eq.question && eq.question.id
    );

    // Create new attempt with server-authoritative expiration
    const attemptNumber = existingAttempts.length + 1;
    const expiresAt = new Date(now.getTime() + exam.duration * 60 * 1000);

    const newAttempt = await prisma.examAttempt.create({
      data: {
        examId: exam.id,
        studentId: student.id,
        attemptNumber,
        startedAt: now,
        expiresAt,
        status: 'IN_PROGRESS',
        answers: {
          create: validQuestions.map((eq) => ({
            questionId: eq.question.id,
            isAnswered: false,
            isMarkedForReview: false,
            isVisited: false,
          })),
        },
      },
      include: {
        answers: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Exam attempt started successfully',
      attemptId: newAttempt.id,
      startedAt: newAttempt.startedAt,
      expiresAt: newAttempt.expiresAt,
      serverTime: now,
      tabSwitchViolations: 0,
      exam: {
        id: exam.id,
        title: exam.title,
        description: exam.description,
        duration: exam.duration,
        totalMarks: exam.totalMarks,
        negativeMarking: exam.negativeMarking,
        instructions: exam.instructions,
        sections: exam.sections,
      },
      savedAnswers: newAttempt.answers,
      questions: exam.examQuestions.map((eq) => ({
        examQuestionId: eq.id,
        questionId: eq.question.id,
        sectionId: eq.sectionId,
        marks: eq.marks,
        negativeMarks: eq.negativeMarks,
        order: eq.order,
        type: eq.question.type,
        question: eq.question.question,
        subject: eq.question.subject,
        imageUrl: eq.question.imageUrl,
        isMultipleCorrect: eq.question.isMultipleCorrect,
        maxWordCount: eq.question.maxWordCount,
        options: eq.question.options,
        pairs: eq.question.pairs,
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to start exam' },
      { status: 500 }
    );
  }
}
