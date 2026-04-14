# Lexia Analytics — Claude Memory File
> Last updated: 2026-04-13
> Reference this file at the start of a new session.

---

## 0. Monorepo Structure & Deployment (Updated 2026-04-13)

**Repository:** `github.com/JoseFTV/supersociedades-scraper` (monorepo)

```
supersociedades-scraper/
├── app/             ← Next.js 16 app (Lexia Analytics)
├── scraper/         ← Python scraper (conceptos jurídicos)
├── data/            ← Taxonomías compartidas
├── vercel.json      ← CRITICAL: routes all traffic to app/
└── README.md
```

**Vercel Project:** `supersociedades-chat-gpt` (ID: `prj_9kYW1uEDXIpMtmAGzRtREdN10zfB`)
- **Production URL:** https://supersociedades-chat-gpt.vercel.app/
- **Root Directory:** `null` (NOT "app" — uses vercel.json builds instead)
- **Production Branch:** `main`
- **Framework:** Next.js (detected via `vercel.json` builds array)
- **Auto-deploy:** Triggered on push to `main` via GitHub webhook

**CRITICAL — vercel.json at repo root:**
```json
{
  "version": 2,
  "builds": [{ "src": "app/package.json", "use": "@vercel/next" }],
  "routes": [{ "src": "/(.*)", "dest": "app/$1" }]
}
```
This file is essential. Without it, Vercel uses `@vercel/static` and the app doesn't build.
Do NOT set Root Directory to "app" in Vercel — it causes the build to fail silently (224ms static build).
Do NOT delete `vercel.json` — it's the only way Vercel correctly detects and builds Next.js.

**Auth:** Clerk has been REMOVED. All auth is disabled (`requireAuth()` returns `{ userId: 'anonymous' }`).
- `middleware.ts` is a passthrough (`NextResponse.next()`)
- No login required for any page

**Other Vercel projects to ignore:**
- `app` (accidental, created by CLI) — can be deleted
- The old `supersociedadesChatGPT` repo on GitHub is archived/unused

**Scraper (Python):**
- 4 phases of tech debt remediation completed (80/80 tests pass, ruff clean)
- Key files: `scraper/src/cli.py` (run command), `scraper/src/storage.py` (merge_records)
- Run: `cd scraper && python -m src.cli run`

---

## 1. Project Overview

**Lexia Analytics** is a Colombian corporate litigation intelligence platform built with Next.js 16 (App Router), Prisma + PostgreSQL (Neon), pgvector for semantic search, and deployed on Vercel.

**Data corpus:**
- **292 sentencias** (judicial decisions from Superintendencia de Sociedades) — with embeddings (3072-dim Gemini)
- **12,750 conceptos** (administrative doctrine documents) — NO embeddings yet, text search only
- **49 laudos arbitrales** (arbitration awards, filtered to `societario` vertical only) — NO embeddings yet

**Three taxonomies (the "Triángulo de Oro"):**
- `AS.XX` — Sentencias action types (15 codes, AS.01–AS.15)
- `TX.SOC.XX` — Conceptos topic codes
- `CT.SOC.XX / B6.XX` — Laudos Lexia codes
- Cross-mapped in `src/lib/taxonomy-cross-map.ts`

---

## 2. Architecture

### Pages (App Router)
| Route | Description |
|-------|-------------|
| `/` | Landing page (public) |
| `/cases` | Case Explorer with semantic search |
| `/cases/[id]` | Case detail + PDF viewer + Triángulo de Oro |
| `/conceptos` | Conceptos distribution dashboard |
| `/laudos` | Laudos arbitrales (societario only) |
| `/search` | Unified search (semantic + text hybrid) |
| `/copilot` | AI strategic memo generator |
| `/jurisprudence` | Jurisprudence evolution charts |
| `/taxonomy` | Taxonomy explorer |
| `/analytics` | Internal dashboard |
| `/sources` | Source files overview |
| `/admin` | Admin panel |

### API Routes
| Route | Purpose |
|-------|---------|
| `/api/unified-search` | Hybrid semantic (pgvector) + text search across all 3 sources |
| `/api/cases/search` | Semantic case search |
| `/api/copilot` | Claude-powered strategic memo |
| `/api/pdf-proxy` | Proxy for private Vercel Blob PDFs |
| `/api/cross-references` | Triángulo de Oro cross-taxonomy lookup |
| `/api/conceptos` | Conceptos CRUD + search |
| `/api/conceptos/stats` | Conceptos statistics |
| `/api/laudos` | Laudos (hardcoded to societario) |
| `/api/taxonomy-insights` | AI taxonomy insights |
| `/api/jurisprudence-evolution` | Time-series data |
| `/api/jurisprudence-graph` | Citation graph data |
| `/api/evidence-metrics` | Evidence analytics |
| `/api/admin/upload` | Batch upload to Vercel Blob (private) |
| `/api/admin/resolve-citations` | Citation resolution endpoint |
| `/api/admin/tribunal/*` | Tribunal scraping/ingest |

### Key Lib Files
| File | Purpose |
|------|---------|
| `src/lib/taxonomy.ts` | 15 AS codes with aliases, `canonicalize()` function, `ACTION_TYPE_BY_CODE` map |
| `src/lib/taxonomy-cross-map.ts` | Cross-mapping AS ↔ TX.SOC ↔ CT.SOC, `CROSS_MAP` array, helper functions |
| `src/lib/taxonomy-conceptos.ts` | TX.SOC taxonomy definitions |
| `src/lib/relevance-notes.ts` | Claude-powered relevance note generation for Triángulo de Oro |
| `src/lib/prisma.ts` | Prisma singleton |
| `src/lib/types.ts` | Shared TypeScript types |

### Scripts (local, run with `node scripts/X.cjs`)
| Script | Purpose | Status |
|--------|---------|--------|
| `enrich-conceptos.cjs` | Add titulo/resumen to conceptos via Claude | ⚠️ Was running — check progress |
| `reclassify-manual-cases.cjs` | Reclassify 13 "revisión manual" cases | ✅ Done |
| `resolve-citations.cjs` | 4-level citation matching + López Medina scoring | ✅ Done (402 authorities) |
| `upload-pdfs-to-blob.cjs` | Upload PDFs to Vercel Blob private store | ✅ Done (277/292) |
| `canonicalize_action_types.cjs` | Normalize actionType strings to AS codes | ✅ Done |
| `data-quality-audit.cjs` | Data quality checks | Available |

### Key Components
| Component | File |
|-----------|------|
| `Sidebar` | `src/components/Sidebar.tsx` |
| `CaseExplorerClient` | `src/components/CaseExplorerClient.tsx` |
| `TaxonomyClient` | `src/components/TaxonomyClient.tsx` |
| `LaudosClient` | `src/app/(dashboard)/laudos/LaudosClient.tsx` |
| `ConceptosClient` | `src/app/(dashboard)/conceptos/ConceptosClient.tsx` |
| `JurisprudenceClient` | `src/app/(dashboard)/jurisprudence/JurisprudenceClient.tsx` |

---

## 3. Environment Variables (Vercel + Local)

| Variable | Purpose | Status |
|----------|---------|--------|
| `DATABASE_URL` | Neon pooled connection | ✅ |
| `DIRECT_URL` | Neon direct connection | ✅ |
| `ANTHROPIC_API_KEY` | Claude API (relevance notes, copilot, reclassification) | ✅ |
| `GEMINI_API_KEY` | Gemini embeddings for semantic search | ⚠️ **Missing in Vercel — ADD THIS** |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob private store | ✅ |
| `NEXT_PUBLIC_CLERK_*` | Clerk auth keys (REMOVED — auth disabled) | ❌ No longer needed |

**Important:** Scripts need `require('dotenv').config({ override: true })` because system env vars may exist as empty strings.

---

## 4. Completed Sprints

| Sprint | What | Commit |
|--------|------|--------|
| 1-3 | Claude migration, Prisma singleton, laudos page, bug fixes | `56637d2` |
| 4 | Cross-references (Triángulo de Oro), unified search, sidebar link | `61d298b` |
| 5 | Citation graph resolution (402 authorities, López Medina scores) | `7c77a6d` |
| 6 | Upload 277 PDFs to Vercel Blob | `3287f6f` |
| 7 | Laudos solo societario + reclassify 13 manual cases + enrich conceptos script | `5d859b0` |
| — | PDF proxy for private Blob + taxonomy fixes (AS.15) | `048b347` |
| — | AI relevance notes + semantic search + cross-map completion | `3dfb026` |
| — | Scraper tech debt: 4 phases (merge_records, concurrency, tests, CI) | `e19dba2` |
| — | Remove Clerk auth (middleware passthrough, anonymous userId) | `e19dba2` |
| — | Monorepo: combine scraper + app repos via git subtree | `e19dba2` |
| — | Fix Vercel deploy: vercel.json with @vercel/next builder + routes | `274b563` |
| — | Apply Lexia design system to /analytics/deep page | `ca70088` |

---

## 5. PENDING TASKS (Start Here)

### 🔴 Critical / Immediate

1. **Add GEMINI_API_KEY to Vercel Environment Variables**
   - Without this, unified search falls back to text-only in production
   - Go to Vercel → Settings → Environment Variables → Add `GEMINI_API_KEY`
   - Then redeploy: `npx vercel --prod --force`

2. **Finish Sprint 7A enrichment (890 conceptos remaining)**
   - 11,830/12,720 conceptos enriched with titulo/resumen via Claude
   - Last 890 failed due to Anthropic API credit balance running out
   - Re-run after topping up credits: `node scripts/enrich-conceptos.cjs --offset 11830`
   - Verify: `SELECT COUNT(*) FROM "Concepto" WHERE titulo IS NOT NULL;`

### 🟡 Medium Priority — Platform Polish

3. **Add AI relevance explanations to search results**
   - Currently search shows results but doesn't explain WHY each result is relevant
   - Could add a per-result 1-liner from Claude (expensive) or template-based explanation
   - File: `src/app/(dashboard)/search/page.tsx`

4. **Add semantic search explanation to Case Explorer**
   - `src/components/CaseExplorerClient.tsx` shows similarity % but no explanation
   - Could add tooltip: "Matched because: [factual pattern / legal issue]"

5. **Generate embeddings for conceptos**
   - Currently only sentencias have 3072-dim Gemini embeddings
   - Would enable semantic search across conceptos (currently text-only)
   - Need a script similar to existing embedding generation

6. **Generate embeddings for laudos**
   - Same as above, for the 49 laudos
   - Small corpus, quick to process

7. **15 sentencias missing PDFs**
   - 277/292 uploaded; 15 didn't match filenames on disk
   - Need to manually identify which PDFs correspond to those cases
   - Check: `SELECT id, "caseName" FROM "Case" WHERE "pdfBlobUrl" IS NULL;`

### 🟢 Nice to Have — Future Sprints

8. **Jurisprudence Evolution — case relevance context**
   - Add context to "Top Casos Recientes" explaining strategic significance
   - File: `src/app/(dashboard)/jurisprudence/JurisprudenceClient.tsx`

9. **Taxonomy — recent cases relevance**
   - Add explanations under each case in expanded taxonomy categories
   - File: `src/components/TaxonomyClient.tsx`

10. **Laudos page — cross-reference to sentencias/conceptos**
    - Currently laudos page is standalone; could show related sentencias
    - File: `src/app/(dashboard)/laudos/LaudosClient.tsx`

11. **Copilot improvements**
    - Consider caching generated memos
    - Add export to Word/PDF
    - File: `src/app/(dashboard)/copilot/page.tsx`

---

## 6. Technical Notes

### Semantic Search Architecture
- Sentencias: Gemini embedding (3072-dim) → pgvector cosine distance (`<=>` operator)
- Unified search generates query embedding at request time, compares via `ORDER BY embedding <=> $1::vector`
- Falls back to Prisma text search (`contains`, `mode: 'insensitive'`) if embedding fails
- Results include `searchMethod: 'semantic' | 'text'` and `similarity` score

### Vercel Blob (Private Store)
- All PDFs uploaded with `access: 'private'`
- Cannot be loaded directly in iframes — use `/api/pdf-proxy?caseId=X`
- Proxy fetches with `Authorization: Bearer ${BLOB_READ_WRITE_TOKEN}` and streams

### Prisma + pgvector
- Extension enabled in schema: `extensions = [vector]`
- Embedding queries use `$queryRawUnsafe` (Prisma doesn't natively support vector ops)
- Schema: `embedding Unsupported("vector(3072)")?`

### Deployment
- **Auto-deploy:** Push to `main` triggers Vercel build automatically via GitHub webhook
- **Manual deploy:** `npx vercel --prod --force` from repo root (NOT from `app/`)
- The `vercel.json` at repo root is CRITICAL — uses `@vercel/next` builder with `app/package.json`
- Without it, Vercel CLI falls back to `@vercel/static` (224ms build, 404 on all pages)
- Do NOT set Root Directory in Vercel project settings — leave it null
- Production URL: https://supersociedades-chat-gpt.vercel.app/

### Claude Usage
- `claude-sonnet-4-20250514` for: relevance notes, copilot memos, reclassification, enrichment
- Single-call batching pattern (multiple items in one prompt, JSON response)
- Prompt language: Spanish (legal domain)

### López Medina Citation Authority
- Sentencias have `lopezMedinaScore` field on `Authority` model
- Categories: HITO (landmark) → FUNDADORA → CONFIRMADORA → PERIFÉRICA
- Resolved by `scripts/resolve-citations.cjs` (4-level matching: exact → fuzzy → external → AI)
