import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, signToken, COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { name, email, username, password, confirmPassword, studentId, course, batch, unit, phone } =
      await req.json();

    if (!name || !email || !username || !password) {
      return NextResponse.json(
        { error: 'All required fields must be filled' },
        { status: 400 }
      );
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Password and confirm password do not match' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim().toLowerCase();

    // Check existing
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: cleanEmail }, { username: cleanUsername }],
      },
    });

    if (existing) {
      if (existing.email === cleanEmail) {
        return NextResponse.json({ error: 'Email is already registered' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Username is already taken' }, { status: 409 });
    }

    const hashedPassword = await hashPassword(password);

    // Create user and profile
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        username: cleanUsername,
        password: hashedPassword,
        role: 'STUDENT',
        status: 'ACTIVE',
        studentProfile: {
          create: {
            studentId: studentId?.trim() || null,
            course: course?.trim() || 'Senior Division / Wing',
            batch: batch?.trim() || '2025-2026',
            unit: unit?.trim() || 'NCC Battalion Unit',
            phone: phone?.trim() || null,
          },
        },
      },
      include: {
        studentProfile: true,
      },
    });

    const sessionPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
      role: 'STUDENT' as const,
      name: user.name,
    };

    const token = await signToken(sessionPayload);

    const response = NextResponse.json({
      success: true,
      message: 'Student registered successfully',
      user: sessionPayload,
      redirectUrl: '/student',
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      {
        error: 'Registration failed due to a server error',
        details: error?.message || 'Database write error or constraint violation',
      },
      { status: 500 }
    );
  }
}
