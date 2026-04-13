import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import LaudosClient from './LaudosClient';

export const metadata: Metadata = { title: 'Laudos Arbitrales' };
export const dynamic = 'force-dynamic';

export default async function LaudosPage() {
  let laudos: any[] = [];
  let stats = { total: 0, verticals: [] as { vertical: string; count: number }[], yearRange: { min: 0, max: 0 } };

  try {
    const societarioFilter = { vertical: 'societario' };
    const total = await prisma.laudo.count({ where: societarioFilter });

    if (total > 0) {
      const yearAgg = await prisma.laudo.aggregate({
        where: societarioFilter,
        _min: { year: true },
        _max: { year: true },
      });

      // Group by subVertical for societario breakdown
      const subVerticalDist = await prisma.laudo.groupBy({
        by: ['subVertical'],
        where: societarioFilter,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      });

      stats = {
        total,
        verticals: subVerticalDist.map(v => ({ vertical: v.subVertical || 'Sin clasificar', count: v._count.id })),
        yearRange: {
          min: yearAgg._min.year ?? 0,
          max: yearAgg._max.year ?? 0,
        },
      };

      laudos = await prisma.laudo.findMany({
        where: societarioFilter,
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
          controversies: true,
          failures: true,
          relatedCase: {
            select: { id: true, caseName: true, actionType: true, outcomeGeneral: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }
  } catch (error: any) {
    console.error('[Laudos] DB error:', error?.message || error);
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <LaudosClient laudos={laudos} stats={stats} />
    </div>
  );
}
