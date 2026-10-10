import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { identifier, verificationValue, newPassword, confirmPassword } = await req.json();

    if (!identifier) {
      return NextResponse.json(
        { error: 'Email or username is required' },
        { status: 400 }
      );
    }

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    if (confirmPassword !== undefined && newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'New password and confirmation password do not match' },
        { status: 400 }
      );
    }

    const rawIdentifier = identifier.trim();
    const cleanLower = rawIdentifier.toLowerCase();
    const withUnderscores = cleanLower.replace(/\s+/g, '_');
    const withSpaces = cleanLower.replace(/_+/g, ' ');

    // Lookup user by email OR username
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanLower },
          { username: rawIdentifier },
          { username: cleanLower },
          { username: withUnderscores },
          { username: withSpaces },
        ],
      },
      include: {
        studentProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'No account found matching this email or username' },
        { status: 404 }
      );
    }

    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'This account is deactivated. Please contact your ANO / Admin.' },
        { status: 403 }
      );
    }

    // Identity verification step:
    // If user is a cadet/student, they must verify their Cadet Regimental ID (Roll No) OR registered email
    const trimmedVerification = (verificationValue || '').trim().toLowerCase();

    if (user.role === 'STUDENT') {
      const studentIdClean = user.studentProfile?.studentId?.trim().toLowerCase() || '';
      const emailClean = user.email.trim().toLowerCase();

      if (!trimmedVerification) {
        return NextResponse.json(
          { error: 'Please provide your Cadet Regimental / Roll ID or registered email for security verification' },
          { status: 400 }
        );
      }

      const matchesStudentId = studentIdClean && trimmedVerification === studentIdClean;
      const matchesEmail = trimmedVerification === emailClean;

      if (!matchesStudentId && !matchesEmail) {
        return NextResponse.json(
          {
            error:
              'Verification failed. The Cadet Regimental ID or email provided does not match our records for this account.',
          },
          { status: 400 }
        );
      }
    } else {
      // For Admin, verify against their registered email address or username confirmation
      const emailClean = user.email.trim().toLowerCase();
      const usernameClean = user.username.trim().toLowerCase();

      if (!trimmedVerification) {
        return NextResponse.json(
          { error: 'Please enter your registered email address to verify your officer / admin identity' },
          { status: 400 }
        );
      }

      if (trimmedVerification !== emailClean && trimmedVerification !== usernameClean) {
        return NextResponse.json(
          { error: 'Verification failed. Registered email does not match admin records.' },
          { status: 400 }
        );
      }
    }

    // Hash the new password and update in database
    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({
      success: true,
      message: `Password for ${user.name} has been successfully reset. You can now sign in with your new credentials.`,
      userName: user.name,
      role: user.role,
    });
  } catch (error: any) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      {
        error: 'Failed to reset password due to an internal server error',
        details: error?.message || 'Database update error',
      },
      { status: 500 }
    );
  }
}
