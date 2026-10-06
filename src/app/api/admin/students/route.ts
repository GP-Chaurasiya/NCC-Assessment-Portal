import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, hashPassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    await requireAuth(['ADMIN']);
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get('search')?.trim() || '';
    const status = searchParams.get('status') || '';

    const where: any = { role: 'STUDENT' };

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { username: { contains: search } },
        { studentProfile: { studentId: { contains: search } } },
      ];
    }

    const students = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        studentProfile: true,
        attempts: {
          select: {
            id: true,
            totalScore: true,
            percentage: true,
            isPassed: true,
            status: true,
          },
        },
      },
    });

    const formattedStudents = students.map((s) => {
      const completedAttempts = s.attempts.filter((a) =>
        ['SUBMITTED', 'AUTO_SUBMITTED', 'EVALUATED'].includes(a.status)
      );
      const avgScore =
        completedAttempts.length > 0
          ? Math.round(
              (completedAttempts.reduce((acc, curr) => acc + curr.percentage, 0) /
                completedAttempts.length) *
                10
            ) / 10
          : 0;

      return {
        id: s.id,
        name: s.name,
        email: s.email,
        username: s.username,
        status: s.status,
        createdAt: s.createdAt,
        studentId: s.studentProfile?.studentId || 'N/A',
        course: s.studentProfile?.course || 'Senior Division',
        unit: s.studentProfile?.unit || 'NCC Unit',
        attemptsCount: s.attempts.length,
        averageScore: avgScore,
      };
    });

    return NextResponse.json({ students: formattedStudents });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch students' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth(['ADMIN']);
    const { name, email, username, password, studentId, course, unit, status } =
      await req.json();

    if (!name || !email || !username || !password) {
      return NextResponse.json(
        { error: 'Name, email, username, and password are required' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim().toLowerCase();

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: cleanEmail }, { username: cleanUsername }],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'User with this email or username already exists' },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);

    const student = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        username: cleanUsername,
        password: hashedPassword,
        role: 'STUDENT',
        status: status || 'ACTIVE',
        studentProfile: {
          create: {
            studentId: studentId?.trim() || null,
            course: course?.trim() || 'Senior Division',
            unit: unit?.trim() || 'NCC Unit',
          },
        },
      },
      include: {
        studentProfile: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Student created successfully',
      student,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create student' },
      { status: 500 }
    );
  }
}
