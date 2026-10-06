import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

function getPrismaClient(): PrismaClient {
  const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
  };

  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  // Support Vercel Serverless environment where root filesystem is read-only
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const tmpDbPath = '/tmp/dev.db';

    if (!fs.existsSync(tmpDbPath)) {
      const candidates = [
        path.join(process.cwd(), 'prisma', 'dev.db'),
        path.join(process.cwd(), 'dev.db'),
        path.join(process.cwd(), '.next', 'server', 'prisma', 'dev.db'),
      ];

      for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
          try {
            fs.copyFileSync(candidate, tmpDbPath);
            console.log(`[PRISMA] Seeded database copied to writable /tmp: ${candidate} -> ${tmpDbPath}`);
            break;
          } catch (err) {
            console.error('[PRISMA] Failed copying db to /tmp:', err);
          }
        }
      }
    }

    process.env.DATABASE_URL = `file:${tmpDbPath}`;
    const client = new PrismaClient({
      datasources: {
        db: {
          url: `file:${tmpDbPath}`,
        },
      },
      log: ['error'],
    });

    globalForPrisma.prisma = client;
    return client;
  }

  // Local development or custom server
  const canonicalDbPath = path.resolve(process.cwd(), 'prisma', 'dev.db');
  process.env.DATABASE_URL = `file:${canonicalDbPath}`;
  const client = new PrismaClient({
    datasources: {
      db: {
        url: `file:${canonicalDbPath}`,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client;
  }

  return client;
}

export const prisma = getPrismaClient();
