/**
 * Generate Gemini embeddings (3072-dim) for Conceptos
 * Enables semantic search across 12,750 conceptos.
 *
 * Usage: node scripts/generate-embeddings-conceptos.cjs [--limit 100] [--offset 0] [--batch 50]
 */
require('dotenv').config({ override: true });
const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const prisma = new PrismaClient();
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const embedModel = ai.getGenerativeModel({ model: 'gemini-embedding-001' });

// Parse CLI args
const args = process.argv.slice(2);
const getArg = (name, def) => {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 ? parseInt(args[idx + 1]) : def;
};
const LIMIT = getArg('limit', 99999);
const OFFSET = getArg('offset', 0);
const BATCH_SIZE = getArg('batch', 50); // Gemini is fast, can do larger batches
const CONCURRENCY = 5;
const RATE_DELAY_MS = 200; // Small delay between batches to respect rate limits

async function generateEmbedding(text) {
  const result = await embedModel.embedContent(text);
  return result.embedding.values;
}

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Generate Embeddings — Conceptos (Gemini 3072-dim)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Find conceptos without embeddings
  const conceptos = await prisma.$queryRawUnsafe(`
    SELECT id, titulo, resumen, "textPreview", subtema, "temaPrincipal"
    FROM "Concepto"
    WHERE embedding IS NULL
    ORDER BY year DESC
    OFFSET $1
    LIMIT $2
  `, OFFSET, LIMIT);

  console.log(`\n📦 ${conceptos.length} conceptos sin embedding (offset=${OFFSET}, limit=${LIMIT})`);

  if (conceptos.length === 0) {
    console.log('✅ Todos los conceptos ya tienen embedding.');
    await prisma.$disconnect();
    return;
  }

  let processed = 0;
  let embedded = 0;
  let errors = 0;

  for (let i = 0; i < conceptos.length; i += BATCH_SIZE * CONCURRENCY) {
    const superBatch = conceptos.slice(i, i + BATCH_SIZE * CONCURRENCY);
    const chunks = [];
    for (let j = 0; j < superBatch.length; j += BATCH_SIZE) {
      chunks.push(superBatch.slice(j, j + BATCH_SIZE));
    }

    const promises = chunks.map(chunk => processChunk(chunk));
    const results = await Promise.allSettled(promises);

    for (const result of results) {
      if (result.status === 'fulfilled') {
        embedded += result.value.embedded;
        errors += result.value.errors;
        processed += result.value.processed;
      } else {
        console.error(`  ⚠️  Chunk error: ${result.reason?.message}`);
        errors += BATCH_SIZE;
        processed += BATCH_SIZE;
      }
    }

    const pct = ((processed / conceptos.length) * 100).toFixed(0);
    console.log(`  [${pct}%] ${processed}/${conceptos.length} — Embedded: ${embedded} | Errors: ${errors}`);

    // Rate limiting
    if (i + BATCH_SIZE * CONCURRENCY < conceptos.length) {
      await new Promise(r => setTimeout(r, RATE_DELAY_MS));
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  RESULTADOS FINALES');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  ✅ Embedded:  ${embedded}`);
  console.log(`  ⚠️  Errors:    ${errors}`);
  console.log(`  Total:       ${conceptos.length}`);

  await prisma.$disconnect();
}

async function processChunk(chunk) {
  let embedded = 0;
  let errors = 0;

  for (const concepto of chunk) {
    try {
      // Build text to embed — prioritize enriched fields, fall back to textPreview
      const parts = [];
      if (concepto.titulo) parts.push(`Título: ${concepto.titulo}`);
      if (concepto.resumen) parts.push(`Resumen: ${concepto.resumen}`);
      if (concepto.subtema) parts.push(`Tema: ${concepto.subtema}`);
      if (concepto.textPreview) {
        // Use first 1000 chars of textPreview to stay within embedding limits
        parts.push(`Contenido: ${concepto.textPreview.substring(0, 1000)}`);
      }

      const textToEmbed = parts.join('\n\n');
      if (textToEmbed.length < 20) {
        errors++;
        continue;
      }

      const embedding = await generateEmbedding(textToEmbed);

      if (embedding && embedding.length > 0) {
        await prisma.$executeRawUnsafe(
          `UPDATE "Concepto" SET embedding = $1::vector WHERE id = $2`,
          `[${embedding.join(',')}]`,
          concepto.id
        );
        embedded++;
      } else {
        errors++;
      }
    } catch (err) {
      console.error(`  ⚠️  Gemini error: ${err.message?.substring(0, 80)}`);
      errors++;
      // If rate limited, wait and retry won't help in this loop — just continue
      if (err.message?.includes('429') || err.message?.includes('quota')) {
        console.log('  ⏳ Rate limited, waiting 10s...');
        await new Promise(r => setTimeout(r, 10000));
      }
    }
  }

  return { embedded, errors, processed: chunk.length };
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
