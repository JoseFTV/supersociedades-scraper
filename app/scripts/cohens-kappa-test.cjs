/**
 * Inter-Rater Reliability Test (Cohen's Kappa)
 *
 * Validates extraction quality by re-extracting a random sample
 * of cases and comparing with existing data.
 *
 * Tests:
 * 1. actionType agreement (15 categories)
 * 2. outcomeGeneral agreement (3 categories)
 * 3. denialReasons agreement (presence/absence per code)
 *
 * Usage: node scripts/cohens-kappa-test.cjs
 * Options:
 *   --sample N     Number of cases to sample (default: 15)
 *   --dry-run      Just show the sample without re-extracting
 */

require('dotenv').config({ override: true });

const { PrismaClient } = require('@prisma/client');
const Anthropic = require('@anthropic-ai/sdk').default;

const prisma = new PrismaClient();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const sampleIdx = args.indexOf('--sample');
const SAMPLE_SIZE = sampleIdx !== -1 ? parseInt(args[sampleIdx + 1], 10) : 15;

// ─── Cohen's Kappa computation ──────────────────────────────────────────────

function cohensKappa(ratings1, ratings2) {
  // Build confusion matrix
  const categories = [...new Set([...ratings1, ...ratings2])];
  const n = ratings1.length;
  if (n === 0) return { kappa: 0, agreement: 0, n: 0 };

  // Observed agreement
  let agree = 0;
  for (let i = 0; i < n; i++) {
    if (ratings1[i] === ratings2[i]) agree++;
  }
  const po = agree / n;

  // Expected agreement by chance
  let pe = 0;
  for (const cat of categories) {
    const p1 = ratings1.filter(r => r === cat).length / n;
    const p2 = ratings2.filter(r => r === cat).length / n;
    pe += p1 * p2;
  }

  const kappa = pe === 1 ? 1 : (po - pe) / (1 - pe);

  return {
    kappa: Math.round(kappa * 1000) / 1000,
    agreement: Math.round(po * 1000) / 1000,
    n,
    categories: categories.length,
  };
}

function interpretKappa(k) {
  if (k >= 0.81) return 'Casi perfecto';
  if (k >= 0.61) return 'Sustancial';
  if (k >= 0.41) return 'Moderado';
  if (k >= 0.21) return 'Justo';
  if (k >= 0.01) return 'Leve';
  return 'Sin acuerdo';
}

// ─── Re-extraction prompt ───────────────────────────────────────────────────

const REEXTRACT_PROMPT = `Eres un analista jurídico experto en derecho societario colombiano.
Lee el siguiente resumen y datos de una sentencia de la Superintendencia de Sociedades.

Clasifica ÚNICAMENTE con estos campos:

1. actionType: El tipo de acción. DEBE ser exactamente uno de:
   - "Responsabilidad de administradores"
   - "Impugnación de decisiones sociales"
   - "Desestimación de la personalidad jurídica"
   - "Disputas sobre contratos"
   - "Disputas societarias"
   - "Rendición de cuentas"
   - "Disolución y liquidación"
   - "Conflictos de interés"
   - "Reconocimiento de presupuestos de ineficacia"
   - "Cumplimiento de derecho de inspección"
   - "Nulidad societaria"
   - "Resolución de conflictos sobre propiedad accionaria"
   - "Indemnización de perjuicios"
   - "Ejecución de obligaciones del acuerdo de accionistas"
   - "Ejecutivos y cobros"

2. outcomeGeneral: DEBE ser exactamente uno de:
   - "Demandante prevalece"
   - "Demandado prevalece"
   - "Mixto/Parcial"

3. denialCodes: Array de códigos RN que aplican (puede ser vacío). Opciones:
   RN.01, RN.02, RN.03a, RN.03b, RN.04a, RN.04b, RN.05, RN.06, RN.07, RN.08, RN.09, RN.10, RN.11

Responde SOLO con JSON:
{
  "actionType": "...",
  "outcomeGeneral": "...",
  "denialCodes": ["RN.XX", ...]
}`;

async function reExtract(caseData) {
  const context = `
CASO: ${caseData.caseName}
AÑO: ${caseData.year}
RESUMEN: ${caseData.summary}
RESULTADO DETALLADO: ${caseData.outcomeDetailed}
PROBLEMA JURÍDICO: ${caseData.legalIssue}
`.trim();

  const result = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 512,
    messages: [{ role: 'user', content: `${REEXTRACT_PROMPT}\n\n${context}` }],
  });

  const text = result.content[0].type === 'text' ? result.content[0].text : '';
  const jsonStr = text.replace(/```json|```/g, '').trim();
  return JSON.parse(jsonStr);
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log("  INTER-RATER RELIABILITY TEST (Cohen's Kappa)");
  console.log(`  Sample: ${SAMPLE_SIZE} cases`);
  console.log(`  Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Random sample
  const totalCases = await prisma.case.count();
  const skip = Math.max(0, Math.floor(Math.random() * (totalCases - SAMPLE_SIZE)));

  const sample = await prisma.case.findMany({
    select: {
      id: true, caseName: true, year: true, actionType: true,
      outcomeGeneral: true, outcomeDetailed: true, legalIssue: true, summary: true,
      denialReasons: { select: { code: true } },
    },
    skip,
    take: SAMPLE_SIZE,
    orderBy: { createdAt: 'asc' },
  });

  console.log(`Sampled ${sample.length} cases (skip=${skip}).\n`);

  if (DRY_RUN) {
    sample.forEach((c, i) => {
      console.log(`  ${i + 1}. ${c.caseName.slice(0, 50)} | ${c.actionType} | ${c.outcomeGeneral}`);
    });
    await prisma.$disconnect();
    return;
  }

  // Re-extract each case
  const original = { actionTypes: [], outcomes: [], denialSets: [] };
  const reextracted = { actionTypes: [], outcomes: [], denialSets: [] };
  const disagreements = [];

  for (let i = 0; i < sample.length; i++) {
    const c = sample[i];
    try {
      const re = await reExtract(c);

      original.actionTypes.push(c.actionType);
      reextracted.actionTypes.push(re.actionType || 'UNKNOWN');

      original.outcomes.push(c.outcomeGeneral);
      reextracted.outcomes.push(re.outcomeGeneral || 'UNKNOWN');

      const origDR = new Set(c.denialReasons.map(d => d.code));
      const reDR = new Set(re.denialCodes || []);
      original.denialSets.push(origDR);
      reextracted.denialSets.push(reDR);

      // Track disagreements
      if (c.actionType !== re.actionType) {
        disagreements.push({
          case: c.caseName.slice(0, 50),
          field: 'actionType',
          original: c.actionType,
          reextracted: re.actionType,
        });
      }
      if (c.outcomeGeneral !== re.outcomeGeneral) {
        disagreements.push({
          case: c.caseName.slice(0, 50),
          field: 'outcomeGeneral',
          original: c.outcomeGeneral,
          reextracted: re.outcomeGeneral,
        });
      }

      console.log(`  [${i + 1}/${sample.length}] ${c.caseName.slice(0, 40)} — AT: ${c.actionType === re.actionType ? '✓' : '✗'} OC: ${c.outcomeGeneral === re.outcomeGeneral ? '✓' : '✗'}`);
    } catch (err) {
      console.error(`  [ERROR] ${c.caseName.slice(0, 50)}: ${err.message.slice(0, 80)}`);
    }

    // Small delay to avoid rate limits
    if (i < sample.length - 1) {
      await new Promise(r => setTimeout(r, 300));
    }
  }

  // ─── Compute Kappas ──────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  RESULTS');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const kappaAT = cohensKappa(original.actionTypes, reextracted.actionTypes);
  const kappaOC = cohensKappa(original.outcomes, reextracted.outcomes);

  console.log("  1. Action Type (Cohen's Kappa):");
  console.log(`     κ = ${kappaAT.kappa} (${interpretKappa(kappaAT.kappa)})`);
  console.log(`     Agreement: ${(kappaAT.agreement * 100).toFixed(1)}%`);
  console.log(`     Categories: ${kappaAT.categories} | n = ${kappaAT.n}`);

  console.log("\n  2. Outcome General (Cohen's Kappa):");
  console.log(`     κ = ${kappaOC.kappa} (${interpretKappa(kappaOC.kappa)})`);
  console.log(`     Agreement: ${(kappaOC.agreement * 100).toFixed(1)}%`);
  console.log(`     Categories: ${kappaOC.categories} | n = ${kappaOC.n}`);

  // Denial reasons: compute per-code agreement
  const allCodes = ['RN.01','RN.02','RN.03a','RN.03b','RN.04a','RN.04b','RN.05','RN.06','RN.07','RN.08','RN.09','RN.10','RN.11'];
  const origBinary = [];
  const reBinary = [];
  for (let i = 0; i < original.denialSets.length; i++) {
    for (const code of allCodes) {
      origBinary.push(original.denialSets[i].has(code) ? 'Y' : 'N');
      reBinary.push(reextracted.denialSets[i].has(code) ? 'Y' : 'N');
    }
  }
  const kappaDR = cohensKappa(origBinary, reBinary);

  console.log("\n  3. Denial Reasons (Cohen's Kappa, binary per-code):");
  console.log(`     κ = ${kappaDR.kappa} (${interpretKappa(kappaDR.kappa)})`);
  console.log(`     Agreement: ${(kappaDR.agreement * 100).toFixed(1)}%`);
  console.log(`     Observations: ${kappaDR.n} (${sample.length} cases × ${allCodes.length} codes)`);

  // Disagreements
  if (disagreements.length > 0) {
    console.log('\n  Disagreements:');
    disagreements.forEach(d => {
      console.log(`    [${d.field}] ${d.case}`);
      console.log(`      Original:    ${d.original}`);
      console.log(`      Re-extracted: ${d.reextracted}`);
    });
  } else {
    console.log('\n  ✓ Perfect agreement on all cases!');
  }

  // Overall assessment
  console.log('\n═══════════════════════════════════════════════════════════════');
  const minKappa = Math.min(kappaAT.kappa, kappaOC.kappa, kappaDR.kappa);
  if (minKappa >= 0.61) {
    console.log('  ✅ PASS: All dimensions show substantial+ agreement (κ ≥ 0.61)');
  } else if (minKappa >= 0.41) {
    console.log('  ⚠️ WARN: Some dimensions show only moderate agreement (κ ≥ 0.41)');
  } else {
    console.log('  ❌ FAIL: Low agreement detected — extraction pipeline needs review');
  }
  console.log('═══════════════════════════════════════════════════════════════');

  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Fatal:', err);
  prisma.$disconnect();
  process.exit(1);
});
