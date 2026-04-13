import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { canonicalize } from '@/lib/taxonomy';
import { prisma } from '@/lib/prisma';
import { requireAuth, isAuthError, safeErrorResponse } from '@/lib/auth-guard';
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const extractModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// ─── Gemini prompt for tribunal decisions ────────────────────────────────────
const TRIBUNAL_EXTRACTION_PROMPT = `
Eres un abogado litigante colombiano experto en derecho societario. Acabas de leer una sentencia del Tribunal Superior de Bogotá, Sala Civil, que resuelve una apelación contra una decisión de la Superintendencia de Sociedades.

TAREA CRÍTICA #1: Localiza en los ANTECEDENTES de esta providencia el número de radicado o expediente asignado por la Superintendencia de Sociedades al proceso en primera instancia. Puede aparecer como:
- "radicado No. XXXX-XX-XXXXXX de la Superintendencia de Sociedades"
- "expediente XXXX" o "proceso radicado bajo el número XXXX"
- En el encabezado bajo "Proceso" o "Asunto"
- En la narración como "en el proceso adelantado por..." o "bajo el radicado..."
- Formatos comunes SS: "2019-01-300339", "800-45 de 2019", "2021-01-XXXXXX"

TAREA CRÍTICA #2: Determina exactamente qué resolvió el Tribunal: ¿Confirmó, Revocó o Modificó la sentencia de la Supersociedades?

TAREA CRÍTICA #3: Extrae el radicado del Tribunal (el que aparece en el encabezado de ESTA sentencia del Tribunal, formato 11001-31-...).

Responde ÚNICAMENTE con un JSON válido, sin bloques markdown, sin explicaciones:

{
  "radicadoTribunal": "radicado del Tribunal como aparece en el encabezado — ej: 11001-31-99-002-2021-00199-01",
  "radicadoSupersociedades": "número exacto de radicado/expediente SS encontrado en antecedentes — null si no encuentras nada",
  "partesEncontradas": ["Demandante S.A.S.", "Demandado Nombre"],
  "fechaDecision": "YYYY-MM-DD",
  "magistradoPonente": "nombre completo del magistrado ponente",
  "appealsOutcome": "CONFIRMO | REVOCO | MODIFICO | PARCIALMENTE_REVOCO",
  "actionType": "tipo exacto de acción societaria (ej: Impugnación de Actos de Asamblea, Responsabilidad de Administradores, Acción Social de Responsabilidad, Conflicto de Intereses, Levantamiento de Velo Corporativo)",
  "ratioDecidendi": "2-3 oraciones: la razón jurídica central del Tribunal para su decisión — lo que un abogado citaría como precedente",
  "outcomeGeneral": "DEMANDANTE_GANA | DEMANDADO_GANA | PARCIAL | INHIBITORIO",
  "summary": "4-5 oraciones: qué revisó el Tribunal, qué había decidido Supersociedades en primera instancia, qué cambió o confirmó el Tribunal y por qué, cuál fue el argumento determinante",
  "legalBases": [
    {
      "norm": "norma citada exactamente como aparece en el fallo",
      "normType": "CODIGO_COMERCIO | LEY | DECRETO | REGLAMENTO | JURISPRUDENCIA",
      "application": "cómo usó el Tribunal esta norma para decidir",
      "wasDecisive": true
    }
  ]
}
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function fetchPdfAsBase64(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LexiaCrawler/1.0)' },
    redirect: 'follow',
  });
  if (!res.ok) {
    throw new Error(`Error descargando PDF desde Tribunal: HTTP ${res.status} — ${url}`);
  }
  const contentType = res.headers.get('content-type') ?? '';
  if (!contentType.includes('pdf') && !contentType.includes('octet-stream') && !contentType.includes('application')) {
    throw new Error(`La URL no retornó un PDF (Content-Type: ${contentType})`);
  }
  const buffer = await res.arrayBuffer();
  return Buffer.from(buffer).toString('base64');
}

function normalizeForMatching(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function mapAppealsOutcome(geminiValue: string): string {
  const map: Record<string, string> = {
    CONFIRMO: 'Confirmó',
    REVOCO: 'Revocó',
    MODIFICO: 'Modificó',
    PARCIALMENTE_REVOCO: 'Modificó',
  };
  return map[geminiValue] ?? geminiValue;
}

async function findMatchingSSCase(radicadoSS: string | null) {
  if (!radicadoSS) return null;

  // 1. Exact match
  const exact = await prisma.case.findFirst({
    where: { sourceReference: radicadoSS, courtLevel: 'Primera Instancia' },
  });
  if (exact) return { case: exact, confidence: 1.0, method: 'EXACT' };

  // 2. Normalized string comparison
  const normTarget = normalizeForMatching(radicadoSS);
  const ssCases = await prisma.case.findMany({
    where: { courtLevel: 'Primera Instancia' },
    select: { id: true, sourceReference: true, caseName: true, year: true },
  });

  for (const c of ssCases) {
    const normRef = normalizeForMatching(c.sourceReference);
    if (normRef === normTarget || normRef.includes(normTarget) || normTarget.includes(normRef)) {
      return { case: c, confidence: 0.9, method: 'NORMALIZED' };
    }
  }

  // 3. Numeric-only match (last resort)
  const numTarget = radicadoSS.replace(/[^0-9]/g, '');
  if (numTarget.length >= 6) {
    for (const c of ssCases) {
      const numRef = c.sourceReference.replace(/[^0-9]/g, '');
      if (numRef.length >= 6 && (numRef.includes(numTarget) || numTarget.includes(numRef))) {
        return { case: c, confidence: 0.7, method: 'NUMERIC' };
      }
    }
  }

  return null;
}

// ─── POST /api/admin/tribunal/ingest ─────────────────────────────────────────
// Body: { pdfUrl: string } OR { fileData: string (base64), fileName: string }
export async function POST(req: NextRequest) {
  try {
    // Auth check — only authenticated users can ingest tribunal decisions
    const authResult = await requireAuth();
    if (isAuthError(authResult)) return authResult.error;

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'API Key de Gemini no configurada.' }, { status: 500 });
    }

    const body = await req.json();
    const { pdfUrl, fileData, fileName } = body;

    if (!pdfUrl && !fileData) {
      return NextResponse.json({ error: 'Se requiere pdfUrl o fileData.' }, { status: 400 });
    }

    // ── 1. Get PDF as base64 ────────────────────────────────────────────────
    let base64Pdf: string;
    let sourceName: string;

    if (pdfUrl) {
      console.log(`[TribunalIngest] Descargando PDF desde: ${pdfUrl}`);
      base64Pdf = await fetchPdfAsBase64(pdfUrl);
      sourceName = pdfUrl;
    } else {
      base64Pdf = fileData;
      sourceName = fileName ?? 'manual-upload';
    }

    // Idempotency: skip if already ingested from same URL
    if (pdfUrl) {
      const existing = await prisma.case.findFirst({
        where: { sourceUrl: pdfUrl, court: 'Tribunal Superior de Bogotá' },
      });
      if (existing) {
        return NextResponse.json({
          success: true,
          skipped: true,
          message: 'Esta sentencia del Tribunal ya fue ingerida previamente.',
          case: existing,
        });
      }
    }

    // ── 2. Gemini extraction ────────────────────────────────────────────────
    console.log(`[TribunalIngest] Enviando a Gemini para extracción...`);
    const pdfPart = {
      inlineData: { data: base64Pdf, mimeType: 'application/pdf' },
    };

    const extractionResult = await extractModel.generateContent({
      contents: [{ role: 'user', parts: [pdfPart, { text: TRIBUNAL_EXTRACTION_PROMPT }] }],
    });

    const rawText = extractionResult.response.text().trim();
    const jsonText = rawText.replace(/```json|```/g, '').trim();

    let extracted: any;
    try {
      extracted = JSON.parse(jsonText);
    } catch {
      await prisma.ingestQuarantine.create({
        data: {
          fileName: sourceName,
          errors: ['JSON inválido de Gemini para sentencia del Tribunal'],
          rawGeminiOutput: rawText,
        },
      });
      return NextResponse.json(
        { success: false, error: 'Gemini no retornó JSON válido. Enviado a cuarentena.', raw: rawText.slice(0, 300) },
        { status: 422 }
      );
    }

    console.log(`[TribunalIngest] Extracción exitosa. radicadoSS extraído: ${extracted.radicadoSupersociedades}`);

    // ── 3. Match to SS case ────────────────────────────────────────────────
    const matchResult = await findMatchingSSCase(extracted.radicadoSupersociedades);

    if (!matchResult) {
      console.warn(`[TribunalIngest] No se encontró caso SS para: ${extracted.radicadoSupersociedades}`);
    } else {
      console.log(`[TribunalIngest] Match encontrado (${matchResult.method}, ${matchResult.confidence}): ${matchResult.case.id}`);
    }

    // ── 4. Parse decision date ─────────────────────────────────────────────
    let decisionDate = extracted.fechaDecision ?? '';
    let year = new Date().getFullYear();
    if (decisionDate) {
      const parsedYear = parseInt(decisionDate.slice(0, 4));
      if (parsedYear >= 2000 && parsedYear <= 2030) year = parsedYear;
    }

    // ── 5. Save as Case record ─────────────────────────────────────────────
    const appealsOutcomeMapped = mapAppealsOutcome(extracted.appealsOutcome ?? '');

    const newCase = await prisma.case.create({
      data: {
        id: `tribunal-${Date.now().toString().slice(-8)}`,
        caseName: extracted.partesEncontradas?.join(' vs. ') ?? 'Partes no identificadas',
        sourceReference: extracted.radicadoTribunal ?? sourceName,
        sourceUrl: pdfUrl ?? sourceName,
        filingDate: '',
        decisionDate,
        duration: 'N/A',
        year,
        office: 'Sala Civil',
        court: 'Tribunal Superior de Bogotá',
        courtLevel: 'Segunda Instancia',
        firstInstanceRef: extracted.radicadoSupersociedades ?? null,
        appealsOutcome: appealsOutcomeMapped,
        actionType: canonicalize(extracted.actionType ?? 'No identificado').label,
        subtopics: [],
        summary: extracted.summary ?? '',
        factualBackground: extracted.ratioDecidendi ?? '',
        legalIssue: extracted.ratioDecidendi ?? '',
        proceduralTrack: 'Apelación',
        outcomeGeneral: extracted.outcomeGeneral ?? 'PARCIAL',
        outcomeDetailed: extracted.summary ?? '',
        markdownContent: buildMarkdown(extracted),
        legalBases: extracted.legalBases?.length
          ? {
              create: (extracted.legalBases as any[]).map((lb: any) => ({
                norm: lb.norm ?? '',
                normType: lb.normType ?? 'LEY',
                application: lb.application ?? '',
                wasDecisive: lb.wasDecisive ?? false,
              })),
            }
          : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      case: newCase,
      match: matchResult
        ? {
            ssCase: { id: matchResult.case.id, caseName: (matchResult.case as any).caseName, sourceReference: matchResult.case.sourceReference },
            confidence: matchResult.confidence,
            method: matchResult.method,
          }
        : null,
      radicadoSSExtracted: extracted.radicadoSupersociedades,
      appealsOutcome: appealsOutcomeMapped,
    });
  } catch (error: any) {
    console.error('[TribunalIngest] Error:', error);
    return NextResponse.json({ error: error.message ?? 'Error procesando la sentencia del Tribunal' }, { status: 500 });
  }
}

function buildMarkdown(data: any): string {
  return `# ${data.radicadoTribunal ?? 'Radicado no identificado'} — Tribunal Superior de Bogotá, Sala Civil

## Segunda Instancia
**Revisando primera instancia:** ${data.radicadoSupersociedades ?? 'No identificado'}
**Magistrado Ponente:** ${data.magistradoPonente ?? 'No identificado'}
**Fecha de Decisión:** ${data.fechaDecision ?? 'No identificada'}

## Decisión del Tribunal
**Resultado:** ${data.appealsOutcome ?? '—'}
**Tipo de Acción:** ${data.actionType ?? '—'}

## Resumen
${data.summary ?? '—'}

## Ratio Decidendi
${data.ratioDecidendi ?? '—'}

## Bases Normativas Aplicadas
${(data.legalBases ?? []).map((lb: any) => `- **${lb.norm}** (${lb.normType}): ${lb.application}`).join('\n') || 'No identificadas'}
`;
}
