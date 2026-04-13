import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';
import { put } from '@vercel/blob';
import { canonicalize, DEEP_CLASSIFICATION_MAP } from '@/lib/taxonomy';
import { prisma } from '@/lib/prisma';
import { requireAuth, isAuthError, safeErrorResponse } from '@/lib/auth-guard';

// Claude for extraction (higher quality), Gemini for embeddings only
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const embedModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });

const CLASSIFICATION_PROMPT = `
Eres un Clasificador Legal Experto en litigio societario colombiano ante la Delegatura de 
Procedimientos Mercantiles de la Superintendencia de Sociedades. Tu única misión es leer el 
texto de una providencia y determinar con precisión el TIPO DE ACCIÓN que la origina.

CONTEXTO CRÍTICO:
Muchas providencias no declaran el tipo de acción en su encabezado — solo dicen "Artículo 24 
del Código General del Proceso", que es la mera base jurisdiccional, no el tipo de acción 
sustantiva. En esos casos, DEBES deducir el tipo de acción leyendo las PRETENSIONES de la 
demanda y las CONSIDERACIONES del juez.

═══════════════════════════════════════════════════════════════════════
TAXONOMÍA DE ACCIONES — DEFINICIONES Y MARCADORES LINGÜÍSTICOS
═══════════════════════════════════════════════════════════════════════

TIPO 1 — INEFICACIA DE DECISIONES SOCIALES
──────────────────────────────────────────
DEFINICIÓN: Acción para que se declare que una decisión de asamblea o junta carece de efectos 
jurídicos ipso iure por haber sido adoptada con vicios de procedimiento (convocatoria, quórum, 
o participación del interesado). El vicio hace la decisión ineficaz de pleno derecho, sin 
necesidad de impugnación judicial; pero la parte pide al juez que la declare.

MARCADORES LINGÜÍSTICOS: "declarar ineficaz", "ineficacia de pleno derecho", "ipso iure", "voto del interesado", "falta de convocatoria".

TIPO 2 — NULIDAD ABSOLUTA O RELATIVA DE DECISIONES SOCIALES / INEXISTENCIA
─────────────────────────────────────────────────────────────────────────────
DEFINICIÓN: Acción de impugnación de decisiones sociales por vicios de fondo que afectan la 
validez sustantiva del acto (dolo, fraude, violación de norma imperativa, abuso del derecho 
de voto). También cubre inexistencia cuando la reunión nunca ocurrió.

MARCADORES LINGÜÍSTICOS: "declarar nula(s) las decisiones", "abuso del derecho de voto", "inexistencia de la reunión", "violación de norma imperativa".

TIPO 3 — RESPONSABILIDAD CIVIL DE ADMINISTRADORES
───────────────────────────────────────────────────
DEFINICIÓN: Acción de responsabilidad (social o individual) contra administradores 
(gerentes, representantes legales, miembros de junta directiva) por incumplimiento de sus 
deberes de diligencia y lealtad, causando perjuicios a la sociedad o a terceros.

MARCADORES LINGÜÍSTICOS: "acción social de responsabilidad", "deber de lealtad", "conflicto de interés", "incumplimiento de los deberes del cargo".

TIPO 4 — DESESTIMACIÓN DE LA PERSONALIDAD JURÍDICA (Levantamiento del Velo)
──────────────────────────────────────────────────────────────────────────────
DEFINICIÓN: Acción para que el juez declare inoponible la separación patrimonial de la 
persona jurídica, extendiendo responsabilidad por pasivos sociales a socios o controlantes.

MARCADORES LINGÜÍSTICOS: "desestimación de la personalidad jurídica", "levantamiento del velo corporativo", "uso abusivo de la forma societaria".

TIPO 5 — CLÁUSULA COMPROMISORIA Y ARBITRAJE
─────────────────────────────────────────────
DEFINICIÓN: Incidentes o pronunciamientos sobre la existencia, validez o alcance de una 
cláusula compromisoria en estatutos sociales.

TIPO 6 — CONFLICTOS SOCIETARIOS Y DERECHOS DEL SOCIO
───────────────────────────────────────────────────────
DEFINICIÓN: Categoría residual para conflictos entre socios o entre socio y sociedad: disolución judicial, pago de dividendos, exclusión de socios.

TIPO 7 — RESPONSABILIDAD DE SOCIEDAD MATRIZ / GRUPOS EMPRESARIALES
────────────────────────────────────────────────────────────────────
DEFINICIÓN: Acción contra la sociedad matriz o controlante por los pasivos de la subordinada.

TIPO 8 — ABUSO DEL DERECHO DE VOTO
────────────────────────────────────
DEFINICIÓN: Ejercicio del poder de voto para dañar a la compañía, extraer beneficios privados o perjudicar a otros accionistas (Art 43 Ley 1258/2008).
MARCADORES LINGÜÍSTICOS: "abuso del derecho de voto", "abuso de mayoría", "abuso de minoría", "abuso de paridad".

TIPO 9 — DESIGNACIÓN DE PERITOS
─────────────────────────────────
DEFINICIÓN: Nombramiento de peritos para avalúos en supuestos de discrepancia o derecho de retiro.

TIPO 10 — DISPUTAS SOBRE CAUSALES DE DISOLUCIÓN
──────────────────────────────────────────────────
DEFINICIÓN: Debates sobre la ocurrencia, reconocimiento o enervamiento de causales de disolución.
MARCADORES LINGÜÍSTICOS: "causal de disolución", "pérdidas que reducen el patrimonio", "imposibilidad de desarrollar el objeto social".

TIPO 11 — CUMPLIMIENTO DE ACUERDOS DE ACCIONISTAS
────────────────────────────────────────────────────
DEFINICIÓN: Exigir cumplimiento específico de obligaciones en acuerdo de accionistas depositado (Art 24 Ley 1258/2008).
MARCADORES LINGÜÍSTICOS: "acuerdo de accionistas", "pacto parasocial depositado", "ejecución del acuerdo".

TIPO 12 — RESPONSABILIDAD DE SOCIOS Y LIQUIDADORES
─────────────────────────────────────────────────────
DEFINICIÓN: Acciones para hacer efectiva la responsabilidad solidaria y subsidiaria de socios o liquidadores.

TIPO 13 — OPOSICIÓN A REACTIVACIÓN SOCIETARIA
────────────────────────────────────────────────
DEFINICIÓN: Oposición formulada por acreedores o terceros frente a la decisión de reactivar una compañía en liquidación.

TIPO 14 — CONFLICTO DE INTERESES DE ADMINISTRADORES
──────────────────────────────────────────────────────
DEFINICIÓN: Acción por operaciones con vinculados o autocontratación sin autorización previa del órgano competente.
MARCADORES LINGÜÍSTICOS: "conflicto de intereses", "operaciones con vinculados", "autocontratación".

TIPO 15 — EJECUCIÓN DE PACTOS PARASOCIALES
────────────────────────────────────────────
DEFINICIÓN: Ejecución de obligaciones de pactos entre socios no depositados como acuerdo de accionistas.

═══════════════════════════════════════════════════════════════════════
ÁRBOL DE DECISIÓN PARA CASOS AMBIGUOS
═══════════════════════════════════════════════════════════════════════

PASO 1: ¿El demandado es administrador y la pretensión pide responsabilidad patrimonial? → TIPO 3
PASO 2: ¿La pretensión pide extender responsabilidad a socios/controlantes? → TIPO 4
PASO 3: ¿La pretensión ataca la FORMA (quórum, convocatoria)? → TIPO 1
PASO 4: ¿La pretensión invoca abuso del voto sin atacar validez del acta? → TIPO 8
PASO 5: ¿La pretensión invoca nulidad, fraude o inexistencia de decisiones? → TIPO 2
PASO 6: ¿La pretensión pide cumplimiento de acuerdo de accionistas depositado? → TIPO 11
PASO 7: ¿La pretensión pide ejecución de pacto parasocial NO depositado? → TIPO 15
PASO 8: ¿Involucra conflicto de intereses del administrador? → TIPO 14
PASO 9: ¿La pretensión ataca cesión de cuotas, dividendos, exclusión? → TIPO 6
PASO 10: Si no encaja → INDETERMINADO

═══════════════════════════════════════════════════════════════════════
FORMATO DE SALIDA OBLIGATORIO (JSON estricto)
═══════════════════════════════════════════════════════════════════════

Responde ÚNICAMENTE con el siguiente objeto JSON:

{
  "action_type": "<TIPO_1 | TIPO_2 | TIPO_3 | TIPO_4 | TIPO_5 | TIPO_6 | TIPO_7 | TIPO_8 | TIPO_9 | TIPO_10 | TIPO_11 | TIPO_12 | TIPO_13 | TIPO_14 | TIPO_15 | INDETERMINADO>",
  "confidence": "<high | medium | low>",
  "classification_note": "<Frase breve explicando el razonamiento>"
}
`;

export async function POST(req: NextRequest) {
  try {
    // Auth check — only authenticated users can upload
    const authResult = await requireAuth();
    if (isAuthError(authResult)) return authResult.error;

    console.log(`[Admin Upload] Invocando POST... parsing JSON...`);
    const { fileName, fileData } = await req.json();
    console.log(`[Admin Upload] JSON parsed exitosamente para: ${fileName}`);

    if (!fileData) {
      return NextResponse.json({ error: 'No se recibió el archivo' }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY || !process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'API Keys no configuradas (requiere ANTHROPIC_API_KEY + GEMINI_API_KEY).' }, { status: 500 });
    }

    // 0. Prevent duplicates & Handle Idempotency
    const existingCase = await prisma.case.findFirst({
      where: { sourceUrl: fileName }
    });

    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('mode') || 'SKIP';

    if (existingCase) {
      if (mode !== 'UPDATE') {
        console.log(`[Admin Upload] Archivo ya procesado previamente (Saltando): ${fileName}`);
        return NextResponse.json({ success: true, message: 'Archivo ya ingerido previamente', skipped: true, case: existingCase });
      } else {
        console.log(`[Admin Upload] Re-ingiriendo archivo existente (UPDATE): ${fileName}`);
        // Limpiamos viejas sub-entidades para no duplicar en el update
        await prisma.evidence.deleteMany({ where: { caseId: existingCase.id } });
        await prisma.legalArgument.deleteMany({ where: { caseId: existingCase.id } });
        await prisma.legalBasis.deleteMany({ where: { caseId: existingCase.id } });
        await prisma.factualPattern.deleteMany({ where: { caseId: existingCase.id } });
        await prisma.party.deleteMany({ where: { caseId: existingCase.id } });
        await prisma.claim.deleteMany({ where: { caseId: existingCase.id } });
        await prisma.authority.deleteMany({ where: { caseId: existingCase.id } });
        await prisma.strategicFlags.deleteMany({ where: { caseId: existingCase.id } });
      }
    }

    console.log(`[Admin Upload] Procesando archivo: ${fileName}`);

    // 1. Prepare PDF part for Gemini Multimodal
    const pdfPart = {
      inlineData: {
        data: fileData,
        mimeType: 'application/pdf',
      },
    };

    // 2. Dual Extraction Prompt
    const DUAL_EXTRACTION_PROMPT = `
Eres un abogado litigante colombiano experto en derecho societario con 20 años de experiencia ante la Superintendencia de Sociedades. Acabas de leer el PDF adjunto completo.

Vas a producir DOS outputs separados por el delimitador exacto: ===MARKDOWN===

OUTPUT 1 — JSON estructurado (antes del delimitador):
Extrae los datos jurídicos en el siguiente formato. Sé CONCRETO: nunca uses frases genéricas como "se verificaron requisitos formales". Siempre especifica QUÉ requisito, QUÉ prueba, QUÉ determinó la Supersociedades y POR QUÉ.

{
  "metadata": {
    "sourceReference": "radicado oficial exacto del encabezado — NUNCA el nombre del archivo. Ej: 'Auto n° 800-456 del 22 de julio de 2019'",
    "caseName": "Demandante vs. Demandado",
    "year": 2019,
    "actionType": "tipo exacto de acción societaria",
    "duration": 180,
    "outcomeGeneral": "DEMANDANTE_GANA | DEMANDADO_GANA | PARCIAL | INHIBITORIO",
    "plaintiffWin": true
  },
  "factualPattern": {
    "coreDispute": "2 oraciones máximo: qué disputaban y por qué llegaron a la Supersociedades. Incluye tipo de sociedad y acto societario impugnado.",
    "triggerEvent": "Hecho concreto con fecha. Ej: 'El 12 de marzo de 2018, el administrador convocó asamblea omitiendo notificar al socio con el 35% del capital.'",
    "corporateConfig": "Tipo de sociedad, distribución de capital, estructura de órganos si es relevante.",
    "keyFacts": [
      "Hecho material probado 1 — concreto y específico",
      "Hecho material probado 2"
    ],
    "contestedFacts": [
      "Hecho que el demandado disputó y cómo lo disputó"
    ],
    "timeline": "3-5 eventos clave en formato: 'FECHA: evento.'"
  },
  "evidence": [
    {
      "description": "Nombre exacto de la prueba. Ej: 'Acta de Asamblea n°14 del 15-mar-2018, aportada por el demandante'",
      "submittedBy": "DEMANDANTE | DEMANDADO | AMBAS_PARTES | DECRETO_OFICIO",
      "category": "DOCUMENTAL | TESTIMONIAL | PERICIAL | INSPECCION",
      "wasAccepted": true,
      "weight": "DECISIVA | RELEVANTE | MARGINAL | DESESTIMADA",
      "reasoning": "Por qué tuvo ese peso. Ej: 'Decisiva porque demostró que el quórum registrado (62%) no coincidía con la lista de asistencia (48%).'"
    }
  ],
  "legalArguments": [
    {
      "party": "DEMANDANTE | DEMANDADO",
      "argument": "Argumento concreto tal como lo planteó la parte.",
      "legalBasis": "Norma o precedente invocado por la parte",
      "outcome": "ACOGIDO | DESESTIMADO | PARCIALMENTE_ACOGIDO",
      "whyOutcome": "Razón concreta de la Supersociedades para acogerlo o rechazarlo.",
      "isStrategic": true
    }
  ],
  "legalBases": [
    {
      "norm": "Art. 185 C.Co. | Ley 222/1995 Art. 23 — exacto como aparece en el fallo",
      "normType": "CODIGO_COMERCIO | LEY | DECRETO | REGLAMENTO",
      "application": "Cómo usó la Supersociedades esta norma para decidir.",
      "wasDecisive": true
    }
  ],
  "parties": [
    { "role": "DEMANDANTE | DEMANDADO", "type": "PERSONA_NATURAL | PERSONA_JURIDICA", "name": "nombre" }
  ],
  "claims": [
    { "type": "pretensión concreta", "text": "detalle de la pretensión", "requestedRemedy": "qué se solicitaba" }
  ],
  "authorities": [
    { "normType": "Jurisprudencia | Ley | Decreto | Otro", "citationText": "referencia exacta citada en el fallo", "articleNumber": "" }
  ],
  "strategicFlags": {
    "highEvidentiaryBurden": true,
    "standingDiscussed": false,
    "jurisdictionDiscussed": false,
    "highestBodyAuthorization": false,
    "shareholderAgreementDeposit": false,
    "interimRelief": false
  },
  "denialReasons": [
    {
      "code": "RN.01 | RN.02 | RN.03a | RN.03b | RN.04a | RN.04b | RN.05 | RN.06 | RN.07 | RN.08 | RN.09 | RN.10 | RN.11",
      "reasoning": "1-2 oraciones explicando por qué aplica esta razón de negación en este caso concreto.",
      "confidence": "high | medium | low"
    }
  ],
  "summary": "4-6 oraciones para briefing interno: tipo de acción, hecho detonante concreto, argumento central que definió el resultado, prueba determinante, artículo aplicado."
}

TAXONOMÍA DE RAZONES DE NEGACIÓN (Serie RN v1.1) — Solo aplica a pretensiones NEGADAS o DESESTIMADAS.
Si el demandante ganó completamente, el array denialReasons debe estar vacío.
Un caso puede tener múltiples RN. Identifica TODAS las que apliquen.

  RN.01 — Insuficiencia probatoria: No cumplió la carga de la prueba para acreditar hechos constitutivos o conducta reprochada.
  RN.02 — Improcedencia de la vía o acción: Canalizó la pretensión por una acción que no corresponde. PRIORIDAD sobre RN.09.
  RN.03a — Cláusula compromisoria: Desplazamiento a tribunal arbitral.
  RN.03b — Falta de competencia por materia: SS no tiene jurisdicción.
  RN.04a — Prescripción extintiva: Fuera del término de prescripción (típicamente 5 años, Art. 235 Ley 222/1995).
  RN.04b — Caducidad de la acción: Fuera del plazo de caducidad (típicamente 2 meses, Art. 191 C.Co.).
  RN.05 — Falta de legitimación en la causa: No ostenta la calidad jurídica necesaria.
  RN.06 — Ausencia de nexo causal o perjuicio: Conducta acreditada PERO no demostró daño ni nexo causal. Si la conducta NO fue probada, usar RN.01.
  RN.07 — Saneamiento, ratificación o convalidación: Vicio subsanado por acto posterior.
  RN.08 — Conducta no configura el supuesto legal: Hechos probados no encuadran en el tipo legal invocado.
  RN.09 — Error en la calificación jurídica: Invocó norma sustantiva equivocada. Solo si NO determinó la elección de la acción (si la determinó, usar RN.02).
  RN.10 — Cosa juzgada o litispendencia: Pronunciamiento judicial previo con identidad de partes, objeto y causa.
  RN.11 — Defecto formal de la demanda: Inepta demanda, falta de litisconsorcio necesario, indebida acumulación.

===MARKDOWN===

OUTPUT 2 — Documento Markdown enriquecido (después del delimitador):
Redacta un documento narrativo de la sentencia en el siguiente formato. Este documento será usado por un sistema RAG para responder preguntas jurídicas estratégicas, por lo tanto debe ser denso en información jurídica concreta, no un resumen abstracto.

# [sourceReference] — [caseName] ([year])

## Tipo de Acción
[actionType] — Resultado: [outcomeGeneral]

## Disputa Central
[narrativa concreta de qué pasó y por qué llegaron a la Supersociedades]

## Hechos Materiales Probados
[lista numerada de hechos concretos y probados, con fechas cuando estén disponibles]

## Configuración Societaria
[tipo de sociedad, socios, distribución de capital, órganos relevantes]

## Pruebas y su Valoración
[para cada prueba relevante: qué era, quién la aportó, qué demostró, qué peso le dio la Supersociedades y por qué]

## Argumentos del Demandante
[cada argumento, la norma que invocó, y si fue acogido o desestimado con la razón concreta]

## Argumentos del Demandado  
[cada argumento, la norma que invocó, y si fue acogido o desestimado con la razón concreta]

## Base Normativa Aplicada
[cada norma aplicada, cómo la usó la Supersociedades para decidir]

## Ratio Decidendi
[la razón jurídica determinante del fallo en 2-3 oraciones — lo que un abogado citaría como precedente]

## Patrones Estratégicos
[qué funcionó, qué no funcionó, qué hubiera cambiado el resultado]
`;

    console.log(`[Admin Upload] Enviando a Claude Sonnet para extracción Dual...`);

    const extractionResult = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: fileData },
          },
          { type: 'text', text: DUAL_EXTRACTION_PROMPT },
        ],
      }],
    });

    const rawText = extractionResult.content[0].type === 'text' ? extractionResult.content[0].text : '';

    // 3. Parse and Validate
    const parts = rawText.split('===MARKDOWN===');
    if (parts.length !== 2) {
      throw new Error('Gemini no produjo los dos outputs esperados (falta delimitador ===MARKDOWN===)');
    }

    const jsonText = parts[0].trim().replace(/```json|```/g, '').trim();
    const markdown = parts[1].trim();

    let caseData: any;
    try {
      caseData = JSON.parse(jsonText);
    } catch {
      throw new Error(`JSON inválido de Gemini: ${jsonText.substring(0, 200)}`);
    }

    // --- SECONDARY DEEP CLASSIFICATION GATE ---
    const extractedAsunto = caseData.metadata?.actionType || '';
    const ambiguousPatterns = [
      /art[íi]culo\s+24\s+(del\s+)?c[oó]digo\s+general/i,
      /art\.?\s*24\s+cgp/i,
      /competencia\s+general/i,
      /prescripci[óo]n/i,
      /n\/?a/i,
      /desconocido/i,
      /otro/i
    ];
    
    if (ambiguousPatterns.some(p => p.test(extractedAsunto))) {
      console.log(`[Admin Upload] Detectado 'Art 24 CGP' u otro tipo de acción ambiguo. Iniciando Re-Clasificación Profunda...`);
      
      const classificationContext = [
        `PROBABLE ASUNTO BASE: ${extractedAsunto}`,
        `DISPUTA CENTRAL: ${caseData.factualPattern?.coreDispute}`,
        `PRETENSIONES:\n${(caseData.claims || []).map((c: any) => `- ${c.requestedRemedy || c.text}`).join('\n')}`,
        `RESUMEN FALLO: ${caseData.summary}`
      ].filter(Boolean).join('\n\n---\n\n');

      const deepClassResult = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `${CLASSIFICATION_PROMPT}\n\n═══════════════════════════════════════════════════════════════════════\nTEXTO DE LA PROVIDENCIA A CLASIFICAR:\n═══════════════════════════════════════════════════════════════════════\n${classificationContext}`,
        }],
      });

      try {
        const deepClassJson = (deepClassResult.content[0].type === 'text' ? deepClassResult.content[0].text : '').replace(/```json|```/g, '').trim();
        const classification = JSON.parse(deepClassJson);
        
        // Use canonical taxonomy map (imported from @/lib/taxonomy)
        if (classification.action_type && DEEP_CLASSIFICATION_MAP[classification.action_type]) {
          const canonicalLabel = DEEP_CLASSIFICATION_MAP[classification.action_type];
          console.log(`[Admin Upload] Reclasificado exitosamente a: ${canonicalLabel} (Confianza: ${classification.confidence})`);
          caseData.metadata.actionType = canonicalLabel;
          
          if (classification.classification_note) {
            caseData.summary = `[NOTA DE RECLASIFICACIÓN: ${classification.classification_note}] ` + caseData.summary;
          }
        }
      } catch (err) {
        console.error(`[Admin Upload] Error parseando JSON de la clasificación profunda. Se mantiene la original.`);
      }
    }

    // VALIDACIONES CRÍTICAS
    const errors: string[] = [];
    if (!caseData.metadata?.sourceReference) errors.push('sourceReference vacío');
    else if (caseData.metadata.sourceReference.includes('.pdf')) errors.push(`sourceReference contiene .pdf: ${caseData.metadata.sourceReference}`);
    else if (caseData.metadata.sourceReference.length > 100) errors.push(`sourceReference demasiado largo`);

    const year = caseData.metadata?.year;
    if (!year || year < 2000 || year > 2025) errors.push(`year inválido: ${year}`);

    const validOutcomes = ['DEMANDANTE_GANA', 'DEMANDADO_GANA', 'PARCIAL', 'INHIBITORIO', 'Demandante prevalece', 'Demandado prevalece', 'Mixto/Parcial', 'Desestimado', 'Transado'];
    if (!validOutcomes.includes(caseData.metadata?.outcomeGeneral)) errors.push(`outcomeGeneral inválido: ${caseData.metadata?.outcomeGeneral}`);

    if (!caseData.evidence?.length) errors.push('Sin pruebas extraídas');
    if (!caseData.legalArguments?.length) errors.push('Sin argumentos jurídicos extraídos');
    if (markdown.length < 500) errors.push(`Markdown demasiado corto: ${markdown.length} chars`);

    if (errors.length > 0) {
      console.error('VALIDACIÓN FALLIDA:', errors);
      await prisma.ingestQuarantine.create({
        data: {
          fileName,
          errors,
          rawGeminiOutput: rawText
        }
      });
      return NextResponse.json({ success: false, message: 'Validación fallida, enviado a cuarentena', errors }, { status: 422 });
    }

    console.log(`[Admin Upload] Extracción exitosa. Generando vectores para el Markdown...`);

    // 4. Generate Embeddings for Semantic Search using MARKDOWN
    const embedResult = await embedModel.embedContent(markdown);
    const embedding = embedResult.embedding.values;

    if (!embedding || embedding.length === 0) {
      throw new Error('No se generó el embedding correctamente.');
    }

    console.log(`[Admin Upload] Subiendo PDF a Vercel Blob...`);
    const pdfBuffer = Buffer.from(fileData, 'base64');
    const { url: pdfBlobUrl } = await put(`jurisprudencia/${fileName}`, pdfBuffer, {
      access: 'private',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    console.log(`[Admin Upload] PDF subido exitosamente a: ${pdfBlobUrl}`);

    console.log(`[Admin Upload] Guardando en Base de Datos PostgreSQL...`);

    const validParties = (caseData.parties || []).filter((p: any) => p && p.name);
    const validClaims = (caseData.claims || []).filter((c: any) => c && c.text);
    const validAuthorities = (caseData.authorities || []).filter((a: any) => a && a.citationText);

    // 5. Save to Postgres
    const casePayload = {
      caseName: caseData.metadata?.caseName || 'Desconocido',
      sourceReference: caseData.metadata?.sourceReference || 'S/N',
      sourceUrl: fileName,
      pdfBlobUrl: pdfBlobUrl,
      filingDate: '',
      decisionDate: `${caseData.metadata?.year || new Date().getFullYear()}-01-01`,
      duration: caseData.metadata?.duration ? `${caseData.metadata.duration} días` : 'N/A',
      year: Number(caseData.metadata?.year) || new Date().getFullYear(),
      office: 'Supersociedades',
      court: 'Supersociedades',
      courtLevel: 'Primera Instancia',
      actionType: canonicalize(caseData.metadata?.actionType || 'Otra').label,
      subtopics: [],
      summary: caseData.summary || '',
      factualBackground: caseData.factualPattern?.coreDispute || '',
      legalIssue: caseData.factualPattern?.triggerEvent || '',
      proceduralTrack: 'Verbal',
      outcomeGeneral: caseData.metadata?.outcomeGeneral || 'Demandante prevalece',
      outcomeDetailed: caseData.summary || '',
      markdownContent: markdown,

      parties: { create: validParties },
      claims: { create: validClaims },
      authorities: { create: validAuthorities },
      strategicFlags: caseData.strategicFlags ? { 
        create: {
          highEvidentiaryBurden: caseData.strategicFlags.highEvidentiaryBurden || caseData.strategicFlags.highProofBurden || false,
          standingDiscussed: caseData.strategicFlags.standingDiscussed || false,
          jurisdictionDiscussed: caseData.strategicFlags.jurisdictionDiscussed || false,
          highestBodyAuthorization: caseData.strategicFlags.highestBodyAuthorization || false,
          shareholderAgreementDeposit: caseData.strategicFlags.shareholderAgreementDeposit || false,
          interimRelief: caseData.strategicFlags.interimRelief || false
        }
      } : undefined,
      factualPattern: caseData.factualPattern ? { 
        create: {
          ...caseData.factualPattern,
          timeline: Array.isArray(caseData.factualPattern.timeline)
            ? caseData.factualPattern.timeline.join('\n')
            : String(caseData.factualPattern.timeline || '')
        }
      } : undefined,
      evidence: caseData.evidence?.length ? { create: caseData.evidence } : undefined,
      legalArguments: caseData.legalArguments?.length ? { create: caseData.legalArguments } : undefined,
      legalBases: caseData.legalBases?.length ? { create: caseData.legalBases } : undefined,
    };

    let targetCase;
    if (existingCase && mode === 'UPDATE') {
      targetCase = await prisma.case.update({
        where: { id: existingCase.id },
        data: casePayload
      });
    } else {
      targetCase = await prisma.case.create({
        data: {
          id: `caso-${Date.now().toString().slice(-6)}`,
          ...casePayload
        }
      });
    }

    // 6. Update Vector Column
    await prisma.$executeRawUnsafe(
      `UPDATE "Case" SET embedding = $1::vector WHERE id = $2`,
      `[${embedding.join(',')}]`,
      targetCase.id
    );

    // 7. Save Denial Reasons (Serie RN v1.1) if extracted
    const denialReasons = (caseData.denialReasons || []).filter(
      (dr: any) => dr && dr.code && dr.reasoning
    );
    if (denialReasons.length > 0) {
      const VALID_RN_CODES = new Set([
        'RN.01', 'RN.02', 'RN.03a', 'RN.03b', 'RN.04a', 'RN.04b',
        'RN.05', 'RN.06', 'RN.07', 'RN.08', 'RN.09', 'RN.10', 'RN.11'
      ]);
      const validDRs = denialReasons.filter((dr: any) => VALID_RN_CODES.has(dr.code));
      if (validDRs.length > 0) {
        await prisma.denialReason.createMany({
          data: validDRs.map((dr: any) => ({
            caseId: targetCase.id,
            code: dr.code,
            label: dr.code,
            reasoning: dr.reasoning,
            confidence: dr.confidence || 'medium',
            source: 'extraction_prompt',
          })),
        });
        console.log(`[Admin Upload] ${validDRs.length} denial reasons guardadas.`);
      }
    }

    console.log(`[Admin Upload] Finalizado. Caso ${targetCase.id} ingerido.`);

    return NextResponse.json({ success: true, case: targetCase });

  } catch (error: any) {
    console.error('[Admin Upload] Error:', error);
    return NextResponse.json({ error: error.message || 'Error procesando el PDF' }, { status: 500 });
  }
}
