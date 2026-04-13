import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { canonicalize, ACTION_TYPE_BY_CODE } from '@/lib/taxonomy';
import { CROSS_MAP, getRelatedConceptos } from '@/lib/taxonomy-cross-map';
import { prisma } from '@/lib/prisma';
import { requireAuth, isAuthError, toSafeEmbeddingString, safeErrorResponse } from '@/lib/auth-guard';
import { checkRateLimit, safeString, safeInt } from '@/lib/validation';

// Gemini for query embeddings (Claude doesn't offer embeddings)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const embedModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });

/**
 * POST /api/unified-search
 *
 * Hybrid semantic + text search across sentencias, conceptos, and laudos.
 * - Sentencias: semantic search via pgvector (3072-dim embeddings)
 * - Conceptos: text search (no embeddings yet)
 * - Laudos: text search (small corpus)
 *
 * Body: {
 *   query: string,
 *   source?: "all" | "sentencias" | "conceptos" | "laudos",
 *   limit?: number,
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (isAuthError(authResult)) return authResult.error;

    // Rate limit: 20 requests per minute per user
    const { allowed } = checkRateLimit(`unified-search:${authResult.userId}`, 20, 60_000);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const query = safeString(body.query, 500) || '';
    const source = ['all', 'sentencias', 'conceptos', 'laudos'].includes(body.source) ? body.source : 'all';
    const limit = safeInt(String(body.limit), 20, 1, 50);

    if (!query.trim()) {
      return NextResponse.json({ error: 'Query vacío' }, { status: 400 });
    }

    interface SentenciaResult {
      id: string;
      caseName: string;
      summary?: string;
      actionType: string;
      year: number;
      outcomeGeneral: string;
      similarity?: number;
      searchMethod: string;
    }

    interface ConceptoResult {
      id: string;
      filename: string;
      year: number;
      temaPrincipal: string;
      subtema: string;
      confianza: number;
      titulo: string | null;
      resumen: string | null;
      textPreview?: string;
      similarity?: number;
      searchMethod: string;
    }

    interface LaudoResult {
      id: string;
      caseTitle: string;
      arbitrationCenter: string;
      vertical: string;
      subVertical: string | null;
      year: number | null;
      cuantia: string | null;
    }

    interface CrossMapEntry {
      as: string;
      txSocLabels: string[];
      lexiaLabels: string[];
      relationship: string;
    }

    const results: {
      sentencias: SentenciaResult[];
      conceptos: ConceptoResult[];
      laudos: LaudoResult[];
      crossReferences: CrossMapEntry | null;
    } = {
      sentencias: [],
      conceptos: [],
      laudos: [],
      crossReferences: null,
    };

    // Check if query matches a known action type for cross-references
    const { code: canonicalAS } = canonicalize(query);
    if (canonicalAS !== 'AS.99') {
      const entry = CROSS_MAP.find(m => m.as === canonicalAS);
      if (entry) results.crossReferences = entry;
    }

    // ─── Generate query embedding ONCE (reused across all sources) ──
    let queryEmbeddingStr: string | null = null;
    if (process.env.GEMINI_API_KEY) {
      try {
        const embedResult = await embedModel.embedContent(query);
        const embedding = embedResult.embedding.values;
        if (embedding && embedding.length > 0) {
          queryEmbeddingStr = toSafeEmbeddingString(embedding);
        }
      } catch (embErr: unknown) {
        const message = embErr instanceof Error ? embErr.message : String(embErr);
        console.error('[Unified Search] Embedding generation error, falling back to text:', message);
      }
    }

    // ─── Helper: generate relevance hint from similarity + metadata ──
    function relevanceHint(similarity: number | undefined, matchField?: string): string | undefined {
      if (!similarity) return undefined;
      const pct = Math.round(similarity * 100);
      if (pct >= 85) return `Alta relevancia semántica (${pct}%)${matchField ? ` — coincide en ${matchField}` : ''}`;
      if (pct >= 70) return `Relevancia moderada (${pct}%)${matchField ? ` — relacionado por ${matchField}` : ''}`;
      if (pct >= 55) return `Relevancia parcial (${pct}%)${matchField ? ` — conexión indirecta por ${matchField}` : ''}`;
      return undefined;
    }

    // ─── Sentencias: Semantic Search via pgvector ──────────────────
    if (source === 'all' || source === 'sentencias') {
      let semanticResults: { id: string; caseName: string; summary: string; actionType: string; year: number; outcomeGeneral: string; similarity: number }[] = [];

      if (queryEmbeddingStr) {
        try {
          semanticResults = await prisma.$queryRawUnsafe(`
            SELECT
              id,
              "caseName",
              "summary",
              "actionType",
              "year",
              "outcomeGeneral",
              ROUND((1 - (embedding <=> $1::vector))::numeric, 4) as similarity
            FROM "Case"
            WHERE embedding IS NOT NULL
            ORDER BY embedding <=> $1::vector
            LIMIT $2;
          `, queryEmbeddingStr, limit);
        } catch (embErr: unknown) {
          const message = embErr instanceof Error ? embErr.message : String(embErr);
          console.error('[Unified Search] Sentencias semantic search error:', message);
        }
      }

      if (semanticResults.length > 0) {
        results.sentencias = semanticResults.map(s => ({
          ...s,
          similarity: Number(s.similarity),
          searchMethod: 'semantic',
          relevanceHint: relevanceHint(Number(s.similarity), s.actionType),
        }));
      } else {
        results.sentencias = (await prisma.case.findMany({
          where: {
            OR: [
              { caseName: { contains: query, mode: 'insensitive' } },
              { summary: { contains: query, mode: 'insensitive' } },
              { factualBackground: { contains: query, mode: 'insensitive' } },
              { actionType: { contains: query, mode: 'insensitive' } },
            ],
          },
          select: {
            id: true,
            caseName: true,
            actionType: true,
            year: true,
            outcomeGeneral: true,
            summary: true,
          },
          orderBy: { year: 'desc' },
          take: limit,
        })).map(s => ({ ...s, searchMethod: 'text' }));
      }
    }

    // ─── Conceptos: Semantic + Text search ──────────────────────────
    if (source === 'all' || source === 'conceptos') {
      let conceptosSemantic: { id: string; filename: string; year: number; temaPrincipal: string; subtema: string; confianza: number; titulo: string | null; resumen: string | null; textPreview: string; similarity: number }[] = [];

      if (queryEmbeddingStr) {
        try {
          conceptosSemantic = await prisma.$queryRawUnsafe(`
            SELECT
              id,
              filename,
              year,
              "temaPrincipal",
              subtema,
              confianza,
              titulo,
              resumen,
              LEFT("textPreview", 300) as "textPreview",
              ROUND((1 - (embedding <=> $1::vector))::numeric, 4) as similarity
            FROM "Concepto"
            WHERE embedding IS NOT NULL
            ORDER BY embedding <=> $1::vector
            LIMIT $2;
          `, queryEmbeddingStr, limit);
        } catch (embErr: unknown) {
          const message = embErr instanceof Error ? embErr.message : String(embErr);
          console.error('[Unified Search] Conceptos semantic search error:', message);
        }
      }

      if (conceptosSemantic.length > 0) {
        results.conceptos = conceptosSemantic.map(c => ({
          ...c,
          similarity: Number(c.similarity),
          searchMethod: 'semantic',
          relevanceHint: relevanceHint(Number(c.similarity), c.temaPrincipal),
        }));
      } else {
        const where: {
          temaPrincipal?: { in: string[] };
          OR?: { titulo?: { contains: string; mode: 'insensitive' }; subtema?: { contains: string; mode: 'insensitive' }; filename?: { contains: string; mode: 'insensitive' }; textPreview?: { contains: string; mode: 'insensitive' } }[];
        } = {};

        if (canonicalAS !== 'AS.99') {
          const relatedTx = getRelatedConceptos(canonicalAS);
          if (relatedTx.length > 0) {
            where.temaPrincipal = { in: relatedTx };
          }
        }

        where.OR = [
          { titulo: { contains: query, mode: 'insensitive' } },
          { subtema: { contains: query, mode: 'insensitive' } },
          { filename: { contains: query, mode: 'insensitive' } },
          { textPreview: { contains: query, mode: 'insensitive' } },
        ];

        results.conceptos = (await prisma.concepto.findMany({
          where,
          select: {
            id: true,
            filename: true,
            year: true,
            temaPrincipal: true,
            subtema: true,
            confianza: true,
            titulo: true,
            resumen: true,
            textPreview: true,
          },
          orderBy: { year: 'desc' },
          take: limit,
        })).map(c => ({ ...c, searchMethod: 'text' }));
      }
    }

    // ─── Laudos: Semantic + Text search ───────────────────────────
    if (source === 'all' || source === 'laudos') {
      let laudosSemantic: { id: string; caseTitle: string; arbitrationCenter: string; vertical: string; subVertical: string | null; year: number | null; cuantia: string | null; similarity: number }[] = [];

      if (queryEmbeddingStr) {
        try {
          laudosSemantic = await prisma.$queryRawUnsafe(`
            SELECT
              id,
              "caseTitle",
              "arbitrationCenter",
              vertical,
              "subVertical",
              year,
              cuantia,
              ROUND((1 - (embedding <=> $1::vector))::numeric, 4) as similarity
            FROM "Laudo"
            WHERE embedding IS NOT NULL AND vertical = 'societario'
            ORDER BY embedding <=> $1::vector
            LIMIT $2;
          `, queryEmbeddingStr, limit);
        } catch (embErr: unknown) {
          const message = embErr instanceof Error ? embErr.message : String(embErr);
          console.error('[Unified Search] Laudos semantic search error:', message);
        }
      }

      if (laudosSemantic.length > 0) {
        results.laudos = laudosSemantic.map(l => ({
          ...l,
          similarity: Number(l.similarity),
          searchMethod: 'semantic',
          relevanceHint: relevanceHint(Number(l.similarity), l.subVertical || l.vertical),
        }));
      } else {
        results.laudos = (await prisma.laudo.findMany({
          where: {
            vertical: 'societario',
            OR: [
              { caseTitle: { contains: query, mode: 'insensitive' } },
              { subVertical: { contains: query, mode: 'insensitive' } },
            ],
          },
          select: {
            id: true,
            caseTitle: true,
            arbitrationCenter: true,
            vertical: true,
            subVertical: true,
            year: true,
            cuantia: true,
          },
          orderBy: { year: 'desc' },
          take: limit,
        })).map(l => ({ ...l, searchMethod: 'text' }));
      }
    }

    return NextResponse.json({
      query,
      source,
      counts: {
        sentencias: results.sentencias.length,
        conceptos: results.conceptos.length,
        laudos: results.laudos.length,
      },
      crossReferences: results.crossReferences,
      results,
    });

  } catch (error: unknown) {
    return safeErrorResponse(error, 'Unified Search');
  }
}
