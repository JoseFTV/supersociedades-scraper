import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, isAuthError, safeErrorResponse } from '@/lib/auth-guard';
import { safeInt, safeString } from '@/lib/validation';

/**
 * GET /api/conceptos?tema=TX.SOC.05&year=2020&page=1&limit=20
 * Returns paginated conceptos with optional filtering.
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (isAuthError(authResult)) return authResult.error;

    const { searchParams } = new URL(req.url);
    const tema = safeString(searchParams.get('tema'), 50);
    const year = safeInt(searchParams.get('year'), 0, 1990, 2030) || null;
    const search = safeString(searchParams.get('q'), 200);
    const page = safeInt(searchParams.get('page'), 1, 1, 1000);
    const limit = safeInt(searchParams.get('limit'), 20, 1, 100);
    const skip = (page - 1) * limit;

    const where: {
      temaPrincipal?: string;
      year?: number;
      OR?: { filename?: { contains: string; mode: 'insensitive' }; subtema?: { contains: string; mode: 'insensitive' }; textPreview?: { contains: string; mode: 'insensitive' }; titulo?: { contains: string; mode: 'insensitive' } }[];
    } = {};
    if (tema) where.temaPrincipal = tema;
    if (year) where.year = year;
    if (search) {
      where.OR = [
        { filename: { contains: search, mode: 'insensitive' } },
        { subtema: { contains: search, mode: 'insensitive' } },
        { textPreview: { contains: search, mode: 'insensitive' } },
        { titulo: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [conceptos, total] = await Promise.all([
      prisma.concepto.findMany({
        where,
        select: {
          id: true,
          filename: true,
          year: true,
          temaPrincipal: true,
          temaSecundario: true,
          subtema: true,
          confianza: true,
          titulo: true,
          resumen: true,
        },
        orderBy: { year: 'desc' },
        skip,
        take: limit,
      }),
      prisma.concepto.count({ where }),
    ]);

    return NextResponse.json({
      conceptos,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    return safeErrorResponse(error, 'Conceptos');
  }
}
