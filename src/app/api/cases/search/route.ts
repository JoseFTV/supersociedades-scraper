import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';
import { requireAuth, isAuthError, toSafeEmbeddingString, safeErrorResponse } from '@/lib/auth-guard';

// Gemini for embeddings (Claude doesn't offer embeddings)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (isAuthError(authResult)) return authResult.error;

    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Falta la consulta (query)' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Configuración AI incompleta' }, { status: 500 });
    }

    console.log(`Buscando similitud semántica para: "${query}"`);

    // 1. Convert the user's plain text query into a 3072-dimensional vector embedding
    const result = await model.embedContent(query);
    const embedding = result.embedding.values;

    if (!embedding || embedding.length === 0) {
      throw new Error('No se generó el embedding de la consulta');
    }

    // 2. Perform Vector Similarity Search using PostgreSQL pgvector (<=> operator for Cosine Distance)
    const embeddingString = toSafeEmbeddingString(embedding);
    if (!embeddingString) {
      throw new Error('Embedding inválido');
    }

    const cases: { id: string; caseName: string; summary: string; actionType: string; year: number; outcomeGeneral: string; similarity: number }[] = await prisma.$queryRawUnsafe(`
      SELECT
        id,
        "caseName",
        "summary",
        "actionType",
        "year",
        "outcomeGeneral",
        1 - (embedding <=> $1::vector) as similarity
      FROM "Case"
      ORDER BY embedding <=> $1::vector
      LIMIT 10;
    `, embeddingString);

    return NextResponse.json({ results: cases });

  } catch (error: unknown) {
    return safeErrorResponse(error, 'Semantic Search');
  }
}
