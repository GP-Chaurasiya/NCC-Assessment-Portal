import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, signToken, COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { identifier, password } = await req.json();

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Email or username and password are required' },
        { status: 400 }
      );
    }

    const rawIdentifier = identifier.trim();
    const cleanLower = rawIdentifier.toLowerCase();
    const withUnderscores = cleanLower.replace(/\s+/g, '_');
    const withSpaces = cleanLower.replace(/_+/g, ' ');

    // Lookup user by email OR username (case-insensitive and space/underscore tolerant)
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
        { error: 'Invalid email/username or password' },
        { status: 401 }
      );
    }

    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Your account is deactivated. Please contact an administrator.' },
        { status: 403 }
      );
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email/username or password' },
        { status: 401 }
      );
    }

    const sessionPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role as 'ADMIN' | 'STUDENT',
      name: user.name,
      studentId: user.studentProfile?.studentId || undefined,
      course: user.studentProfile?.course || undefined,
      batch: user.studentProfile?.batch || undefined,
      unit: user.studentProfile?.unit || undefined,
    };

    const token = await signToken(sessionPayload);

    const redirectUrl = user.role === 'ADMIN' ? '/admin' : '/student';

    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: sessionPayload,
      redirectUrl,
    });

    // Set secure cookie
    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error occurred during login',
        details: error?.message || 'Database or authentication failure',
      },
      { status: 500 }
    );
  }
}
