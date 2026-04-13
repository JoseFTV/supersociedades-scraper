/**
 * Import 12,758 classified conceptos into the Concepto table.
 *
 * Sources:
 *   - data/exports/all_classified.csv  (idx, file, filename, year, tema_principal, tema_secundario, subtema, confianza)
 *   - data/exports/all_texts.jsonl     (file, year, filename, text_preview)
 *
 * Usage:
 *   npx tsx scripts/data-import/import_conceptos.ts --csv <path> --texts <path>
 *
 * Requires DATABASE_URL in .env
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

const prisma = new PrismaClient();

const CSV_PATH = process.argv.includes('--csv')
  ? process.argv[process.argv.indexOf('--csv') + 1]
  : path.join(__dirname, '../../../scraper-supersociedades/data/exports/all_classified.csv');

const TEXTS_PATH = process.argv.includes('--texts')
  ? process.argv[process.argv.indexOf('--texts') + 1]
  : path.join(__dirname, '../../../scraper-supersociedades/data/exports/all_texts.jsonl');

const BATCH_SIZE = 200;

interface ClassifiedRow {
  idx: string;
  file: string;
  filename: string;
  year: string;
  tema_principal: string;
  tema_secundario: string;
  subtema: string;
  confianza: string;
}

interface TextRecord {
  file: string;
  year: string;
  filename: string;
  text_preview: string;
}

async function loadTexts(textsPath: string): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const rl = readline.createInterface({
    input: fs.createReadStream(textsPath, { encoding: 'utf-8' }),
    crlfDelay: Infinity,
  });
  for await (const line of rl) {
    try {
      const rec: TextRecord = JSON.parse(line);
      map.set(rec.filename, rec.text_preview);
    } catch {}
  }
  return map;
}

function parseCSV(csvPath: string): ClassifiedRow[] {
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n').filter(Boolean);
  const header = lines[0].split(',');
  const rows: ClassifiedRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const row: any = {};
    header.forEach((h, idx) => {
      row[h.trim()] = values[idx]?.trim() ?? '';
    });
    rows.push(row as ClassifiedRow);
  }
  return rows;
}

async function main() {
  console.log('Loading text previews...');
  const textsMap = await loadTexts(TEXTS_PATH);
  console.log(`  Loaded ${textsMap.size} text previews`);

  console.log('Parsing classification CSV...');
  const rows = parseCSV(CSV_PATH);
  console.log(`  Parsed ${rows.length} classified rows`);

  // Check how many already exist
  const existingCount = await prisma.concepto.count();
  console.log(`  Already in DB: ${existingCount}`);

  if (existingCount >= rows.length) {
    console.log('All conceptos already imported. Done.');
    return;
  }

  // Get existing filenames to skip
  const existingFilenames = new Set(
    (await prisma.concepto.findMany({ select: { filename: true } })).map(c => c.filename)
  );

  const toInsert = rows.filter(r => !existingFilenames.has(r.filename));
  console.log(`  To insert: ${toInsert.length}`);

  let inserted = 0;
  for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
    const batch = toInsert.slice(i, i + BATCH_SIZE);

    const data = batch.map(row => ({
      filename: row.filename,
      year: parseInt(row.year) || 2000,
      sourceFile: row.file,
      textPreview: textsMap.get(row.filename) ?? '',
      temaPrincipal: row.tema_principal,
      temaSecundario: row.tema_secundario || null,
      subtema: row.subtema || '',
      confianza: parseFloat(row.confianza) || 0.0,
    }));

    await prisma.concepto.createMany({
      data,
      skipDuplicates: true,
    });

    inserted += batch.length;
    if (inserted % 1000 === 0 || inserted === toInsert.length) {
      console.log(`  Inserted ${inserted}/${toInsert.length}`);
    }
  }

  const finalCount = await prisma.concepto.count();
  console.log(`\nDone. Total conceptos in DB: ${finalCount}`);

  // Show distribution
  const dist = await prisma.$queryRaw<{ temaPrincipal: string; _count: bigint }[]>`
    SELECT "temaPrincipal", COUNT(*) as "_count"
    FROM "Concepto"
    GROUP BY "temaPrincipal"
    ORDER BY "_count" DESC
  `;
  console.log('\nDistribution:');
  for (const row of dist) {
    console.log(`  ${row.temaPrincipal}: ${row._count}`);
  }

  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
