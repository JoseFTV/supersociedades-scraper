import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { copilotPromptV2 } from './src/prompts/copilot_v2';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function main() {
  const factPattern = 'Nuestro cliente es el accionista minoritario (15%) de una constructora. El gerente general vendió a espaldas de todos el lote más valioso de la empresa a una sociedad donde el mismo gerente es socio mayoritario, a un precio tres veces menor al avalúo comercial. La venta nunca se discutió en asamblea.';
  console.log('[1/4] Hechos de Usuario:', factPattern.substring(0, 100) + '...');

  const embeddingModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
  const result = await embeddingModel.embedContent(factPattern);
  const embedding = result.embedding.values;
  const embeddingString = `[${embedding.join(',')}]`;

  console.log('[2/4] Buscando en DB Vectorial (pgvector)...');
  const similarCases: any[] = await prisma.$queryRawUnsafe(`
      SELECT 
        id, 
        "sourceReference",
        "caseName", 
        "year",
        COALESCE("markdownContent", "summary") as "markdownContent",
        1 - (embedding <=> $1::vector) as similarity
      FROM "Case"
      ORDER BY embedding <=> $1::vector
      LIMIT 3;
    `, embeddingString);

  console.log(`[3/4] Recuperados ${similarCases.length} Casos Clave. Generando V2 (Gemini 2.5 Pro)...`);
  const contextText = similarCases.map((c, index) => `
    [DOCUMENTO #${index + 1}]
    REFERENCIA: ${c.sourceReference}
    AÑO: ${c.year}
    CONTENIDO:
    ${c.markdownContent}
    -------------------
  `).join('\n');

  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.5-pro'
  });

  const startTime = Date.now();
  const finalPrompt = copilotPromptV2(factPattern, contextText);
  const response = await model.generateContent(finalPrompt);
  
  const memoText = response.response.text();
  console.log(`\n\n[4/4] 🔥 MEMORANDO "Estándar Lexia" (Tomó ${(Date.now() - startTime)/1000}s):\n`);
  console.log(memoText.substring(0, 800));
  console.log('\n(...Truncado...)\n');
}

main().catch(console.error).finally(async () => { await prisma.$disconnect() });
