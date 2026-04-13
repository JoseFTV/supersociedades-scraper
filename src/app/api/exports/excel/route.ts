import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, isAuthError, safeErrorResponse } from '@/lib/auth-guard';
import { checkRateLimit } from '@/lib/validation';

/**
 * Export: Excel-compatible CSV with full case statistics
 *
 * GET /api/exports/excel?format=csv
 *
 * Returns a CSV with all cases + denial reasons + parties for analysis.
 * CSV chosen over xlsx to avoid heavy dependencies — opens perfectly in Excel.
 */

function escapeCSV(val: string | null | undefined): string {
  if (!val) return '';
  const s = val.replace(/"/g, '""');
  return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s;
}

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (isAuthError(authResult)) return authResult.error;

    const { allowed } = checkRateLimit(`export-excel:${authResult.userId}`, 5, 60_000);
    if (!allowed) {
      return NextResponse.json({ error: 'Demasiadas solicitudes.' }, { status: 429 });
    }

    const VALID_SHEETS = new Set(['cases', 'denial-reasons', 'entities']);
    const rawSheet = req.nextUrl.searchParams.get('sheet') || 'cases';
    const sheet = VALID_SHEETS.has(rawSheet) ? rawSheet : null;

    if (!sheet) {
      return NextResponse.json(
        { error: 'Sheet inválido. Opciones: cases, denial-reasons, entities' },
        { status: 400 }
      );
    }

    if (sheet === 'cases') {
      const cases = await prisma.case.findMany({
        include: {
          denialReasons: { select: { code: true } },
          parties: { select: { name: true, role: true } },
        },
        orderBy: [{ year: 'desc' }, { caseName: 'asc' }],
      });

      const headers = [
        'ID', 'Nombre del Caso', 'Año', 'Tipo de Acción', 'Resultado General',
        'Resultado Detallado', 'Radicado', 'Fecha Decisión', 'Fecha Radicación',
        'Duración', 'Despacho', 'Trámite Procesal', 'Problema Jurídico',
        'Demandantes', 'Demandados', 'Razones de Negación', 'Subtemas',
      ];

      const rows = cases.map(c => {
        const demandantes = c.parties.filter(p => /demandante/i.test(p.role)).map(p => p.name).join('; ');
        const demandados = c.parties.filter(p => /demandado/i.test(p.role)).map(p => p.name).join('; ');
        const drs = c.denialReasons.map(dr => dr.code).join('; ');
        const subtemas = (c.subtopics || []).join('; ');

        return [
          c.id, c.caseName, c.year, c.actionType, c.outcomeGeneral,
          c.outcomeDetailed, c.sourceReference, c.decisionDate, c.filingDate,
          c.duration, c.office, c.proceduralTrack, c.legalIssue,
          demandantes, demandados, drs, subtemas,
        ].map(v => escapeCSV(String(v ?? ''))).join(',');
      });

      // BOM for Excel UTF-8 detection
      const bom = '\uFEFF';
      const csv = bom + headers.join(',') + '\n' + rows.join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="lexia-sentencias-${new Date().toISOString().slice(0, 10)}.csv"`,
          'Cache-Control': 's-maxage=3600, stale-while-revalidate=7200',
        },
      });
    }

    if (sheet === 'denial-reasons') {
      const drs = await prisma.denialReason.findMany({
        include: {
          case: { select: { caseName: true, actionType: true, year: true, outcomeGeneral: true } },
        },
        orderBy: { code: 'asc' },
      });

      const headers = ['Código RN', 'Caso', 'Tipo de Acción', 'Año', 'Resultado', 'Confianza', 'Razonamiento'];
      const rows = drs.map(dr => [
        dr.code, dr.case.caseName, dr.case.actionType, dr.case.year,
        dr.case.outcomeGeneral, dr.confidence, dr.reasoning,
      ].map(v => escapeCSV(String(v ?? ''))).join(','));

      const bom = '\uFEFF';
      const csv = bom + headers.join(',') + '\n' + rows.join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="lexia-denial-reasons-${new Date().toISOString().slice(0, 10)}.csv"`,
          'Cache-Control': 's-maxage=3600, stale-while-revalidate=7200',
        },
      });
    }

    if (sheet === 'entities') {
      const entities = await prisma.canonicalEntity.findMany({
        orderBy: { totalCases: 'desc' },
      });

      const headers = ['Nombre Canónico', 'Tipo', 'Aliases', 'Total Casos', 'Como Demandante', 'Como Demandado', 'Win Rate'];
      const rows = entities.map(e => [
        e.canonicalName, e.entityType, e.aliases.join('; '),
        e.totalCases, e.asPlaintiff, e.asDefendant,
        e.winRate !== null ? `${(e.winRate * 100).toFixed(1)}%` : '',
      ].map(v => escapeCSV(String(v ?? ''))).join(','));

      const bom = '\uFEFF';
      const csv = bom + headers.join(',') + '\n' + rows.join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="lexia-entidades-${new Date().toISOString().slice(0, 10)}.csv"`,
          'Cache-Control': 's-maxage=3600, stale-while-revalidate=7200',
        },
      });
    }

    // Unreachable due to VALID_SHEETS check above, but TypeScript needs it
    return NextResponse.json({ error: 'Sheet inválido' }, { status: 400 });
  } catch (error: unknown) {
    return safeErrorResponse(error, 'Export Excel');
  }
}
