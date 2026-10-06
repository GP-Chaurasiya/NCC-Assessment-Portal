import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseQuestionPaperText, ExtractedQuestion } from '@/lib/paperParser';
import zlib from 'zlib';

function extractFallbackPdfText(buffer: Buffer): string {
  try {
    const content = buffer.toString('binary');
    const streamRegex = /stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g;
    let match: RegExpExecArray | null;
    let extractedText = '';

    while ((match = streamRegex.exec(content)) !== null) {
      const streamData = Buffer.from(match[1], 'binary');
      let textChunk = '';
      try {
        const decompressed = zlib.inflateSync(streamData);
        textChunk = decompressed.toString('utf-8');
      } catch {
        textChunk = streamData.toString('utf-8');
      }

      // Extract Tj and TJ strings
      const tjMatches = textChunk.match(/\(([^)]+)\)\s*Tj/g);
      if (tjMatches) {
        extractedText +=
          tjMatches
            .map((m) => m.replace(/^\(/, '').replace(/\)\s*Tj$/, ''))
            .join(' ') + '\n';
      }
      const arrayMatches = textChunk.match(/\[(.*?)\]\s*TJ/g);
      if (arrayMatches) {
        for (const arr of arrayMatches) {
          const innerStrings = arr.match(/\(([^)]+)\)/g);
          if (innerStrings) {
            extractedText += innerStrings.map((s) => s.slice(1, -1)).join('') + ' ';
          }
        }
        extractedText += '\n';
      }
    }

    return extractedText.trim();
  } catch {
    return '';
  }
}

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
      let questions: ExtractedQuestion[] = [];
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
    const contentType = req.headers.get('content-type') || '';

    let title = '';
    let fileName = '';
    let fileType = 'TXT';
    let rawContent = '';
    let subject = 'General';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      title = (formData.get('title') as string) || '';
      subject = (formData.get('subject') as string) || 'General';

      if (!file) {
        return NextResponse.json(
          { error: 'No file was uploaded. Please select a document (PDF, DOCX, or TXT).' },
          { status: 400 }
        );
      }

      fileName = file.name;
      const extension = fileName.split('.').pop()?.toLowerCase() || '';

      if (!title.trim()) {
        title = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ');
      }

      const arrayBuffer = await file.arrayBuffer();
      const fileBuffer = Buffer.from(arrayBuffer);

      if (extension === 'pdf') {
        fileType = 'PDF';
        try {
          const { PDFParse } = await import('pdf-parse');
          const parser = new PDFParse({ data: fileBuffer });
          const pdfData = await parser.getText();
          rawContent = pdfData?.text || '';
        } catch (pdfErr: any) {
          console.warn('pdf-parse library extraction error, attempting stream fallback:', pdfErr?.message);
          // Fallback stream text extraction
          rawContent = extractFallbackPdfText(fileBuffer);
        }

        if (!rawContent || !rawContent.trim()) {
          rawContent = extractFallbackPdfText(fileBuffer);
        }

        if (!rawContent || !rawContent.trim()) {
          return NextResponse.json(
            { error: 'Failed to extract text from PDF file. Please ensure the PDF contains selectable text (not scanned images).' },
            { status: 422 }
          );
        }
      } else if (extension === 'docx') {
        fileType = 'DOCX';
        try {
          const mammoth = await import('mammoth');
          const docxResult = await mammoth.extractRawText({ buffer: fileBuffer });
          rawContent = docxResult.value || '';
        } catch (docxErr: any) {
          return NextResponse.json(
            { error: `Failed to extract text from DOCX file: ${docxErr.message || 'Corrupt or unreadable Word document'}` },
            { status: 422 }
          );
        }
      } else {
        // Plain text / Markdown / other text formats
        fileType = extension ? extension.toUpperCase() : 'TXT';
        rawContent = fileBuffer.toString('utf-8');
      }
    } else {
      // Standard JSON payload
      const body = await req.json();
      title = body.title || '';
      fileName = body.fileName || '';
      fileType = body.fileType || 'TXT';
      rawContent = body.rawContent || '';
      subject = body.subject || 'General';
    }

    if (!title.trim() || !rawContent.trim()) {
      return NextResponse.json(
        { error: 'Paper title and non-empty content are required for extraction' },
        { status: 400 }
      );
    }

    // Extract questions using high-accuracy parser
    const extractedQuestions = parseQuestionPaperText(
      rawContent,
      subject.trim() || 'General'
    );

    if (extractedQuestions.length === 0) {
      return NextResponse.json(
        {
          error: 'Could not detect any valid question patterns in the provided document. Please check the document format.',
          rawContent,
        },
        { status: 400 }
      );
    }

    const paper = await prisma.uploadedQuestionPaper.create({
      data: {
        title: title.trim(),
        fileName: fileName || `${title.replace(/\s+/g, '_')}.txt`,
        fileType,
        rawContent,
        status: 'PENDING_REVIEW',
        extractedJson: JSON.stringify(extractedQuestions),
        createdById: session.userId,
      },
    });

    const stats = {
      total: extractedQuestions.length,
      mcq: extractedQuestions.filter((q) => q.type === 'MCQ').length,
      trueFalse: extractedQuestions.filter((q) => q.type === 'TRUE_FALSE').length,
      fillBlanks: extractedQuestions.filter((q) => q.type === 'FILL_BLANKS').length,
      shortAnswer: extractedQuestions.filter((q) => q.type === 'SHORT_ANSWER').length,
      longAnswer: extractedQuestions.filter((q) => q.type === 'LONG_ANSWER').length,
    };

    return NextResponse.json({
      success: true,
      message: `Successfully extracted ${extractedQuestions.length} questions from ${fileName || 'document'} with high accuracy.`,
      rawContent,
      stats,
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
