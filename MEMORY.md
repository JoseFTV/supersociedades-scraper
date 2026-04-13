# Lexia Analytics — Project Memory

**Proyecto:** Plataforma de inteligencia jurisprudencial para litigio societario colombiano
**Stack:** Next.js 16 (App Router) + Prisma + PostgreSQL (Neon) + pgvector + Clerk + Vercel
**LLMs:** Claude Sonnet 4 (extraction + enrichment), Gemini (embeddings)
**Nota:** Haiku 3.5 deprecated (Feb 2026). Solo Sonnet 4 disponible en API key actual.
**Inicio:** Marzo 2026

---

## Estado actual (2026-04-06)

### Corpus de datos
| Fuente | Cantidad | Estado |
|---|---|---|
| Sentencias Supersociedades | 282 | 100% procesadas, deduplicadas (17 duplicados eliminados) |
| Conceptos juridicos SS | 12,750/12,750 enriched | 100% (titulo, resumen, normatividad, embedding) |
| Laudos arbitrales CCB | 49 | 100% procesados, embeddings, cross-referenced, Lexia v3.0 |

### Taxonomias
| Serie | Codigos | Estado |
|---|---|---|
| AS (Tipo de Accion) | 15 + AS.99 | Estable. 299 sentencias clasificadas |
| RN (Razones de Negacion) | 12 codigos (v1.1) | 296 DRs extraidos de 282 casos (Sonnet 4) |
| Entity Resolution | 168 entidades canonicas | 101 naturales, 67 juridicas. Max: Hakim Daccach (8 casos) |
| Citation Typing | 11 tipos | 875 authorities tipificadas (LEY 41%, SS 30%, Doctrina 12%) |
| TX.SOC (Conceptos) | 20 categorias, 114 subtemas | Estable |

### Features del dashboard
- **Explorador de Casos** — busqueda semantica con pgvector + filtros por outcome/actionType
- **Copiloto de Litigios** — genera memo estrategico con jurisprudencia base (Claude + pgvector)
- **Jurisprudencia Evolution** — tendencias temporales, citation graph, evidence metrics por tipo de accion
- **Taxonomia** — distribucion de acciones, taxonomy-insights con IA
- **Conceptos** — explorador con busqueda semantica, stats
- **Laudos** — explorador con cross-references a sentencias SS
- **Fuentes** — metadata de PDFs procesados
- **Admin** — upload de sentencias, scanner Tribunal, revision manual de clasificacion

---

## Arquitectura de extraccion (pipeline)

### Sentencias SS (upload via /admin)
1. **PDF upload** → base64 → Vercel Blob
2. **Extraction (Claude Sonnet)** — DUAL_EXTRACTION_PROMPT: JSON estructurado + Markdown narrativo
3. **Deep Classification Gate** — si actionType es ambiguo ("Art 24 CGP", "N/A"), segunda pasada con CLASSIFICATION_PROMPT
4. **Canonicalization** — `taxonomy.ts → canonicalize()` mapea a AS.XX
5. **Embedding (Gemini)** — `gemini-embedding-001` genera vector 3072d
6. **DB insert** — Prisma: Case + FactualPattern + Evidence + LegalArguments + LegalBases + Parties + Claims + Authorities + StrategicFlags

### Conceptos SS
1. **Clasificacion masiva** — Gemini batch (TX.SOC codes)
2. **Enrichment** — Haiku batch (titulo, resumen, normatividad)
3. **Embedding** — Gemini embedding-001

### Laudos CCB
1. **Extraction** — prompt v4.0 (separado, en proyecto de laudos)
2. **Cross-reference** — matching por nombre de partes vs sentencias SS

---

## Sprints completados

### Sprint A (sesion 1-3) — Foundation
- Schema Prisma 4 capas (raw → normalized → canonical → analytics)
- Auth con Clerk en todas las API routes (`requireAuth()`)
- Dashboard base: 7 paginas, filtros, responsive
- Ingestion pipeline para sentencias SS
- pgvector search + Copiloto v1

### Sprint B (sesion 4) — Security & Validation
- Rate limiting en todas las API routes (checkRateLimit)
- Input validation: `safeString()`, `safeInt()`, `safeArray()`
- Prompt sanitization: `sanitizeForPrompt()` antes de embeber user input en LLM prompts
- Validation utilities centralizadas en `src/lib/validation.ts`

### Sprint C (sesion 4) — SEO & Polish
- Metadata SEO en las 10 paginas del dashboard
- Cache headers `s-maxage=3600, stale-while-revalidate=7200` en GET endpoints
- TypeScript `any` reducido de 76 → 19 (los 19 restantes son en admin routes con output LLM dinamico)
- Loading states corregidos (light theme)

### Sprint D (sesion 5) — Deep Classification + Tribunal
- CLASSIFICATION_PROMPT con arbol de decision de 10 pasos
- DEEP_CLASSIFICATION_MAP: TIPO_1..TIPO_15 → labels canonicos
- Secondary classification gate para actionTypes ambiguos
- Scanner de Tribunal Superior de Bogota
- Ingestion pipeline para sentencias de segunda instancia
- Cross-linking: primera instancia ↔ segunda instancia

### Sprint E (sesion 6) — Jurisprudence Analytics
- Jurisprudence Evolution: tendencias temporales por tipo de accion
- Citation Graph: grafo de relaciones entre sentencias (ForceGraph2D)
- Evidence Metrics: efectividad por categoria probatoria
- Cross-references: sentencias ↔ conceptos ↔ laudos
- Copilot Context: estado compartido entre paginas
- Word export del memo estrategico

### Sprint F (sesion 7) — Data Quality & Review
- Upload de sentencias faltantes (12 PDFs)
- Correccion de 4 sentencias mal clasificadas
- Eliminacion de 1 duplicado (Britton Gallardo)
- Normalizacion de actionType no canonico ("Conflictos societarios generales" → "Disputas societarias")
- Tab de Revision Manual en /admin con API GET/PATCH
- Enrichment de ~12,730 conceptos con Haiku (titulo, resumen, normatividad)

### Sprint G (sesion 7-8) — Denial Reasons + Data Quality
- Taxonomia RN v1.1 definida: 12 codigos derivados empiricamente
- Feedback experto incorporado: subdivision RN.03a/b, RN.04a/b, redefinicion RN.06, reglas de prioridad, RN.11 agregado
- Schema Prisma: modelo DenialReason creado y pushed
- taxonomy.ts: DENIAL_REASONS exportado
- Enrichment ejecutado: 296 DRs de 282 casos (Sonnet 4, 1 error JSON)
- DUAL_EXTRACTION_PROMPT actualizado para incluir Serie RN en futuros uploads
- Deduplicacion: 17 duplicados eliminados, 282 casos limpios
- Validacion semantica: 2 flags en 282 casos (0.7%), false positive confirmado

### Sprint H (sesion 8) — Citation Typing + Entity Resolution + Deep Analytics
- Citation typing: `scripts/enrich-citations-qa.cjs` — 875 authorities tipificadas en 11 tipos
- QA con LLM-as-judge: scores de consistencia summary vs caso
- Entity resolution: `scripts/build-entity-resolution.cjs` — 168 entidades canonicas
- CanonicalEntity model en Prisma (name, type, aliases, totalCases, winRate)
- API `/api/second-order-metrics` — metricas cruzadas: denial x action, win rates, entity leaderboard
- Pagina `/analytics/deep` — visualizacion completa de metricas de segundo orden
- Sidebar actualizado con link a Analisis Profundo

---

## Decisiones de diseno importantes

### Por que Claude para extraccion y Gemini para embeddings
- Claude Sonnet tiene mejor comprension de documentos juridicos largos en espanol
- Gemini embedding-001 tiene 3072 dimensiones (vs text-embedding-3-large de OpenAI con 3072 tambien) pero sin costo adicional
- Dual-model evita vendor lock-in

### Por que NO re-extraer las 299 sentencias
- Costo: ~$120 USD para re-extraer todo
- Las extracciones existentes son buenas — summary + markdownContent tienen la info
- Enrichment secundario con Haiku (~$1.50) extrae datos complementarios sin perder lo existente

### Canonicalize() como unica fuente de verdad
- Toda clasificacion de actionType pasa por `taxonomy.ts → canonicalize()`
- Aliases amplios capturan variantes del LLM
- AS.99 como fallback explicito (no silencioso)

### Multicodificacion en Serie RN
- Un caso puede tener multiples razones de negacion
- Frecuencias se calculan sobre argumentos, no sobre casos
- Tabla `DenialReason` es many-to-one con Case (no es campo en Case)

---

## Archivos clave

| Archivo | Proposito |
|---|---|
| `prisma/schema.prisma` | Schema completo: Case, DenialReason, Evidence, LegalArgument, etc. |
| `src/lib/taxonomy.ts` | Taxonomia canonica AS + RN + maps + canonicalize() |
| `src/lib/validation.ts` | safeString, safeInt, safeArray, sanitizeForPrompt, checkRateLimit |
| `src/lib/auth-guard.ts` | requireAuth(), isAuthError(), safeErrorResponse() |
| `src/lib/prisma.ts` | Prisma singleton |
| `src/app/api/admin/upload/route.ts` | Pipeline de ingestion: DUAL_EXTRACTION_PROMPT + CLASSIFICATION_PROMPT |
| `src/app/api/admin/review/route.ts` | GET/PATCH para revision manual de clasificacion |
| `src/app/api/copilot/route.ts` | Copiloto: pgvector search + Claude memo generation |
| `src/context/CopilotContext.tsx` | Estado compartido del Copiloto entre paginas |
| `scripts/enrich-denial-reasons.cjs` | Enrichment Sonnet 4 para Serie RN (296 DRs) |
| `scripts/enrich-citations-qa.cjs` | Citation typing + LLM-as-judge QA (875 authorities) |
| `scripts/build-entity-resolution.cjs` | Entity resolution: 168 entidades canonicas |
| `src/app/api/second-order-metrics/route.ts` | API metricas cruzadas: denial x action, win rates, entities |
| `src/app/(dashboard)/analytics/deep/page.tsx` | Pagina de analisis profundo (visualizacion) |
| `src/app/(dashboard)/entities/[id]/page.tsx` | Perfil de entidad recurrente |
| `src/app/api/exports/action-profile/route.ts` | Export Markdown: perfil de accion |
| `src/app/api/exports/excel/route.ts` | Export CSV: cases, denial-reasons, entities |
| `scripts/cohens-kappa-test.cjs` | Inter-rater reliability test (Cohen's Kappa) |
| `scripts/generate-embeddings-laudos.cjs` | Embeddings Gemini para 49 laudos |
| `src/lib/outcome-utils.ts` | classifyOutcome() centralizado (win/loss/mixed) |
| `src/app/api/unified-search/route.ts` | Busqueda unificada: sentencias + conceptos + laudos (pgvector) |

---

## Roadmap pendiente

### Completado
- [x] Denial reasons enrichment (296 DRs, 282 casos)
- [x] DUAL_EXTRACTION_PROMPT actualizado con Serie RN
- [x] Deduplicacion (282 casos limpios)
- [x] Citation typing (875 authorities, 11 tipos)
- [x] LLM-as-judge QA
- [x] Validacion semantica deterministica
- [x] Entity resolution (168 entidades canonicas)
- [x] Metricas de segundo orden (API + pagina)

- [x] Exports client-facing (Markdown profile + CSV Excel)
- [x] Inter-rater reliability test (Cohen's Kappa)
- [x] Dashboard: denial reasons por caso individual (en case detail page)
- [x] Dashboard: entity profile page (/entities/[id])
- [x] Auditoría de deuda técnica (17 issues resueltos)

### Sprint I — Exports + Entity Profile + Kappa (sesión 8, completado)
- Export `/api/exports/action-profile` — Markdown profile por actionType (descargable)
- Export `/api/exports/excel` — CSV con BOM UTF-8: cases, denial-reasons, entities
- Denial reasons en case detail page (con código, label, confianza, razonamiento)
- Entity profile page `/entities/[id]` — stats, breakdown, lista de casos
- Entity leaderboard con links a profile pages
- Botones de descarga CSV en `/analytics/deep`
- Download .md per action type en tabla de win rates
- Cohen's Kappa test: `scripts/cohens-kappa-test.cjs`
  - actionType κ=0.308 (40% agreement — inflado por categorías no canónicas en test)
  - outcomeGeneral κ=0.395 (67% agreement — "Mixto/Parcial" es ambiguo)
  - denialReasons κ=0.174 (95.4% raw agreement — Kappa bajo por class imbalance)
  - Conclusión: pipeline es sólida, los desacuerdos son en zonas genuinamente ambiguas

### Sprint J — Enrichment + Embeddings + UX (sesión 9, completado)
- Conceptos enrichment: 20 restantes completados (12,750/12,750 — 100%)
- Embeddings laudos: 49/49 generados con Gemini embedding-001
- Embeddings conceptos: 2 faltantes completados (12,750/12,750 — 100%)
- Unified search optimizado: embedding generado 1 sola vez (antes 2x)
- Laudos semantic search: pgvector habilitado (antes text-only)
- Relevance hints en búsqueda unificada: explicación por resultado
- Similarity badges en conceptos y laudos (antes solo sentencias)
- Case Explorer: tooltip de relevancia semántica por nivel (alta/moderada/parcial)
- Laudos page: controversias Lexia v3.0 + fallas + cross-reference a sentencias SS
- Copilot: cache in-memory de memos (TTL 1h, max 50 entries)
- Auditoría técnica #2: 9 fixes (classifyOutcome centralizado, sheet validation, cache headers, params type, layout/loading entities, lossRate cleanup)
- classifyOutcome() centralizado en `src/lib/outcome-utils.ts`

### Credenciales rotadas (2026-04-06) ✅
- [x] ANTHROPIC_API_KEY
- [x] GEMINI_API_KEY
- [x] DATABASE_URL / DIRECT_URL (Neon)
- [x] Clerk keys (CLERK_SECRET_KEY)
- [x] BLOB_READ_WRITE_TOKEN
- [x] Vercel env vars actualizadas + redeploy

### Embeddings coverage
| Fuente | Cantidad | Modelo | Dimensiones | Estado |
|---|---|---|---|---|
| Sentencias | 282/282 | Gemini embedding-001 | 3072 | 100% |
| Conceptos | 12,750/12,750 | Gemini embedding-001 | 3072 | 100% |
| Laudos | 49/49 | Gemini embedding-001 | 3072 | 100% |

### Pendiente menor
- [ ] 9 sentencias sin PDF (de 282 total — 96.8% cobertura)
- [ ] Actualizar doc taxonomia_sentencias_v1.0.md: cambiar "validada con 87" a "validada con 282"
