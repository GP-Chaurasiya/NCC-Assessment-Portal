import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(['ADMIN']);
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get('search')?.trim() || '';
    const status = searchParams.get('status') || '';
    const subject = searchParams.get('subject') || '';

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (subject && subject !== 'ALL') {
      where.subject = subject;
    }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { examCode: { contains: search } },
        { subject: { contains: search } },
      ];
    }

    const exams = await prisma.exam.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        sections: true,
        examQuestions: {
          include: {
            question: true,
          },
        },
        _count: {
          select: { attempts: true },
        },
      },
    });

    const formatted = exams.map((e) => {
      const calculatedMarks = e.examQuestions.reduce((acc, q) => acc + q.marks, 0);
      return {
        ...e,
        questionCount: e.examQuestions.length,
        calculatedMarks: calculatedMarks || e.totalMarks,
        attemptCount: e._count.attempts,
      };
    });

    return NextResponse.json({ exams: formatted });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch exams' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(['ADMIN']);
    const body = await req.json();

    const {
      title,
      description,
      subject,
      course,
      examCode,
      startDate,
      endDate,
      duration,
      totalMarks,
      passingMarks,
      negativeMarking,
      randomizeQuestions,
      randomizeOptions,
      showResultImmediately,
      showAnswersToStudent,
      allowRetake,
      maxAttempts,
      status,
      instructions,
    } = body;

    if (!title || !subject || !examCode || !duration) {
      return NextResponse.json(
        { error: 'Title, subject, exam code, and duration are required' },
        { status: 400 }
      );
    }

    // Check code uniqueness
    const existing = await prisma.exam.findUnique({
      where: { examCode: examCode.trim().toUpperCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'An exam with this exam code already exists' },
        { status: 409 }
      );
    }

    const exam = await prisma.exam.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        subject: subject.trim(),
        course: course?.trim() || null,
        examCode: examCode.trim().toUpperCase(),
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        duration: parseInt(duration, 10),
        totalMarks: parseFloat(totalMarks || 0),
        passingMarks: parseFloat(passingMarks || 0),
        negativeMarking: parseFloat(negativeMarking || 0),
        randomizeQuestions: Boolean(randomizeQuestions),
        randomizeOptions: Boolean(randomizeOptions),
        showResultImmediately: showResultImmediately !== false,
        showAnswersToStudent: showAnswersToStudent !== false,
        allowRetake: Boolean(allowRetake),
        maxAttempts: parseInt(maxAttempts || 1, 10),
        status: status || 'DRAFT',
        instructions: instructions?.trim() || null,
        createdById: session.userId,
        sections: {
          create: {
            name: 'Section A - General',
            order: 0,
            instructions: 'Answer all questions in this section.',
          },
        },
      },
      include: {
        sections: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Exam created successfully',
      exam,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create exam' },
      { status: 500 }
    );
  }
}
