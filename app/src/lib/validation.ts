/**
 * Input validation and sanitization utilities for API routes.
 */

/** Validate and clamp a numeric parameter. Returns default if invalid. */
export function safeInt(
  value: string | null | undefined,
  defaultVal: number,
  min: number,
  max: number
): number {
  if (!value) return defaultVal;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed) || !isFinite(parsed)) return defaultVal;
  return Math.max(min, Math.min(max, parsed));
}

/** Validate and cap a string length. Returns null if empty after trimming. */
export function safeString(
  value: string | null | undefined,
  maxLength: number = 1000
): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  return trimmed.slice(0, maxLength);
}

/** Validate an array is within bounds. Returns null if invalid. */
export function safeArray<T>(
  arr: T[] | null | undefined,
  maxLength: number = 100
): T[] | null {
  if (!arr || !Array.isArray(arr)) return null;
  if (arr.length === 0) return null;
  return arr.slice(0, maxLength);
}

/**
 * Sanitize user input before embedding in LLM prompts.
 * Strips potential injection patterns while preserving legal text.
 */
export function sanitizeForPrompt(input: string, maxLength: number = 5000): string {
  if (!input) return '';

  let sanitized = input.trim().slice(0, maxLength);

  // Remove common prompt injection patterns
  sanitized = sanitized
    // Remove "ignore previous instructions" patterns
    .replace(/ignore\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions?|prompts?|context)/gi, '[redacted]')
    // Remove "system prompt" extraction attempts
    .replace(/(?:show|reveal|print|output|return|give)\s+(?:me\s+)?(?:the\s+)?(?:system|original|hidden)\s+prompt/gi, '[redacted]')
    // Remove attempts to change role
    .replace(/(?:you\s+are\s+now|act\s+as|pretend\s+to\s+be|roleplay\s+as)\s/gi, '[redacted] ')
    // Remove markdown code blocks that could wrap injection payloads
    .replace(/```[\s\S]*?```/g, '[code block removed]');

  return sanitized;
}

/**
 * Simple in-memory rate limiter for serverless.
 * Uses a sliding window approach.
 * Note: In serverless, each cold start resets the map — this provides
 * basic protection but is not a full distributed rate limiter.
 * For production, consider Upstash Redis rate limiting.
 */
const requestCounts = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  maxRequests: number = 20,
  windowMs: number = 60_000
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = requestCounts.get(key);

  if (!entry || now > entry.resetAt) {
    requestCounts.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  entry.count++;
  const remaining = Math.max(0, maxRequests - entry.count);

  if (entry.count > maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining };
}

// Cleanup old entries periodically (prevent memory leak)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of requestCounts.entries()) {
    if (now > entry.resetAt) {
      requestCounts.delete(key);
    }
  }
}, 60_000);
