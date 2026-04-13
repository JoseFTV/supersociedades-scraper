/**
 * Cross-Taxonomy Mapping — The Triangle of Gold
 *
 * Maps between three independent taxonomies:
 *   AS.XX  — Sentencias (acción jurisdiccional ante Supersociedades)
 *   TX.SOC.XX — Conceptos (doctrina administrativa Supersociedades)
 *   CT.SOC.XX / B6.XX — Laudos (arbitraje CCB, Lexia v3.0)
 *
 * This enables unified search: a user searching "abuso de voto" gets
 * sentencias (AS.01) + conceptos (TX.SOC.03.09, TX.SOC.05) + laudos (S-ABV).
 */

export interface CrossMapping {
  /** AS code for sentencias */
  as: string;
  asLabel: string;
  /** TX.SOC codes for conceptos */
  txSoc: string[];
  txSocLabels: string[];
  /** Lexia CT/B6 codes for laudos */
  lexia: string[];
  lexiaLabels: string[];
  /** Semantic description of the relationship */
  relationship: string;
}

export const CROSS_MAP: CrossMapping[] = [
  {
    as: 'AS.01',
    asLabel: 'Abuso del derecho de voto',
    txSoc: ['TX.SOC.03', 'TX.SOC.05'],
    txSocLabels: ['Socios y accionistas', 'Órganos sociales'],
    lexia: ['S-ABV'],
    lexiaLabels: ['Abuso de voto'],
    relationship: 'Mismo fenómeno jurídico: abuso del derecho de voto en tres contextos',
  },
  {
    as: 'AS.02',
    asLabel: 'Reconocimiento de presupuestos de ineficacia',
    txSoc: ['TX.SOC.05'],
    txSocLabels: ['Órganos sociales'],
    lexia: ['CT.SOC.05', 'B6.05', 'B6.06'],
    lexiaLabels: ['Vicios en asamblea', 'Convocatoria defectuosa', 'Quórum insuficiente'],
    relationship: 'Gobierno corporativo formal — vicios de procedimiento en asambleas',
  },
  {
    as: 'AS.03',
    asLabel: 'Impugnación de decisiones sociales',
    txSoc: ['TX.SOC.05', 'TX.SOC.15'],
    txSocLabels: ['Órganos sociales', 'Procedimiento'],
    lexia: ['CT.SOC.05'],
    lexiaLabels: ['Vicios en asamblea'],
    relationship: 'Nulidad/anulabilidad de decisiones vs. ineficacia (distinto régimen)',
  },
  {
    as: 'AS.04',
    asLabel: 'Disputas societarias',
    txSoc: ['TX.SOC.03', 'TX.SOC.13'],
    txSocLabels: ['Socios y accionistas', 'Utilidades y dividendos'],
    lexia: ['CT.SOC.01', 'CT.SOC.03', 'CT.SOC.04', 'CT.SOC.09', 'CT.SOC.10'],
    lexiaLabels: ['Incumplimiento acuerdo', 'Exclusión de socios', 'Distribución utilidades', 'Conflicto socios', 'Retiro de socios'],
    relationship: 'Categoría residual amplia — conflictos entre socios',
  },
  {
    as: 'AS.05',
    asLabel: 'Responsabilidad de administradores',
    txSoc: ['TX.SOC.09'],
    txSocLabels: ['Administradores'],
    lexia: ['CT.SOC.06', 'S-COI'],
    lexiaLabels: ['Responsabilidad admin.', 'Conflicto de intereses'],
    relationship: 'Deberes fiduciarios — diligencia y lealtad del administrador',
  },
  {
    as: 'AS.06',
    asLabel: 'Desestimación de la personalidad jurídica',
    txSoc: ['TX.SOC.15'],
    txSocLabels: ['Procedimiento'],
    lexia: [],
    lexiaLabels: [],
    relationship: 'Competencia exclusiva de Supersociedades jurisdiccional',
  },
  {
    as: 'AS.07',
    asLabel: 'Designación de peritos',
    txSoc: ['TX.SOC.03'],
    txSocLabels: ['Socios y accionistas'],
    lexia: ['CT.SOC.02'],
    lexiaLabels: ['Valoración de participaciones'],
    relationship: 'Avalúo de acciones — derecho de retiro y discrepancia de valor',
  },
  {
    as: 'AS.08',
    asLabel: 'Disputas sobre causales de disolución',
    txSoc: ['TX.SOC.04'],
    txSocLabels: ['Disolución y liquidación'],
    lexia: ['CT.SOC.07'],
    lexiaLabels: ['Disolución y liquidación'],
    relationship: 'Disolución societaria — causales y enervatoria',
  },
  {
    as: 'AS.09',
    asLabel: 'Cumplimiento de acuerdos de accionistas',
    txSoc: ['TX.SOC.03'],
    txSocLabels: ['Socios y accionistas'],
    lexia: ['CT.SOC.01'],
    lexiaLabels: ['Incumplimiento acuerdo accionistas'],
    relationship: 'Pactos parasociales depositados',
  },
  {
    as: 'AS.10',
    asLabel: 'Responsabilidad de socios y liquidadores',
    txSoc: ['TX.SOC.04', 'TX.SOC.03'],
    txSocLabels: ['Disolución y liquidación', 'Socios y accionistas'],
    lexia: ['CT.SOC.07'],
    lexiaLabels: ['Disolución y liquidación'],
    relationship: 'Liquidación irregular y responsabilidad subsidiaria',
  },
  {
    as: 'AS.15',
    asLabel: 'Cláusula compromisoria',
    txSoc: ['TX.SOC.15'],
    txSocLabels: ['Procedimiento'],
    lexia: [],
    lexiaLabels: [],
    relationship: 'Competencia jurisdiccional — validez y alcance de cláusulas compromisorias en estatutos sociales',
  },
  {
    as: 'AS.11',
    asLabel: 'Oposición a reactivación societaria',
    txSoc: ['TX.SOC.04'],
    txSocLabels: ['Disolución y liquidación'],
    lexia: [],
    lexiaLabels: [],
    relationship: 'Oposición de acreedores o terceros a la reactivación de sociedades en liquidación',
  },
  {
    as: 'AS.12',
    asLabel: 'Conflicto de intereses de administradores',
    txSoc: ['TX.SOC.09'],
    txSocLabels: ['Administradores'],
    lexia: ['S-COI'],
    lexiaLabels: ['Conflicto de intereses'],
    relationship: 'Operaciones con vinculados y autocontratación sin autorización — deberes de lealtad',
  },
  {
    as: 'AS.13',
    asLabel: 'Responsabilidad de matrices y controlantes',
    txSoc: ['TX.SOC.10'],
    txSocLabels: ['Grupos empresariales'],
    lexia: [],
    lexiaLabels: [],
    relationship: 'Abuso de control en grupos empresariales',
  },
  {
    as: 'AS.14',
    asLabel: 'Ejecución de pactos parasociales',
    txSoc: ['TX.SOC.03'],
    txSocLabels: ['Socios y accionistas'],
    lexia: ['CT.SOC.01'],
    lexiaLabels: ['Incumplimiento acuerdo accionistas'],
    relationship: 'Pactos parasociales no depositados — ejecución de obligaciones entre socios',
  },
];

/**
 * Given an AS code, find related TX.SOC codes to search conceptos.
 */
export function getRelatedConceptos(asCode: string): string[] {
  const entry = CROSS_MAP.find(m => m.as === asCode);
  return entry?.txSoc ?? [];
}

/**
 * Given a TX.SOC code, find related AS codes to search sentencias.
 */
export function getRelatedSentencias(txSocCode: string): string[] {
  return CROSS_MAP
    .filter(m => m.txSoc.includes(txSocCode))
    .map(m => m.as);
}

/**
 * Given any code (AS, TX.SOC, or Lexia), find all cross-references.
 */
export function findCrossReferences(code: string): CrossMapping | null {
  // Try AS match
  let match = CROSS_MAP.find(m => m.as === code);
  if (match) return match;

  // Try TX.SOC match — return first mapping that includes this code
  match = CROSS_MAP.find(m => m.txSoc.includes(code));
  if (match) return match;

  // Try Lexia match
  match = CROSS_MAP.find(m => m.lexia.includes(code));
  if (match) return match;

  return null;
}
