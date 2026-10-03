import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, hashPassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(['ADMIN']);
    const student = await prisma.user.findUnique({
      where: { id: params.id, role: 'STUDENT' },
      include: {
        studentProfile: true,
        attempts: {
          orderBy: { startedAt: 'desc' },
          include: {
            exam: {
              select: {
                id: true,
                title: true,
                examCode: true,
                totalMarks: true,
                passingMarks: true,
              },
            },
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json({ student });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch student details' },
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
    const { name, email, username, studentId, course, unit, status, password } =
      await req.json();

    const data: any = {
      name: name?.trim(),
      email: email?.trim().toLowerCase(),
      username: username?.trim(),
      status: status || undefined,
    };

    if (password && password.trim().length >= 6) {
      data.password = await hashPassword(password);
    }

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: {
        ...data,
        studentProfile: {
          upsert: {
            create: {
              studentId: studentId?.trim() || null,
              course: course?.trim() || null,
              unit: unit?.trim() || null,
            },
            update: {
              studentId: studentId?.trim() || null,
              course: course?.trim() || null,
              unit: unit?.trim() || null,
            },
          },
        },
      },
      include: {
        studentProfile: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Student updated successfully',
      student: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update student' },
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
    await prisma.user.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true, message: 'Student deleted successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete student' },
      { status: 500 }
    );
  }
}
