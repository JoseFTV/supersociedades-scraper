/**
 * Shared outcome classification utility.
 * Single source of truth for win/loss/mixed classification.
 */

/** Classify an outcomeGeneral string into win/loss/mixed */
export function classifyOutcome(outcome: string): 'win' | 'loss' | 'mixed' {
  if (/demandante\s*prevalece|DEMANDANTE_GANA/i.test(outcome)) return 'win';
  if (/demandado\s*prevalece|DEMANDADO_GANA|desestimado/i.test(outcome)) return 'loss';
  return 'mixed';
}
