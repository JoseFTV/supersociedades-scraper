/**
 * Taxonomía Canónica de Tipos de Acción Societaria (Serie AS)
 * Fuente de verdad: taxonomia_sentencias_supersociedades_v1.0.md
 *
 * Todas las pipelines de ingesta y componentes de UI deben importar de aquí.
 */

import {
  Scale,
  Users,
  LayoutGrid,
  Book,
  Gavel,
  AlertTriangle,
  Briefcase,
  FileCheck,
  HelpCircle,
  UserX,
  Activity,
  ShieldAlert,
  Building2,
  Handshake,
  FileQuestion,
} from 'lucide-react';

// ─── Canonical definitions ──────────────────────────────────────────────────

export interface ActionTypeDefinition {
  code: string;
  slug: string;
  label: string;
  description: string;
  legalBasis: string[];
  subtopics: string[];
  aliases: string[];
  icon: any;
}

export const ACTION_TYPES: ActionTypeDefinition[] = [
  {
    code: 'AS.01',
    slug: 'abuso_derecho_voto',
    label: 'Abuso del derecho de voto',
    description:
      'Cuando un accionista ejerce el poder de voto para dañar a la compañía, extraer beneficios privados o dañar ilegalmente a otros accionistas (Art 43 Ley 1258/2008).',
    legalBasis: ['Art. 43 Ley 1258/2008', 'Art. 830 C.Co.'],
    subtopics: ['Abuso de mayoría', 'Abuso de minoría', 'Abuso de paridad', 'Veto injustificado'],
    aliases: [
      'Abuso del derecho de voto',
      'Abuso de mayoría',
      'Abuso de minoría',
      'Abuso de paridad',
      'Abuso del voto',
      'Voto abusivo',
    ],
    icon: Scale,
  },
  {
    code: 'AS.02',
    slug: 'ineficacia',
    label: 'Reconocimiento de presupuestos de ineficacia',
    description:
      'Declaratoria de ineficacia de decisiones de órganos sociales adoptadas con violación de requisitos legales imperativos.',
    legalBasis: ['Art. 24 num. 1 CGP', 'Art. 190 C.Co.'],
    subtopics: ['Convocatoria irregular', 'Representación indebida'],
    aliases: [
      'Reconocimiento de presupuestos de ineficacia',
      'Ineficacia de Decisiones Sociales',
      'Ineficacia de decisiones sociales',
      'Ineficacia',
      'Declaratoria de ineficacia',
      'Presupuestos de ineficacia',
    ],
    icon: HelpCircle,
  },
  {
    code: 'AS.03',
    slug: 'impugnacion',
    label: 'Impugnación de decisiones sociales',
    description:
      'Acciones que demandan la nulidad absoluta, nulidad relativa o inoponibilidad de las decisiones tomadas por la Asamblea General o la Junta Directiva.',
    legalBasis: ['Art. 24 num. 2 CGP', 'Art. 191 C.Co.'],
    subtopics: ['Falta de convocatoria', 'Quórum o mayorías insuficientes', 'Decisiones fuera del objeto social'],
    aliases: [
      'Impugnación de decisiones sociales',
      'Nulidad o Inexistencia de Decisiones',
      'Nulidad de decisiones sociales',
      'Impugnación de Actos de Asamblea',
      'Nulidad de asamblea',
      'Inexistencia de decisiones',
      'Impugnación de actas',
    ],
    icon: FileCheck,
  },
  {
    code: 'AS.04',
    slug: 'disputas_societarias',
    label: 'Disputas societarias',
    description:
      'Controversias generales entre socios o con la compañía relativas al desarrollo del contrato social y los estatutos.',
    legalBasis: ['Art. 24 num. 5.d CGP'],
    subtopics: ['Conflicto de socios', 'Distribución de utilidades', 'Derecho de inspección'],
    aliases: [
      'Disputas societarias',
      'Conflictos Societarios (Residual)',
      'Conflictos societarios',
      'Conflicto entre socios',
      'Controversia societaria',
      'Conflictos Societarios y Derechos del Socio',
      'Conflictos societarios generales',
    ],
    icon: LayoutGrid,
  },
  {
    code: 'AS.05',
    slug: 'responsabilidad_administradores',
    label: 'Responsabilidad de administradores',
    description:
      'Acciones dirigidas a directores, gerentes o liquidadores por incumplimiento de deberes fiduciarios (Art 23, 24 Ley 222/1995).',
    legalBasis: ['Art. 24 num. 5.b CGP', 'Art. 25 Ley 222/1995'],
    subtopics: [
      'Conflictos de interés',
      'Usurpación de oportunidades corporativas',
      'Apropiación de activos de la sociedad',
      'Extralimitación de funciones',
    ],
    aliases: [
      'Responsabilidad de administradores',
      'Responsabilidad de Administradores',
      'Responsabilidad civil de administradores',
      'Acción Social de Responsabilidad',
      'Acción social de responsabilidad',
      'Accion social de responsabilidad',
      'Responsabilidad Civil de Administradores',
    ],
    icon: Users,
  },
  {
    code: 'AS.06',
    slug: 'desestimacion_personalidad',
    label: 'Desestimación de la personalidad jurídica',
    description:
      'Desconocimiento de la estructura societaria cuando se utiliza en fraude a la ley o en perjuicio de terceros (Art 42 Ley 1258/2008).',
    legalBasis: ['Art. 42 Ley 1258/2008'],
    subtopics: ['Fraude a la ley', 'Inoponibilidad de la personalidad jurídica'],
    aliases: [
      'Desestimación de la personalidad jurídica',
      'Desestimación de la Personalidad Jurídica',
      'Levantamiento del velo corporativo',
      'Levantamiento de Velo Corporativo',
      'Velo corporativo',
    ],
    icon: Book,
  },
  {
    code: 'AS.07',
    slug: 'designacion_peritos',
    label: 'Designación de peritos',
    description: 'Nombramiento de peritos para avalúos en supuestos de discrepancia o derecho de retiro.',
    legalBasis: ['Art. 24 num. 3 CGP'],
    subtopics: ['Avalúo de acciones', 'Derecho de retiro'],
    aliases: ['Designación de peritos', 'Nombramiento de peritos', 'Avalúo de acciones'],
    icon: Gavel,
  },
  {
    code: 'AS.08',
    slug: 'disolucion',
    label: 'Disputas sobre causales de disolución',
    description: 'Debates sobre la ocurrencia, reconocimiento o enervamiento de causales de disolución.',
    legalBasis: ['Art. 24 num. 4 CGP'],
    subtopics: ['Pérdidas que reducen el patrimonio', 'Imposibilidad de desarrollar el objeto social'],
    aliases: [
      'Disputas sobre causales de disolución',
      'Causales de disolución',
      'Disolución societaria',
      'Reconocimiento de causal de disolución',
    ],
    icon: AlertTriangle,
  },
  {
    code: 'AS.09',
    slug: 'cumplimiento_acuerdos',
    label: 'Cumplimiento de acuerdos de accionistas',
    description:
      'Exigir el cumplimiento específico de las obligaciones contenidas en un acuerdo de accionistas depositado (Art 24 Ley 1258/2008).',
    legalBasis: ['Art. 24 num. 5.a CGP', 'Art. 70 Ley 222/1995'],
    subtopics: ['Ejecución de acuerdos de voto', 'Ejecución de derechos de arrastre / acompañamiento'],
    aliases: [
      'Cumplimiento específico de acuerdos de accionistas',
      'Cumplimiento de acuerdos de accionistas',
      'Ejecución de acuerdos parasociales',
      'Acuerdo de accionistas',
      'Pacto parasocial',
    ],
    icon: Briefcase,
  },
  {
    code: 'AS.10',
    slug: 'responsabilidad_socios_liquidadores',
    label: 'Responsabilidad de socios y liquidadores',
    description:
      'Acciones para hacer efectiva la responsabilidad solidaria y subsidiaria de socios o liquidadores.',
    legalBasis: ['Art. 24 num. 5.c CGP', 'Art. 36 Ley 1258/2008'],
    subtopics: ['Responsabilidad subsidiaria', 'Liquidación irregular'],
    aliases: [
      'Responsabilidad de socios y liquidadores',
      'Responsabilidad de liquidadores',
      'Responsabilidad subsidiaria de socios',
    ],
    icon: UserX,
  },
  {
    code: 'AS.11',
    slug: 'oposicion_reactivacion',
    label: 'Oposición a reactivación societaria',
    description:
      'Oposición formulada por acreedores o terceros frente a la decisión de reactivar una compañía en liquidación.',
    legalBasis: ['Art. 24 num. 6 CGP', 'Art. 29 Ley 1429/2010'],
    subtopics: ['Oposición de acreedores', 'Oposición de terceros'],
    aliases: [
      'Oposición a la reactivación de sociedades o sucursales',
      'Oposición a reactivación',
      'Reactivación societaria',
    ],
    icon: Activity,
  },
  {
    code: 'AS.12',
    slug: 'conflicto_intereses',
    label: 'Conflicto de intereses de administradores',
    description:
      'Acción por operaciones con vinculados o autocontratación sin autorización previa del órgano competente.',
    legalBasis: ['Art. 23 num. 7 Ley 222/1995', 'Decreto 1925/2009'],
    subtopics: ['Operaciones con vinculados', 'Autocontratación sin autorización'],
    aliases: [
      'Conflicto de intereses de administradores',
      'Conflicto de Intereses',
      'Operaciones con vinculados',
      'Autocontratación sin autorización',
    ],
    icon: ShieldAlert,
  },
  {
    code: 'AS.13',
    slug: 'responsabilidad_matrices',
    label: 'Responsabilidad de matrices y controlantes',
    description:
      'Acción contra la sociedad matriz o controlante por obligaciones de la subordinada.',
    legalBasis: ['Art. 61 Ley 1116/2006', 'Art. 265 C.Co.'],
    subtopics: ['Abuso de control', 'Confusión patrimonial'],
    aliases: [
      'Responsabilidad de Matrices / Grupos',
      'Responsabilidad de matrices',
      'Responsabilidad del controlante',
      'Abuso de control',
      'Responsabilidad de grupos',
    ],
    icon: Building2,
  },
  {
    code: 'AS.14',
    slug: 'ejecucion_pactos',
    label: 'Ejecución de pactos parasociales',
    description:
      'Ejecución de obligaciones de pactos entre socios no depositados como acuerdo de accionistas.',
    legalBasis: ['Art. 70 Ley 222/1995'],
    subtopics: ['Pacto parasocial no depositado'],
    aliases: [
      'Ejecución de pactos parasociales',
      'Pacto parasocial no depositado',
    ],
    icon: Handshake,
  },
  {
    code: 'AS.15',
    slug: 'clausula_compromisoria',
    label: 'Cláusula compromisoria',
    description:
      'Incidentes o pronunciamientos sobre la existencia, validez o alcance de una cláusula compromisoria en estatutos sociales.',
    legalBasis: ['Art. 24 CGP', 'Art. 116 Constitución'],
    subtopics: ['Excepción de cláusula compromisoria', 'Cláusula patológica', 'Competencia arbitral'],
    aliases: [
      'Cláusula compromisoria',
      'Clausula compromisoria',
      'Cláusula Compromisoria',
      'Cláusula compromisoria patológica',
      'Excepción de cláusula compromisoria',
    ],
    icon: Gavel,
  },
  {
    code: 'AS.99',
    slug: 'requiere_revision',
    label: 'Requiere revisión manual',
    description: 'Sentencia cuyo tipo de acción no pudo ser determinado automáticamente.',
    legalBasis: [],
    subtopics: [],
    aliases: [
      'Requiere Revisión Manual',
      'Otra',
      'No identificado',
      'N/A',
      'INDETERMINADO',
      'Otro',
    ],
    icon: FileQuestion,
  },
];

// ─── Lookup maps (built once at module load) ────────────────────────────────

/** Map from AS code to definition */
export const ACTION_TYPE_BY_CODE: Record<string, ActionTypeDefinition> = {};
for (const at of ACTION_TYPES) {
  ACTION_TYPE_BY_CODE[at.code] = at;
}

/** Map from lowercase alias/label to AS code */
const ALIAS_MAP: Record<string, string> = {};
for (const at of ACTION_TYPES) {
  ALIAS_MAP[at.label.toLowerCase()] = at.code;
  for (const alias of at.aliases) {
    ALIAS_MAP[alias.toLowerCase()] = at.code;
  }
}

// ─── Canonicalize function ──────────────────────────────────────────────────

/**
 * Converts any raw actionType string (from Gemini, upload forms, old data)
 * into the canonical label. If not recognized, returns AS.99.
 */
export function canonicalize(raw: string | null | undefined): { code: string; label: string } {
  if (!raw || raw.trim().length === 0) {
    return { code: 'AS.99', label: 'Requiere revisión manual' };
  }
  const key = raw.trim().toLowerCase();
  const code = ALIAS_MAP[key];
  if (code) {
    return { code, label: ACTION_TYPE_BY_CODE[code].label };
  }
  return { code: 'AS.99', label: 'Requiere revisión manual' };
}

// ─── Serie RN: Razones de Negación de Pretensiones (v1.1) ───────────────────
// Derivada empíricamente de 120 sentencias "Demandado prevalece", 396 argumentos
// desestimados, y 638 claims. Frecuencias calculadas sobre argumentos desestimados,
// no sobre casos — un caso puede portar múltiples RN.

export interface DenialReasonDefinition {
  code: string;
  label: string;
  definition: string;
  priorityRule?: string;
}

export const DENIAL_REASONS: DenialReasonDefinition[] = [
  {
    code: 'RN.01',
    label: 'Insuficiencia probatoria',
    definition:
      'La parte no cumplió la carga de la prueba para acreditar los hechos constitutivos o la conducta reprochada.',
  },
  {
    code: 'RN.02',
    label: 'Improcedencia de la vía o acción',
    definition:
      'La pretensión se canalizó por una acción que no corresponde al supuesto fáctico.',
    priorityRule:
      'Prioridad sobre RN.09 cuando el error en calificación jurídica determinó la elección de la acción incorrecta.',
  },
  {
    code: 'RN.03a',
    label: 'Cláusula compromisoria',
    definition:
      'Desplazamiento convencional de jurisdicción a tribunal arbitral por existir cláusula compromisoria vigente en estatutos.',
  },
  {
    code: 'RN.03b',
    label: 'Falta de competencia por materia',
    definition:
      'La Supersociedades se declara incompetente por no corresponderle la materia en controversia.',
  },
  {
    code: 'RN.04a',
    label: 'Prescripción extintiva',
    definition:
      'La acción fue interpuesta después del término de prescripción legal (típicamente 5 años, Art. 235 Ley 222/1995).',
  },
  {
    code: 'RN.04b',
    label: 'Caducidad de la acción',
    definition:
      'La acción fue interpuesta fuera del plazo de caducidad (típicamente 2 meses para impugnación, Art. 191 C.Co.).',
  },
  {
    code: 'RN.05',
    label: 'Falta de legitimación en la causa',
    definition:
      'El demandante no ostenta la calidad jurídica necesaria para formular la pretensión.',
  },
  {
    code: 'RN.06',
    label: 'Ausencia de nexo causal o perjuicio',
    definition:
      'Aun cuando la conducta reprochada fue acreditada o no fue objeto de controversia, la parte no demostró el daño patrimonial ni el nexo de causalidad entre la actuación y el perjuicio alegado.',
  },
  {
    code: 'RN.07',
    label: 'Saneamiento, ratificación o convalidación',
    definition:
      'El vicio existió pero fue subsanado por acto posterior (quórum universal, ratificación expresa, consentimiento tácito).',
  },
  {
    code: 'RN.08',
    label: 'Conducta no configura el supuesto legal',
    definition:
      'Los hechos probados no encuadran en el tipo legal invocado (el abuso no se configuró, el conflicto de interés no existía, la decisión no excedió los estatutos).',
  },
  {
    code: 'RN.09',
    label: 'Error en la calificación jurídica',
    definition:
      'La parte invocó la norma sustantiva equivocada o confundió figuras jurídicas.',
    priorityRule:
      'Aplica cuando el error NO determinó la elección de la acción — si la determinó, aplica RN.02.',
  },
  {
    code: 'RN.10',
    label: 'Cosa juzgada o litispendencia',
    definition:
      'Existe pronunciamiento judicial previo con identidad de partes, objeto y causa, o el proceso está pendiente ante otro juez.',
  },
  {
    code: 'RN.11',
    label: 'Defecto formal de la demanda',
    definition:
      'Inepta demanda, falta de integración del litisconsorcio necesario, indebida acumulación de pretensiones.',
  },
];

export const DENIAL_REASON_BY_CODE: Record<string, DenialReasonDefinition> = {};
for (const dr of DENIAL_REASONS) {
  DENIAL_REASON_BY_CODE[dr.code] = dr;
}

export const VALID_DENIAL_CODES = new Set(DENIAL_REASONS.map(dr => dr.code));

// ─── Reclassifier map for upload/route.ts deep classification ───────────────

/**
 * Maps TIPO_1..TIPO_7 from the existing classification prompt
 * to canonical labels.
 */
export const DEEP_CLASSIFICATION_MAP: Record<string, string> = {
  'TIPO_1': 'Reconocimiento de presupuestos de ineficacia',   // AS.02
  'TIPO_2': 'Impugnación de decisiones sociales',             // AS.03
  'TIPO_3': 'Responsabilidad de administradores',             // AS.05
  'TIPO_4': 'Desestimación de la personalidad jurídica',      // AS.06
  'TIPO_5': 'Cláusula compromisoria',                          // AS.15
  'TIPO_6': 'Disputas societarias',                           // AS.04
  'TIPO_7': 'Responsabilidad de matrices y controlantes',     // AS.13
  'TIPO_8': 'Abuso del derecho de voto',                      // AS.01
  'TIPO_9': 'Designación de peritos',                         // AS.07
  'TIPO_10': 'Disputas sobre causales de disolución',         // AS.08
  'TIPO_11': 'Cumplimiento de acuerdos de accionistas',       // AS.09
  'TIPO_12': 'Responsabilidad de socios y liquidadores',      // AS.10
  'TIPO_13': 'Oposición a reactivación societaria',           // AS.11
  'TIPO_14': 'Conflicto de intereses de administradores',     // AS.12
  'TIPO_15': 'Ejecución de pactos parasociales',              // AS.14
  'INDETERMINADO': 'Requiere revisión manual',                // AS.99
};
