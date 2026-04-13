import type { Metadata } from 'next';
import ConceptosClient from './ConceptosClient';
import { CONCEPTO_CATEGORIES } from '@/lib/taxonomy-conceptos';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = { title: 'Conceptos Jurídicos' };
export const dynamic = 'force-dynamic';

// Default stats using pre-computed taxonomy counts as placeholder
const EMPTY_STATS = {
  total: 12758,
  distribution: CONCEPTO_CATEGORIES.map(c => ({
    code: c.code,
    label: c.label,
    count: c.count,
    pct: c.pct,
  })),
  yearlyTrend: [] as { year: number; count: number }[],
};

export default async function ConceptosPage() {
  let stats = EMPTY_STATS;
  let recentConceptos: any[] = [];

  try {
    const total = await prisma.concepto.count();

    if (total > 0) {
      // Use Prisma groupBy instead of raw SQL for compatibility
      const distRaw = await prisma.concepto.groupBy({
        by: ['temaPrincipal'],
        _count: { temaPrincipal: true },
        orderBy: { _count: { temaPrincipal: 'desc' } },
      });

      const yearRaw = await prisma.concepto.groupBy({
        by: ['year'],
        _count: { year: true },
        orderBy: { year: 'asc' },
      });

      stats = {
        total,
        distribution: distRaw.map(d => {
          const cat = CONCEPTO_CATEGORIES.find(c => c.code === d.temaPrincipal);
          const count = d._count.temaPrincipal;
          return {
            code: d.temaPrincipal,
            label: cat?.label ?? d.temaPrincipal,
            count,
            pct: total > 0 ? Number(((count / total) * 100).toFixed(1)) : 0,
          };
        }),
        yearlyTrend: yearRaw.map(y => ({ year: y.year, count: y._count.year })),
      };

      recentConceptos = await prisma.concepto.findMany({
        select: {
          id: true,
          filename: true,
          year: true,
          temaPrincipal: true,
          subtema: true,
          confianza: true,
          titulo: true,
        },
        orderBy: { year: 'desc' },
        take: 50,
      });
    }
  } catch (error: any) {
    console.error('[Conceptos] DB error:', error?.message || error);
    // Falls back to EMPTY_STATS with taxonomy placeholder data
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <ConceptosClient stats={stats} recentConceptos={recentConceptos} categories={CONCEPTO_CATEGORIES} />
    </div>
  );
}
