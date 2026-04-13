import type { Metadata } from 'next';
import DashboardClient from '@/components/DashboardClient';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = { title: 'Dashboard Analítico' };

// Prevent static generation caching so the dashboard updates when new cases are added
export const dynamic = 'force-dynamic';

export default async function AnalyticsDashboard() {
  // Fetch data from PostgreSQL
  const cases = await prisma.case.findMany({
    include: {
      remedies: true,
      strategicFlags: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return <DashboardClient cases={cases} />;
}
