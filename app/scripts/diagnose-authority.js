import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function diagnose() {
    console.log('--- EMPEZANDO DIAGNÓSTICO DE AUTHORITY ---');

    // 1. ¿Cuántas Authority hay y qué tipos existen?
    const authorityTypes = await prisma.authority.groupBy({
        by: ['normType'],
        _count: { normType: true }
    })

    // 2. Muestra de 10 Authority para ver formato exacto del campo `citationText`
    // We use normType and citationText as those are the actual fields in our schema instead of type and name.
    const sample = await prisma.authority.findMany({
        where: { normType: { in: ['Jurisprudencia', 'JURISPRUDENCIA', 'Sentencia', 'Auto', 'AUTO', 'FALLO'] } },
        take: 10,
        select: { id: true, normType: true, citationText: true, caseId: true }
    })

    // 3. ¿Cuántos Case tienen sourceReference con formato de Supersociedades?
    const casesWithRef = await prisma.case.findMany({
        take: 10,
        select: { id: true, sourceReference: true, caseName: true, year: true }
    })

    console.log('\nTIPOS DE AUTHORITY:', JSON.stringify(authorityTypes, null, 2))
    console.log('\nMUESTRA AUTHORITY JURISPRUDENCIAL:', JSON.stringify(sample, null, 2))
    console.log('\nMUESTRA CASES (Source Reference):', JSON.stringify(casesWithRef, null, 2))
}

diagnose()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
