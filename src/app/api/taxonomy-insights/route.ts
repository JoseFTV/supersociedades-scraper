import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/lib/prisma';
import { requireAuth, isAuthError, safeErrorResponse } from '@/lib/auth-guard';
import { checkRateLimit, safeString, safeArray, sanitizeForPrompt } from '@/lib/validation';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' });

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (isAuthError(authResult)) return authResult.error;

    // Rate limit: 10 requests per minute per user (expensive LLM call)
    const { allowed } = checkRateLimit(`taxonomy-insights:${authResult.userId}`, 10, 60_000);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const actionType = safeString(body.actionType, 200);
    const caseIds = safeArray<string>(body.caseIds, 50);

    if (!actionType || !caseIds || caseIds.length === 0) {
      return NextResponse.json({ error: 'Falta proveer el actionType o los caseIds asociados.' }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'Configuración AI incompleta (ANTHROPIC_API_KEY)' }, { status: 500 });
    }

    console.log(`[Taxonomy Insights] Generando reporte para: ${actionType} (${caseIds.length} casos)`);

    // 1. Fetch the FULL detailed summaries directly from Postgres for these specific IDs
    // We only take up to 20 to avoid exceeding context or taking too long, ordered randomly or by date
    const fullCases = await prisma.case.findMany({
      where: {
        id: { in: caseIds }
      },
      select: {
        caseName: true,
        legalIssue: true,
        outcomeGeneral: true,
        outcomeDetailed: true
      },
      take: 20
    });

    // 2. Format Context for Gemini
    const contextText = fullCases.map((c, index) => `
### Caso ${index + 1}: ${c.caseName}
- **Problema Jurídico:** ${c.legalIssue}
- **Resultado General:** ${c.outcomeGeneral}
- **Móvil/Razón del Fallo Detallada:** ${c.outcomeDetailed}
`).join('\n\n');

    // 3. Construct Prompt (sanitize actionType before embedding in LLM prompt)
    const sanitizedActionType = sanitizeForPrompt(actionType, 200);
    const prompt = `
Eres un analista estratégico de datos jurídicos especializado en litigio societario colombiano (Superintendencia de Sociedades).
Tu objetivo es leer un compendio de casos reales pertenecientes a la tipología de acción: **"${sanitizedActionType}"** y extraer los verdaderos INSIGHTS TÁCTICOS.

Queremos saber CÓMO ganar estos casos y POR QUÉ se pierden, basándonos estricta y ÚNICAMENTE en la data provista.

CASOS PROVISTOS PARA ANÁLISIS:
"""
${contextText}
"""

INSTRUCCIONES DE FORMATO OBLIGATORIAS:
- Usa Markdown.
- Debes ser sumamente directo y táctico. No digas cosas obvias o genéricas.
- Estructura tu respuesta estrictamente en 2 secciones principales:
  1. **🎯 Factores de Éxito (Por qué prospera el demandante)**: Viñetas directas de qué pruebas o situaciones fácticas convencieron al juez en los casos donde ganó el demandante.
  2. **⚠️ Causas de Desestimación (Por qué fracasan)**: Viñetas directas de los errores, excepciones o falta de carga probatoria que llevaron a fallos en contra del demandante.
- NUNCA inventes información. Si no hay suficientes datos para encontrar patrones fuertes, indícalo.

Genera el insight ahora.`;

    // 4. Call Claude
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });
    const insight = message.content[0].type === 'text' ? message.content[0].text : '';

    return NextResponse.json({ insight });

  } catch (error: unknown) {
    return safeErrorResponse(error, 'Taxonomy Insights');
  }
}
