import type { Metadata } from 'next';
import TaxonomyClient from '@/components/TaxonomyClient';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = { title: 'Taxonomía Legal' };
export const dynamic = 'force-dynamic';

export default async function TaxonomyPage() {
  const cases = await prisma.case.findMany({
    select: {
      id: true,
      caseName: true,
      actionType: true,
      year: true,
      duration: true,
      outcomeGeneral: true,
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return <TaxonomyClient cases={cases} />;
}
