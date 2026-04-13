/**
 * Smart canonicalization of actionType field using keyword matching.
 * Handles the ~130 free-text Gemini variants across 292 cases.
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Ordered rules: first match wins. More specific patterns before general ones.
const RULES = [
  // AS.01 — Abuso del derecho de voto
  { pattern: /abuso\s+(del\s+)?derecho\s+de\s+voto/i, label: 'Abuso del derecho de voto' },
  { pattern: /abuso\s+de\s+(mayor[ií]a|minor[ií]a|paridad)/i, label: 'Abuso del derecho de voto' },
  { pattern: /abuso\s+de\s+formas\s+societarias/i, label: 'Abuso del derecho de voto' },
  { pattern: /voto\s+abusivo/i, label: 'Abuso del derecho de voto' },
  { pattern: /retenci[oó]n\s+sistem[aá]tica\s+de\s+utilidades/i, label: 'Abuso del derecho de voto' },

  // AS.02 — Ineficacia
  { pattern: /ineficacia/i, label: 'Reconocimiento de presupuestos de ineficacia' },
  { pattern: /presupuestos\s+(f[aá]cticos\s+)?de\s+ineficacia/i, label: 'Reconocimiento de presupuestos de ineficacia' },
  { pattern: /sanci[oó]n\s+de\s+ineficacia/i, label: 'Reconocimiento de presupuestos de ineficacia' },

  // AS.03 — Impugnación / Nulidad de decisiones
  { pattern: /nulidad\s+(absoluta\s+)?(de\s+)?(decisiones|acta|actos|contrato.*acciones|contrato.*suscripci)/i, label: 'Impugnación de decisiones sociales' },
  { pattern: /inexistencia\s+(de\s+)?(decisiones|reuniones)/i, label: 'Impugnación de decisiones sociales' },
  { pattern: /impugnaci[oó]n/i, label: 'Impugnación de decisiones sociales' },
  { pattern: /nulidad.*asamblea/i, label: 'Impugnación de decisiones sociales' },
  { pattern: /nulidad\s+(de\s+)?cesión/i, label: 'Impugnación de decisiones sociales' },
  { pattern: /nulidad\s+(absoluta\s+)?(de\s+)?contrato/i, label: 'Impugnación de decisiones sociales' },
  { pattern: /nulidad.*transferencia/i, label: 'Impugnación de decisiones sociales' },
  { pattern: /inoponibilidad\s+de\s+(decisiones|actos)/i, label: 'Impugnación de decisiones sociales' },
  { pattern: /nulidad.*disoluci[oó]n.*fraude/i, label: 'Impugnación de decisiones sociales' },
  { pattern: /validez\s+de\s+suscripci[oó]n/i, label: 'Impugnación de decisiones sociales' },
  { pattern: /suspensi[oó]n\s+de\s+(decisiones|acto|efectos)/i, label: 'Impugnación de decisiones sociales' },

  // AS.05 — Responsabilidad de administradores
  { pattern: /responsabilidad\s+(de\s+)?(administrador|gerente|liquidador|director)/i, label: 'Responsabilidad de administradores' },
  { pattern: /acci[oó]n\s+social\s+de\s+responsabilidad/i, label: 'Responsabilidad de administradores' },
  { pattern: /acci[oó]n\s+individual\s+de\s+responsabilidad/i, label: 'Responsabilidad de administradores' },
  { pattern: /responsabilidad.*administrad/i, label: 'Responsabilidad de administradores' },
  { pattern: /responsabilidad.*liquidador/i, label: 'Responsabilidad de administradores' },
  { pattern: /rendici[oó]n\s+(provocada\s+)?de\s+cuentas/i, label: 'Responsabilidad de administradores' },

  // AS.12 — Conflicto de intereses
  { pattern: /conflicto\s+de\s+inter[eé]s/i, label: 'Conflicto de intereses de administradores' },

  // AS.06 — Desestimación de la personalidad jurídica
  { pattern: /desestimaci[oó]n/i, label: 'Desestimación de la personalidad jurídica' },
  { pattern: /levantamiento\s+(del\s+)?velo/i, label: 'Desestimación de la personalidad jurídica' },

  // AS.07 — Peritos / Valoración
  { pattern: /valoraci[oó]n\s+de\s+(acciones|cuotas)/i, label: 'Designación de peritos' },
  { pattern: /fijaci[oó]n\s+(judicial\s+)?(del\s+)?valor/i, label: 'Designación de peritos' },
  { pattern: /fijaci[oó]n\s+de\s+precio/i, label: 'Designación de peritos' },
  { pattern: /proceso\s+de\s+valoraci[oó]n/i, label: 'Designación de peritos' },
  { pattern: /precio\s+de\s+reembolso/i, label: 'Designación de peritos' },

  // AS.08 — Disolución
  { pattern: /disoluci[oó]n/i, label: 'Disputas sobre causales de disolución' },

  // AS.09 — Acuerdos de accionistas
  { pattern: /acuerdo\s+de\s+accionistas/i, label: 'Cumplimiento de acuerdos de accionistas' },
  { pattern: /pacto\s+parasocial/i, label: 'Cumplimiento de acuerdos de accionistas' },

  // AS.04 — Disputas societarias (residual)
  { pattern: /conflictos?\s+societari/i, label: 'Disputas societarias' },
  { pattern: /disputa\s+societaria/i, label: 'Disputas societarias' },
  { pattern: /pago\s+de\s+dividendos/i, label: 'Disputas societarias' },
  { pattern: /distribuci[oó]n\s+de\s+utilidades/i, label: 'Disputas societarias' },
  { pattern: /restituci[oó]n\s+de\s+anticipos/i, label: 'Disputas societarias' },
  { pattern: /reconocimiento\s+de\s+calidad\s+de\s+(accionista|socio)/i, label: 'Disputas societarias' },
  { pattern: /representaci[oó]n\s+legal/i, label: 'Disputas societarias' },
  { pattern: /derecho\s+de\s+preferencia/i, label: 'Disputas societarias' },
  { pattern: /derecho\s+de\s+retiro/i, label: 'Disputas societarias' },
  { pattern: /exclusi[oó]n\s+de\s+(accionista|socio)/i, label: 'Disputas societarias' },
  { pattern: /resoluci[oó]n\s+de\s+contrato/i, label: 'Disputas societarias' },
  { pattern: /inscripci[oó]n\s+en\s+libro/i, label: 'Disputas societarias' },
  { pattern: /transferencia\s+de\s+acciones/i, label: 'Disputas societarias' },

  // Catch: clause compromissory / arbitration → AS.99 (not a substantive action type)
  { pattern: /cl[aá]usula\s+compromisoria/i, label: 'Requiere revisión manual' },
  { pattern: /excepci[oó]n\s+previa/i, label: 'Requiere revisión manual' },

  // Medidas cautelares → try to extract the underlying action
  { pattern: /medida\s+cautelar.*responsabilidad/i, label: 'Responsabilidad de administradores' },
  { pattern: /medida\s+cautelar.*abuso/i, label: 'Abuso del derecho de voto' },
  { pattern: /medida\s+cautelar.*societari/i, label: 'Disputas societarias' },
  { pattern: /medida\s+cautelar.*ineficacia/i, label: 'Reconocimiento de presupuestos de ineficacia' },
  { pattern: /medida\s+cautelar/i, label: 'Disputas societarias' }, // fallback for generic cautelares
];

function canonicalize(raw) {
  if (!raw) return { label: 'Requiere revisión manual', rule: 'null' };
  for (const rule of RULES) {
    if (rule.pattern.test(raw)) {
      return { label: rule.label, rule: rule.pattern.toString() };
    }
  }
  return { label: 'Requiere revisión manual', rule: 'no match' };
}

async function main() {
  const cases = await prisma.case.findMany({ select: { id: true, actionType: true } });
  console.log(`Total cases: ${cases.length}`);

  const updates = {};
  const unmatched = [];

  for (const c of cases) {
    const { label, rule } = canonicalize(c.actionType);
    if (label !== c.actionType) {
      if (!updates[label]) updates[label] = [];
      updates[label].push({ id: c.id, old: c.actionType });
    }
    if (label === 'Requiere revisión manual' && c.actionType !== 'Requiere revisión manual') {
      unmatched.push(c.actionType);
    }
  }

  // Show what will change
  console.log('\n=== CANONICALIZATION PLAN ===');
  for (const [label, items] of Object.entries(updates)) {
    console.log(`\n→ ${label} (${items.length} cases)`);
    const unique = [...new Set(items.map(i => i.old))];
    unique.forEach(u => console.log(`    from: "${u}"`));
  }

  if (unmatched.length > 0) {
    console.log(`\n⚠ UNMATCHED (${unmatched.length}):`);
    [...new Set(unmatched)].forEach(u => console.log(`    "${u}"`));
  }

  // Execute updates
  console.log('\n=== EXECUTING UPDATES ===');
  let totalUpdated = 0;
  for (const [label, items] of Object.entries(updates)) {
    const ids = items.map(i => i.id);
    const result = await prisma.case.updateMany({
      where: { id: { in: ids } },
      data: { actionType: label },
    });
    totalUpdated += result.count;
    console.log(`  ${label}: ${result.count} updated`);
  }

  // Clear JurisprudenceCache
  const cleared = await prisma.jurisprudenceCache.deleteMany({});
  console.log(`\nJurisprudenceCache cleared: ${cleared.count} entries`);

  console.log(`\nTotal updated: ${totalUpdated}/${cases.length}`);

  // Show final distribution
  const dist = await prisma.$queryRaw`SELECT "actionType", COUNT(*)::int as n FROM "Case" GROUP BY "actionType" ORDER BY n DESC`;
  console.log('\n=== FINAL DISTRIBUTION ===');
  dist.forEach(d => console.log(`  ${d.n}x  ${d.actionType}`));

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
