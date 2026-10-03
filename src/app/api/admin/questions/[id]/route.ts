import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(['ADMIN']);
    const question = await prisma.question.findUnique({
      where: { id: params.id },
      include: {
        options: { orderBy: { order: 'asc' } },
        pairs: { orderBy: { order: 'asc' } },
      },
    });

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    return NextResponse.json({ question });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch question' },
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
      type,
      question,
      subject,
      topic,
      difficulty,
      defaultMarks,
      negativeMarks,
      explanation,
      imageUrl,
      isMultipleCorrect,
      caseSensitive,
      acceptedAnswersJson,
      expectedAnswer,
      maxWordCount,
      requiresManualEvaluation,
      options,
      pairs,
    } = body;

    // Delete existing options & pairs if updated
    if (options) {
      await prisma.questionOption.deleteMany({ where: { questionId: params.id } });
    }
    if (pairs) {
      await prisma.questionPair.deleteMany({ where: { questionId: params.id } });
    }

    const updated = await prisma.question.update({
      where: { id: params.id },
      data: {
        type: type || undefined,
        question: question ? question.trim() : undefined,
        subject: subject ? subject.trim() : undefined,
        topic: topic !== undefined ? topic : undefined,
        difficulty: difficulty || undefined,
        defaultMarks: defaultMarks !== undefined ? parseFloat(defaultMarks) : undefined,
        negativeMarks: negativeMarks !== undefined ? parseFloat(negativeMarks) : undefined,
        explanation: explanation !== undefined ? explanation : undefined,
        imageUrl: imageUrl !== undefined ? imageUrl : undefined,
        isMultipleCorrect: isMultipleCorrect !== undefined ? Boolean(isMultipleCorrect) : undefined,
        caseSensitive: caseSensitive !== undefined ? Boolean(caseSensitive) : undefined,
        acceptedAnswersJson: acceptedAnswersJson
          ? typeof acceptedAnswersJson === 'string'
            ? acceptedAnswersJson
            : JSON.stringify(acceptedAnswersJson)
          : undefined,
        expectedAnswer: expectedAnswer !== undefined ? expectedAnswer : undefined,
        maxWordCount: maxWordCount !== undefined ? parseInt(maxWordCount, 10) : undefined,
        requiresManualEvaluation:
          requiresManualEvaluation !== undefined
            ? Boolean(requiresManualEvaluation)
            : undefined,
        options:
          options && options.length > 0
            ? {
                create: options.map((opt: any, index: number) => ({
                  text: opt.text.trim(),
                  isCorrect: Boolean(opt.isCorrect),
                  order: opt.order !== undefined ? opt.order : index,
                  explanation: opt.explanation?.trim() || null,
                })),
              }
            : undefined,
        pairs:
          pairs && pairs.length > 0
            ? {
                create: pairs.map((pair: any, index: number) => ({
                  leftItem: pair.leftItem.trim(),
                  rightItem: pair.rightItem.trim(),
                  order: pair.order !== undefined ? pair.order : index,
                })),
              }
            : undefined,
      },
      include: {
        options: true,
        pairs: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Question updated successfully',
      question: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update question' },
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
    await prisma.question.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true, message: 'Question deleted successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete question' },
      { status: 500 }
    );
  }
}
