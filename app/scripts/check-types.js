import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    const r = await prisma.case.groupBy({
        by: ['actionType'],
        _count: { actionType: true },
        orderBy: { _count: { actionType: 'desc' } }
    });
    console.log(r.slice(0, 5));
}
check().finally(() => window.process.exit(0));
