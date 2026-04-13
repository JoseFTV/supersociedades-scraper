import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/lib/prisma';
import { requireAuth, isAuthError, safeErrorResponse } from '@/lib/auth-guard';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' });

// Types
type CaseRef = { id: string; sourceReference: string; year: number; actionType: string };
type Resolution = { caseId: string | null; confidence: number; method: string; isExternal: boolean; externalCourt?: string };

export async function POST() {
    try {
        // Auth check — only authenticated users can resolve citations
        const authResult = await requireAuth();
        if (isAuthError(authResult)) return authResult.error;

        console.log('[Resolver] Iniciando resolución del Grafo Citacional...');

        // 1. Cargar todos los casos con su sourceReference para el matching
        const allCases = await prisma.case.findMany({
            select: { id: true, sourceReference: true, year: true, actionType: true }
        });

        // 2. Cargar todas las Authority de tipo jurisprudencial que aún no tienen CitationLink
        const targets = await prisma.authority.findMany({
            where: {
                normType: { in: ['Jurisprudencia', 'JURISPRUDENCIA', 'Sentencia', 'Auto', 'AUTO', 'FALLO'] },
                citationLink: null
            },
            select: { id: true, citationText: true, caseId: true }
        });

        console.log(`[Resolver] ${targets.length} autoridades pendientes de resolución frente a ${allCases.length} casos base.`);

        const results = { exact: 0, fuzzy: 0, gemini: 0, unresolved: 0, external: 0 };

        for (const authority of targets) {
            if (!authority.citationText) continue;

            const resolution = await resolveInLevels(authority.citationText, allCases);

            await prisma.citationLink.create({
                data: {
                    citingCaseId: authority.caseId,
                    citedCaseId: resolution.caseId ?? null,
                    sourceAuthorityId: authority.id,
                    rawReference: authority.citationText,
                    confidence: resolution.confidence,
                    matchMethod: resolution.method,
                    isExternal: resolution.isExternal,
                    externalCourt: resolution.externalCourt ?? null,
                }
            });

            const key = resolution.method.toLowerCase() as keyof typeof results;
            if (key in results) results[key]++;
            if (resolution.isExternal) results.external++;
        }

        console.log('[Resolver] Recalculando scores de autoridad...');
        await recalculateAuthorityScores();

        return NextResponse.json({ success: true, processed: targets.length, results });

    } catch (error: any) {
        console.error('[Resolver Error]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

async function resolveInLevels(citationText: string, allCases: CaseRef[]): Promise<Resolution> {
    const normalized = citationText.toLowerCase().replace(/\s+/g, ' ').trim();

    // NIVEL 1 — Exact match
    const exact = allCases.find(c =>
        c.sourceReference && c.sourceReference.toLowerCase().replace(/\s+/g, ' ').trim() === normalized
    );
    if (exact) return { caseId: exact.id, confidence: 1.0, method: 'EXACT', isExternal: false };

    // NIVEL 2 — Fuzzy por números de radicado
    const numbers = citationText.match(/\b\d{3,}\b/g) ?? [];
    if (numbers.length > 0) {
        // Buscar la mayor coincidencia numérica
        const fuzzy = allCases.find(c =>
            c.sourceReference && numbers.some(n => c.sourceReference.includes(n))
        );
        if (fuzzy) return { caseId: fuzzy.id, confidence: 0.75, method: 'FUZZY', isExternal: false };
    }

    // NIVEL 3 — Detectar citas externas
    const externalMap: Record<string, string> = {
        'corte suprema': 'CORTE_SUPREMA',
        'corte constitucional': 'CORTE_CONSTITUCIONAL',
        'consejo de estado': 'CONSEJO_ESTADO',
        'tribunal superior': 'TRIBUNAL_SUPERIOR',
        'juzgado civil': 'JUZGADO_CIVIL_CIRCUITO'
    };

    for (const [pattern, court] of Object.entries(externalMap)) {
        if (normalized.includes(pattern)) {
            return { caseId: null, confidence: 0.9, method: 'GEMINI', isExternal: true, externalCourt: court };
        }
    }

    // NIVEL 4 — Gemini Fallback
    const geminiResolution = await resolveWithGemini(citationText, allCases);
    if (geminiResolution) return geminiResolution;

    // NIVEL 5 — No resolvible
    return { caseId: null, confidence: 0, method: 'UNRESOLVED', isExternal: false };
}

async function resolveWithGemini(
    rawName: string,
    candidates: CaseRef[]
): Promise<Resolution | null> {
    if (candidates.length === 0) return null;

    // Optimización: Si Gemini va a comparar, no le pases 400 casos, pásale solo una sub-muestra aleatoria, o pásale solo referencias
    // Como Gemini limit context es alto, 400 líneas está bien.
    const prompt = `
Eres un analista jurídico. Tienes esta referencia extraída de otra sentencia: "${rawName}"

¿Detectas el radicado oficial correspondiente en ESTA lista numerada de expedientes internos de la base de datos?
${candidates.map((c, i) => `${i}: ${c.sourceReference} (${c.year})`).join('\n')}

Responde SOLO con un JSON sin markdown ni \`\`\`
{"matchIndex": 0, "confidence": 0.8} si hay match claro
{"matchIndex": -1, "confidence": 0} si ninguno coincide plenamente
  `;

    try {
        const result = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 256,
            messages: [{ role: 'user', content: prompt }],
        });

        let jsonStr = result.content[0].type === 'text' ? result.content[0].text : '';
        if (jsonStr.includes('\`')) {
            jsonStr = jsonStr.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
        }
        const parsed = JSON.parse(jsonStr);

        if (parsed.matchIndex >= 0 && parsed.matchIndex < candidates.length && parsed.confidence > 0.6) {
            return {
                caseId: candidates[parsed.matchIndex].id,
                confidence: parsed.confidence,
                method: 'GEMINI',
                isExternal: false
            };
        }
    } catch (e) {
        console.error('[Gemini Resolver Error]', e);
    }

    return null;
}

// Percentile helper
function percentile(arr: number[], p: number) {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const pos = (sorted.length - 1) * p / 100;
    const base = Math.floor(pos);
    const rest = pos - base;
    if (sorted[base + 1] !== undefined) {
        return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
    } else {
        return sorted[base];
    }
}

async function recalculateAuthorityScores() {
    const allCases = await prisma.case.findMany({
        include: { citationsReceived: true }
    });

    const scores = allCases.map(c => c.citationsReceived.length);
    const p75 = percentile(scores, 75);
    const p40 = percentile(scores, 40);

    const years = allCases.map(c => c.year);
    const minYear = years.length > 0 ? Math.min(...years) : new Date().getFullYear();

    for (const case_ of allCases) {
        const score = case_.citationsReceived.length;

        // Bonus por citas recientes
        const maxYear = new Date().getFullYear();
        const recentBonus = case_.citationsReceived
            .filter(c => case_.year >= maxYear - 3)
            .length * 0.5;

        const finalScore = score + recentBonus;

        let lopezRole: string;
        if (finalScore >= p75 && finalScore > 0) {
            lopezRole = case_.year <= minYear + 2 ? 'FUNDADORA' : 'HITO';
        } else if (finalScore >= p40 && finalScore > 0) {
            lopezRole = 'CONFIRMADORA';
        } else {
            lopezRole = 'PERIFÉRICA';
        }

        await prisma.case.update({
            where: { id: case_.id },
            data: { authorityScore: finalScore, lopezRole }
        });
    }
}
