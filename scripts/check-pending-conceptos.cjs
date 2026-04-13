require('dotenv').config({ override: true });
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const pending = await p.concepto.findMany({
    where: { titulo: null },
    select: { id: true, filename: true, temaPrincipal: true, textPreview: true },
    take: 20,
  });

  for (const c of pending) {
    const textLen = (c.texto || '').length;
    console.log(`ID: ${c.id} | Num: ${c.numero} | Tema: ${(c.tema || '').slice(0, 60)} | texto: ${textLen} chars`);
  }

  console.log('\nTotal pending:', pending.length);
  await p.$disconnect();
}
main().catch(e => { console.error(e); p.$disconnect(); });
