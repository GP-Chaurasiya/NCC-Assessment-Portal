import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseQuestionPaperText } from '@/lib/paperParser';

export async function GET() {
  try {
    await requireAuth(['ADMIN']);
    const papers = await prisma.uploadedQuestionPaper.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { name: true, email: true } },
      },
    });

    const parsedPapers = papers.map((p) => {
      let questions = [];
      try {
        questions = JSON.parse(p.extractedJson);
      } catch (e) {
        questions = [];
      }
      return {
        ...p,
        questions,
      };
    });

    return NextResponse.json({ papers: parsedPapers });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch uploaded papers' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(['ADMIN']);
    const body = await req.json();

    const { title, fileName, fileType, rawContent, subject } = body;

    if (!title || !rawContent) {
      return NextResponse.json(
        { error: 'Paper title and text content are required for extraction' },
        { status: 400 }
      );
    }

    // Extract questions using our parser
    const extractedQuestions = parseQuestionPaperText(
      rawContent,
      subject || 'General'
    );

    if (extractedQuestions.length === 0) {
      return NextResponse.json(
        { error: 'Could not detect any valid question patterns in the provided content. Please ensure questions are numbered.' },
        { status: 400 }
      );
    }

    const paper = await prisma.uploadedQuestionPaper.create({
      data: {
        title: title.trim(),
        fileName: fileName || `${title.replace(/\s+/g, '_')}.txt`,
        fileType: fileType || 'TXT',
        rawContent,
        status: 'PENDING_REVIEW',
        extractedJson: JSON.stringify(extractedQuestions),
        createdById: session.userId,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully extracted ${extractedQuestions.length} questions for review.`,
      paper: {
        ...paper,
        questions: extractedQuestions,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to process question paper' },
      { status: 500 }
    );
  }
}
