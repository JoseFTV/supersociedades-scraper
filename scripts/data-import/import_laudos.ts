/**
 * Import laudos arbitrales from the Lexia corpus into the Laudo table.
 *
 * Source: lexia_corpus_normalized 2.json (49 analyzed laudos)
 *
 * Usage:
 *   npx tsx scripts/data-import/import_laudos.ts --corpus <path>
 *
 * Requires DATABASE_URL in .env
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

const CORPUS_PATH = process.argv.includes('--corpus')
  ? process.argv[process.argv.indexOf('--corpus') + 1]
  : path.join(__dirname, '../../../lexia-workspace/09_datos/lexia_corpus_normalized 2.json');

async function main() {
  console.log(`Loading corpus from: ${CORPUS_PATH}`);
  const raw = fs.readFileSync(CORPUS_PATH, 'utf-8');
  const laudos: any[] = JSON.parse(raw);
  console.log(`  Total laudos in corpus: ${laudos.length}`);

  const existingCount = await prisma.laudo.count();
  console.log(`  Already in DB: ${existingCount}`);

  let inserted = 0;
  let skipped = 0;

  for (const l of laudos) {
    // Check if already exists by case_id or title
    const existing = await prisma.laudo.findFirst({
      where: { caseTitle: l.case_title },
    });

    if (existing) {
      skipped++;
      continue;
    }

    // Extract year from timeline if available
    let year: number | null = null;
    if (l.timeline && Array.isArray(l.timeline)) {
      for (const evt of l.timeline) {
        const match = String(evt.date || evt.fecha || '').match(/\d{4}/);
        if (match) {
          year = parseInt(match[0]);
          break;
        }
      }
    }
    if (!year && l.radicado) {
      const match = String(l.radicado).match(/\d{4}/);
      if (match) year = parseInt(match[0]);
    }

    await prisma.laudo.create({
      data: {
        caseTitle: l.case_title || 'Sin título',
        arbitrationCenter: l.arbitration_center || 'CCB',
        city: l.city || null,
        arbitrationType: l.arbitration_type || null,
        awardNature: l.award_nature || null,
        cuantia: l.cuantia ? String(l.cuantia) : null,
        pages: l.pages || null,
        vertical: l.vertical || 'general',
        subVertical: l.sub_vertical || null,
        radicado: l.radicado || null,
        year,
        parties: l.parties || null,
        tribunal: l.tribunal || null,
        counsel: l.counsel || null,
        contractType: l.contract?.type || null,
        timeline: l.timeline || null,
        pretensiones: l.pretensiones || null,
        excepciones: l.excepciones || null,
        reconvencion: l.reconvencion || null,
        decision: l.decision || null,
        legalIssues: l.legal_issues || null,
        controversies: l.controversies || null,
        failures: l.failures || null,
        evidence: l.evidence || null,
        corporateData: l.corporate_data || null,
        confidenceScore: typeof l.confidence_score === 'number' ? l.confidence_score :
                         l.confidence_score === 'high' ? 0.9 :
                         l.confidence_score === 'medium' ? 0.7 :
                         l.confidence_score === 'low' ? 0.5 : null,
        needsHumanReview: Array.isArray(l.needs_human_review) ? l.needs_human_review.length > 0 :
                          Boolean(l.needs_human_review),
      },
    });
    inserted++;
  }

  console.log(`\nDone. Inserted: ${inserted}, Skipped: ${skipped}`);
  console.log(`Total laudos in DB: ${await prisma.laudo.count()}`);

  // Show vertical distribution
  const dist = await prisma.$queryRaw<{ vertical: string; _count: bigint }[]>`
    SELECT "vertical", COUNT(*) as "_count"
    FROM "Laudo"
    GROUP BY "vertical"
    ORDER BY "_count" DESC
  `;
  console.log('\nDistribution by vertical:');
  for (const row of dist) {
    console.log(`  ${row.vertical}: ${row._count}`);
  }

  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
