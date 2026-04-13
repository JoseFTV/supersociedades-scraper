require('dotenv').config({ override: true });
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  // Conceptos
  const totalConceptos = await p.concepto.count();
  const [embConceptos] = await p.$queryRaw`SELECT COUNT(*) as cnt FROM "Concepto" WHERE embedding IS NOT NULL`;
  console.log(`Conceptos: ${embConceptos.cnt}/${totalConceptos} with embeddings`);

  // Laudos
  const totalLaudos = await p.laudo.count();
  const [embLaudos] = await p.$queryRaw`SELECT COUNT(*) as cnt FROM "Laudo" WHERE embedding IS NOT NULL`;
  console.log(`Laudos: ${embLaudos.cnt}/${totalLaudos} with embeddings`);

  // Cases (for reference)
  const totalCases = await p.case.count();
  const [embCases] = await p.$queryRaw`SELECT COUNT(*) as cnt FROM "Case" WHERE embedding IS NOT NULL`;
  console.log(`Cases: ${embCases.cnt}/${totalCases} with embeddings`);

  await p.$disconnect();
}
main().catch(e => { console.error(e); p.$disconnect(); });
