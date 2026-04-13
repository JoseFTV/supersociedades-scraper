/**
 * Entity Resolution: Build CanonicalEntity records from Party data
 *
 * Clusters recurring parties (persons, companies) across cases using
 * normalized name matching + fuzzy dedup within clusters.
 *
 * Usage: node scripts/build-entity-resolution.cjs
 * Options:
 *   --dry-run     Print clusters without saving
 *   --min-cases N Minimum cases to qualify (default: 2)
 */

require('dotenv').config({ override: true });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const minIdx = args.indexOf('--min-cases');
const MIN_CASES = minIdx !== -1 ? parseInt(args[minIdx + 1], 10) : 2;

// ─── Normalization ───────────────────────────────────────────────────────────

function normalize(name) {
  return name
    .toUpperCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/\b(S\.?\s*A\.?\s*S?\.?|S\.?\s*A\.?\s*S\.?|LTDA\.?|S\.?\s*EN\s*C\.?|E\.?\s*U\.?)\b/g, '') // strip legal suffixes
    .replace(/[.,;:'"()\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function classifyEntityType(parties) {
  // If any party entry has type containing "Sociedad" or "Empresa", it's juridica
  const types = parties.map(p => (p.type || '').toLowerCase());
  if (types.some(t => t.includes('sociedad') || t.includes('empresa') || t.includes('compañ'))) {
    return 'PERSONA_JURIDICA';
  }
  // If name contains common corporate indicators
  const name = parties[0].name.toUpperCase();
  if (/\b(S\.?A\.?S?|LTDA|S\.?\s*EN\s*C|E\.?\s*U|INC|LLC|CORP|GROUP|HOLDINGS|COMPANY|TRADING|INVESTMENTS)\b/.test(name)) {
    return 'PERSONA_JURIDICA';
  }
  return 'PERSONA_NATURAL';
}

function pickCanonicalName(variants) {
  // Pick the most "proper case" version (not all-caps, not all-lower)
  const properCase = variants.find(v => v !== v.toUpperCase() && v !== v.toLowerCase());
  if (properCase) return properCase;
  // Otherwise title-case the most common variant
  const freq = {};
  variants.forEach(v => { freq[v] = (freq[v] || 0) + 1; });
  const mostCommon = Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
  return mostCommon
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());
}

// Levenshtein distance for fuzzy matching
function levenshtein(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function similarity(a, b) {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  ENTITY RESOLUTION: Build CanonicalEntity records');
  console.log(`  Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log(`  Min cases: ${MIN_CASES}`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  // 1. Fetch all parties with case outcomes
  const parties = await prisma.party.findMany({
    select: {
      name: true,
      role: true,
      type: true,
      caseId: true,
      case: {
        select: { outcomeGeneral: true }
      }
    }
  });

  console.log(`Total party entries: ${parties.length}`);

  // 2. Group by normalized name
  const clusters = new Map(); // normalizedName -> [{name, role, type, caseId, outcome}]
  for (const p of parties) {
    const key = normalize(p.name);
    if (key.length < 3) continue; // skip very short names
    if (!clusters.has(key)) clusters.set(key, []);
    clusters.get(key).push({
      name: p.name,
      role: p.role,
      type: p.type,
      caseId: p.caseId,
      outcome: p.case.outcomeGeneral,
    });
  }

  // 3. Merge fuzzy-similar clusters (similarity > 0.85)
  const keys = Array.from(clusters.keys());
  const merged = new Map(); // track merges: key -> canonical key
  for (let i = 0; i < keys.length; i++) {
    if (merged.has(keys[i])) continue;
    for (let j = i + 1; j < keys.length; j++) {
      if (merged.has(keys[j])) continue;
      if (similarity(keys[i], keys[j]) > 0.85) {
        // Merge j into i
        const target = clusters.get(keys[i]);
        const source = clusters.get(keys[j]);
        target.push(...source);
        merged.set(keys[j], keys[i]);
      }
    }
  }

  // Remove merged clusters
  for (const key of merged.keys()) {
    clusters.delete(key);
  }

  // 4. Filter by minimum cases
  const qualifying = [];
  for (const [key, entries] of clusters) {
    const uniqueCases = new Set(entries.map(e => e.caseId));
    if (uniqueCases.size >= MIN_CASES) {
      qualifying.push({ key, entries, uniqueCases: uniqueCases.size });
    }
  }

  qualifying.sort((a, b) => b.uniqueCases - a.uniqueCases);
  console.log(`Clusters with >= ${MIN_CASES} cases: ${qualifying.length}\n`);

  // 5. Build entities
  const entities = [];
  for (const { key, entries } of qualifying) {
    const uniqueCaseIds = [...new Set(entries.map(e => e.caseId))];
    const variants = [...new Set(entries.map(e => e.name))];
    const canonicalName = pickCanonicalName(variants);
    const entityType = classifyEntityType(entries);

    // Count roles
    const asPlaintiff = new Set(
      entries.filter(e => /demandante/i.test(e.role)).map(e => e.caseId)
    ).size;
    const asDefendant = new Set(
      entries.filter(e => /demandado/i.test(e.role)).map(e => e.caseId)
    ).size;

    // Win rate when plaintiff (deduplicated by caseId)
    // Only "Demandante prevalece" counts as a full win; Mixto/Parcial excluded
    const plaintiffCaseIds = new Set(
      entries.filter(e => /demandante/i.test(e.role)).map(e => e.caseId)
    );
    // Build a map caseId -> outcome (deduplicated)
    const caseOutcomes = new Map();
    for (const e of entries) {
      if (plaintiffCaseIds.has(e.caseId) && !caseOutcomes.has(e.caseId)) {
        caseOutcomes.set(e.caseId, e.outcome || '');
      }
    }
    let plaintiffWinCount = 0;
    for (const [, outcome] of caseOutcomes) {
      if (/demandante\s*prevalece|DEMANDANTE_GANA/i.test(outcome)) plaintiffWinCount++;
    }
    const winRate = plaintiffCaseIds.size > 0
      ? plaintiffWinCount / plaintiffCaseIds.size
      : null;

    entities.push({
      canonicalName,
      entityType,
      aliases: variants,
      totalCases: uniqueCaseIds.length,
      asPlaintiff,
      asDefendant,
      winRate,
    });
  }

  // 6. Display top entities
  console.log('Top 30 entities:');
  entities.slice(0, 30).forEach((e, i) => {
    const wr = e.winRate !== null ? ` | WR: ${(e.winRate * 100).toFixed(0)}%` : '';
    console.log(`  ${String(i + 1).padStart(2)}. ${e.canonicalName} (${e.entityType})`);
    console.log(`      Cases: ${e.totalCases} | Plt: ${e.asPlaintiff} | Def: ${e.asDefendant}${wr}`);
    if (e.aliases.length > 1) {
      console.log(`      Aliases: ${e.aliases.join(', ')}`);
    }
  });

  // 7. Save to DB
  if (!DRY_RUN) {
    // Clear existing
    await prisma.canonicalEntity.deleteMany();

    // Insert all
    const created = await prisma.canonicalEntity.createMany({
      data: entities.map(e => ({
        canonicalName: e.canonicalName,
        entityType: e.entityType,
        aliases: e.aliases,
        totalCases: e.totalCases,
        asPlaintiff: e.asPlaintiff,
        asDefendant: e.asDefendant,
        winRate: e.winRate,
      })),
    });

    console.log(`\n✓ Created ${created.count} CanonicalEntity records.`);
  } else {
    console.log(`\n[DRY RUN] Would create ${entities.length} entities.`);
  }

  // 8. Summary stats
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Total entities: ${entities.length}`);
  console.log(`  Personas naturales: ${entities.filter(e => e.entityType === 'PERSONA_NATURAL').length}`);
  console.log(`  Personas jurídicas: ${entities.filter(e => e.entityType === 'PERSONA_JURIDICA').length}`);
  const topRepeat = entities.filter(e => e.totalCases >= 3);
  console.log(`  Entities with 3+ cases: ${topRepeat.length}`);
  console.log(`  Max cases: ${entities[0]?.totalCases || 0} (${entities[0]?.canonicalName || 'N/A'})`);

  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Fatal:', err);
  prisma.$disconnect();
  process.exit(1);
});
