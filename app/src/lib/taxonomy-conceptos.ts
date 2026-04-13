/**
 * Taxonomía de Conceptos Jurídicos — Serie TX.SOC
 * Fuente de verdad: taxonomia_conceptos_supersociedades_v2.0.md
 * Corpus: 12,758 conceptos jurídicos clasificados
 */

export interface ConceptoCategoryDefinition {
  code: string;
  label: string;
  description: string;
  normatividad: string[];
  count: number;  // from classification run
  pct: number;
  /** Maps to AS.XX sentencias codes where applicable */
  relatedAS: string[];
}

export const CONCEPTO_CATEGORIES: ConceptoCategoryDefinition[] = [
  {
    code: 'TX.SOC.01',
    label: 'Inspección, vigilancia y control',
    description: 'Funciones, competencias y facultades de la Superintendencia de Sociedades.',
    normatividad: ['Ley 222/1995 Art. 82-86', 'Decreto 1023/2012'],
    count: 1892, pct: 14.8,
    relatedAS: [],
  },
  {
    code: 'TX.SOC.02',
    label: 'Insolvencia',
    description: 'Reorganización empresarial (Ley 1116), liquidación judicial, régimen Ley 550, concordatos.',
    normatividad: ['Ley 1116/2006', 'Ley 550/1999', 'Decreto 560/2020'],
    count: 1471, pct: 11.5,
    relatedAS: [],
  },
  {
    code: 'TX.SOC.03',
    label: 'Socios y accionistas',
    description: 'Derechos de socios, cesión de cuotas, inspección, exclusión, retiro, preferencia.',
    normatividad: ['C.Co. Art. 363-382', 'Ley 1258/2008 Art. 13-22'],
    count: 1120, pct: 8.8,
    relatedAS: ['AS.04', 'AS.09'],
  },
  {
    code: 'TX.SOC.04',
    label: 'Disolución y liquidación',
    description: 'Causales de disolución, enervatoria, liquidación voluntaria/judicial, reactivación.',
    normatividad: ['C.Co. Art. 218-233', 'Ley 1258/2008 Art. 34-35'],
    count: 1452, pct: 11.4,
    relatedAS: ['AS.08', 'AS.10', 'AS.11'],
  },
  {
    code: 'TX.SOC.05',
    label: 'Órganos sociales',
    description: 'Asamblea general, junta directiva, representante legal, quórum, actas, convocatoria.',
    normatividad: ['C.Co. Art. 181-198', 'Ley 222/1995 Art. 18-27'],
    count: 1198, pct: 9.4,
    relatedAS: ['AS.02', 'AS.03'],
  },
  {
    code: 'TX.SOC.06',
    label: 'Tipos societarios',
    description: 'SAS, SA, Ltda, EU, SCA, sucursales extranjeras, constitución, requisitos.',
    normatividad: ['Ley 1258/2008', 'C.Co. Libro II'],
    count: 1145, pct: 9.0,
    relatedAS: [],
  },
  {
    code: 'TX.SOC.07',
    label: 'Reformas estatutarias',
    description: 'Fusión, escisión, transformación, aumento/disminución de capital.',
    normatividad: ['C.Co. Art. 167-180', 'Ley 222/1995 Art. 4-11'],
    count: 672, pct: 5.3,
    relatedAS: [],
  },
  {
    code: 'TX.SOC.08',
    label: 'Capital y aportes',
    description: 'Aportes en especie, acciones, cuotas, prima de emisión, colocación.',
    normatividad: ['C.Co. Art. 110-149', 'Ley 1258/2008 Art. 5-9'],
    count: 912, pct: 7.1,
    relatedAS: [],
  },
  {
    code: 'TX.SOC.09',
    label: 'Administradores',
    description: 'Deberes de diligencia y lealtad, responsabilidad, conflicto de intereses, inhabilidades.',
    normatividad: ['Ley 222/1995 Art. 23-25', 'Decreto 1925/2009'],
    count: 640, pct: 5.0,
    relatedAS: ['AS.05', 'AS.12'],
  },
  {
    code: 'TX.SOC.10',
    label: 'Grupos empresariales',
    description: 'Situaciones de control, subordinación, grupo empresarial, consolidación contable.',
    normatividad: ['Ley 222/1995 Art. 26-33', 'C.Co. Art. 260-265'],
    count: 303, pct: 2.4,
    relatedAS: ['AS.13'],
  },
  {
    code: 'TX.SOC.11',
    label: 'Contratación comercial',
    description: 'Contratos mercantiles, fiducia, garantías mobiliarias, contratos de colaboración.',
    normatividad: ['C.Co. Libro IV'],
    count: 358, pct: 2.8,
    relatedAS: [],
  },
  {
    code: 'TX.SOC.12',
    label: 'Revisor fiscal',
    description: 'Nombramiento, funciones, inhabilidades, obligatoriedad.',
    normatividad: ['Ley 43/1990', 'C.Co. Art. 203-217'],
    count: 261, pct: 2.0,
    relatedAS: [],
  },
  {
    code: 'TX.SOC.13',
    label: 'Utilidades y dividendos',
    description: 'Distribución de utilidades, reservas legales y estatutarias, dividendos.',
    normatividad: ['C.Co. Art. 149-157', 'Ley 222/1995 Art. 37-41'],
    count: 270, pct: 2.1,
    relatedAS: ['AS.04'],
  },
  {
    code: 'TX.SOC.14',
    label: 'Libros y contabilidad',
    description: 'Libros de comercio, estados financieros, adopción NIIF/IFRS.',
    normatividad: ['C.Co. Art. 48-74', 'Ley 1314/2009'],
    count: 279, pct: 2.2,
    relatedAS: [],
  },
  {
    code: 'TX.SOC.15',
    label: 'Procedimiento',
    description: 'Acciones judiciales societarias, impugnación, conciliación, competencia jurisdiccional.',
    normatividad: ['CGP Art. 24', 'Ley 1258/2008 Art. 40-45'],
    count: 178, pct: 1.4,
    relatedAS: ['AS.01', 'AS.02', 'AS.03', 'AS.06'],
  },
  {
    code: 'TX.SOC.16',
    label: 'Entidades sin ánimo de lucro',
    description: 'ESAL, fundaciones, asociaciones, cooperativas bajo vigilancia de Supersociedades.',
    normatividad: ['Decreto 2150/1995', 'Decreto 427/1996'],
    count: 93, pct: 0.7,
    relatedAS: [],
  },
  {
    code: 'TX.SOC.17',
    label: 'Régimen cambiario',
    description: 'Inversión extranjera, régimen de cambios internacionales.',
    normatividad: ['Decreto 2080/2000', 'Ley 9/1991'],
    count: 187, pct: 1.5,
    relatedAS: [],
  },
  {
    code: 'TX.SOC.18',
    label: 'Registro mercantil',
    description: 'Matrícula mercantil, inscripción de actos, certificados.',
    normatividad: ['C.Co. Art. 26-47', 'Decreto 898/2002'],
    count: 152, pct: 1.2,
    relatedAS: [],
  },
  {
    code: 'TX.SOC.19',
    label: 'Propiedad intelectual',
    description: 'Marcas, nombres comerciales, enseñas — cuando involucran sociedades.',
    normatividad: ['Decisión Andina 486'],
    count: 21, pct: 0.2,
    relatedAS: [],
  },
  {
    code: 'TX.SOC.20',
    label: 'Otro',
    description: 'Conceptos que no encajan en ninguna categoría anterior.',
    normatividad: [],
    count: 121, pct: 0.9,
    relatedAS: [],
  },
];

/** Lookup by code */
export const CONCEPTO_BY_CODE: Record<string, ConceptoCategoryDefinition> = {};
for (const cat of CONCEPTO_CATEGORIES) {
  CONCEPTO_BY_CODE[cat.code] = cat;
}

/** Get category label from code */
export function getConceptoLabel(code: string): string {
  return CONCEPTO_BY_CODE[code]?.label ?? 'Desconocido';
}
