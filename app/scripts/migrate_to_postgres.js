import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

// Using dotnv to load variables
import 'dotenv/config';

const prisma = new PrismaClient();
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const EMBEDDING_MODEL = 'gemini-embedding-001';

async function generateEmbedding(text) {
  try {
    const model = ai.getGenerativeModel({ model: EMBEDDING_MODEL });
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

async function migrate() {
  console.log('Starting migration to Neon PostgreSQL with pgvector...');
  
  // Read extracted cases from script output
  const dataPath = path.join(process.cwd(), 'script_output', 'extracted_cases_ai.json');
  if (!fs.existsSync(dataPath)) {
    console.error('Extraction output file not found. Have you successfully run extract_cases.js?');
    process.exit(1);
  }

  const casesToMigrate = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  console.log(`Found ${casesToMigrate.length} cases to migrate.`);

  // Clean existing data for safety re-runs
  console.log('Cleaning existing database...');
  await prisma.case.deleteMany();

  for (let i = 0; i < casesToMigrate.length; i++) {
    const caseData = casesToMigrate[i];
    console.log(`[${i + 1}/${casesToMigrate.length}] Processing case: ${caseData.caseName}`);

    // Generate Embeddings for Semantic Search combining Summary & Factual Background
    const textToEmbed = `Summary: ${caseData.summary}\n\nFacts: ${caseData.factualBackground}`;
    const embedding = await generateEmbedding(textToEmbed);

    // Filter out invalid/empty items specifically
    const validParties = (caseData.parties || []).filter(p => p && p.name);
    const validClaims = (caseData.claims || []).filter(c => c && c.text);
    const validRemedies = (caseData.remedies || []).filter(r => r && r.type);
    const validAuthorities = (caseData.authorities || []).filter(a => a && a.citationText);

    // Save to Postgres
    const createdCase = await prisma.case.create({
      data: {
        id: caseData.id,
        caseName: caseData.caseName,
        sourceReference: caseData.sourceReference,
        sourceUrl: caseData.sourceUrl || '',
        filingDate: caseData.filingDate,
        decisionDate: caseData.decisionDate,
        duration: caseData.duration,
        year: Number(caseData.year) || new Date(caseData.decisionDate).getFullYear() || 2020,
        office: caseData.office,
        actionType: caseData.actionType,
        subtopics: caseData.subtopic || [],
        summary: caseData.summary,
        factualBackground: caseData.factualBackground,
        legalIssue: caseData.legalIssue,
        proceduralTrack: caseData.proceduralTrack,
        outcomeGeneral: caseData.outcomeGeneral,
        outcomeDetailed: caseData.outcomeDetailed,
        
        // Nested Relations Creation
        parties: { create: validParties.map(p => ({
          name: p.name,
          role: p.role || 'Otro',
          type: p.type || 'Otro'
        })) },
        claims: { create: validClaims.map(c => ({
          type: c.type || 'Petición',
          text: c.text,
          requestedRemedy: c.requestedRemedy || ''
        })) },
        remedies: { create: validRemedies.map(r => ({
          type: r.type,
          granted: r.granted === true || String(r.granted).toLowerCase() === 'true',
          detail: r.detail || ''
        })) },
        authorities: { create: validAuthorities.map(a => ({
          normType: a.normType || 'Ley',
          citationText: a.citationText,
          articleNumber: a.articleNumber || ''
        })) },
        strategicFlags: caseData.strategicFlags ? { 
          create: {
            standingDiscussed: caseData.strategicFlags.standingDiscussed || false,
            jurisdictionDiscussed: caseData.strategicFlags.jurisdictionDiscussed || false,
            highEvidentiaryBurden: caseData.strategicFlags.highEvidentiaryBurden || false,
            highestBodyAuthorization: caseData.strategicFlags.highestBodyAuthorization || false,
            shareholderAgreementDeposit: caseData.strategicFlags.shareholderAgreementDeposit || false,
            interimRelief: caseData.strategicFlags.interimRelief || false,
          }
        } : undefined
      }
    });

    // 4. Update vector column using raw SQL 
    // Prisma does not fully support pgvector yet in the `create` block directly without preview strings
    // But we can $executeRawUnsafe to inject the array
    if (embedding && embedding.length > 0) {
      await prisma.$executeRawUnsafe(
        `UPDATE "Case" SET embedding = $1::vector WHERE id = $2`,
        `[${embedding.join(',')}]`,
        createdCase.id
      );
      console.log(`  -> Vector computed and stored (${embedding.length} dims)`);
    }
  }

  console.log('✅ Migration to Postgres completed successfully!');
}

migrate()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
