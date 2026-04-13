import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, isAuthError, safeErrorResponse } from '@/lib/auth-guard';
import { checkRateLimit, safeString } from '@/lib/validation';
import { DENIAL_REASON_BY_CODE } from '@/lib/taxonomy';
import { classifyOutcome } from '@/lib/outcome-utils';

/**
 * Export: Action Type Profile (Markdown → downloadable)
 *
 * Generates a structured litigation profile for a given action type.
 * Returns markdown that the client converts to PDF via browser print.
 *
 * GET /api/exports/action-profile?actionType=Responsabilidad+de+administradores
 */

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (isAuthError(authResult)) return authResult.error;

    const { allowed } = checkRateLimit(`export-profile:${authResult.userId}`, 10, 60_000);
    if (!allowed) {
      return NextResponse.json({ error: 'Demasiadas solicitudes.' }, { status: 429 });
    }

    const actionType = safeString(req.nextUrl.searchParams.get('actionType'), 200);
    if (!actionType) {
      return NextResponse.json({ error: 'Falta actionType' }, { status: 400 });
    }

    // Fetch cases
    const cases = await prisma.case.findMany({
      where: { actionType },
      include: {
        denialReasons: true,
        remedies: true,
        parties: true,
      },
      orderBy: { year: 'desc' },
    });

    if (cases.length === 0) {
      return NextResponse.json({ error: 'No se encontraron casos para este tipo de acción' }, { status: 404 });
    }

    // Compute stats
    let wins = 0, losses = 0, mixed = 0;
    const yearMap = new Map<number, { w: number; l: number; m: number }>();
    const denialMap = new Map<string, number>();
    const durationMonths: number[] = [];

    for (const c of cases) {
      const cls = classifyOutcome(c.outcomeGeneral);
      if (cls === 'win') wins++;
      else if (cls === 'loss') losses++;
      else mixed++;

      if (!yearMap.has(c.year)) yearMap.set(c.year, { w: 0, l: 0, m: 0 });
      const ye = yearMap.get(c.year)!;
      if (cls === 'win') ye.w++; else if (cls === 'loss') ye.l++; else ye.m++;

      for (const dr of c.denialReasons) {
        denialMap.set(dr.code, (denialMap.get(dr.code) || 0) + 1);
      }

      // Parse duration
      const match = c.duration?.match(/(\d+)/);
      if (match) durationMonths.push(parseInt(match[1], 10));
    }

    const total = cases.length;
    const winRate = ((wins / total) * 100).toFixed(1);
    const avgDuration = durationMonths.length > 0
      ? (durationMonths.reduce((a, b) => a + b, 0) / durationMonths.length).toFixed(0)
      : 'N/A';

    const sortedYears = Array.from(yearMap.entries()).sort((a, b) => a[0] - b[0]);
    const sortedDenials = Array.from(denialMap.entries()).sort((a, b) => b[1] - a[1]);

    // Build markdown report
    const lines: string[] = [];
    lines.push(`# Perfil de Acción: ${actionType}`);
    lines.push(`**Generado:** ${new Date().toLocaleDateString('es-CO')} | **Fuente:** Lexia Analytics`);
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('## Resumen Ejecutivo');
    lines.push('');
    lines.push(`| Métrica | Valor |`);
    lines.push(`|---|---|`);
    lines.push(`| Total de casos | ${total} |`);
    lines.push(`| Win rate (demandante) | ${winRate}% |`);
    lines.push(`| Victorias demandante | ${wins} |`);
    lines.push(`| Victorias demandado | ${losses} |`);
    lines.push(`| Resultados mixtos/parciales | ${mixed} |`);
    lines.push(`| Duración promedio | ${avgDuration} meses |`);
    lines.push('');

    lines.push('## Evolución Temporal');
    lines.push('');
    lines.push('| Año | Casos | Dem. Prevalece | Dem.do Prevalece | Mixto |');
    lines.push('|---|---|---|---|---|');
    for (const [year, stats] of sortedYears) {
      lines.push(`| ${year} | ${stats.w + stats.l + stats.m} | ${stats.w} | ${stats.l} | ${stats.m} |`);
    }
    lines.push('');

    if (sortedDenials.length > 0) {
      lines.push('## Razones de Negación Más Frecuentes');
      lines.push('');
      lines.push('| Código | Razón | Frecuencia | % |');
      lines.push('|---|---|---|---|');
      for (const [code, count] of sortedDenials) {
        const def = DENIAL_REASON_BY_CODE[code];
        const pct = ((count / total) * 100).toFixed(1);
        lines.push(`| ${code} | ${def?.label || code} | ${count} | ${pct}% |`);
      }
      lines.push('');
      lines.push('> **Lectura:** Un caso puede tener múltiples razones de negación.');
      lines.push('');
    }

    lines.push('## Casos Individuales');
    lines.push('');
    for (const c of cases.slice(0, 50)) {
      const cls = classifyOutcome(c.outcomeGeneral);
      const icon = cls === 'win' ? '✅' : cls === 'loss' ? '❌' : '⚖️';
      lines.push(`### ${icon} ${c.caseName} (${c.year})`);
      lines.push(`- **Resultado:** ${c.outcomeGeneral}`);
      lines.push(`- **Radicado:** ${c.sourceReference}`);
      lines.push(`- **Duración:** ${c.duration}`);
      if (c.denialReasons.length > 0) {
        lines.push(`- **Razones de negación:** ${c.denialReasons.map(dr => dr.code).join(', ')}`);
      }
      lines.push('');
    }

    lines.push('---');
    lines.push('*Documento generado automáticamente por Lexia Analytics. No constituye asesoría jurídica.*');

    const markdown = lines.join('\n');

    return new NextResponse(markdown, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="perfil-${actionType.replace(/\s+/g, '-').toLowerCase()}.md"`,
        'Cache-Control': 's-maxage=3600, stale-while-revalidate=7200',
      },
    });
  } catch (error: unknown) {
    return safeErrorResponse(error, 'Export Action Profile');
  }
}
