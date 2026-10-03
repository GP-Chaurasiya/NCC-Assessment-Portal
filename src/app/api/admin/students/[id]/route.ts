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
                subject: true,
                totalMarks: true,
                passingMarks: true,
                duration: true,
              },
            },
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const attempts = student.attempts || [];
    const completedAttempts = attempts.filter(
      (a) => a.status === 'SUBMITTED' || a.status === 'AUTO_SUBMITTED' || a.status === 'EVALUATED'
    );
    const passedAttempts = completedAttempts.filter((a) => a.isPassed);

    const totalMarksEarned = completedAttempts.reduce(
      (acc, a) => acc + (a.totalScore || 0),
      0
    );
    const totalMarksPossible = completedAttempts.reduce(
      (acc, a) => acc + (a.exam?.totalMarks || 0),
      0
    );

    const avgPercentage =
      completedAttempts.length > 0
        ? Math.round(
            completedAttempts.reduce((acc, a) => acc + (a.percentage || 0), 0) /
              completedAttempts.length
          )
        : 0;

    let bestAttempt: any = null;
    let lowestAttempt: any = null;

    if (completedAttempts.length > 0) {
      bestAttempt = completedAttempts.reduce(
        (best, cur) => (!best || cur.percentage > best.percentage ? cur : best),
        completedAttempts[0]
      );
      lowestAttempt = completedAttempts.reduce(
        (low, cur) => (!low || cur.percentage < low.percentage ? cur : low),
        completedAttempts[0]
      );
    }

    const totalTabSwitches = attempts.reduce(
      (acc, a) => acc + (a.tabSwitchViolations || 0),
      0
    );
    const terminatedCount = attempts.filter(
      (a) => a.submissionMethod === 'AUTO_TAB_SWITCH'
    ).length;

    // Discipline & Integrity Score (Starts at 100%, drops by 10 per tab switch, 25 per security termination)
    const disciplineScore = Math.max(
      0,
      100 - totalTabSwitches * 10 - terminatedCount * 25
    );
    const disciplineStatus =
      disciplineScore >= 90
        ? 'Exemplary'
        : disciplineScore >= 70
        ? 'Satisfactory'
        : 'Caution Flagged';

    // Subject Breakdown
    const subjectMap: Record<
      string,
      { attempts: number; totalScore: number; maxScore: number; passCount: number }
    > = {};

    completedAttempts.forEach((att) => {
      const subj = att.exam?.subject || 'General';
      if (!subjectMap[subj]) {
        subjectMap[subj] = { attempts: 0, totalScore: 0, maxScore: 0, passCount: 0 };
      }
      subjectMap[subj].attempts += 1;
      subjectMap[subj].totalScore += att.totalScore || 0;
      subjectMap[subj].maxScore += att.exam?.totalMarks || 0;
      if (att.isPassed) subjectMap[subj].passCount += 1;
    });

    const subjectBreakdown = Object.entries(subjectMap).map(([subject, data]) => ({
      subject,
      attempts: data.attempts,
      passCount: data.passCount,
      passRate: data.attempts > 0 ? Math.round((data.passCount / data.attempts) * 100) : 0,
      averagePercentage:
        data.maxScore > 0 ? Math.round((data.totalScore / data.maxScore) * 100) : 0,
    }));

    const analytics = {
      totalAttempts: attempts.length,
      completedAttempts: completedAttempts.length,
      passedCount: passedAttempts.length,
      failedCount: completedAttempts.length - passedAttempts.length,
      passRate:
        completedAttempts.length > 0
          ? Math.round((passedAttempts.length / completedAttempts.length) * 100)
          : 0,
      avgPercentage,
      totalMarksEarned: Math.round(totalMarksEarned * 10) / 10,
      totalMarksPossible: Math.round(totalMarksPossible * 10) / 10,
      bestScore: bestAttempt
        ? {
            score: bestAttempt.totalScore,
            percentage: bestAttempt.percentage,
            examTitle: bestAttempt.exam?.title,
            examCode: bestAttempt.exam?.examCode,
          }
        : null,
      lowestScore: lowestAttempt
        ? {
            score: lowestAttempt.totalScore,
            percentage: lowestAttempt.percentage,
            examTitle: lowestAttempt.exam?.title,
            examCode: lowestAttempt.exam?.examCode,
          }
        : null,
      totalTabSwitches,
      terminatedCount,
      disciplineScore,
      disciplineStatus,
      subjectBreakdown,
    };

    return NextResponse.json({ student, analytics });
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
