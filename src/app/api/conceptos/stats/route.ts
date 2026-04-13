import { NextResponse } from 'next/server';
import { CONCEPTO_CATEGORIES } from '@/lib/taxonomy-conceptos';
import { prisma } from '@/lib/prisma';
import { requireAuth, isAuthError, safeErrorResponse } from '@/lib/auth-guard';

/**
 * GET /api/conceptos/stats
 * Returns aggregate statistics for the conceptos corpus.
 */
export async function GET() {
  try {
    const authResult = await requireAuth();
    if (isAuthError(authResult)) return authResult.error;

    const total = await prisma.concepto.count();

    // Distribution by tema using Prisma groupBy
    const distRaw = await prisma.concepto.groupBy({
      by: ['temaPrincipal'],
      _count: { temaPrincipal: true },
      orderBy: { _count: { temaPrincipal: 'desc' } },
    });

    // Year range
    const yearAgg = await prisma.concepto.aggregate({
      _min: { year: true },
      _max: { year: true },
      _avg: { confianza: true },
    });

    // Yearly trend
    const yearRaw = await prisma.concepto.groupBy({
      by: ['year'],
      _count: { year: true },
      orderBy: { year: 'asc' },
    });

    const enrichedDistribution = distRaw.map(d => {
      const cat = CONCEPTO_CATEGORIES.find(c => c.code === d.temaPrincipal);
      const count = d._count.temaPrincipal;
      return {
        code: d.temaPrincipal,
        label: cat?.label ?? d.temaPrincipal,
        count,
        pct: total > 0 ? ((count / total) * 100).toFixed(1) : '0',
      };
    });

    return NextResponse.json({
      total,
      yearRange: {
        min_year: yearAgg._min.year ?? 0,
        max_year: yearAgg._max.year ?? 0,
      },
      averageConfidence: yearAgg._avg.confianza ?? 0,
      distribution: enrichedDistribution,
      yearlyTrend: yearRaw.map(y => ({ year: y.year, count: y._count.year })),
    }, {
      headers: {
        'Cache-Control': 'private, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  } catch (error: unknown) {
    return safeErrorResponse(error, 'Conceptos Stats');
  }
}
