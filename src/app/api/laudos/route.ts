import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, isAuthError, safeErrorResponse } from '@/lib/auth-guard';
import { safeInt, safeString } from '@/lib/validation';

/**
 * GET /api/laudos?vertical=societario&year=2020&page=1&limit=20&q=search
 * Returns paginated laudos with optional filtering.
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (isAuthError(authResult)) return authResult.error;

    const { searchParams } = new URL(req.url);
    const year = safeInt(searchParams.get('year'), 0, 1990, 2030) || null;
    const page = safeInt(searchParams.get('page'), 1, 1, 1000);
    const limit = safeInt(searchParams.get('limit'), 20, 1, 100);
    const q = safeString(searchParams.get('q'), 200);
    const skip = (page - 1) * limit;

    const where: {
      vertical: string;
      year?: number;
      OR?: { caseTitle?: { contains: string; mode: 'insensitive' }; radicado?: { contains: string; mode: 'insensitive' } }[];
    } = { vertical: 'societario' };
    if (year) where.year = year;
    if (q) {
      where.OR = [
        { caseTitle: { contains: q, mode: 'insensitive' } },
        { radicado: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [laudos, total] = await Promise.all([
      prisma.laudo.findMany({
        where,
        select: {
          id: true,
          caseTitle: true,
          vertical: true,
          subVertical: true,
          year: true,
          arbitrationCenter: true,
          cuantia: true,
          confidenceScore: true,
          needsHumanReview: true,
          contractType: true,
          parties: true,
          decision: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.laudo.count({ where }),
    ]);

    return NextResponse.json({ laudos, total, page, limit });
  } catch (error: unknown) {
    return safeErrorResponse(error, 'Laudos');
  }
}
