import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();
const prisma = new PrismaClient();

async function check() {
  const t = await prisma.case.count();
  const m = await prisma.case.count({ where: { markdownContent: { not: null } } });
  console.log(`\n\n=== REPORTE DE INGESTA ===\nTOTAL CASOS: ${t}\nPROCESADOS CON GEMINI VISION: ${m}\nFALTANTES: ${t-m}\n==========================\n\n`);
}

check().catch(console.error).finally(() => { prisma.$disconnect(); setTimeout(() => process.exit(0), 1000); });
