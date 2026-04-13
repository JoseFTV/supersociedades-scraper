import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function count() {
    const c = await prisma.citationLink.count();
    console.log(`[Status] Hay \${c} CitationLinks en la base de datos de Neon.`);
}
count().catch(console.error).finally(() => process.exit(0));
