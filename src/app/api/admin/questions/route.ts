import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(['ADMIN']);
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get('search')?.trim() || '';
    const type = searchParams.get('type') || '';
    const subject = searchParams.get('subject') || '';
    const difficulty = searchParams.get('difficulty') || '';

    const where: any = {};
    if (type && type !== 'ALL') where.type = type;
    if (subject && subject !== 'ALL') where.subject = subject;
    if (difficulty && difficulty !== 'ALL') where.difficulty = difficulty;

    if (search) {
      where.OR = [
        { question: { contains: search } },
        { subject: { contains: search } },
        { topic: { contains: search } },
      ];
    }

    const questions = await prisma.question.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        options: { orderBy: { order: 'asc' } },
        pairs: { orderBy: { order: 'asc' } },
        _count: { select: { examQuestions: true } },
      },
    });

    return NextResponse.json({ questions });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(['ADMIN']);
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
      options, // array of { text, isCorrect, order }
      pairs,   // array of { leftItem, rightItem, order }
    } = body;

    if (!type || !question || !subject) {
      return NextResponse.json(
        { error: 'Question text, type, and subject are required' },
        { status: 400 }
      );
    }

    const created = await prisma.question.create({
      data: {
        type,
        question: question.trim(),
        subject: subject.trim(),
        topic: topic?.trim() || null,
        difficulty: difficulty || 'MEDIUM',
        defaultMarks: parseFloat(defaultMarks || 1),
        negativeMarks: parseFloat(negativeMarks || 0),
        explanation: explanation?.trim() || null,
        imageUrl: imageUrl?.trim() || null,
        isMultipleCorrect: Boolean(isMultipleCorrect),
        caseSensitive: Boolean(caseSensitive),
        acceptedAnswersJson: acceptedAnswersJson
          ? typeof acceptedAnswersJson === 'string'
            ? acceptedAnswersJson
            : JSON.stringify(acceptedAnswersJson)
          : null,
        expectedAnswer: expectedAnswer?.trim() || null,
        maxWordCount: maxWordCount ? parseInt(maxWordCount, 10) : null,
        requiresManualEvaluation:
          Boolean(requiresManualEvaluation) ||
          type === 'SHORT_ANSWER' ||
          type === 'LONG_ANSWER',
        createdById: session.userId,
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
      message: 'Question created successfully in Question Bank',
      question: created,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create question' },
      { status: 500 }
    );
  }
}
