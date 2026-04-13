import { NextResponse } from 'next/server';

/**
 * Auth disabled — all requests are allowed.
 * Returns a dummy userId to keep API routes working.
 */
export async function requireAuth(): Promise<
  { userId: string } | { error: NextResponse }
> {
  return { userId: 'anonymous' };
}

/**
 * Helper to check if auth result is an error.
 */
export function isAuthError(
  result: { userId: string } | { error: NextResponse }
): result is { error: NextResponse } {
  return 'error' in result;
}

/**
 * Validate that a string looks like a Gemini/OpenAI embedding array.
 * Prevents SQL injection through embedding strings.
 */
export function validateEmbeddingString(embeddingStr: string): boolean {
  // Must start with [ and end with ]
  if (!embeddingStr.startsWith('[') || !embeddingStr.endsWith(']')) return false;
  // Must only contain numbers, commas, dots, minus signs, spaces
  const inner = embeddingStr.slice(1, -1);
  return /^[-\d.,\s]+$/.test(inner);
}

/**
 * Safely create an embedding string from a number array.
 */
export function toSafeEmbeddingString(values: number[]): string | null {
  if (!values || values.length === 0) return null;
  // Validate every element is actually a number
  if (!values.every(v => typeof v === 'number' && isFinite(v))) return null;
  return `[${values.join(',')}]`;
}

/**
 * Return a safe error response that doesn't expose internals.
 */
export function safeErrorResponse(error: unknown, context: string): NextResponse {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[${context}] Error:`, message);
  return NextResponse.json(
    { error: 'Error interno del servidor' },
    { status: 500 }
  );
}
