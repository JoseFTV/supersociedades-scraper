import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

async function cleanWithGemini(caseIds: string[]) {
    console.log(`[Admin] Initiating Gemini fallback to clean ${caseIds.length} complex references...`);
    const cases = await prisma.case.findMany({
        where: { id: { in: caseIds } },
        select: { id: true, sourceReference: true, caseName: true }
    });

    let geminiCleaned = 0;
    for (const case_ of cases) {
        const prompt = `
El siguiente texto es el nombre de archivo PDF de una sentencia de la Superintendencia de Sociedades de Colombia.
Extrae ÚNICAMENTE el número de radicado oficial (ej: "Auto 800-456 de 2019" o "Sentencia 810-6 de 2017").
Si no puedes identificar un radicado, responde null.
Responde SOLO con JSON sin markdown: {"radicado": "string o null"}

TEXTO: "${case_.sourceReference}"
`;
        try {
            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0 }
            });

            let jsonString = result.response.text();
            if (jsonString.includes('`')) {
                jsonString = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
            }
            const parsed = JSON.parse(jsonString);
            if (parsed.radicado && parsed.radicado !== "null") {
                await prisma.case.update({
                    where: { id: case_.id },
                    data: { sourceReference: parsed.radicado }
                });
                geminiCleaned++;
                console.log(`[Gemini] Limpiado: ${case_.sourceReference.substring(0, 40)}... -> ${parsed.radicado}`);
            } else {
                console.log(`[Gemini] No pudo limpiar: ${case_.sourceReference}`);
            }

            // Very brief delay to respect rate limit on free tier if applicable
            await new Promise(r => setTimeout(r, 1000));
        } catch (e: any) {
            console.log(`[Gemini] Error con ${case_.sourceReference}:`, e.message);
        }
    }
    return geminiCleaned;
}

async function sanitizeSourceReferences() {
    const cases = await prisma.case.findMany({
        select: { id: true, sourceReference: true }
    });

    const PDF_PATTERNS = [
        // Extraer radicado de strings como:
        // "Auto 2013-801-118 - 2013-09-25 - Medidas cautelares (Diaz vs Noreña).pdf"
        /(?:Auto|Sentencia|Providencia)\s+[\w\-\.]+(?=\s*[-–]|\s*\(|\.pdf)/gi,
        // Números de radicado puros: 2013-801-118, 800-00456, 810-6
        /\b(?:20\d{2}-\d{3}-\d{3,6}|\d{3}-\d{4,6})\b/g,
    ];

    const results = { cleaned: 0, skipped: 0, needsGeminiCount: 0, geminiCleaned: 0 };
    const needsGemini: string[] = [];

    for (const case_ of cases) {
        const raw = case_.sourceReference;
        if (!raw) continue;

        // Si ya es un radicado limpio (no contiene .pdf ni rutas), saltar
        if (!raw.includes('.pdf') && !raw.includes('/') && raw.length < 60) {
            results.skipped++;
            continue;
        }

        // Intentar extracción por regex
        let cleaned: string | null = null;
        for (const pattern of PDF_PATTERNS) {
            const match = raw.match(pattern);
            if (match) { cleaned = match[0].trim(); break; }
        }

        // Limpieza adicional de '.pdf' errante al final si lo cogió
        if (cleaned && cleaned.toLowerCase().endsWith('.pdf')) {
            cleaned = cleaned.substring(0, cleaned.length - 4);
        }

        if (cleaned) {
            await prisma.case.update({
                where: { id: case_.id },
                data: { sourceReference: cleaned }
            });
            results.cleaned++;
            console.log(`[Regex] Limpiado: ${raw.substring(0, 40)}... -> ${cleaned}`);
        } else {
            needsGemini.push(case_.id);
        }
    }

    results.needsGeminiCount = needsGemini.length;

    if (needsGemini.length > 0) {
        results.geminiCleaned = await cleanWithGemini(needsGemini);
    }

    console.log('--- SANEAMIENTO COMPLETADO ---');
    console.log(JSON.stringify(results, null, 2));
}

sanitizeSourceReferences().finally(() => window.process ? window.process.exit(0) : process.exit(0));
