-- Migration: Canonicalize actionType values in Case table
-- Source: taxonomia_sentencias_supersociedades_v1.0.md (Serie AS)
-- Run this ONCE against the production database.
-- Safe to re-run (idempotent — canonical values match themselves).

BEGIN;

-- AS.02: Reconocimiento de presupuestos de ineficacia
UPDATE "Case" SET "actionType" = 'Reconocimiento de presupuestos de ineficacia'
WHERE lower("actionType") IN (
  'ineficacia de decisiones sociales',
  'ineficacia',
  'declaratoria de ineficacia',
  'presupuestos de ineficacia'
);

-- AS.03: Impugnación de decisiones sociales
UPDATE "Case" SET "actionType" = 'Impugnación de decisiones sociales'
WHERE lower("actionType") IN (
  'nulidad o inexistencia de decisiones',
  'nulidad de decisiones sociales',
  'impugnación de actos de asamblea',
  'nulidad de asamblea',
  'inexistencia de decisiones',
  'impugnación de actas'
);

-- AS.04: Disputas societarias
UPDATE "Case" SET "actionType" = 'Disputas societarias'
WHERE lower("actionType") IN (
  'conflictos societarios (residual)',
  'conflictos societarios',
  'conflicto entre socios',
  'controversia societaria',
  'conflictos societarios y derechos del socio'
);

-- AS.05: Responsabilidad de administradores
UPDATE "Case" SET "actionType" = 'Responsabilidad de administradores'
WHERE lower("actionType") IN (
  'responsabilidad de administradores',
  'responsabilidad civil de administradores',
  'acción social de responsabilidad',
  'accion social de responsabilidad',
  'responsabilidad de administradores'
);

-- AS.06: Desestimación de la personalidad jurídica
UPDATE "Case" SET "actionType" = 'Desestimación de la personalidad jurídica'
WHERE lower("actionType") IN (
  'desestimación de la personalidad jurídica',
  'levantamiento del velo corporativo',
  'levantamiento de velo corporativo',
  'velo corporativo'
);

-- AS.09: Normalize old label
UPDATE "Case" SET "actionType" = 'Cumplimiento de acuerdos de accionistas'
WHERE lower("actionType") IN (
  'cumplimiento específico de acuerdos de accionistas',
  'cumplimiento de acuerdos de accionistas',
  'ejecución de acuerdos parasociales',
  'acuerdo de accionistas',
  'pacto parasocial'
);

-- AS.11: Normalize old verbose label
UPDATE "Case" SET "actionType" = 'Oposición a reactivación societaria'
WHERE lower("actionType") IN (
  'oposición a la reactivación de sociedades o sucursales',
  'oposición a reactivación',
  'reactivación societaria'
);

-- AS.13: Responsabilidad de matrices y controlantes
UPDATE "Case" SET "actionType" = 'Responsabilidad de matrices y controlantes'
WHERE lower("actionType") IN (
  'responsabilidad de matrices / grupos',
  'responsabilidad de matrices',
  'responsabilidad del controlante',
  'abuso de control',
  'responsabilidad de grupos'
);

-- AS.99: Catch-all for unrecognized values
UPDATE "Case" SET "actionType" = 'Requiere revisión manual'
WHERE lower("actionType") IN (
  'otra',
  'no identificado',
  'n/a',
  'indeterminado',
  'otro',
  'cláusula compromisoria / arbitraje'
);

-- Clean JurisprudenceCache (keyed by old actionType values)
DELETE FROM "JurisprudenceCache";

COMMIT;

-- Verify: show final distribution
SELECT "actionType", COUNT(*) as n
FROM "Case"
GROUP BY "actionType"
ORDER BY n DESC;
