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

        // Traer todos los casos base de esta acción
        const baseCases = await prisma.case.findMany({
            where: { actionType },
            select: {
                id: true,
                caseName: true,
                sourceReference: true,
                year: true,
                authorityScore: true,
                lopezRole: true,
                outcomeGeneral: true,
                summary: true
            }
        });

        const baseCaseIds = baseCases.map(c => c.id);

        // Traer las citas DONDE EL CASO CITADOR es de esta acción
        const linksData = await prisma.citationLink.findMany({
            where: {
                citingCaseId: { in: baseCaseIds }
            },
            include: {
                citedCase: {
                    select: {
                        id: true, caseName: true, sourceReference: true, year: true, authorityScore: true, lopezRole: true, outcomeGeneral: true, summary: true
                    }
                }
            }
        });

        const nodesMap = new Map();
        // Insertamos todos los nodos base
        for (const c of baseCases) {
            nodesMap.set(c.id, {
                id: c.id,
                name: c.sourceReference || c.caseName,
                year: c.year,
                score: c.authorityScore || 0,
                role: c.lopezRole || 'PERIFÉRICA',
                outcome: c.outcomeGeneral,
                isExternal: false,
                summary: c.summary
            });
        }

        const links = [];

        // Insertamos enlaces y nodos externos/citados faltantes
        for (const l of linksData) {
            if (l.isExternal && l.externalCourt) {
                // Pseudo-nodo para corte externa repetida
                const extId = `ext-${l.externalCourt}`;
                if (!nodesMap.has(extId)) {
                    nodesMap.set(extId, {
                        id: extId,
                        name: l.externalCourt.replace('_', ' '),
                        year: null,
                        score: 1,
                        role: 'EXTERNAL',
                        isExternal: true
                    });
                }
                links.push({ source: l.citingCaseId, target: extId, method: l.matchMethod, confidence: l.confidence, isExternal: true });
            } else if (l.citedCaseId) {
                // Fue citado un caso interno
                if (!nodesMap.has(l.citedCaseId) && l.citedCase) {
                    nodesMap.set(l.citedCaseId, {
                        id: l.citedCase.id,
                        name: l.citedCase.sourceReference || l.citedCase.caseName,
                        year: l.citedCase.year,
                        score: l.citedCase.authorityScore || 0,
                        role: l.citedCase.lopezRole || 'PERIFÉRICA',
                        outcome: l.citedCase.outcomeGeneral,
                        isExternal: false,
                        summary: l.citedCase.summary
                    });
                }
                links.push({ source: l.citingCaseId, target: l.citedCaseId, method: l.matchMethod, confidence: l.confidence, isExternal: false });
            }
        }

        const nodes = Array.from(nodesMap.values());

        // Calcular Top 5 Citados
        const citationCounts = new Map();
        for (const l of links) {
            // Ignoramos auto-referencias o nodos puramente externos en el ranking principal
            if (!l.isExternal && String(l.target).startsWith('ext-') === false) {
                const count = citationCounts.get(l.target) || 0;
                citationCounts.set(l.target, count + 1);
            }
        }

        let topCited = [];
        for (const [nodeId, count] of citationCounts.entries()) {
            const node = nodesMap.get(nodeId);
            if (node && !node.isExternal) {
                topCited.push({ ...node, citations: count });
            }
        }

        // Ordenar de mayor a menor citación
        topCited.sort((a, b) => b.citations - a.citations);
        topCited = topCited.slice(0, 5);

        return NextResponse.json({ success: true, nodes, links, topCited }, {
            headers: {
                'Cache-Control': 'private, s-maxage=3600, stale-while-revalidate=7200',
            },
        });

    } catch (error: unknown) {
        return safeErrorResponse(error, 'Jurisprudence Graph');
    }
}
