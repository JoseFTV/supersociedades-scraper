import type { Metadata } from 'next';
import CaseExplorerClient from '@/components/CaseExplorerClient';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = { title: 'Explorador de Casos' };

// Prevent static generation caching
export const dynamic = 'force-dynamic';

export default async function CaseExplorer() {
  const cases = await prisma.case.findMany({
    orderBy: {
      createdAt: 'desc'
    }
  });

  return <CaseExplorerClient initialCases={cases} />;
}

