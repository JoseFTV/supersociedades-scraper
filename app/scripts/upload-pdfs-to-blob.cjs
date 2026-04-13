/**
 * Sprint 6 — Re-ingest PDFs to Vercel Blob
 * Uploads existing local PDFs to Vercel Blob and updates pdfBlobUrl in DB.
 *
 * Prerequisites:
 *   - BLOB_READ_WRITE_TOKEN in .env (create Blob store in Vercel dashboard first)
 *
 * Usage: node scripts/upload-pdfs-to-blob.cjs
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { put } = require('@vercel/blob');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const PDF_DIR = path.join(__dirname, '..', 'SuperSociedades - Sentencias');
const BATCH_SIZE = 5; // Concurrent uploads per batch

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Sprint 6 — Upload PDFs to Vercel Blob');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('❌ BLOB_READ_WRITE_TOKEN no encontrado en .env');
    console.error('   Crea un Blob store en Vercel Dashboard → Storage → Blob');
    process.exit(1);
  }

  // 1. Get all cases without pdfBlobUrl
  const cases = await prisma.case.findMany({
    where: {
      OR: [
        { pdfBlobUrl: null },
        { pdfBlobUrl: '' },
      ]
    },
    select: { id: true, sourceUrl: true, caseName: true }
  });

  console.log(`\n📦 ${cases.length} casos sin PDF en Blob.`);

  // 2. Index PDF files on disk
  let pdfFiles = [];
  try {
    pdfFiles = fs.readdirSync(PDF_DIR).filter(f => f.endsWith('.pdf'));
  } catch (e) {
    console.error(`❌ No se encontró la carpeta: ${PDF_DIR}`);
    process.exit(1);
  }
  console.log(`📁 ${pdfFiles.length} PDFs en disco.\n`);

  const results = { uploaded: 0, notFound: 0, alreadyDone: 0, errors: 0 };
  const notFoundList = [];

  // 3. Process in batches
  for (let i = 0; i < cases.length; i += BATCH_SIZE) {
    const batch = cases.slice(i, i + BATCH_SIZE);

    const promises = batch.map(async (c) => {
      const pdfFile = findPdfFile(c.sourceUrl, pdfFiles);

      if (!pdfFile) {
        results.notFound++;
        if (notFoundList.length < 20) notFoundList.push(c.sourceUrl);
        return;
      }

      try {
        const filePath = path.join(PDF_DIR, pdfFile);
        const buffer = fs.readFileSync(filePath);

        // Upload to Vercel Blob
        const { url } = await put(`jurisprudencia/${pdfFile}`, buffer, {
          access: 'private',
          allowOverwrite: true,
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });

        // Update DB
        await prisma.case.update({
          where: { id: c.id },
          data: { pdfBlobUrl: url }
        });

        results.uploaded++;
      } catch (err) {
        console.error(`  ⚠️  Error uploading ${c.sourceUrl}: ${err.message}`);
        results.errors++;
      }
    });

    await Promise.all(promises);

    // Progress
    const processed = Math.min(i + BATCH_SIZE, cases.length);
    const pct = Math.round((processed / cases.length) * 100);
    console.log(`  [${pct}%] ${processed}/${cases.length} — Uploaded: ${results.uploaded} | Not found: ${results.notFound} | Errors: ${results.errors}`);
  }

  // 4. Summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  RESULTADOS FINALES');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  ✅ Uploaded:   ${results.uploaded}`);
  console.log(`  📂 Not found:  ${results.notFound}`);
  console.log(`  ⚠️  Errors:     ${results.errors}`);

  if (notFoundList.length > 0) {
    console.log('\n  PDFs no encontrados en disco:');
    notFoundList.forEach(f => console.log(`    - ${f}`));
  }

  // Verify
  const withBlob = await prisma.case.count({ where: { pdfBlobUrl: { not: null } } });
  const withBlobEmpty = await prisma.case.count({ where: { pdfBlobUrl: '' } });
  console.log(`\n📊 Estado final: ${withBlob - withBlobEmpty}/${await prisma.case.count()} casos con PDF en Blob.`);
}

/**
 * Try to find the PDF file matching a sourceUrl.
 * Level 1: Exact filename match
 * Level 2: Fuzzy match by radicado numbers
 */
function findPdfFile(sourceUrl, pdfFiles) {
  if (!sourceUrl) return null;

  // Exact match
  if (pdfFiles.includes(sourceUrl)) return sourceUrl;

  // Fuzzy: extract significant numbers and match
  const numbers = sourceUrl.match(/\d{3,}/g) || [];
  if (numbers.length > 0) {
    // Prefer match with more number overlap
    let bestMatch = null;
    let bestScore = 0;
    for (const f of pdfFiles) {
      const score = numbers.filter(n => f.includes(n)).length;
      if (score > bestScore) {
        bestScore = score;
        bestMatch = f;
      }
    }
    if (bestMatch && bestScore > 0) return bestMatch;
  }

  return null;
}

main()
  .catch(e => { console.error('FATAL:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
