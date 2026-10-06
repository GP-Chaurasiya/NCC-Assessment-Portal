import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { prisma } from './prisma';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'ncc-cadet-portal-fallback-secret-2026'
);

export const COOKIE_NAME = 'ncc_session_token';

export interface UserSession {
  userId: string;
  email: string;
  username: string;
  role: 'ADMIN' | 'STUDENT';
  name: string;
  studentId?: string;
  course?: string;
  batch?: string;
  unit?: string;
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

export async function signToken(payload: UserSession): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<UserSession | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as UserSession;
  } catch (err) {
    return null;
  }
}

export async function getSession(): Promise<UserSession | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return await verifyToken(token);
}

export async function requireAuth(allowedRoles?: ('ADMIN' | 'STUDENT')[]) {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  if (allowedRoles && !allowedRoles.includes(session.role)) {
    throw new Error('Forbidden: Insufficient privileges');
  }

  // Ensure user and student profile exist in the active database instance (prevents cross-container foreign key errors)
  try {
    let userRecord = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { studentProfile: true },
    });

    if (!userRecord) {
      userRecord = await prisma.user.findFirst({
        where: {
          OR: [
            { email: session.email.toLowerCase() },
            { username: session.username.toLowerCase() },
          ],
        },
        include: { studentProfile: true },
      });

      if (userRecord) {
        session.userId = userRecord.id;
      }
    }

    if (!userRecord) {
      userRecord = await prisma.user.create({
        data: {
          id: session.userId,
          email: session.email.toLowerCase(),
          username: session.username.toLowerCase(),
          name: session.name,
          password: await hashPassword('cadet123'),
          role: session.role,
          status: 'ACTIVE',
          studentProfile:
            session.role === 'STUDENT'
              ? {
                  create: {
                    studentId: session.studentId || 'NCC-CADET',
                    course: session.course || 'Senior Division Army Wing',
                    batch: session.batch || '2025-2026',
                    unit: session.unit || '1 Delhi Composite Battalion',
                  },
                }
              : undefined,
        },
        include: { studentProfile: true },
      });
    }

    // Ensure student profile exists for students
    if (session.role === 'STUDENT' && userRecord && !userRecord.studentProfile) {
      await prisma.studentProfile.create({
        data: {
          userId: userRecord.id,
          studentId: session.studentId || 'NCC-CADET',
          course: session.course || 'Senior Division Army Wing',
          batch: session.batch || '2025-2026',
          unit: session.unit || '1 Delhi Composite Battalion',
        },
      }).catch(() => {});
    }
  } catch (err) {
    // If concurrent insert occurs or record already created, continue gracefully
  }

  return session;
}
