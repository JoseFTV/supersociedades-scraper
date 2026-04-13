require('dotenv').config({ override: true });
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const total = await p.concepto.count();
  const enriched = await p.concepto.count({ where: { titulo: { not: null } } });
  const pending = await p.concepto.count({ where: { titulo: null } });
  console.log('Total:', total);
  console.log('Enriched:', enriched);
  console.log('Pending:', pending);
  await p.$disconnect();
}
main().catch(e => { console.error(e); p.$disconnect(); });
