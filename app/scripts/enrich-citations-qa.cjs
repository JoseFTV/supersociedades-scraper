/**
 * Enrichment Script: Citation Typing + LLM-as-Judge QA
 * Combined pass to minimize API calls.
 *
 * For each case:
 * 1. Classifies authorities into types (CSJ, CC, Concepto SS, etc.)
 * 2. Validates summary consistency (QA score)
 *
 * Usage: node scripts/enrich-citations-qa.cjs
 * Options:
 *   --limit N     Process only N cases
 *   --dry-run     Print without saving
 */

require('dotenv').config({ override: true });

const { PrismaClient } = require('@prisma/client');
const Anthropic = require('@anthropic-ai/sdk').default;

const prisma = new PrismaClient();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const limitIdx = args.indexOf('--limit');
const LIMIT = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : 0;

const PROMPT = `Eres un analista jurídico experto. Tienes DOS tareas sobre una sentencia de la Superintendencia de Sociedades de Colombia:

═══════════════════════════════════════════════════════════════
TAREA 1: TIPIFICACIÓN DE CITAS (authorities)
═══════════════════════════════════════════════════════════════

Para cada autoridad/cita listada, clasifícala en uno de estos tipos:

- CSJ_CIVIL: Sentencia de la Corte Suprema de Justicia, Sala Civil
- CSJ_LABORAL: Sentencia de la Corte Suprema de Justicia, Sala Laboral
- CORTE_CONSTITUCIONAL: Sentencia de la Corte Constitucional (T-, C-, SU-)
- CONSEJO_ESTADO: Sentencia del Consejo de Estado
- SUPERSOCIEDADES: Sentencia o auto previo de la Superintendencia de Sociedades
- CONCEPTO_SS: Oficio o concepto jurídico de la Superintendencia de Sociedades
- TRIBUNAL: Sentencia de Tribunal Superior
- LAUDO_ARBITRAL: Laudo arbitral
- DOCTRINA: Doctrina, libro, artículo académico
- LEY: Ley, decreto, código, norma positiva
- OTRO: No clasificable

═══════════════════════════════════════════════════════════════
TAREA 2: QA DEL SUMMARY (validación de consistencia)
═══════════════════════════════════════════════════════════════

Evalúa si el summary es coherente con los datos del caso:
- ¿El outcome mencionado en el summary coincide con outcomeGeneral?
- ¿Las partes mencionadas coinciden con caseName?
- ¿El tipo de acción mencionado es coherente con actionType?
- ¿Hay afirmaciones contradictorias dentro del summary?

Asigna un qa_score de 0.0 a 1.0:
- 1.0 = perfecto, sin inconsistencias
- 0.7-0.9 = menor imprecisión (ej: año ligeramente diferente)
- 0.5-0.7 = inconsistencia notable pero usable
- <0.5 = inconsistencia grave, necesita revisión

═══════════════════════════════════════════════════════════════
FORMATO DE SALIDA (JSON estricto)
═══════════════════════════════════════════════════════════════

{
  "citation_types": [
    { "authority_id": "id-de-la-autoridad", "citation_type": "CSJ_CIVIL | CORTE_CONSTITUCIONAL | ... | LEY | OTRO" }
  ],
  "qa": {
    "score": 0.95,
    "issues": ["descripción breve de inconsistencia si hay"]
  }
}

Si no hay authorities, devuelve citation_types como array vacío.
Si el summary es perfecto, devuelve issues como array vacío.
`;

const VALID_TYPES = new Set([
  'CSJ_CIVIL', 'CSJ_LABORAL', 'CORTE_CONSTITUCIONAL', 'CONSEJO_ESTADO',
  'SUPERSOCIEDADES', 'CONCEPTO_SS', 'TRIBUNAL', 'LAUDO_ARBITRAL',
  'DOCTRINA', 'LEY', 'OTRO'
]);

const BATCH_SIZE = 5;
const DELAY_MS = 500;
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function processCase(c) {
  const authList = c.authorities.map(a =>
    `  - ID: ${a.id} | Tipo original: ${a.normType} | Cita: ${a.citationText.slice(0, 150)}`
  ).join('\n');

  const caseContext = `
CASO: ${c.caseName}
AÑO: ${c.year}
ACCIÓN: ${c.actionType}
RESULTADO: ${c.outcomeGeneral}

SUMMARY:
${c.summary}

AUTHORITIES (${c.authorities.length}):
${authList || '(ninguna)'}
`.trim();

  const result = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: `${PROMPT}\n\n═══════════════════════════════════════════════════════════════\nSENTENCIA:\n═══════════════════════════════════════════════════════════════\n\n${caseContext}`,
    }],
  });

  const text = result.content[0].type === 'text' ? result.content[0].text : '';
  const jsonStr = text.replace(/```json|```/g, '').trim();
  return JSON.parse(jsonStr);
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  ENRICHMENT: Citation Typing + LLM-as-Judge QA');
  console.log(`  Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  const cases = await prisma.case.findMany({
    select: {
      id: true, caseName: true, actionType: true, outcomeGeneral: true,
      year: true, summary: true,
      authorities: { select: { id: true, normType: true, citationText: true } },
    },
    orderBy: { year: 'asc' },
    ...(LIMIT > 0 ? { take: LIMIT } : {}),
  });

  console.log(`Found ${cases.length} cases to process.\n`);

  let processed = 0, errors = 0;
  let totalCitations = 0, totalTyped = 0;
  const typeFreq = {};
  const qaScores = [];
  const qaIssues = [];

  for (let i = 0; i < cases.length; i += BATCH_SIZE) {
    const batch = cases.slice(i, i + BATCH_SIZE);

    await Promise.allSettled(batch.map(async (c) => {
      try {
        const result = await processCase(c);

        // Process citation types
        const citationTypes = (result.citation_types || []);
        for (const ct of citationTypes) {
          if (!ct.authority_id || !VALID_TYPES.has(ct.citation_type)) continue;
          totalTyped++;
          typeFreq[ct.citation_type] = (typeFreq[ct.citation_type] || 0) + 1;

          if (!DRY_RUN) {
            // Update the authority's normType with the enriched type
            try {
              await prisma.authority.update({
                where: { id: ct.authority_id },
                data: { normType: ct.citation_type },
              });
            } catch (e) {
              // Authority might have been deleted during dedup
            }
          }
        }
        totalCitations += c.authorities.length;

        // Process QA
        const qa = result.qa || {};
        const score = typeof qa.score === 'number' ? qa.score : 1.0;
        qaScores.push(score);
        if (qa.issues && qa.issues.length > 0) {
          qa.issues.forEach(issue => {
            qaIssues.push({ case: c.caseName.slice(0, 50), score, issue });
          });
        }

        if (DRY_RUN) {
          console.log(`[DRY] ${c.caseName.slice(0, 40)} | QA: ${score} | Citations typed: ${citationTypes.length}/${c.authorities.length}`);
        }

        processed++;
      } catch (err) {
        errors++;
        console.error(`[ERROR] ${c.caseName.slice(0, 50)}: ${err.message.slice(0, 100)}`);
      }
    }));

    const done = Math.min(i + BATCH_SIZE, cases.length);
    console.log(`  Progress: ${done}/${cases.length} (${totalTyped} citations typed, ${errors} errors)`);

    if (i + BATCH_SIZE < cases.length) await sleep(DELAY_MS);
  }

  // ─── Report ──────────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  RESULTS');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Cases processed: ${processed}`);
  console.log(`  Errors: ${errors}`);
  console.log(`  Total citations in DB: ${totalCitations}`);
  console.log(`  Citations typed: ${totalTyped}`);

  console.log('\n  Citation type frequency:');
  Object.entries(typeFreq).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
    const pct = ((count / Math.max(totalTyped, 1)) * 100).toFixed(1);
    console.log(`    ${String(count).padStart(4)} (${pct.padStart(5)}%) | ${type}`);
  });

  const avgQa = qaScores.length > 0 ? (qaScores.reduce((a, b) => a + b, 0) / qaScores.length) : 0;
  const lowQa = qaScores.filter(s => s < 0.7).length;
  console.log(`\n  QA Scores:`);
  console.log(`    Average: ${avgQa.toFixed(3)}`);
  console.log(`    Cases with score < 0.7: ${lowQa}`);
  console.log(`    Cases with issues: ${qaIssues.length}`);

  if (qaIssues.length > 0) {
    console.log('\n  Top QA Issues:');
    qaIssues
      .sort((a, b) => a.score - b.score)
      .slice(0, 15)
      .forEach(qi => {
        console.log(`    [${qi.score.toFixed(2)}] ${qi.case}: ${qi.issue}`);
      });
  }

  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Fatal:', err);
  prisma.$disconnect();
  process.exit(1);
});
