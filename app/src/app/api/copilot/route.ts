import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';
import { copilotPromptV2 } from '../../../prompts/copilot_v2';
import { prisma } from '@/lib/prisma';
import { requireAuth, isAuthError, toSafeEmbeddingString, safeErrorResponse } from '@/lib/auth-guard';
import { checkRateLimit, sanitizeForPrompt, safeString } from '@/lib/validation';

// Gemini for embeddings only, Claude for text generation
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const embeddingModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' });

// ─── Memo cache (in-memory, TTL 1 hour) ─────────────────────────────────────
const CACHE_TTL = 60 * 60 * 1000; // 1 hour
const memoCache = new Map<string, { memo: string; citedCases: unknown[]; timestamp: number }>();

function getCacheKey(text: string): string {
  // Simple hash: normalize whitespace + lowercase, then take first 200 chars as key
  return text.replace(/\s+/g, ' ').trim().toLowerCase().slice(0, 200);
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (isAuthError(authResult)) return authResult.error;

    // Rate limit: 10 requests per minute per user (expensive LLM call)
    const { allowed, remaining } = checkRateLimit(`copilot:${authResult.userId}`, 10, 60_000);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.' },
        { status: 429, headers: { 'X-RateLimit-Remaining': '0' } }
      );
    }

    const body = await req.json();
    const factPattern = safeString(body.factPattern, 10_000);

    if (!factPattern) {
      return NextResponse.json({ error: 'Falta proveer los hechos del caso.' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY || !process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'Configuración AI incompleta (requiere GEMINI_API_KEY + ANTHROPIC_API_KEY)' }, { status: 500 });
    }

    console.log(`[Copilot] Generando embedding para los hechos...`);

    // Sanitize user input before embedding in LLM prompt
    const sanitizedFactPattern = sanitizeForPrompt(factPattern);

    // Check cache for identical (or near-identical) queries
    const cacheKey = getCacheKey(sanitizedFactPattern);
    const cached = memoCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`[Copilot] Cache hit for query (${cacheKey.slice(0, 50)}...)`);
      return NextResponse.json({
        memo: cached.memo,
        citedCases: cached.citedCases,
        cached: true,
      });
    }

    // 1. Convert the user's fact pattern into an embedding
    const embedResult = await embeddingModel.embedContent(sanitizedFactPattern);
    const embedding = embedResult.embedding.values;

    if (!embedding || embedding.length === 0) {
      throw new Error('No se generó el embedding de la consulta');
    }

    // 2. Perform Vector Similarity Search using PostgreSQL pgvector
    const embeddingString = toSafeEmbeddingString(embedding);
    if (!embeddingString) {
      return NextResponse.json({ error: 'Embedding inválido' }, { status: 500 });
    }

    console.log(`[Copilot] Buscando casos similares...`);
    const similarCases: { id: string; sourceReference: string; caseName: string; year: number; markdownContent: string; similarity: number }[] = await prisma.$queryRawUnsafe(`
      SELECT 
        id, 
        "sourceReference",
        "caseName", 
        "year",
        COALESCE("markdownContent", "summary") as "markdownContent",
        1 - (embedding <=> $1::vector) as similarity
      FROM "Case"
      ORDER BY embedding <=> $1::vector
      LIMIT 5;
    `, embeddingString);

    if (!similarCases || similarCases.length === 0) {
      return NextResponse.json({ error: 'No se encontraron casos similares en la base de datos.' }, { status: 404 });
    }

    console.log(`[Copilot] Se encontraron ${similarCases.length} casos. Generando memorando...`);

    // 3. Format the retrieved cases as context for the LLM
    const contextText = similarCases.map((c, index) => `
## ${c.sourceReference} - ${c.caseName} (${c.year}) - Similitud: ${(c.similarity * 100).toFixed(1)}%
${c.markdownContent}`).join('\n\n---\n\n');

    // 4. Construct the prompt for the drafting of the Strategic Memo using the Lexia Standard
    const prompt = copilotPromptV2(sanitizedFactPattern, contextText);

    const chatResult = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      messages: [{ role: 'user', content: prompt }],
    });
    const memo = chatResult.content[0].type === 'text' ? chatResult.content[0].text : '';

    // Cache the result
    memoCache.set(cacheKey, { memo, citedCases: similarCases, timestamp: Date.now() });

    // Evict old entries if cache grows too large (max 50 entries)
    if (memoCache.size > 50) {
      const oldest = [...memoCache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
      if (oldest) memoCache.delete(oldest[0]);
    }

    return NextResponse.json({
      memo,
      citedCases: similarCases,
    });

  } catch (error: unknown) {
    return safeErrorResponse(error, 'Copilot');
  }
}
