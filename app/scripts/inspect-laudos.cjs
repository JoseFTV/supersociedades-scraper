require('dotenv').config({ override: true });
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const laudos = await p.laudo.findMany({
    select: {
      id: true, caseTitle: true, vertical: true, subVertical: true,
      controversies: true, failures: true, legalIssues: true,
      markdownContent: true,
    },
    take: 5,
    orderBy: { year: 'desc' },
  });

  for (const l of laudos) {
    console.log('---');
    console.log('Title:', l.caseTitle?.slice(0, 60));
    console.log('Vertical:', l.vertical, '| SubVertical:', l.subVertical);
    console.log('Controversies:', l.controversies ? JSON.stringify(l.controversies).slice(0, 200) : 'NULL');
    console.log('Failures:', l.failures ? JSON.stringify(l.failures).slice(0, 200) : 'NULL');
    console.log('LegalIssues:', l.legalIssues ? JSON.stringify(l.legalIssues).slice(0, 200) : 'NULL');
    console.log('Markdown:', l.markdownContent ? l.markdownContent.length + ' chars' : 'NULL');
  }

  // Count how many have controversies/failures
  const total = await p.laudo.count();
  const withControv = await p.laudo.count({ where: { controversies: { not: null } } });
  const withFailures = await p.laudo.count({ where: { failures: { not: null } } });
  console.log(`\nTotal: ${total} | With controversies: ${withControv} | With failures: ${withFailures}`);

  await p.$disconnect();
}
main().catch(e => { console.error(e); p.$disconnect(); });
