import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: { attemptId: string } }
) {
  try {
    const session = await requireAuth(['STUDENT']);
    const now = new Date();

    const attempt = await prisma.examAttempt.findUnique({
      where: { id: params.attemptId },
    });

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    if (attempt.studentId !== session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (attempt.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { error: 'This exam attempt has already been submitted and is locked.' },
        { status: 400 }
      );
    }

    // Server-authoritative expiration check (with 5000ms grace for network latency)
    const expirationWithGrace = new Date(new Date(attempt.expiresAt).getTime() + 5000);
    if (now > expirationWithGrace) {
      return NextResponse.json(
        { error: 'Exam duration has expired. Answers can no longer be modified.', expired: true },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      questionId,
      selectedOptionIds,
      textAnswer,
      matchedPairs,
      orderedItemIds,
      isMarkedForReview,
      isVisited,
    } = body;

    if (!questionId) {
      return NextResponse.json({ error: 'Question ID is required' }, { status: 400 });
    }

    // Determine if question has an answer
    const hasSelectedOptions =
      Array.isArray(selectedOptionIds) && selectedOptionIds.length > 0;
    const hasText = typeof textAnswer === 'string' && textAnswer.trim().length > 0;
    const hasMatchedPairs =
      matchedPairs &&
      typeof matchedPairs === 'object' &&
      Object.keys(matchedPairs).length > 0;
    const hasOrdered = Array.isArray(orderedItemIds) && orderedItemIds.length > 0;

    const isAnswered = hasSelectedOptions || hasText || hasMatchedPairs || hasOrdered;

    // Upsert StudentAnswer
    const answer = await prisma.studentAnswer.upsert({
      where: {
        id: body.answerId || `ans-${params.attemptId}-${questionId}`,
      },
      create: {
        id: `ans-${params.attemptId}-${questionId}`,
        attemptId: params.attemptId,
        questionId,
        selectedOptionIdsJson: selectedOptionIds
          ? JSON.stringify(selectedOptionIds)
          : null,
        textAnswer: textAnswer !== undefined ? textAnswer : null,
        matchedPairsJson: matchedPairs ? JSON.stringify(matchedPairs) : null,
        orderedItemIdsJson: orderedItemIds ? JSON.stringify(orderedItemIds) : null,
        isMarkedForReview: Boolean(isMarkedForReview),
        isVisited: isVisited !== undefined ? Boolean(isVisited) : true,
        isAnswered,
        savedAt: now,
      },
      update: {
        selectedOptionIdsJson:
          selectedOptionIds !== undefined
            ? JSON.stringify(selectedOptionIds)
            : undefined,
        textAnswer: textAnswer !== undefined ? textAnswer : undefined,
        matchedPairsJson:
          matchedPairs !== undefined ? JSON.stringify(matchedPairs) : undefined,
        orderedItemIdsJson:
          orderedItemIds !== undefined ? JSON.stringify(orderedItemIds) : undefined,
        isMarkedForReview:
          isMarkedForReview !== undefined ? Boolean(isMarkedForReview) : undefined,
        isVisited: isVisited !== undefined ? Boolean(isVisited) : undefined,
        isAnswered,
        savedAt: now,
      },
    });

    return NextResponse.json({
      success: true,
      savedAt: now.toISOString(),
      answerId: answer.id,
      isAnswered: answer.isAnswered,
      isMarkedForReview: answer.isMarkedForReview,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to autosave answer' },
      { status: 500 }
    );
  }
}
