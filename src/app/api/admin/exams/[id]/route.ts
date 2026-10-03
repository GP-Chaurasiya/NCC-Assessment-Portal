import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(['ADMIN']);

    const exam = await prisma.exam.findUnique({
      where: { id: params.id },
      include: {
        sections: {
          orderBy: { order: 'asc' },
          include: {
            examQuestions: {
              orderBy: { order: 'asc' },
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
        examQuestions: {
          orderBy: { order: 'asc' },
          include: {
            question: {
              include: {
                options: true,
                pairs: true,
              },
            },
            section: true,
          },
        },
        _count: {
          select: { attempts: true },
        },
      },
    });

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    // Compute live validation checklist for publishing
    const validationChecklist = {
      hasTitle: Boolean(exam.title && exam.title.trim().length > 0),
      hasDuration: exam.duration > 0,
      hasQuestions: exam.examQuestions.length > 0,
      totalMarksCalculated: exam.examQuestions.reduce((sum, eq) => sum + eq.marks, 0),
      questionsConfigured: exam.examQuestions.every((eq) => {
        const q = eq.question;
        if (q.type === 'MCQ' || q.type === 'TRUE_FALSE') {
          return q.options.some((o) => o.isCorrect);
        }
        if (q.type === 'FILL_BLANKS') {
          return Boolean(q.acceptedAnswersJson && q.acceptedAnswersJson.length > 2);
        }
        if (q.type === 'MATCH_FOLLOWING') {
          return q.pairs.length >= 2;
        }
        return true;
      }),
    };

    const isPublishReady =
      validationChecklist.hasTitle &&
      validationChecklist.hasDuration &&
      validationChecklist.hasQuestions &&
      validationChecklist.questionsConfigured;

    return NextResponse.json({
      exam,
      validationChecklist,
      isPublishReady,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch exam' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(['ADMIN']);
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

    // Check if trying to publish
    if (status === 'ACTIVE') {
      const existingExam = await prisma.exam.findUnique({
        where: { id: params.id },
        include: {
          examQuestions: {
            include: { question: { include: { options: true, pairs: true } } },
          },
        },
      });

      if (!existingExam || existingExam.examQuestions.length === 0) {
        return NextResponse.json(
          { error: 'Cannot publish exam: At least one question is required before publishing.' },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.exam.update({
      where: { id: params.id },
      data: {
        title: title ? title.trim() : undefined,
        description: description !== undefined ? description : undefined,
        subject: subject ? subject.trim() : undefined,
        course: course !== undefined ? course : undefined,
        examCode: examCode ? examCode.trim().toUpperCase() : undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        duration: duration ? parseInt(duration, 10) : undefined,
        totalMarks: totalMarks !== undefined ? parseFloat(totalMarks) : undefined,
        passingMarks: passingMarks !== undefined ? parseFloat(passingMarks) : undefined,
        negativeMarking: negativeMarking !== undefined ? parseFloat(negativeMarking) : undefined,
        randomizeQuestions: randomizeQuestions !== undefined ? Boolean(randomizeQuestions) : undefined,
        randomizeOptions: randomizeOptions !== undefined ? Boolean(randomizeOptions) : undefined,
        showResultImmediately: showResultImmediately !== undefined ? Boolean(showResultImmediately) : undefined,
        showAnswersToStudent: showAnswersToStudent !== undefined ? Boolean(showAnswersToStudent) : undefined,
        allowRetake: allowRetake !== undefined ? Boolean(allowRetake) : undefined,
        maxAttempts: maxAttempts !== undefined ? parseInt(maxAttempts, 10) : undefined,
        status: status || undefined,
        instructions: instructions !== undefined ? instructions : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Exam updated successfully',
      exam: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update exam' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(['ADMIN']);
    await prisma.exam.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true, message: 'Exam deleted successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete exam' },
      { status: 500 }
    );
  }
}
