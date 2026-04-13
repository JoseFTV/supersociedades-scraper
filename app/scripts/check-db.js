import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkDb() {
  const count = await prisma.case.count();
  console.log('Total cases in database:', count);
}

checkDb()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
