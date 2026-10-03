import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(['ADMIN']);
    const body = await req.json();
    const { action } = body;

    // Action 1: Add existing question from Question Bank to Exam
    if (action === 'ADD_QUESTION') {
      const { questionId, sectionId, marks, negativeMarks } = body;
      const question = await prisma.question.findUnique({ where: { id: questionId } });
      if (!question) {
        return NextResponse.json({ error: 'Question not found' }, { status: 404 });
      }

      // Check count to assign order
      const count = await prisma.examQuestion.count({ where: { examId: params.id } });

      const examQ = await prisma.examQuestion.create({
        data: {
          examId: params.id,
          questionId,
          sectionId: sectionId || null,
          marks: marks !== undefined ? parseFloat(marks) : question.defaultMarks,
          negativeMarks: negativeMarks !== undefined ? parseFloat(negativeMarks) : question.negativeMarks,
          order: count,
        },
      });

      // Recalculate total marks
      const allEq = await prisma.examQuestion.findMany({ where: { examId: params.id } });
      const newTotal = allEq.reduce((acc, eq) => acc + eq.marks, 0);
      await prisma.exam.update({ where: { id: params.id }, data: { totalMarks: newTotal } });

      return NextResponse.json({ success: true, examQuestion: examQ, newTotal });
    }

    // Action 2: Remove question from Exam
    if (action === 'REMOVE_QUESTION') {
      const { examQuestionId } = body;
      await prisma.examQuestion.delete({ where: { id: examQuestionId } });

      // Recalculate total marks
      const allEq = await prisma.examQuestion.findMany({ where: { examId: params.id } });
      const newTotal = allEq.reduce((acc, eq) => acc + eq.marks, 0);
      await prisma.exam.update({ where: { id: params.id }, data: { totalMarks: newTotal } });

      return NextResponse.json({ success: true, newTotal });
    }

    // Action 3: Reorder questions
    if (action === 'REORDER_QUESTIONS') {
      const { orderedIds } = body; // Array of examQuestion ids
      await Promise.all(
        orderedIds.map((id: string, index: number) =>
          prisma.examQuestion.update({
            where: { id },
            data: { order: index },
          })
        )
      );
      return NextResponse.json({ success: true });
    }

    // Action 4: Update question marks or section assignment
    if (action === 'UPDATE_EXAM_QUESTION') {
      const { examQuestionId, marks, negativeMarks, sectionId } = body;
      await prisma.examQuestion.update({
        where: { id: examQuestionId },
        data: {
          marks: marks !== undefined ? parseFloat(marks) : undefined,
          negativeMarks: negativeMarks !== undefined ? parseFloat(negativeMarks) : undefined,
          sectionId: sectionId !== undefined ? sectionId : undefined,
        },
      });

      const allEq = await prisma.examQuestion.findMany({ where: { examId: params.id } });
      const newTotal = allEq.reduce((acc, eq) => acc + eq.marks, 0);
      await prisma.exam.update({ where: { id: params.id }, data: { totalMarks: newTotal } });

      return NextResponse.json({ success: true, newTotal });
    }

    // Action 5: Add Section
    if (action === 'ADD_SECTION') {
      const { name, instructions } = body;
      const count = await prisma.examSection.count({ where: { examId: params.id } });
      const section = await prisma.examSection.create({
        data: {
          examId: params.id,
          name: name.trim(),
          instructions: instructions?.trim() || null,
          order: count,
        },
      });
      return NextResponse.json({ success: true, section });
    }

    // Action 6: Delete Section
    if (action === 'DELETE_SECTION') {
      const { sectionId } = body;
      await prisma.examSection.delete({ where: { id: sectionId } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action specified' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Builder operation failed' },
      { status: 500 }
    );
  }
}
