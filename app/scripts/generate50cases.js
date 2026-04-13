const fs = require('fs');
const path = require('path');

// Canonical action types (Serie AS) — see taxonomia_sentencias_supersociedades_v1.0.md
const actionTypes = [
  'Responsabilidad de administradores',           // AS.05
  'Abuso del derecho de voto',                     // AS.01
  'Desestimación de la personalidad jurídica',     // AS.06
  'Impugnación de decisiones sociales',            // AS.03
  'Cumplimiento de acuerdos de accionistas',       // AS.09
  'Reconocimiento de presupuestos de ineficacia',  // AS.02
  'Disputas societarias',                          // AS.04
];

const subtopicsMap = {
  'Responsabilidad de administradores': ['Conflictos de interés', 'Usurpación de oportunidades corporativas', 'Apropiación de activos de la sociedad', 'Extralimitación de funciones', 'Negligencia', 'Pérdida de libros corporativos'],
  'Abuso del derecho de voto': ['Abuso de mayoría', 'Abuso de minoría', 'Abuso de paridad', 'Veto injustificado', 'Expulsión de accionistas'],
  'Desestimación de la personalidad jurídica': ['Fraude a la ley', 'Inoponibilidad de la personalidad jurídica'],
  'Impugnación de decisiones sociales': ['Falta de convocatoria', 'Quórum o mayorías insuficientes', 'Decisiones fuera del objeto social'],
  'Cumplimiento de acuerdos de accionistas': ['Ejecución de acuerdos de voto', 'Ejecución de derechos de arrastre / acompañamiento'],
  'Reconocimiento de presupuestos de ineficacia': ['Convocatoria irregular', 'Representación indebida'],
  'Disputas societarias': ['Conflicto de socios', 'Distribución de utilidades', 'Derecho de inspección'],
};

const outcomes = ['Demandante prevalece', 'Demandado prevalece', 'Mixto/Parcial'];
const normTypes = ['Ley', 'Decreto', 'Contrato'];

const companies = ['Inversiones Omega S.A.S.', 'TechAndes S.A.', 'Constructora Valle S.A.S.', 'Agropecuaria El Sol', 'Logistica Norte', 'Textiles del Caribe', 'Capital Ventures S.A.', 'Distribuidora Central S.A.S.', 'Comercializadora Pacífico', 'Servicios Integrados S.A.', 'Innovación Tecnológica S.A.S.', 'Desarrollos Inmobiliarios S.A.', 'Consultoría Avanzada S.A.S.'];
const people = ['Juan Pérez', 'Patricia Gomez', 'Carlos Restrepo', 'Martin Suarez', 'Andrés Londoño', 'María Fernanda Ruiz', 'Luis Alberto Torres', 'Junta Directiva', 'Ex Gerente', 'Sindicato Proveedores', 'Hermanos Minoritarios'];

function randomArrayElt(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

let generatedId = 100;
const cases = [];

for (let i = 0; i < 100; i++) {
  const caseId = `case-${2020 + (i % 5)}-${('' + generatedId++).padStart(3, '0')}`;
  const actionType = randomArrayElt(actionTypes);
  const possibleSubtopics = subtopicsMap[actionType];
  const numSubs = Math.max(1, Math.floor(Math.random() * 3));
  const selectedSubtopics = Array.from(new Set(Array(numSubs).fill().map(() => randomArrayElt(possibleSubtopics))));
  
  const c1 = randomArrayElt(companies);
  let c2 = randomArrayElt(companies);
  while(c1 === c2) c2 = randomArrayElt(companies);
  const p1 = Math.random() > 0.5 ? c1 : randomArrayElt(people);
  const p2 = Math.random() > 0.5 ? c2 : randomArrayElt(people);
  
  const year = 2020 + Math.floor(Math.random() * 5);
  const filingDateObj = randomDate(new Date(year - 2, 0, 1), new Date(year, Math.random() * 11, 1));
  const decisionDateObj = randomDate(filingDateObj, new Date(year, 11, 31));
  
  const filingDate = filingDateObj.toISOString().split('T')[0];
  const decisionDate = decisionDateObj.toISOString().split('T')[0];
  
  // Calculate duration in months
  const durationMonths = (decisionDateObj.getFullYear() - filingDateObj.getFullYear()) * 12 + (decisionDateObj.getMonth() - filingDateObj.getMonth());
  const formattedDuration = `${Math.max(1, durationMonths)} meses`;

  const outcomeGeneral = randomArrayElt(outcomes);
  const plaintiffWin = outcomeGeneral === 'Demandante prevalece';
  
  cases.push({
    id: caseId,
    caseName: `${p1} vs. ${p2}`,
    sourceReference: `Sentencia ${year}-${Math.floor(Math.random() * 12 + 1).toString().padStart(2, '0')}-0${Math.floor(Math.random() * 900 + 100)}`,
    decisionDate,
    filingDate,
    duration: formattedDuration,
    year,
    office: 'Delegatura para Procedimientos Mercantiles',
    actionType,
    subtopic: selectedSubtopics,
    summary: `Demanda vinculada a ${actionType.toLowerCase()} iniciada por ${p1}. El asunto clave versaba sobre ${selectedSubtopics.join(' y ')}. El tribunal falló: ${outcomeGeneral.toLowerCase()}.`,
    factualBackground: `En ${filingDateObj.getFullYear()}, ${p1} descubrió irregularidades en el manejo de la sociedad que afectaban la gestión y el patrimonio. Los hechos involucran particularmente una falta de diligencia por parte de ${p2} respecto a ${selectedSubtopics[0] || 'sus funciones'}.`,
    legalIssue: `¿Configura el comportamiento de ${p2} una violación a los estatutos aplicables a ${actionType.toLowerCase()}?`,
    proceduralTrack: 'Proceso Verbal Sumario',
    outcomeGeneral,
    outcomeDetailed: `${outcomeGeneral}. Las pruebas condujeron a una ${plaintiffWin ? 'condena' : 'absolución'} sobre los cargos de ${selectedSubtopics[0] || 'irregularidades'}.`,
    parties: [
      { id: `p${i}a`, name: p1.toString(), role: 'Demandante', type: ['S.A.S.', 'S.A.'].some(s => p1.includes(s)) ? 'Sociedad' : 'Individuo' },
      { id: `p${i}b`, name: p2.toString(), role: 'Demandado', type: ['S.A.S.', 'S.A.'].some(s => p2.includes(s)) ? 'Sociedad' : 'Administrador' }
    ],
    claims: [
      { id: `c${i}a`, type: 'Perjuicios', text: 'Indemnización por daño emergente.', requestedRemedy: 'Daños monetarios' }
    ],
    remedies: [
      { id: `r${i}a`, type: 'Daños', granted: plaintiffWin, detail: plaintiffWin ? `Otorgado COP ${(Math.random() * 500 + 10).toFixed(0)}M.` : 'Pruebas insuficientes.' }
    ],
    authorities: [
      { id: `a${i}a`, normType: 'Ley', citationText: 'Ley 1258 de 2008', articleNumber: `${Math.floor(Math.random() * 45 + 1)}` }
    ],
    strategicFlags: {
      standingDiscussed: Math.random() > 0.7,
      jurisdictionDiscussed: Math.random() > 0.8,
      highEvidentiaryBurden: Math.random() > 0.5,
      highestBodyAuthorization: Math.random() > 0.7,
      shareholderAgreementDeposit: Math.random() > 0.9,
      interimRelief: Math.random() > 0.6
    }
  });
}

const fileContent = `import { Case } from './types';

export const mockCases: Case[] = ${JSON.stringify(cases, null, 2)};
`;

fs.writeFileSync(path.join(__dirname, '../src/lib/mockData.ts'), fileContent, 'utf8');
console.log('Successfully generated 50 cases in mockData.ts');
