import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/lib/prisma';
import { canonicalize } from '@/lib/taxonomy';
import { requireAuth, isAuthError, safeErrorResponse } from '@/lib/auth-guard';
import { checkRateLimit, safeString, sanitizeForPrompt } from '@/lib/validation';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' });

// Set max duration for Vercel Hobby limits
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (isAuthError(authResult)) return authResult.error;

    // Rate limit: 5 requests per minute per user (very expensive LLM call)
    const { allowed } = checkRateLimit(`jurisprudence:${authResult.userId}`, 5, 60_000);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const rawActionType = safeString(body.actionType, 200);

    if (!rawActionType) {
      return NextResponse.json({ error: 'actionType is required' }, { status: 400 });
    }

    // Canonicalize to handle any variant
    const actionType = canonicalize(rawActionType).label;

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not configured' }, { status: 500 });
    }

    // 1. Check Cache first
    const cachedItem = await prisma.jurisprudenceCache.findUnique({
      where: { actionType }
    });

    // Strategy: If it exists and is less than 24 hours old, return it
    if (cachedItem) {
      const ageHours = (new Date().getTime() - cachedItem.createdAt.getTime()) / (1000 * 60 * 60);
      if (ageHours < 24) {
        console.log(`[Cache Hit] Devolviendo evolución para: ${actionType}`);
        return NextResponse.json(cachedItem.result);
      } else {
        // Obsolete cache, clean it
        console.log(`[Cache Stale] Re-calculando evolución para: ${actionType}`);
        await prisma.jurisprudenceCache.delete({ where: { actionType } });
      }
    }

    console.log(`[Cache Miss] Ejecutando análisis profundo para: ${actionType}`);

    // 2. Fetch Cases from Prisma directly
    const cases = await prisma.case.findMany({
      where: { actionType },
      orderBy: { year: 'asc' },
      include: {
        factualPattern: true,
        evidence: true,
        legalArguments: true,
        legalBases: true
      }
    });

    if (cases.length === 0) {
      return NextResponse.json({ error: 'No se encontraron casos para esta acción' }, { status: 404 });
    }

    // 3. Pre-process and truncate text to avoid token limits
    // 3. Pre-process text to group by year and build Enriched Context
    interface CaseWithRelations {
      id: string;
      year: number;
      sourceReference: string;
      summary: string;
      outcomeGeneral: string;
      factualPattern: { coreDispute: string } | null;
      evidence: { weight: string; description: string; reasoning: string }[];
      legalArguments: { isStrategic: boolean; outcome: string; argument: string; whyOutcome: string }[];
      legalBases: { wasDecisive: boolean; norm: string; application: string }[];
    }

    const yearlyMetrics: Record<number, { count: number; plaintiffWins: number; cases: CaseWithRelations[] }> = {};

    cases.forEach(c => {
      if (!yearlyMetrics[c.year]) {
        yearlyMetrics[c.year] = { count: 0, plaintiffWins: 0, cases: [] };
      }
      yearlyMetrics[c.year].count++;
      if (c.outcomeGeneral === 'Demandante prevalece') yearlyMetrics[c.year].plaintiffWins++;
      yearlyMetrics[c.year].cases.push(c);
    });

    // 4. Build Context String for LLM
    let contextString = `Analysis for Action Type: ${actionType}\n\n`;
    const finalQuantitativeMetrics: Record<number, { caseCount: number; winRate: number }> = {};

    Object.keys(yearlyMetrics).sort().forEach(yearStr => {
      const year = parseInt(yearStr);
      const data = yearlyMetrics[year];
      const winRate = Math.round((data.plaintiffWins / data.count) * 100);

      finalQuantitativeMetrics[year] = { caseCount: data.count, winRate };

      // FASE 6: Enriched prompt formatting (limited to 5 per year to save tokens if necessary, though Gemini handles large contexts, 10 is fine)
      const selectedCases = data.cases.slice(0, 10);

      const enrichedContext = selectedCases.map(c => `
CASO: ${c.sourceReference} (${c.year}) — ${c.outcomeGeneral}
DISPUTA: ${c.factualPattern?.coreDispute ?? c.summary}
PRUEBA DECISIVA: ${c.evidence?.find(e => e.weight === 'DECISIVA')?.description || 'N/A'} → ${c.evidence?.find(e => e.weight === 'DECISIVA')?.reasoning || ''}
ARGUMENTO GANADOR: ${c.legalArguments?.find(a => a.isStrategic && a.outcome === 'ACOGIDO')?.argument || 'N/A'}
POR QUÉ GANÓ: ${c.legalArguments?.find(a => a.isStrategic && a.outcome === 'ACOGIDO')?.whyOutcome || ''}
NORMA CENTRAL: ${c.legalBases?.find(b => b.wasDecisive)?.norm || 'N/A'} — ${c.legalBases?.find(b => b.wasDecisive)?.application || ''}
`).join('\n---\n');

      contextString += `--- YEAR ${year} (${data.count} cases, Win Rate: ${winRate}%) ---\n`;
      contextString += enrichedContext + '\n\n';
    });

    // 5. Query Gemini
    const prompt = `
Actúa como un Magistrado Auxiliar experto en derecho societario y litigio estratégico ante la Delegatura de Procedimientos Mercantiles de la Superintendencia de Sociedades de Colombia. 
Tu objetivo es analizar la evolución de la jurisprudencia para la acción: "${sanitizeForPrompt(actionType, 200)}".
Basado EXCLUSIVAMENTE en el siguiente resumen cronológico de expedientes reales, debes extraer cómo evolucionó la postura de la entidad, los estándares probatorios y la ratio decidendi.

CONTEXTO JURISPRUDENCIAL:
${contextString}

FORMATO DE RESPUESTA:
Responde ÚNICAMENTE con un JSON válido. No uses bloques markdown.
Presta especial atención a "dominantRationale": no quiero una simple línea, quiero un párrafo profundo, denso, técnico y estratégico (mínimo 80-100 palabras) que le sirva a un abogado litigante para entender EXACTAMENTE cómo falló la corte ese año de manera dominante, qué sub-reglas aplicó y qué tipo de pruebas resultaron invictas o derrotadas.

Estructura JSON exacta:
{
  "actionType": "${actionType}",
  "overallNarrative": "Un párrafo denso (4-5 oraciones) resumiendo el arco de evolución histórica general de la postura institucional.",
  "yearlyAnalysis": [
    {
      "year": 2018,
      "probeStandard": "BAJO" | "MEDIO" | "ALTO" | "MUY ALTO",
      "institutionalPosition": "FLEXIBLE" | "NEUTRO" | "RESTRICTIVO" | "MUY RESTRICTIVO",
      "keyShift": "2 oraciones precisas si hubo un giro doctrinal ese año (ratio decidendi nueva), o 'null' si la postura se mantuvo idéntica al año anterior.",
      "dominantRationale": "ANÁLISIS ESTRATÉGICO PROFUNDO: Redacta un párrafo extenso y técnico (80-120 palabras). Detalla la 'ratio decidendi' predominante del año. Explica los requisitos sustanciales que exigió la corte, el escrutinio sobre el material probatorio (qué pruebas fueron decisivas) y sub-reglas establecidas frente a los hechos."
    }
  ],
  "criticalMilestones": [
    {
      "year": 2020,
      "description": "Descripción legal y contundente del hito más relevante"
    }
  ],
  "currentDoctrine": "Párrafo final estratégico (3-4 oraciones) resumiendo el estándar o regla de oro actual que gobierna esta acción."
}`;

    const result = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      messages: [{ role: 'user', content: prompt }],
    });

    let rawOutput = result.content[0].type === 'text' ? result.content[0].text : '';
    // Clean markdown if model wraps in fences
    if (rawOutput.includes('```')) {
      rawOutput = rawOutput.replace(/```json/g, '').replace(/```/g, '').trim();
    }

    const aiAnalysis = JSON.parse(rawOutput);

    // 6. Merge Quantitative and AI Data
    // We map over the AI yearlyAnalysis and inject the exact case counts and win rates
    if (aiAnalysis.yearlyAnalysis && Array.isArray(aiAnalysis.yearlyAnalysis)) {
      aiAnalysis.yearlyAnalysis = aiAnalysis.yearlyAnalysis.map((ya: { year: number; probeStandard: string; institutionalPosition: string; keyShift: string; dominantRationale: string }) => ({
        ...ya,
        caseCount: finalQuantitativeMetrics[ya.year]?.caseCount || 0,
        winRate: finalQuantitativeMetrics[ya.year]?.winRate || 0
      }));
    }

    // 7. Save to Cache
    await prisma.jurisprudenceCache.create({
      data: {
        actionType,
        result: aiAnalysis
      }
    });

    return NextResponse.json(aiAnalysis);

  } catch (error: unknown) {
    return safeErrorResponse(error, 'Jurisprudence Evolution');
  }
}
