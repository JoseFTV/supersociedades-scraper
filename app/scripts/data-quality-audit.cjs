const { PrismaClient } = require("@prisma/client");
require("dotenv").config({ path: __dirname + "/../.env" });

const prisma = new PrismaClient();

async function audit() {
  const results = {};
  const totalCases = await prisma.case.count();
  results.totalCases = totalCases;
  console.log(`\n${"=".repeat(80)}`);
  console.log(`  DATA QUALITY AUDIT — Case Table (${totalCases} total cases)`);
  console.log(`${"=".repeat(80)}\n`);

  // 1. outcomeGeneral
  console.log("--- 1. outcomeGeneral ---");
  const outcomeGroups = await prisma.case.groupBy({ by: ["outcomeGeneral"], _count: true, orderBy: { _count: { outcomeGeneral: "desc" } } });
  console.table(outcomeGroups.map(g => ({ value: g.outcomeGeneral, count: g._count })));

  // 2. year
  console.log("\n--- 2. year ---");
  const invalidYears = await prisma.case.findMany({ where: { OR: [{ year: { lt: 2000 } }, { year: { gt: 2026 } }] }, select: { id: true, year: true, caseName: true } });
  console.log(`Invalid years (< 2000 or > 2026): ${invalidYears.length}`);
  if (invalidYears.length > 0) console.table(invalidYears.slice(0, 10));

  const yearDist = await prisma.case.groupBy({ by: ["year"], _count: true, orderBy: { year: "asc" } });
  console.log("Year distribution:");
  console.table(yearDist.map(g => ({ year: g.year, count: g._count })));

  // 3. duration
  console.log("\n--- 3. duration ---");
  const durationNA = await prisma.case.count({ where: { duration: "N/A" } });
  const durationEmpty = await prisma.case.count({ where: { duration: "" } });
  const durationSamples = await prisma.case.groupBy({ by: ["duration"], _count: true, orderBy: { _count: { duration: "desc" } }, take: 20 });
  console.log(`Duration = "N/A": ${durationNA}`);
  console.log(`Duration = "": ${durationEmpty}`);
  console.log("Top 20 duration values:");
  console.table(durationSamples.map(g => ({ value: g.duration, count: g._count })));

  // 4. caseName
  console.log("\n--- 4. caseName ---");
  const nameDesconocido = await prisma.case.count({ where: { caseName: { contains: "Desconocido", mode: "insensitive" } } });
  const nameEmpty = await prisma.case.count({ where: { caseName: "" } });
  const nameShort = await prisma.case.findMany({ where: { caseName: { not: "" } }, select: { id: true, caseName: true } });
  const veryShort = nameShort.filter(c => c.caseName.length < 10);
  console.log(`caseName contains "Desconocido": ${nameDesconocido}`);
  console.log(`caseName empty: ${nameEmpty}`);
  console.log(`caseName < 10 chars: ${veryShort.length}`);
  if (veryShort.length > 0) console.table(veryShort.slice(0, 10));
  if (nameDesconocido > 0) {
    const desconocidoExamples = await prisma.case.findMany({ where: { caseName: { contains: "Desconocido", mode: "insensitive" } }, select: { id: true, caseName: true }, take: 5 });
    console.log("Examples with Desconocido:");
    console.table(desconocidoExamples);
  }

  // 5. sourceReference
  console.log("\n--- 5. sourceReference ---");
  const srcWithPdf = await prisma.case.count({ where: { sourceReference: { contains: ".pdf", mode: "insensitive" } } });
  const srcEmpty = await prisma.case.count({ where: { sourceReference: "" } });
  console.log(`sourceReference contains .pdf: ${srcWithPdf}`);
  console.log(`sourceReference empty: ${srcEmpty}`);
  // Check duplicates
  const srcDuplicates = await prisma.$queryRaw`
    SELECT "sourceReference", COUNT(*) as cnt
    FROM "Case"
    GROUP BY "sourceReference"
    HAVING COUNT(*) > 1
    ORDER BY cnt DESC
    LIMIT 15`;
  console.log(`Duplicate sourceReferences (top 15):`);
  console.table(srcDuplicates.map(r => ({ sourceReference: r.sourceReference, count: Number(r.cnt) })));

  // 6. court / courtLevel
  console.log("\n--- 6. court / courtLevel ---");
  const courtDist = await prisma.case.groupBy({ by: ["court"], _count: true, orderBy: { _count: { court: "desc" } } });
  console.log("court distribution:");
  console.table(courtDist.map(g => ({ court: g.court, count: g._count })));
  const courtLevelDist = await prisma.case.groupBy({ by: ["courtLevel"], _count: true, orderBy: { _count: { courtLevel: "desc" } } });
  console.log("courtLevel distribution:");
  console.table(courtLevelDist.map(g => ({ courtLevel: g.courtLevel, count: g._count })));

  // 7. subtopics
  console.log("\n--- 7. subtopics ---");
  const withSubtopics = await prisma.case.count({ where: { subtopics: { isEmpty: false } } });
  const noSubtopics = await prisma.case.count({ where: { subtopics: { isEmpty: true } } });
  console.log(`Cases WITH subtopics: ${withSubtopics}`);
  console.log(`Cases WITHOUT subtopics (empty array): ${noSubtopics}`);

  // 8. summary
  console.log("\n--- 8. summary ---");
  const summaryEmpty = await prisma.case.count({ where: { summary: "" } });
  const allSummaries = await prisma.case.findMany({ select: { id: true, summary: true, caseName: true } });
  const shortSummaries = allSummaries.filter(c => c.summary.length > 0 && c.summary.length < 50);
  console.log(`summary empty: ${summaryEmpty}`);
  console.log(`summary < 50 chars (non-empty): ${shortSummaries.length}`);
  if (shortSummaries.length > 0) console.table(shortSummaries.slice(0, 5).map(c => ({ id: c.id, length: c.summary.length, preview: c.summary.substring(0, 80) })));

  // 9. factualBackground
  console.log("\n--- 9. factualBackground ---");
  const fbEmpty = await prisma.case.count({ where: { factualBackground: "" } });
  const allFB = await prisma.case.findMany({ select: { id: true, factualBackground: true, caseName: true } });
  const shortFB = allFB.filter(c => c.factualBackground.length > 0 && c.factualBackground.length < 50);
  console.log(`factualBackground empty: ${fbEmpty}`);
  console.log(`factualBackground < 50 chars (non-empty): ${shortFB.length}`);
  if (shortFB.length > 0) console.table(shortFB.slice(0, 5).map(c => ({ id: c.id, length: c.factualBackground.length, preview: c.factualBackground.substring(0, 80) })));

  // 10. actionType
  console.log("\n--- 10. actionType ---");
  const actionDist = await prisma.case.groupBy({ by: ["actionType"], _count: true, orderBy: { _count: { actionType: "desc" } } });
  console.log("actionType distribution:");
  console.table(actionDist.map(g => ({ actionType: g.actionType, count: g._count })));

  // 11. parties
  console.log("\n--- 11. parties ---");
  const casesWithParties = await prisma.$queryRaw`
    SELECT
      COUNT(DISTINCT c.id) FILTER (WHERE p.id IS NOT NULL) as with_parties,
      COUNT(DISTINCT c.id) FILTER (WHERE p.id IS NULL) as without_parties
    FROM "Case" c LEFT JOIN "Party" p ON c.id = p."caseId"`;
  console.log(`Cases WITH parties: ${Number(casesWithParties[0].with_parties)}`);
  console.log(`Cases WITHOUT parties: ${Number(casesWithParties[0].without_parties)}`);
  const partyStats = await prisma.$queryRaw`
    SELECT MIN(cnt) as min_parties, MAX(cnt) as max_parties, AVG(cnt)::numeric(10,1) as avg_parties
    FROM (SELECT c.id, COUNT(p.id) as cnt FROM "Case" c LEFT JOIN "Party" p ON c.id = p."caseId" GROUP BY c.id) t`;
  console.table(partyStats.map(r => ({ min: Number(r.min_parties), max: Number(r.max_parties), avg: Number(r.avg_parties) })));

  // 12. claims
  console.log("\n--- 12. claims ---");
  const casesWithClaims = await prisma.$queryRaw`
    SELECT
      COUNT(DISTINCT c.id) FILTER (WHERE cl.id IS NOT NULL) as with_claims,
      COUNT(DISTINCT c.id) FILTER (WHERE cl.id IS NULL) as without_claims
    FROM "Case" c LEFT JOIN "Claim" cl ON c.id = cl."caseId"`;
  console.log(`Cases WITH claims: ${Number(casesWithClaims[0].with_claims)}`);
  console.log(`Cases WITHOUT claims: ${Number(casesWithClaims[0].without_claims)}`);

  // 13. authorities
  console.log("\n--- 13. authorities ---");
  const casesWithAuth = await prisma.$queryRaw`
    SELECT
      COUNT(DISTINCT c.id) FILTER (WHERE a.id IS NOT NULL) as with_auth,
      COUNT(DISTINCT c.id) FILTER (WHERE a.id IS NULL) as without_auth
    FROM "Case" c LEFT JOIN "Authority" a ON c.id = a."caseId"`;
  console.log(`Cases WITH authorities: ${Number(casesWithAuth[0].with_auth)}`);
  console.log(`Cases WITHOUT authorities: ${Number(casesWithAuth[0].without_auth)}`);

  // 14. strategicFlags
  console.log("\n--- 14. strategicFlags ---");
  const sfCount = await prisma.strategicFlags.count();
  console.log(`Cases WITH strategicFlags: ${sfCount}`);
  console.log(`Cases WITHOUT strategicFlags: ${totalCases - sfCount}`);
  // Check how many have at least one true flag
  const sfWithTrue = await prisma.strategicFlags.count({
    where: {
      OR: [
        { standingDiscussed: true },
        { jurisdictionDiscussed: true },
        { highEvidentiaryBurden: true },
        { highestBodyAuthorization: true },
        { shareholderAgreementDeposit: true },
        { interimRelief: true }
      ]
    }
  });
  console.log(`StrategicFlags records with at least one TRUE flag: ${sfWithTrue}`);

  // 15. evidence
  console.log("\n--- 15. evidence ---");
  const evidenceCount = await prisma.evidence.count();
  const casesWithEvidence = await prisma.$queryRaw`SELECT COUNT(DISTINCT "caseId") as cnt FROM "Evidence"`;
  console.log(`Total evidence records: ${evidenceCount}`);
  console.log(`Cases WITH evidence: ${Number(casesWithEvidence[0].cnt)}`);
  console.log(`Cases WITHOUT evidence: ${totalCases - Number(casesWithEvidence[0].cnt)}`);

  // 16. legalArguments
  console.log("\n--- 16. legalArguments ---");
  const laCount = await prisma.legalArgument.count();
  const casesWithLA = await prisma.$queryRaw`SELECT COUNT(DISTINCT "caseId") as cnt FROM "LegalArgument"`;
  console.log(`Total legalArgument records: ${laCount}`);
  console.log(`Cases WITH legalArguments: ${Number(casesWithLA[0].cnt)}`);
  console.log(`Cases WITHOUT legalArguments: ${totalCases - Number(casesWithLA[0].cnt)}`);

  // 17. legalBases
  console.log("\n--- 17. legalBases ---");
  const lbCount = await prisma.legalBasis.count();
  const casesWithLB = await prisma.$queryRaw`SELECT COUNT(DISTINCT "caseId") as cnt FROM "LegalBasis"`;
  console.log(`Total legalBasis records: ${lbCount}`);
  console.log(`Cases WITH legalBases: ${Number(casesWithLB[0].cnt)}`);
  console.log(`Cases WITHOUT legalBases: ${totalCases - Number(casesWithLB[0].cnt)}`);

  // 18. factualPattern
  console.log("\n--- 18. factualPattern ---");
  const fpCount = await prisma.factualPattern.count();
  console.log(`Cases WITH factualPattern: ${fpCount}`);
  console.log(`Cases WITHOUT factualPattern: ${totalCases - fpCount}`);

  // 19. markdownContent
  console.log("\n--- 19. markdownContent ---");
  const mdNotNull = await prisma.case.count({ where: { markdownContent: { not: null } } });
  const mdNull = await prisma.case.count({ where: { markdownContent: null } });
  const mdEmpty = await prisma.case.count({ where: { markdownContent: "" } });
  console.log(`markdownContent NOT NULL: ${mdNotNull}`);
  console.log(`markdownContent NULL: ${mdNull}`);
  console.log(`markdownContent empty string: ${mdEmpty}`);

  // 20. pdfBlobUrl
  console.log("\n--- 20. pdfBlobUrl ---");
  const pdfNotNull = await prisma.case.count({ where: { pdfBlobUrl: { not: null } } });
  const pdfNull = await prisma.case.count({ where: { pdfBlobUrl: null } });
  console.log(`pdfBlobUrl NOT NULL: ${pdfNotNull}`);
  console.log(`pdfBlobUrl NULL: ${pdfNull}`);

  // 21. embedding
  console.log("\n--- 21. embedding ---");
  const embeddingCounts = await prisma.$queryRaw`
    SELECT
      COUNT(*) FILTER (WHERE embedding IS NOT NULL) as with_embedding,
      COUNT(*) FILTER (WHERE embedding IS NULL) as without_embedding
    FROM "Case"`;
  console.log(`Cases WITH embedding: ${Number(embeddingCounts[0].with_embedding)}`);
  console.log(`Cases WITHOUT embedding: ${Number(embeddingCounts[0].without_embedding)}`);

  // 22. citationLinks
  console.log("\n--- 22. citationLinks ---");
  const clTotal = await prisma.citationLink.count();
  const clByMethod = await prisma.citationLink.groupBy({ by: ["matchMethod"], _count: true, orderBy: { _count: { matchMethod: "desc" } } });
  const clExternal = await prisma.citationLink.count({ where: { isExternal: true } });
  const clResolved = await prisma.citationLink.count({ where: { citedCaseId: { not: null } } });
  const casesWithCitations = await prisma.$queryRaw`SELECT COUNT(DISTINCT "citingCaseId") as cnt FROM "CitationLink"`;
  console.log(`Total CitationLinks: ${clTotal}`);
  console.log(`Resolved (citedCaseId not null): ${clResolved}`);
  console.log(`External: ${clExternal}`);
  console.log(`Cases that cite others: ${Number(casesWithCitations[0].cnt)}`);
  console.log("By matchMethod:");
  console.table(clByMethod.map(g => ({ method: g.matchMethod, count: g._count })));

  // Additional checks
  console.log("\n--- ADDITIONAL: appealsOutcome / lopezRole ---");
  const appealsDist = await prisma.case.groupBy({ by: ["appealsOutcome"], _count: true, orderBy: { _count: { appealsOutcome: "desc" } } });
  console.log("appealsOutcome distribution:");
  console.table(appealsDist.map(g => ({ appealsOutcome: g.appealsOutcome || "(null)", count: g._count })));

  const lopezDist = await prisma.case.groupBy({ by: ["lopezRole"], _count: true, orderBy: { _count: { lopezRole: "desc" } } });
  console.log("lopezRole distribution:");
  console.table(lopezDist.map(g => ({ lopezRole: g.lopezRole || "(null)", count: g._count })));

  const authorityScoreStats = await prisma.$queryRaw`
    SELECT MIN("authorityScore") as min_score, MAX("authorityScore") as max_score, AVG("authorityScore")::numeric(10,2) as avg_score,
    COUNT(*) FILTER (WHERE "authorityScore" > 0) as nonzero
    FROM "Case"`;
  console.log("authorityScore stats:");
  console.table(authorityScoreStats.map(r => ({ min: Number(r.min_score), max: Number(r.max_score), avg: Number(r.avg_score), nonzero: Number(r.nonzero) })));

  console.log(`\n${"=".repeat(80)}`);
  console.log("  AUDIT COMPLETE");
  console.log(`${"=".repeat(80)}\n`);

  await prisma.$disconnect();
}

audit().catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
