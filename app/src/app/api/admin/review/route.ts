import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, isAuthError, safeErrorResponse } from '@/lib/auth-guard';
import { safeString, safeInt } from '@/lib/validation';
import { ACTION_TYPES } from '@/lib/taxonomy';

// Valid canonical labels for validation
const VALID_ACTION_TYPES = new Set(ACTION_TYPES.map(at => at.label));

/**
 * GET /api/admin/review
 * Fetches cases for review, optionally filtered by actionType
 * Query params: filter ('needs_review' | 'all'), page, limit, actionType
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (isAuthError(authResult)) return authResult.error;

    const { searchParams } = new URL(req.url);
    const filter = safeString(searchParams.get('filter'), 50) || 'needs_review';
    const page = safeInt(searchParams.get('page'), 1, 1, 1000);
    const limit = safeInt(searchParams.get('limit'), 25, 1, 100);
    const actionTypeFilter = safeString(searchParams.get('actionType'), 200) || '';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (filter === 'needs_review') {
      where.actionType = { in: ['Requiere revisión manual', 'Otra', 'No identificado', 'N/A', 'INDETERMINADO', 'Otro'] };
    } else if (actionTypeFilter) {
      where.actionType = actionTypeFilter;
    }

    const [cases, total] = await Promise.all([
      prisma.case.findMany({
        where,
        select: {
          id: true,
          caseName: true,
          sourceReference: true,
          actionType: true,
          year: true,
          summary: true,
          outcomeGeneral: true,
          sourceUrl: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.case.count({ where }),
    ]);

    // Also get a count of cases needing review
    const needsReviewCount = await prisma.case.count({
      where: { actionType: { in: ['Requiere revisión manual', 'Otra', 'No identificado', 'N/A', 'INDETERMINADO', 'Otro'] } },
    });

    // Get distinct actionTypes for the filter dropdown
    const actionTypeCounts = await prisma.case.groupBy({
      by: ['actionType'],
      _count: { actionType: true },
      orderBy: { _count: { actionType: 'desc' } },
    });

    return NextResponse.json({
      cases,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      needsReviewCount,
      actionTypeCounts: actionTypeCounts.map(a => ({
        actionType: a.actionType,
        count: a._count.actionType,
      })),
    });
  } catch (err) {
    return safeErrorResponse(err, 'Error obteniendo casos para revisión');
  }
}

/**
 * PATCH /api/admin/review
 * Updates a case's actionType
 * Body: { caseId: string, newActionType: string }
 */
export async function PATCH(req: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (isAuthError(authResult)) return authResult.error;

    const body = await req.json();
    const caseId = safeString(body.caseId, 100);
    const newActionType = safeString(body.newActionType, 200);

    if (!caseId || !newActionType) {
      return NextResponse.json({ error: 'caseId y newActionType son requeridos' }, { status: 400 });
    }

    if (!VALID_ACTION_TYPES.has(newActionType)) {
      return NextResponse.json({ error: `actionType inválido: ${newActionType}` }, { status: 400 });
    }

    const existing = await prisma.case.findUnique({ where: { id: caseId }, select: { id: true, actionType: true, caseName: true } });
    if (!existing) {
      return NextResponse.json({ error: 'Caso no encontrado' }, { status: 404 });
    }

    const oldActionType = existing.actionType;

    const updated = await prisma.case.update({
      where: { id: caseId },
      data: { actionType: newActionType },
      select: { id: true, caseName: true, actionType: true },
    });

    console.log(`[Admin Review] Caso "${existing.caseName}" reclasificado: "${oldActionType}" → "${newActionType}"`);

    return NextResponse.json({
      success: true,
      case: updated,
      oldActionType,
    });
  } catch (err) {
    return safeErrorResponse(err, 'Error actualizando caso');
  }
}
