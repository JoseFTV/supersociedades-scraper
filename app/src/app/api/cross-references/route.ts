import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { canonicalize } from '@/lib/taxonomy';
import { getRelatedConceptos, CROSS_MAP } from '@/lib/taxonomy-cross-map';
import { requireAuth, isAuthError, safeErrorResponse } from '@/lib/auth-guard';
import { safeInt, safeString } from '@/lib/validation';

/**
 * GET /api/cross-references?actionType=Responsabilidad+de+administradores&limit=5
 *
 * Returns related conceptos and laudos for a given action type,
 * using the cross-taxonomy mapping.
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (isAuthError(authResult)) return authResult.error;

    const { searchParams } = new URL(req.url);
    const rawActionType = safeString(searchParams.get('actionType'), 200);
    const limit = safeInt(searchParams.get('limit'), 5, 1, 50);

    if (!rawActionType) {
      return NextResponse.json({ error: 'actionType required' }, { status: 400 });
    }

    const { code: asCode, label } = canonicalize(rawActionType);

    // Find cross-map entry
    const crossEntry = CROSS_MAP.find(m => m.as === asCode);
    const relatedTxCodes = getRelatedConceptos(asCode);

    // Fetch related conceptos
    let conceptos: { id: string; filename: string; year: number; temaPrincipal: string; subtema: string; titulo: string | null; confianza: number }[] = [];
    if (relatedTxCodes.length > 0) {
      conceptos = await prisma.concepto.findMany({
        where: {
          temaPrincipal: { in: relatedTxCodes },
          confianza: { gte: 0.7 },
        },
        select: {
          id: true,
          filename: true,
          year: true,
          temaPrincipal: true,
          subtema: true,
          titulo: true,
          confianza: true,
        },
        orderBy: { year: 'desc' },
        take: limit,
      });
    }

    // Fetch related laudos (only societario vertical for AS codes)
    const laudos = await prisma.laudo.findMany({
      where: {
        vertical: 'societario',
        needsHumanReview: false,
      },
      select: {
        id: true,
        caseTitle: true,
        vertical: true,
        subVertical: true,
        year: true,
        cuantia: true,
        confidenceScore: true,
      },
      orderBy: { confidenceScore: 'desc' },
      take: limit,
    });

    return NextResponse.json({
      actionType: label,
      asCode,
      crossMapping: crossEntry ? {
        txSocLabels: crossEntry.txSocLabels,
        lexiaLabels: crossEntry.lexiaLabels,
        relationship: crossEntry.relationship,
      } : null,
      conceptos,
      laudos,
    });

  } catch (error: unknown) {
    return safeErrorResponse(error, 'Cross-References');
  }
}
