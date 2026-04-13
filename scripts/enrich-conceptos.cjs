/**
 * Sprint 7A — Enrich Conceptos with titulo + resumen
 * Uses Claude to generate titulo and resumen from textPreview.
 * Processes in batches of 10 conceptos per API call to minimize costs.
 *
 * Usage: node scripts/enrich-conceptos.cjs [--limit 100] [--offset 0]
 */
require('dotenv').config({ override: true });
const { PrismaClient } = require('@prisma/client');
const Anthropic = require('@anthropic-ai/sdk').default;

const prisma = new PrismaClient();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Parse CLI args
const args = process.argv.slice(2);
const limitIdx = args.indexOf('--limit');
const offsetIdx = args.indexOf('--offset');
const LIMIT = limitIdx >= 0 ? parseInt(args[limitIdx + 1]) : 12750;
const OFFSET = offsetIdx >= 0 ? parseInt(args[offsetIdx + 1]) : 0;
const BATCH_SIZE = 10; // Conceptos per Claude call
const CONCURRENCY = 3; // Parallel API calls

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Sprint 7A — Enriquecer Conceptos (titulo + resumen)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const conceptos = await prisma.concepto.findMany({
    where: { OR: [{ titulo: null }, { titulo: '' }] },
    select: { id: true, filename: true, textPreview: true, temaPrincipal: true, subtema: true, year: true },
    orderBy: { year: 'desc' },
    skip: OFFSET,
    take: LIMIT,
  });

  console.log(`\n📦 ${conceptos.length} conceptos pendientes de enriquecimiento (offset=${OFFSET}, limit=${LIMIT}).`);

  if (conceptos.length === 0) {
    console.log('✅ Todos los conceptos ya tienen título.');
    return;
  }

  let processed = 0;
  let enriched = 0;
  let errors = 0;

  // Process in batches of BATCH_SIZE, with CONCURRENCY parallel calls
  for (let i = 0; i < conceptos.length; i += BATCH_SIZE * CONCURRENCY) {
    const superBatch = conceptos.slice(i, i + BATCH_SIZE * CONCURRENCY);
    const chunks = [];
    for (let j = 0; j < superBatch.length; j += BATCH_SIZE) {
      chunks.push(superBatch.slice(j, j + BATCH_SIZE));
    }

    const promises = chunks.map(chunk => enrichBatch(chunk));
    const results = await Promise.allSettled(promises);

    for (const result of results) {
      if (result.status === 'fulfilled') {
        enriched += result.value.enriched;
        errors += result.value.errors;
        processed += result.value.processed;
      } else {
        console.error(`  ⚠️  Batch error: ${result.reason?.message}`);
        errors += BATCH_SIZE;
        processed += BATCH_SIZE;
      }
    }

    const pct = Math.round((Math.min(i + BATCH_SIZE * CONCURRENCY, conceptos.length) / conceptos.length) * 100);
    console.log(`  [${pct}%] ${processed}/${conceptos.length} — Enriched: ${enriched} | Errors: ${errors}`);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  RESULTADOS FINALES');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  ✅ Enriched:  ${enriched}`);
  console.log(`  ⚠️  Errors:    ${errors}`);
  console.log(`  Total:       ${processed}`);
}

async function enrichBatch(conceptos) {
  const result = { enriched: 0, errors: 0, processed: conceptos.length };

  const itemsText = conceptos.map((c, idx) => {
    const preview = (c.textPreview || '').substring(0, 800);
    return `[${idx}]
Archivo: ${c.filename}
Tema: ${c.temaPrincipal} — ${c.subtema}
Año: ${c.year}
Texto: ${preview}`;
  }).join('\n\n---\n\n');

  const prompt = `Eres un abogado colombiano experto en derecho societario. Para cada concepto jurídico de la Superintendencia de Sociedades, genera:
- titulo: Una línea clara y descriptiva del tema del concepto (máx 120 chars)
- resumen: 2-3 oraciones con el contenido jurídico esencial del concepto

Responde SOLO con un JSON array, sin markdown ni backticks:
[{"idx": 0, "titulo": "...", "resumen": "..."}, ...]

CONCEPTOS:

${itemsText}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    let jsonStr = response.content[0].type === 'text' ? response.content[0].text : '';
    jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
    const enrichments = JSON.parse(jsonStr);

    for (const e of enrichments) {
      if (e.idx >= 0 && e.idx < conceptos.length && e.titulo) {
        try {
          await prisma.concepto.update({
            where: { id: conceptos[e.idx].id },
            data: {
              titulo: e.titulo.substring(0, 200),
              resumen: (e.resumen || '').substring(0, 500),
            },
          });
          result.enriched++;
        } catch (dbErr) {
          result.errors++;
        }
      }
    }
  } catch (err) {
    console.error(`  ⚠️  Claude error: ${err.message?.substring(0, 100)}`);
    result.errors += conceptos.length;
  }

  return result;
}

main()
  .catch(e => { console.error('FATAL:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
