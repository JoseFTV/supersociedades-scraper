import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthError, safeErrorResponse } from '@/lib/auth-guard';

// Year pages for Tribunal Superior de Bogotá, Sala Civil sentencias
const YEAR_PAGES: { year: number; url: string }[] = [
  { year: 2024, url: 'https://www.ramajudicial.gov.co/web/tribunal-superior-de-bogota-sala-civil/171' },
  { year: 2023, url: 'https://www.ramajudicial.gov.co/web/tribunal-superior-de-bogota-sala-civil/157' },
  { year: 2022, url: 'https://www.ramajudicial.gov.co/web/tribunal-superior-de-bogota-sala-civil/138' },
  { year: 2021, url: 'https://www.ramajudicial.gov.co/web/tribunal-superior-de-bogota-sala-civil/120' },
  { year: 2020, url: 'https://www.ramajudicial.gov.co/web/tribunal-superior-de-bogota-sala-civil/111' },
];

// Keywords in TEMA that suggest a Supersociedades-related appeal
const SS_KEYWORDS = [
  'societar',
  'junta de soci',
  'asamblea de soci',
  'accionista',
  'impugnaci',
  'velo corporativo',
  'conflicto de interes',
  'accion social',
  'revisor fiscal',
  'supersociedades',
  'delegatura',
  'levantamiento velo',
  'desestimacion de personalidad',
  'nulidad de actos',
  'nulidad absoluta de decision',
  'exclusion de socio',
  'responsabilidad de administrador',
  'junta directiva',
  'abuso de mayor',
];

export interface ScrapedEntry {
  year: number;
  magistrado: string;
  expediente: string;
  tema: string;
  pdfUrl: string;
  isSSCandidate: boolean;
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function isSSRelated(tema: string): boolean {
  const normalized = normalizeText(tema);
  return SS_KEYWORDS.some((kw) => normalized.includes(kw));
}

function parseEntriesFromHtml(html: string, year: number): ScrapedEntry[] {
  const entries: ScrapedEntry[] = [];
  const BASE = 'https://www.ramajudicial.gov.co';

  // Remove scripts, styles, and comments to reduce noise
  const cleanHtml = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  // Pattern: table rows that contain a PDF link (SharePoint or ramajudicial /documents/)
  const PDF_LINK_RE =
    /href="(https?:\/\/etbcsj-my\.sharepoint\.com[^"]+|\/documents\/[^"]+|https?:\/\/www\.ramajudicial\.gov\.co\/documents\/[^"]+)"/i;

  const tableRowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch: RegExpExecArray | null;

  while ((rowMatch = tableRowRegex.exec(cleanHtml)) !== null) {
    const rowHtml = rowMatch[1];

    const linkMatch = rowHtml.match(PDF_LINK_RE);
    if (!linkMatch) continue;

    let pdfUrl = linkMatch[1];
    if (pdfUrl.startsWith('/')) pdfUrl = `${BASE}${pdfUrl}`;

    // Extract text content from each <td>
    const cells: string[] = [];
    const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    let cellMatch: RegExpExecArray | null;
    while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
      const cellText = cellMatch[1]
        .replace(/<[^>]+>/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (cellText) cells.push(cellText);
    }

    if (cells.length >= 2) {
      const magistrado = cells[0] ?? '';
      const expediente = cells.length >= 3 ? cells[1] : '';
      const tema = cells.length >= 3 ? cells[2] : cells[1];

      entries.push({
        year,
        magistrado,
        expediente,
        tema,
        pdfUrl,
        isSSCandidate: isSSRelated(tema),
      });
    }
  }

  // Fallback: look for links outside of tables (some Liferay pages use <p> or <li> layout)
  if (entries.length === 0) {
    const anchorRegex =
      /([^<]{10,200})<a[^>]+href="(https?:\/\/etbcsj-my\.sharepoint\.com[^"]+|\/documents\/[^"]+)"[^>]*>([^<]*)<\/a>/gi;
    let aMatch: RegExpExecArray | null;
    while ((aMatch = anchorRegex.exec(cleanHtml)) !== null) {
      const context = aMatch[1].replace(/\s+/g, ' ').trim();
      let pdfUrl = aMatch[2];
      if (pdfUrl.startsWith('/')) pdfUrl = `${BASE}${pdfUrl}`;
      const linkText = aMatch[3].trim();

      entries.push({
        year,
        magistrado: '',
        expediente: '',
        tema: `${context} ${linkText}`.trim(),
        pdfUrl,
        isSSCandidate: isSSRelated(`${context} ${linkText}`),
      });
    }
  }

  return entries;
}

// GET /api/admin/tribunal/scrape-index?filter=candidates (default) | all
export async function GET(req: NextRequest) {
  try {
    // Auth check — only authenticated users can scrape tribunal index
    const authResult = await requireAuth();
    if (isAuthError(authResult)) return authResult.error;

    const { searchParams } = new URL(req.url);
    const filterMode = searchParams.get('filter') ?? 'candidates';
    const yearParam = searchParams.get('year'); // Optional: single year

    const pagesToFetch = yearParam
      ? YEAR_PAGES.filter((p) => p.year === Number(yearParam))
      : YEAR_PAGES;

    const allEntries: ScrapedEntry[] = [];
    const errors: { year: number; error: string }[] = [];

    for (const { year, url } of pagesToFetch) {
      try {
        console.log(`[TribunalScraper] Fetching year ${year}: ${url}`);
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; LexiaCrawler/1.0)',
          },
        });

        if (!res.ok) {
          errors.push({ year, error: `HTTP ${res.status}` });
          continue;
        }

        const html = await res.text();
        const entries = parseEntriesFromHtml(html, year);
        console.log(`[TribunalScraper] Year ${year}: ${entries.length} entries found, ${entries.filter((e) => e.isSSCandidate).length} SS candidates`);
        allEntries.push(...entries);
      } catch (err: any) {
        errors.push({ year, error: err.message });
        console.warn(`[TribunalScraper] Error fetching year ${year}:`, err.message);
      }
    }

    const candidates = allEntries.filter((e) => e.isSSCandidate);
    const output = filterMode === 'all' ? allEntries : candidates;

    return NextResponse.json({
      total: allEntries.length,
      candidatesFound: candidates.length,
      shown: output.length,
      errors,
      entries: output,
    });
  } catch (error: unknown) {
    return safeErrorResponse(error, 'TribunalScraper');
  }
}
