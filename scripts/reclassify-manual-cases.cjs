/**
 * Sprint 7B — Reclassify cases marked "Requiere revisión manual"
 * Uses Claude to re-classify based on existing extracted data (summary, claims, factual background).
 *
 * Usage: node scripts/reclassify-manual-cases.cjs
 */
require('dotenv').config({ override: true });
const { PrismaClient } = require('@prisma/client');
const Anthropic = require('@anthropic-ai/sdk').default;

const prisma = new PrismaClient();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const DEEP_CLASSIFICATION_MAP = {
  'TIPO_1': 'Reconocimiento de presupuestos de ineficacia',
  'TIPO_2': 'Impugnación de decisiones sociales',
  'TIPO_3': 'Responsabilidad de administradores',
  'TIPO_4': 'Desestimación de la personalidad jurídica',
  'TIPO_5': 'Cláusula compromisoria',
  'TIPO_6': 'Conflictos societarios generales',
  'TIPO_7': 'Responsabilidad de matriz/controlante',
  'TIPO_8': 'Abuso del derecho de voto',
  'TIPO_9': 'Designación de peritos',
  'TIPO_10': 'Disputas sobre causales de disolución',
  'TIPO_11': 'Cumplimiento de acuerdos de accionistas',
  'TIPO_12': 'Responsabilidad de socios y liquidadores',
  'TIPO_13': 'Oposición a reactivación societaria',
  'TIPO_14': 'Conflicto de intereses de administradores',
  'TIPO_15': 'Ejecución de pactos parasociales',
  'INDETERMINADO': 'Requiere revisión manual',
};

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Sprint 7B — Reclasificar casos manuales');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const cases = await prisma.case.findMany({
    where: { actionType: 'Requiere revisión manual' },
    select: {
      id: true,
      caseName: true,
      sourceUrl: true,
      summary: true,
      factualBackground: true,
      legalIssue: true,
      outcomeGeneral: true,
      claims: { select: { type: true, text: true, requestedRemedy: true } },
      legalArguments: { select: { argument: true, legalBasis: true, party: true } },
    },
  });

  console.log(`\n🔍 ${cases.length} casos con "Requiere revisión manual".\n`);

  let reclassified = 0;
  let stillManual = 0;

  for (const c of cases) {
    const context = [
      `CASO: ${c.caseName}`,
      `ARCHIVO: ${c.sourceUrl}`,
      `RESUMEN: ${c.summary}`,
      `DISPUTA: ${c.factualBackground}`,
      `HECHO DETONANTE: ${c.legalIssue}`,
      `RESULTADO: ${c.outcomeGeneral}`,
      c.claims?.length ? `PRETENSIONES:\n${c.claims.map(cl => `- ${cl.type}: ${cl.requestedRemedy || cl.text}`).join('\n')}` : '',
      c.legalArguments?.length ? `ARGUMENTOS:\n${c.legalArguments.map(a => `- [${a.party}] ${a.argument} (${a.legalBasis})`).join('\n')}` : '',
    ].filter(Boolean).join('\n\n');

    const prompt = `Eres un clasificador legal experto en litigio societario colombiano ante la Supersociedades.

TIPOS DISPONIBLES:
${Object.entries(DEEP_CLASSIFICATION_MAP).filter(([k]) => k !== 'INDETERMINADO').map(([k, v]) => `${k}: ${v}`).join('\n')}

Con base en la siguiente información extraída de la sentencia, clasifica el tipo de acción.

${context}

Responde SOLO con JSON sin backticks:
{"action_type": "TIPO_X", "confidence": "high|medium|low", "note": "razón breve"}`;

    try {
      const result = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      });

      let jsonStr = result.content[0].type === 'text' ? result.content[0].text : '';
      jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
      const classification = JSON.parse(jsonStr);

      const newLabel = DEEP_CLASSIFICATION_MAP[classification.action_type];
      if (newLabel && newLabel !== 'Requiere revisión manual') {
        await prisma.case.update({
          where: { id: c.id },
          data: { actionType: newLabel },
        });
        console.log(`  ✅ ${c.id} (${c.sourceUrl})`);
        console.log(`     → ${newLabel} (${classification.confidence}) — ${classification.note}`);
        reclassified++;
      } else {
        console.log(`  ❓ ${c.id}: Sigue indeterminado — ${classification.note || 'sin nota'}`);
        stillManual++;
      }
    } catch (err) {
      console.error(`  ⚠️  Error en ${c.id}: ${err.message?.substring(0, 80)}`);
      stillManual++;
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  ✅ Reclasificados: ${reclassified}`);
  console.log(`  ❓ Siguen manual:  ${stillManual}`);
}

main()
  .catch(e => { console.error('FATAL:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
