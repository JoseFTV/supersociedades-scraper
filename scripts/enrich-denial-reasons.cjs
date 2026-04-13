/**
 * Enrichment Script: Denial Reasons (Serie RN v1.1)
 *
 * Runs a secondary Haiku pass over existing case data to extract
 * denial reasons from summary + markdownContent.
 *
 * Cost estimate: ~$0.005/case * 299 = ~$1.50 USD
 *
 * Usage: node scripts/enrich-denial-reasons.cjs
 * Options:
 *   --dry-run     Print what would be extracted without saving
 *   --limit N     Process only N cases (for testing)
 *   --force       Re-process cases that already have denial reasons
 */

require('dotenv').config({ override: true });

const { PrismaClient } = require('@prisma/client');
const Anthropic = require('@anthropic-ai/sdk').default;

const prisma = new PrismaClient();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const FORCE = args.includes('--force');
const limitIdx = args.indexOf('--limit');
const LIMIT = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : 0;

// ─── Taxonomy RN v1.1 ─────────────────────────────────────────────────────────

const DENIAL_TAXONOMY = `
TAXONOMÍA DE RAZONES DE NEGACIÓN (Serie RN v1.1)
Frecuencias calculadas sobre argumentos desestimados, no sobre casos.
Un caso puede portar múltiples RN.

RN.01 — Insuficiencia probatoria
  La parte no cumplió la carga de la prueba para acreditar los hechos constitutivos o la conducta reprochada.

RN.02 — Improcedencia de la vía o acción
  La pretensión se canalizó por una acción que no corresponde al supuesto fáctico.
  REGLA DE PRIORIDAD: Prioridad sobre RN.09 cuando el error en calificación jurídica determinó la elección de la acción incorrecta.

RN.03a — Cláusula compromisoria
  Desplazamiento convencional de jurisdicción a tribunal arbitral por existir cláusula compromisoria vigente en estatutos.

RN.03b — Falta de competencia por materia
  La Supersociedades se declara incompetente por no corresponderle la materia en controversia.

RN.04a — Prescripción extintiva
  La acción fue interpuesta después del término de prescripción legal (típicamente 5 años, Art. 235 Ley 222/1995).

RN.04b — Caducidad de la acción
  La acción fue interpuesta fuera del plazo de caducidad (típicamente 2 meses para impugnación, Art. 191 C.Co.).

RN.05 — Falta de legitimación en la causa
  El demandante no ostenta la calidad jurídica necesaria para formular la pretensión.

RN.06 — Ausencia de nexo causal o perjuicio
  Aun cuando la conducta reprochada fue acreditada o no fue objeto de controversia, la parte no demostró el daño patrimonial ni el nexo de causalidad entre la actuación y el perjuicio alegado.
  IMPORTANTE: Solo aplica cuando la conducta SÍ fue acreditada. Si la conducta NO fue probada, aplica RN.01.

RN.07 — Saneamiento, ratificación o convalidación
  El vicio existió pero fue subsanado por acto posterior (quórum universal, ratificación expresa, consentimiento tácito).

RN.08 — Conducta no configura el supuesto legal
  Los hechos probados no encuadran en el tipo legal invocado (el abuso no se configuró, el conflicto de interés no existía, la decisión no excedió los estatutos).

RN.09 — Error en la calificación jurídica
  La parte invocó la norma sustantiva equivocada o confundió figuras jurídicas.
  REGLA: Aplica cuando el error NO determinó la elección de la acción — si la determinó, aplica RN.02.

RN.10 — Cosa juzgada o litispendencia
  Existe pronunciamiento judicial previo con identidad de partes, objeto y causa.

RN.11 — Defecto formal de la demanda
  Inepta demanda, falta de integración del litisconsorcio necesario, indebida acumulación de pretensiones.
`;

const EXTRACTION_PROMPT = `Eres un analista jurídico experto en derecho societario colombiano. Tu tarea es identificar las RAZONES por las cuales se negaron o desestimaron pretensiones en una sentencia de la Superintendencia de Sociedades.

${DENIAL_TAXONOMY}

═══════════════════════════════════════════════════════════════════════
INSTRUCCIONES
═══════════════════════════════════════════════════════════════════════

1. Lee el resumen y el documento de la sentencia.
2. Identifica TODAS las razones por las cuales se negaron pretensiones del demandante.
3. Si el demandante ganó completamente (todas las pretensiones acogidas), responde con un array vacío.
4. Un caso puede tener múltiples RN — identifica TODAS las que apliquen.
5. Para cada RN, explica en 1-2 oraciones concretas POR QUÉ aplica a este caso específico.
6. Asigna confianza: "high" si la razón es explícita en el texto, "medium" si se infiere claramente, "low" si es una interpretación.

═══════════════════════════════════════════════════════════════════════
FORMATO DE SALIDA (JSON estricto)
═══════════════════════════════════════════════════════════════════════

Responde ÚNICAMENTE con el siguiente JSON:

{
  "denial_reasons": [
    {
      "code": "RN.XX",
      "reasoning": "Explicación concreta de por qué aplica en este caso.",
      "confidence": "high | medium | low"
    }
  ]
}

Si no hay pretensiones negadas (demandante ganó todo), responde:
{ "denial_reasons": [] }
`;

// ─── Main ──────────────────────────────────────────────────────────────────────

const VALID_CODES = new Set([
  'RN.01', 'RN.02', 'RN.03a', 'RN.03b', 'RN.04a', 'RN.04b',
  'RN.05', 'RN.06', 'RN.07', 'RN.08', 'RN.09', 'RN.10', 'RN.11'
]);

const BATCH_SIZE = 5;
const DELAY_MS = 500;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function extractDenialReasons(caseData) {
  const caseContext = [
    `TIPO DE ACCIÓN: ${caseData.actionType}`,
    `RESULTADO: ${caseData.outcomeGeneral}`,
    `NOMBRE: ${caseData.caseName}`,
    `AÑO: ${caseData.year}`,
    `\nRESUMEN:\n${caseData.summary}`,
  ];

  // Add markdown content if available (truncated to save tokens)
  if (caseData.markdownContent) {
    const truncated = caseData.markdownContent.slice(0, 6000);
    caseContext.push(`\nDOCUMENTO COMPLETO (truncado):\n${truncated}`);
  }

  const result = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `${EXTRACTION_PROMPT}\n\n═══════════════════════════════════════════════════════════════════════\nSENTENCIA A ANALIZAR:\n═══════════════════════════════════════════════════════════════════════\n\n${caseContext.join('\n')}`,
    }],
  });

  const text = result.content[0].type === 'text' ? result.content[0].text : '';
  const jsonStr = text.replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(jsonStr);

  // Validate codes
  const valid = (parsed.denial_reasons || []).filter(dr => VALID_CODES.has(dr.code));
  return valid;
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  ENRICHMENT: Denial Reasons (Serie RN v1.1)');
  console.log('  Model: claude-haiku-4-20250414');
  console.log(`  Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}${FORCE ? ' (FORCE)' : ''}`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Get cases to process
  const where = {};
  if (!FORCE) {
    // Only process cases that don't have denial reasons yet
    const casesWithDR = await prisma.denialReason.findMany({
      select: { caseId: true },
      distinct: ['caseId'],
    });
    const processedIds = new Set(casesWithDR.map(dr => dr.caseId));

    if (processedIds.size > 0) {
      where.id = { notIn: Array.from(processedIds) };
    }
  }

  let cases = await prisma.case.findMany({
    where,
    select: {
      id: true,
      caseName: true,
      actionType: true,
      outcomeGeneral: true,
      year: true,
      summary: true,
      markdownContent: true,
    },
    orderBy: { year: 'asc' },
    ...(LIMIT > 0 ? { take: LIMIT } : {}),
  });

  console.log(`Found ${cases.length} cases to process.\n`);

  let processed = 0;
  let totalDRs = 0;
  let errors = 0;
  const codeFreq = {};

  for (let i = 0; i < cases.length; i += BATCH_SIZE) {
    const batch = cases.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map(async (c) => {
        try {
          const drs = await extractDenialReasons(c);

          if (DRY_RUN) {
            console.log(`[DRY] ${c.caseName.slice(0, 50)} | ${c.outcomeGeneral} → ${drs.length > 0 ? drs.map(d => d.code).join(', ') : '(sin negaciones)'}`);
          } else if (drs.length > 0) {
            await prisma.denialReason.createMany({
              data: drs.map(dr => ({
                caseId: c.id,
                code: dr.code,
                label: dr.code, // Will be enriched from taxonomy
                reasoning: dr.reasoning,
                confidence: dr.confidence,
                source: 'haiku_enrichment',
              })),
            });
          }

          // Track stats
          drs.forEach(dr => {
            codeFreq[dr.code] = (codeFreq[dr.code] || 0) + 1;
          });
          totalDRs += drs.length;
          processed++;

          return { success: true, case: c.id, count: drs.length };
        } catch (err) {
          errors++;
          console.error(`[ERROR] ${c.caseName.slice(0, 50)}: ${err.message}`);
          return { success: false, case: c.id, error: err.message };
        }
      })
    );

    // Progress
    const done = Math.min(i + BATCH_SIZE, cases.length);
    console.log(`  Progress: ${done}/${cases.length} (${totalDRs} DRs extracted, ${errors} errors)`);

    if (i + BATCH_SIZE < cases.length) {
      await sleep(DELAY_MS);
    }
  }

  // ─── Final Report ──────────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  RESULTS');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Cases processed: ${processed}`);
  console.log(`  Total DRs extracted: ${totalDRs}`);
  console.log(`  Errors: ${errors}`);
  console.log(`  Avg DRs per case: ${(totalDRs / Math.max(processed, 1)).toFixed(2)}`);
  console.log('\n  Frequency by code:');
  Object.entries(codeFreq)
    .sort((a, b) => b[1] - a[1])
    .forEach(([code, count]) => {
      const pct = ((count / Math.max(processed, 1)) * 100).toFixed(1);
      console.log(`    ${String(count).padStart(4)} (${pct.padStart(5)}%) | ${code}`);
    });

  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Fatal error:', err);
  prisma.$disconnect();
  process.exit(1);
});
