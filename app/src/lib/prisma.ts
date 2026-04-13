/**
 * Prisma Singleton for Next.js
 *
 * Prevents multiple PrismaClient instances in development (hot-reload)
 * and production (serverless cold starts) that exhaust connection pools.
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
