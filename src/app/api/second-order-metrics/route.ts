import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, isAuthError, safeErrorResponse } from '@/lib/auth-guard';
import { checkRateLimit } from '@/lib/validation';
import { classifyOutcome } from '@/lib/outcome-utils';

/**
 * Second-Order Metrics API
 *
 * Computes cross-dimensional analytics:
 * - Denial reasons × action types (e.g., "prescripción baja win rate de 73% a 31%")
 * - Win rates by action type
 * - Entity leaderboard
 * - Citation type distribution
 */

const VALID_SECTIONS = new Set([
  'all', 'win-rates', 'denial-matrix', 'denial-freq', 'citations', 'entities', 'summary',
]);

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (isAuthError(authResult)) return authResult.error;

    // Rate limit: 30 requests per minute (read-only but DB-heavy)
    const { allowed } = checkRateLimit(`second-order-metrics:${authResult.userId}`, 30, 60_000);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.' },
        { status: 429 }
      );
    }

    const rawSection = req.nextUrl.searchParams.get('section') || 'all';
    const section = VALID_SECTIONS.has(rawSection) ? rawSection : 'all';

    const result: Record<string, unknown> = {};

    // ═══════════════════════════════════════════════════════════════
    // 1. WIN RATES BY ACTION TYPE
    // ═══════════════════════════════════════════════════════════════
    if (section === 'all' || section === 'win-rates') {
      const outcomes = await prisma.case.groupBy({
        by: ['actionType', 'outcomeGeneral'],
        _count: true,
      });

      const actionMap = new Map<string, { total: number; wins: number; losses: number; mixed: number }>();
      for (const row of outcomes) {
        const r = row as unknown as { actionType: string; outcomeGeneral: string; _count: number };
        if (!actionMap.has(r.actionType)) {
          actionMap.set(r.actionType, { total: 0, wins: 0, losses: 0, mixed: 0 });
        }
        const entry = actionMap.get(r.actionType)!;
        entry.total += r._count;
        const cls = classifyOutcome(r.outcomeGeneral);
        if (cls === 'win') entry.wins += r._count;
        else if (cls === 'loss') entry.losses += r._count;
        else entry.mixed += r._count;
      }

      const winRates = Array.from(actionMap.entries())
        .map(([actionType, stats]) => ({
          actionType,
          total: stats.total,
          wins: stats.wins,
          losses: stats.losses,
          mixed: stats.mixed,
          winRate: stats.total > 0 ? +(stats.wins / stats.total * 100).toFixed(1) : 0,
          lossRate: stats.total > 0 ? +(stats.losses / stats.total * 100).toFixed(1) : 0,
        }))
        .sort((a, b) => b.total - a.total);

      result.winRates = winRates;
    }

    // ═══════════════════════════════════════════════════════════════
    // 2. DENIAL REASONS × ACTION TYPES (cross-dimensional)
    // ═══════════════════════════════════════════════════════════════
    if (section === 'all' || section === 'denial-matrix') {
      // Get all denial reasons with their case's action type
      const denialData = await prisma.denialReason.findMany({
        select: {
          code: true,
          confidence: true,
          case: {
            select: {
              actionType: true,
              outcomeGeneral: true,
            },
          },
        },
      });

      // Cross-tab: code × actionType
      const matrix = new Map<string, Map<string, number>>();
      const codeTotals = new Map<string, number>();
      const codeByOutcome = new Map<string, { total: number; loss: number; mixed: number }>();

      for (const dr of denialData) {
        const code = dr.code;
        const action = dr.case.actionType;
        const outcome = dr.case.outcomeGeneral;

        // code × actionType
        if (!matrix.has(code)) matrix.set(code, new Map());
        const row = matrix.get(code)!;
        row.set(action, (row.get(action) || 0) + 1);

        // code totals
        codeTotals.set(code, (codeTotals.get(code) || 0) + 1);

        // code × outcome
        if (!codeByOutcome.has(code)) codeByOutcome.set(code, { total: 0, loss: 0, mixed: 0 });
        const oc = codeByOutcome.get(code)!;
        oc.total++;
        const cls = classifyOutcome(outcome);
        if (cls === 'loss') oc.loss++;
        else if (cls === 'mixed') oc.mixed++;
      }

      // Format matrix
      const denialMatrix = Array.from(matrix.entries())
        .map(([code, actions]) => ({
          code,
          total: codeTotals.get(code) || 0,
          outcomeBreakdown: codeByOutcome.get(code),
          byActionType: Object.fromEntries(
            Array.from(actions.entries()).sort((a, b) => b[1] - a[1])
          ),
        }))
        .sort((a, b) => b.total - a.total);

      result.denialMatrix = denialMatrix;

      // ── Impact metrics: how each denial reason affects win rate ──
      // Compare global win rate vs win rate of cases with each RN code
      const totalCases = await prisma.case.count();
      const totalWins = await prisma.case.count({
        where: { outcomeGeneral: { contains: 'Demandante prevalece' } },
      });
      const globalWinRate = totalCases > 0 ? +(totalWins / totalCases * 100).toFixed(1) : 0;

      const impactMetrics = [];
      for (const [code, stats] of codeByOutcome) {
        const casesWithCode = stats.total;
        const winsWithCode = stats.total - stats.loss - stats.mixed;
        const winRateWithCode = casesWithCode > 0 ? +(winsWithCode / casesWithCode * 100).toFixed(1) : 0;
        impactMetrics.push({
          code,
          casesAffected: casesWithCode,
          winRateWithCode,
          globalWinRate,
          winRateDelta: +(winRateWithCode - globalWinRate).toFixed(1),
        });
      }
      impactMetrics.sort((a, b) => a.winRateDelta - b.winRateDelta);
      result.denialImpact = impactMetrics;
    }

    // ═══════════════════════════════════════════════════════════════
    // 3. DENIAL REASON FREQUENCY (global)
    // ═══════════════════════════════════════════════════════════════
    if (section === 'all' || section === 'denial-freq') {
      const freq = await prisma.denialReason.groupBy({
        by: ['code'],
        _count: true,
        orderBy: { _count: { code: 'desc' } },
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result.denialFrequency = freq.map((r: any) => ({
        code: r.code,
        count: typeof r._count === 'number' ? r._count : r._count?.code ?? 0,
      }));
    }

    // ═══════════════════════════════════════════════════════════════
    // 4. CITATION TYPE DISTRIBUTION
    // ═══════════════════════════════════════════════════════════════
    if (section === 'all' || section === 'citations') {
      const citationTypes = await prisma.authority.groupBy({
        by: ['normType'],
        _count: true,
        orderBy: { _count: { normType: 'desc' } },
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result.citationTypes = citationTypes.map((r: any) => ({
        type: r.normType,
        count: typeof r._count === 'number' ? r._count : r._count?.normType ?? 0,
      }));
    }

    // ═══════════════════════════════════════════════════════════════
    // 5. ENTITY LEADERBOARD
    // ═══════════════════════════════════════════════════════════════
    if (section === 'all' || section === 'entities') {
      const entities = await prisma.canonicalEntity.findMany({
        orderBy: { totalCases: 'desc' },
        take: 30,
        select: {
          id: true,
          canonicalName: true,
          entityType: true,
          totalCases: true,
          asPlaintiff: true,
          asDefendant: true,
          winRate: true,
        },
      });

      result.topEntities = entities;
    }

    // ═══════════════════════════════════════════════════════════════
    // 6. SUMMARY STATS
    // ═══════════════════════════════════════════════════════════════
    if (section === 'all' || section === 'summary') {
      const [totalCases, totalDenialReasons, totalAuthorities, totalEntities, totalConceptos, totalLaudos] =
        await Promise.all([
          prisma.case.count(),
          prisma.denialReason.count(),
          prisma.authority.count(),
          prisma.canonicalEntity.count(),
          prisma.concepto.count(),
          prisma.laudo.count(),
        ]);

      result.summary = {
        totalCases,
        totalDenialReasons,
        totalAuthorities,
        totalEntities,
        totalConceptos,
        totalLaudos,
      };
    }

    const response = NextResponse.json(result);
    response.headers.set('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200');
    return response;
  } catch (error: unknown) {
    return safeErrorResponse(error, 'Second-Order Metrics');
  }
}
