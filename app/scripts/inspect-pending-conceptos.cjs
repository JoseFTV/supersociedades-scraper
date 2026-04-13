require('dotenv').config({ override: true });
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const pending = await p.concepto.findMany({
    where: { titulo: null },
    select: { id: true, filename: true, temaPrincipal: true, textPreview: true, sourceFile: true },
    take: 5,
  });

  for (const c of pending) {
    console.log('---');
    console.log('ID:', c.id);
    console.log('Filename:', c.filename);
    console.log('Source:', c.sourceFile);
    console.log('Tema:', c.temaPrincipal);
    console.log('TextPreview (' + c.textPreview.length + ' chars):', c.textPreview.slice(0, 200));
  }

  await p.$disconnect();
}
main().catch(e => { console.error(e); p.$disconnect(); });
