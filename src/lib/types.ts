// Canonical action types derived from taxonomy.ts (Serie AS)
// See: taxonomia_sentencias_supersociedades_v1.0.md
export type ActionType =
  | 'Abuso del derecho de voto'                           // AS.01
  | 'Reconocimiento de presupuestos de ineficacia'        // AS.02
  | 'Impugnación de decisiones sociales'                  // AS.03
  | 'Disputas societarias'                                // AS.04
  | 'Responsabilidad de administradores'                  // AS.05
  | 'Desestimación de la personalidad jurídica'           // AS.06
  | 'Designación de peritos'                              // AS.07
  | 'Disputas sobre causales de disolución'               // AS.08
  | 'Cumplimiento de acuerdos de accionistas'             // AS.09
  | 'Responsabilidad de socios y liquidadores'            // AS.10
  | 'Oposición a reactivación societaria'                 // AS.11
  | 'Conflicto de intereses de administradores'           // AS.12
  | 'Responsabilidad de matrices y controlantes'          // AS.13
  | 'Ejecución de pactos parasociales'                    // AS.14
  | 'Requiere revisión manual';                           // AS.99

export type GeneralOutcome = 'Demandante prevalece' | 'Demandado prevalece' | 'Mixto/Parcial' | 'Desestimado' | 'Transado';

export interface Party {
  id?: string;
  name: string;
  role: string;
  type: string;
}

export interface Claim {
  id?: string;
  type: string;
  text: string;
  requestedRemedy: string;
}

export interface Remedy {
  id?: string;
  type: string;
  granted: boolean;
  detail?: string;
}

export interface Authority {
  id?: string;
  normType: string;
  citationText: string;
  articleNumber?: string;
}

export interface StrategicFlags {
  standingDiscussed: boolean;
  jurisdictionDiscussed: boolean;
  highEvidentiaryBurden: boolean;
  highestBodyAuthorization: boolean;
  shareholderAgreementDeposit: boolean;
  interimRelief: boolean;
}

export interface Case {
  id: string;
  caseName: string;
  sourceReference: string;
  sourceUrl?: string;
  filingDate: string;
  decisionDate: string;
  duration: string;
  year: number;
  office: string;
  actionType: ActionType;
  subtopic: string[];
  summary: string;
  factualBackground: string;
  legalIssue: string;
  proceduralTrack: string;
  outcomeGeneral: GeneralOutcome;
  outcomeDetailed: string;
  parties: Party[];
  claims: Claim[];
  remedies: Remedy[];
  authorities: Authority[];
  strategicFlags: StrategicFlags;
}
