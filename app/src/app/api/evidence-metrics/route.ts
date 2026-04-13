import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { canonicalize } from '@/lib/taxonomy';
import { requireAuth, isAuthError, safeErrorResponse } from '@/lib/auth-guard';
import { safeString } from '@/lib/validation';

export async function GET(req: NextRequest) {
    try {
        const authResult = await requireAuth();
        if (isAuthError(authResult)) return authResult.error;

        const { searchParams } = new URL(req.url);
        const rawActionType = safeString(searchParams.get('actionType'), 200);

        if (!rawActionType) {
            return NextResponse.json({ error: 'Falta actionType' }, { status: 400 });
        }

        const actionType = canonicalize(rawActionType).label;

        // Traer todos los casos para esta acción que contengan Evidencias
        const cases = await prisma.case.findMany({
            where: { actionType },
            include: {
                evidence: true
            }
        });

        if (!cases || cases.length === 0) {
            return NextResponse.json({ success: true, metrics: [], topInsight: null });
        }

        // Variables de agregación
        let totalPlaintiffWins = 0;
        const categoryStats: Record<string, { total: number; decisiveInWin: number }> = {
            'DOCUMENTAL': { total: 0, decisiveInWin: 0 },
            'TESTIMONIAL': { total: 0, decisiveInWin: 0 },
            'PERICIAL': { total: 0, decisiveInWin: 0 },
            'INSPECCION': { total: 0, decisiveInWin: 0 },
        };

        cases.forEach(c => {
            const plaintiffWon = c.outcomeGeneral === 'Demandante prevalece';
            if (plaintiffWon) totalPlaintiffWins++;

            c.evidence.forEach(ev => {
                // Normalizamos categorías para agrupar (Gemini a veces usa mayúsculas/minúsculas o sin acento)
                let cat = ev.category.toUpperCase().replace('Ó', 'O').trim();
                if (!categoryStats[cat]) {
                    categoryStats[cat] = { total: 0, decisiveInWin: 0 };
                }

                categoryStats[cat].total++;

                // Si la prueba fue marcada como DECISIVA y el Demandante ganó ese caso, suma puntos al Win Rate de esa categoría.
                if (ev.weight === 'DECISIVA' && plaintiffWon) {
                    categoryStats[cat].decisiveInWin++;
                }
            });
        });

        // Construir métricas finales para el chart
        const metricsContent = Object.keys(categoryStats)
            .filter(cat => categoryStats[cat].total > 0) // Solo retornar categorías que existan en esta acción
            .map(cat => {
                const stats = categoryStats[cat];
                // Porcentaje: de las veces que el demandante ganó, ¿en qué porcentaje la prueba DECISIVA fue de esta categoría? (Evita /0)
                let decisivelyWinRate = 0;
                if (totalPlaintiffWins > 0) {
                    // Nota: Un mismo caso ganado puede tener 2 pruebas decisivas, por eso se promedia contra el total de casos ganados.
                    decisivelyWinRate = Math.min(Math.round((stats.decisiveInWin / totalPlaintiffWins) * 100), 100);
                }

                return {
                    category: cat.charAt(0) + cat.slice(1).toLowerCase(), // PascalCase "Documental"
                    totalAppeared: stats.total,
                    decisiveWins: stats.decisiveInWin,
                    decisivelyWinRate
                };
            })
            .sort((a, b) => b.decisivelyWinRate - a.decisivelyWinRate); // Ordenar por mayor tasa de victoria

        // Generar un Insight estratégico basado en la data
        let topInsight = null;
        if (metricsContent.length > 0 && metricsContent[0].decisivelyWinRate > 0) {
            const topCat = metricsContent[0].category;
            const rate = metricsContent[0].decisivelyWinRate;

            topInsight = `Análisis Estratégico: En los procesos de "${actionType}", la Prueba ${topCat} resulta ser el factor desequilibrante. Está presente y catalogada como 'DECISIVA' por el Juez en el ${rate}% de las sentencias donde el accionante logra que prosperen sus pretensiones.`;
        } else {
            topInsight = 'Aún no hay suficiente volumen de material probatorio extraído como DECISIVO para arrojar una regla de oro estática en esta acción.';
        }

        return NextResponse.json({
            success: true,
            totalAnalyzedCases: cases.length,
            plaintiffWins: totalPlaintiffWins,
            metrics: metricsContent,
            topInsight
        }, {
            headers: {
                'Cache-Control': 'private, s-maxage=3600, stale-while-revalidate=7200',
            },
        });

    } catch (error: unknown) {
        return safeErrorResponse(error, 'Evidence Metrics');
    }
}
