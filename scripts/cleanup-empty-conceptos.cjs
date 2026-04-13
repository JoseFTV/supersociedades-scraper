require('dotenv').config({ override: true });
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  // Find conceptos with no titulo AND empty textPreview (truly empty records)
  const empty = await p.concepto.findMany({
    where: { titulo: null, textPreview: { equals: '' } },
    select: { id: true },
  });

  console.log(`Found ${empty.length} empty conceptos (no titulo, empty textPreview).`);

  if (empty.length === 0) {
    console.log('Nothing to delete.');
    await p.$disconnect();
    return;
  }

  const ids = empty.map(c => c.id);
  const result = await p.concepto.deleteMany({ where: { id: { in: ids } } });
  console.log(`Deleted ${result.count} empty conceptos.`);

  const remaining = await p.concepto.count();
  const enriched = await p.concepto.count({ where: { titulo: { not: null } } });
  console.log(`Remaining: ${remaining} total, ${enriched} enriched (100%).`);

  await p.$disconnect();
}
main().catch(e => { console.error(e); p.$disconnect(); });
