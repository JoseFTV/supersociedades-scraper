/**
 * Generate Gemini embeddings (3072-dim) for Laudos Arbitrales
 * Enables semantic search across 49 laudos.
 *
 * Usage: node scripts/generate-embeddings-laudos.cjs
 */
require('dotenv').config({ override: true });
const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const prisma = new PrismaClient();
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const embedModel = ai.getGenerativeModel({ model: 'gemini-embedding-001' });

const RATE_DELAY_MS = 300;

async function generateEmbedding(text) {
  const result = await embedModel.embedContent(text);
  return result.embedding.values;
}

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Generate Embeddings — Laudos (Gemini 3072-dim)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const laudos = await prisma.$queryRawUnsafe(`
    SELECT id, "caseTitle", vertical, "subVertical", "contractType",
           "arbitrationType", "markdownContent"
    FROM "Laudo"
    WHERE embedding IS NULL
    ORDER BY year DESC
  `);

  console.log(`\n📦 ${laudos.length} laudos sin embedding.`);

  if (laudos.length === 0) {
    console.log('✅ Todos los laudos ya tienen embedding.');
    await prisma.$disconnect();
    return;
  }

  let embedded = 0;
  let errors = 0;

  for (let i = 0; i < laudos.length; i++) {
    const laudo = laudos[i];
    try {
      // Build text to embed
      const parts = [];
      if (laudo.caseTitle) parts.push(`Caso: ${laudo.caseTitle}`);
      if (laudo.vertical) parts.push(`Vertical: ${laudo.vertical}`);
      if (laudo.subVertical) parts.push(`Sub-vertical: ${laudo.subVertical}`);
      if (laudo.contractType) parts.push(`Contrato: ${laudo.contractType}`);
      if (laudo.arbitrationType) parts.push(`Tipo: ${laudo.arbitrationType}`);
      if (laudo.markdownContent) {
        // Use first 2000 chars of markdown to stay within embedding limits
        parts.push(`Contenido:\n${laudo.markdownContent.substring(0, 2000)}`);
      }

      const textToEmbed = parts.join('\n\n');
      if (textToEmbed.length < 20) {
        console.log(`  ⚠️  [${i + 1}] ${laudo.caseTitle?.slice(0, 40)} — texto insuficiente, skip`);
        errors++;
        continue;
      }

      const embedding = await generateEmbedding(textToEmbed);

      if (embedding && embedding.length > 0) {
        await prisma.$executeRawUnsafe(
          `UPDATE "Laudo" SET embedding = $1::vector WHERE id = $2`,
          `[${embedding.join(',')}]`,
          laudo.id
        );
        embedded++;
        console.log(`  ✅ [${i + 1}/${laudos.length}] ${laudo.caseTitle?.slice(0, 50)}`);
      } else {
        errors++;
      }
    } catch (err) {
      console.error(`  ⚠️  [${i + 1}] Error: ${err.message?.substring(0, 80)}`);
      errors++;
      if (err.message?.includes('429') || err.message?.includes('quota')) {
        console.log('  ⏳ Rate limited, waiting 10s...');
        await new Promise(r => setTimeout(r, 10000));
      }
    }

    // Small delay between requests
    if (i < laudos.length - 1) {
      await new Promise(r => setTimeout(r, RATE_DELAY_MS));
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  RESULTADOS FINALES');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  ✅ Embedded:  ${embedded}`);
  console.log(`  ⚠️  Errors:    ${errors}`);
  console.log(`  Total:       ${laudos.length}`);

  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
