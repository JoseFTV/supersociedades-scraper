require('dotenv').config({ override: true });
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  // Distribution of actionType across 282 cases
  const dist = await p.case.groupBy({
    by: ['actionType'],
    _count: true,
    orderBy: { _count: { actionType: 'desc' } },
  });

  console.log('=== Action Type Distribution (282 cases) ===\n');
  let total = 0;
  for (const row of dist) {
    const count = typeof row._count === 'number' ? row._count : row._count?.actionType || 0;
    total += count;
    const pct = ((count / 282) * 100).toFixed(1);
    console.log(`  ${String(count).padStart(4)} (${pct.padStart(5)}%)  ${row.actionType}`);
  }
  console.log(`\n  Total: ${total}`);
  console.log(`  Distinct action types: ${dist.length}`);

  // Check for AS.99 or uncategorized
  const uncategorized = await p.case.count({
    where: { OR: [
      { actionType: { contains: 'AS.99' } },
      { actionType: { contains: 'Otro' } },
      { actionType: { contains: 'residual' } },
      { actionType: { contains: 'general' } },
    ]},
  });
  console.log(`\n  Potentially uncategorized (AS.99/Otro/residual/general): ${uncategorized}`);

  await p.$disconnect();
}
main().catch(e => { console.error(e); p.$disconnect(); });
