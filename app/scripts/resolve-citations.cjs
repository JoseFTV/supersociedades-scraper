/**
 * Sprint 5 — Resolve Citation Graph (local execution)
 * Runs the same logic as /api/admin/resolve-citations but locally
 * to avoid Vercel serverless timeout.
 *
 * Usage: node scripts/resolve-citations.cjs
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const Anthropic = require('@anthropic-ai/sdk').default;

const prisma = new PrismaClient();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const BATCH_SIZE = 20; // Process in batches to show progress

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Sprint 5 — Resolución del Grafo Citacional');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // 1. Load all cases
  const allCases = await prisma.case.findMany({
    select: { id: true, sourceReference: true, year: true, actionType: true }
  });
  console.log(`\n📦 ${allCases.length} casos en la base de datos.`);

  // 2. Load pending authorities
  const targets = await prisma.authority.findMany({
    where: {
      normType: { in: ['Jurisprudencia', 'JURISPRUDENCIA', 'Sentencia', 'Auto', 'AUTO', 'FALLO'] },
      citationLink: null
    },
    select: { id: true, citationText: true, caseId: true }
  });
  console.log(`🔍 ${targets.length} autoridades pendientes de resolución.\n`);

  if (targets.length === 0) {
    console.log('✅ No hay autoridades pendientes. Grafo ya resuelto.');
    return;
  }

  const results = { exact: 0, fuzzy: 0, external: 0, claude: 0, unresolved: 0, errors: 0 };
  let processed = 0;

  for (let i = 0; i < targets.length; i += BATCH_SIZE) {
    const batch = targets.slice(i, i + BATCH_SIZE);

    for (const authority of batch) {
      if (!authority.citationText) {
        processed++;
        continue;
      }

      try {
        const resolution = await resolveInLevels(authority.citationText, allCases);

        await prisma.citationLink.create({
          data: {
            citingCaseId: authority.caseId,
            citedCaseId: resolution.caseId ?? null,
            sourceAuthorityId: authority.id,
            rawReference: authority.citationText,
            confidence: resolution.confidence,
            matchMethod: resolution.method,
            isExternal: resolution.isExternal,
            externalCourt: resolution.externalCourt ?? null,
          }
        });

        // Count results
        switch (resolution.method) {
          case 'EXACT': results.exact++; break;
          case 'FUZZY': results.fuzzy++; break;
          case 'CLAUDE': results.claude++; break;
          case 'UNRESOLVED': results.unresolved++; break;
        }
        if (resolution.isExternal) results.external++;
      } catch (err) {
        // Handle duplicate (already resolved)
        if (err.code === 'P2002') {
          // Skip duplicates silently
        } else {
          console.error(`  ⚠️  Error en "${authority.citationText?.substring(0, 50)}": ${err.message}`);
          results.errors++;
        }
      }

      processed++;
    }

    // Progress
    const pct = Math.round((processed / targets.length) * 100);
    console.log(`  [${pct}%] ${processed}/${targets.length} — Exact: ${results.exact} | Fuzzy: ${results.fuzzy} | External: ${results.external} | Claude: ${results.claude} | Unresolved: ${results.unresolved}`);
  }

  // 3. Recalculate authority scores
  console.log('\n📊 Recalculando scores de autoridad (López Medina)...');
  await recalculateAuthorityScores();

  // 4. Summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  RESULTADOS FINALES');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  ✅ Exact match:    ${results.exact}`);
  console.log(`  🔍 Fuzzy match:    ${results.fuzzy}`);
  console.log(`  🏛️  External court: ${results.external}`);
  console.log(`  🤖 Claude AI:      ${results.claude}`);
  console.log(`  ❓ Unresolved:     ${results.unresolved}`);
  console.log(`  ⚠️  Errors:         ${results.errors}`);
  console.log(`  ─────────────────────────────────`);
  console.log(`  Total procesadas:  ${processed}`);

  // Show López roles distribution
  const roles = await prisma.case.groupBy({
    by: ['lopezRole'],
    _count: { id: true },
    where: { lopezRole: { not: null } }
  });
  if (roles.length > 0) {
    console.log('\n📈 Distribución López Medina:');
    for (const r of roles) {
      console.log(`  ${r.lopezRole}: ${r._count.id} casos`);
    }
  }
}

async function resolveInLevels(citationText, allCases) {
  const normalized = citationText.toLowerCase().replace(/\s+/g, ' ').trim();

  // LEVEL 1 — Exact match
  const exact = allCases.find(c =>
    c.sourceReference && c.sourceReference.toLowerCase().replace(/\s+/g, ' ').trim() === normalized
  );
  if (exact) return { caseId: exact.id, confidence: 1.0, method: 'EXACT', isExternal: false };

  // LEVEL 2 — Fuzzy by radicado numbers
  const numbers = citationText.match(/\b\d{3,}\b/g) ?? [];
  if (numbers.length > 0) {
    const fuzzy = allCases.find(c =>
      c.sourceReference && numbers.some(n => c.sourceReference.includes(n))
    );
    if (fuzzy) return { caseId: fuzzy.id, confidence: 0.75, method: 'FUZZY', isExternal: false };
  }

  // LEVEL 3 — External court detection
  const externalMap = {
    'corte suprema': 'CORTE_SUPREMA',
    'corte constitucional': 'CORTE_CONSTITUCIONAL',
    'consejo de estado': 'CONSEJO_ESTADO',
    'tribunal superior': 'TRIBUNAL_SUPERIOR',
    'juzgado civil': 'JUZGADO_CIVIL_CIRCUITO'
  };

  for (const [pattern, court] of Object.entries(externalMap)) {
    if (normalized.includes(pattern)) {
      return { caseId: null, confidence: 0.9, method: 'CLAUDE', isExternal: true, externalCourt: court };
    }
  }

  // LEVEL 4 — Claude AI fallback
  const claudeResolution = await resolveWithClaude(citationText, allCases);
  if (claudeResolution) return claudeResolution;

  // LEVEL 5 — Unresolvable
  return { caseId: null, confidence: 0, method: 'UNRESOLVED', isExternal: false };
}

async function resolveWithClaude(rawName, candidates) {
  if (candidates.length === 0) return null;

  const prompt = `
Eres un analista jurídico. Tienes esta referencia extraída de otra sentencia: "${rawName}"

¿Detectas el radicado oficial correspondiente en ESTA lista numerada de expedientes internos de la base de datos?
${candidates.map((c, i) => `${i}: ${c.sourceReference} (${c.year})`).join('\n')}

Responde SOLO con un JSON sin markdown ni backticks:
{"matchIndex": 0, "confidence": 0.8} si hay match claro
{"matchIndex": -1, "confidence": 0} si ninguno coincide plenamente
  `;

  try {
    const result = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    });

    let jsonStr = result.content[0].type === 'text' ? result.content[0].text : '';
    jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(jsonStr);

    if (parsed.matchIndex >= 0 && parsed.matchIndex < candidates.length && parsed.confidence > 0.6) {
      return {
        caseId: candidates[parsed.matchIndex].id,
        confidence: parsed.confidence,
        method: 'CLAUDE',
        isExternal: false
      };
    }
  } catch (e) {
    // Claude parse error — fall through to unresolved
  }

  return null;
}

function percentile(arr, p) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const pos = (sorted.length - 1) * p / 100;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  }
  return sorted[base];
}

async function recalculateAuthorityScores() {
  const allCases = await prisma.case.findMany({
    include: { citationsReceived: true }
  });

  const scores = allCases.map(c => c.citationsReceived.length);
  const p75 = percentile(scores, 75);
  const p40 = percentile(scores, 40);

  const years = allCases.map(c => c.year);
  const minYear = years.length > 0 ? Math.min(...years) : new Date().getFullYear();
  const maxYear = new Date().getFullYear();

  let updated = 0;
  for (const case_ of allCases) {
    const score = case_.citationsReceived.length;
    const recentBonus = case_.citationsReceived
      .filter(() => case_.year >= maxYear - 3)
      .length * 0.5;

    const finalScore = score + recentBonus;

    let lopezRole;
    if (finalScore >= p75 && finalScore > 0) {
      lopezRole = case_.year <= minYear + 2 ? 'FUNDADORA' : 'HITO';
    } else if (finalScore >= p40 && finalScore > 0) {
      lopezRole = 'CONFIRMADORA';
    } else {
      lopezRole = 'PERIFÉRICA';
    }

    await prisma.case.update({
      where: { id: case_.id },
      data: { authorityScore: finalScore, lopezRole }
    });
    updated++;
  }

  console.log(`  ✅ ${updated} casos actualizados con authorityScore y lopezRole.`);
}

main()
  .catch(e => { console.error('FATAL:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
