require('dotenv').config({ override: true });
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const missing = await p.case.findMany({
    where: { OR: [{ pdfBlobUrl: null }, { pdfBlobUrl: '' }] },
    select: { id: true, caseName: true, year: true },
    orderBy: { year: 'desc' },
  });

  console.log(`Cases without PDF: ${missing.length}`);
  for (const c of missing) {
    console.log(`  - [${c.year}] ${c.caseName.slice(0, 70)}`);
  }

  const total = await p.case.count();
  const withPdf = await p.case.count({ where: { pdfBlobUrl: { not: null } } });
  console.log(`\nTotal: ${total} | With PDF: ${withPdf} | Missing: ${total - withPdf}`);

  await p.$disconnect();
}
main().catch(e => { console.error(e); p.$disconnect(); });
