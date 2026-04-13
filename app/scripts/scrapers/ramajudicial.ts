/**
 * ramajudicial.ts
 *
 * Scraper para el portal de jurisprudencia de la Rama Judicial de Colombia.
 * Descarga sentencias de Tribunales Superiores (Sala Civil) y de la
 * Corte Suprema de Justicia (Sala de Casación Civil) que revisen
 * decisiones de la Superintendencia de Sociedades.
 *
 * Fuente: https://consultajurisprudencial.ramajudicial.gov.co
 *
 * USO:
 *   npx ts-node scripts/scrapers/ramajudicial.ts
 *   npx ts-node scripts/scrapers/ramajudicial.ts --max=50
 *   npx ts-node scripts/scrapers/ramajudicial.ts --source=csj      (solo CSJ)
 *   npx ts-node scripts/scrapers/ramajudicial.ts --source=tribunal  (solo Tribunales)
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { ensureDownloadDir, downloadPdf, sleep, sanitizeFilename, DownloadLog } from './base.js';

// ─── Configuración ───────────────────────────────────────────────────────────

const PORTAL_URL = 'https://consultajurisprudencial.ramajudicial.gov.co';

// Términos de búsqueda que apuntan a casos que vienen de Supersociedades
const SEARCH_QUERIES = [
  'Superintendencia de Sociedades',
  'supersociedades responsabilidad administradores',
  'supersociedades impugnación decisiones sociales',
  'supersociedades desestimación personalidad jurídica',
  'supersociedades abuso derecho de voto',
];

// Cortes que nos interesan (segunda instancia y casación)
const TARGET_CORPORATIONS = {
  tribunal: 'TRIBUNALES',   // Salas Civiles de Tribunales Superiores
  csj:      'CORTE SUPREMA DE JUSTICIA', // Sala de Casación Civil
};

// ─── Argparse básico ─────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const maxArg   = args.find(a => a.startsWith('--max='));
const srcArg   = args.find(a => a.startsWith('--source='));
const MAX_DOCS = maxArg ? parseInt(maxArg.split('=')[1]) : 100;
const SOURCE   = srcArg ? srcArg.split('=')[1] : 'all'; // 'all' | 'tribunal' | 'csj'

// ─── Main ─────────────────────────────────────────────────────────────────────

async function scrapeRamaJudicial() {
  const outputDir  = ensureDownloadDir('rama_judicial');
  const logPath    = path.join(outputDir, '_download_log.json');
  const log        = new DownloadLog(logPath);
  const metaPath   = path.join(outputDir, '_metadata.json');
  const metadata: any[] = fs.existsSync(metaPath) ? JSON.parse(fs.readFileSync(metaPath, 'utf8')) : [];

  console.log(`\n🔍 Iniciando scraper de Rama Judicial`);
  console.log(`   Fuente: ${SOURCE} | Máximo: ${MAX_DOCS} documentos\n`);

  const browser: Browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  let totalDownloaded = 0;

  try {
    // Determinar qué corporaciones buscar
    const corporations: string[] = [];
    if (SOURCE === 'all' || SOURCE === 'tribunal') corporations.push(TARGET_CORPORATIONS.tribunal);
    if (SOURCE === 'all' || SOURCE === 'csj')      corporations.push(TARGET_CORPORATIONS.csj);

    for (const corporation of corporations) {
      for (const query of SEARCH_QUERIES) {
        if (totalDownloaded >= MAX_DOCS) break;

        console.log(`\n📂 Corporación: ${corporation}`);
        console.log(`   Query: "${query}"`);

        const page: Page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        await page.setDefaultNavigationTimeout(60000);

        try {
          await page.goto(PORTAL_URL, { waitUntil: 'networkidle2' });
          await sleep(2000);

          // Llenar el campo de búsqueda por texto libre
          const searchInput = await page.$('input[type="text"], input[placeholder*="buscar"], input[placeholder*="Buscar"], #txtBusqueda, .search-input');
          if (!searchInput) {
            console.log('   ⚠️  No se encontró el campo de búsqueda. Verificar selector.');
            await page.close();
            continue;
          }
          await searchInput.click({ clickCount: 3 });
          await searchInput.type(query, { delay: 50 });

          // Intentar seleccionar la corporación en el filtro
          await selectCorporation(page, corporation);

          // Enviar búsqueda
          await Promise.all([
            page.keyboard.press('Enter'),
            page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {}),
          ]);
          await sleep(3000);

          // Extraer resultados de la página actual
          let pageNum = 1;
          while (totalDownloaded < MAX_DOCS) {
            const results = await extractResultsFromPage(page);
            console.log(`   Página ${pageNum}: ${results.length} resultados encontrados`);

            if (results.length === 0) break;

            for (const result of results) {
              if (totalDownloaded >= MAX_DOCS) break;
              if (!result.pdfUrl || log.has(result.pdfUrl)) continue;

              const filename = sanitizeFilename(`${corporation}_${result.caseRef || result.title}_${Date.now()}.pdf`);
              const destPath = path.join(outputDir, filename);

              try {
                console.log(`   ⬇️  Descargando: ${result.title?.slice(0, 60)}...`);
                await downloadPdf(result.pdfUrl, destPath);
                log.add(result.pdfUrl);
                metadata.push({ filename, ...result, corporation, query });
                fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2));
                totalDownloaded++;
                console.log(`   ✅ [${totalDownloaded}/${MAX_DOCS}] Guardado: ${filename}`);
              } catch (e: any) {
                console.log(`   ❌ Error descargando ${result.pdfUrl}: ${e.message}`);
              }

              await sleep(2500); // Respetar rate limits
            }

            // Intentar pasar a la siguiente página de resultados
            const hasNext = await goToNextPage(page);
            if (!hasNext) break;
            pageNum++;
            await sleep(2000);
          }

        } catch (err: any) {
          console.log(`   ❌ Error en query "${query}": ${err.message}`);
        } finally {
          await page.close();
        }

        await sleep(3000);
      }
    }

  } finally {
    await browser.close();
  }

  console.log(`\n✅ Scraping finalizado.`);
  console.log(`   Total descargado: ${totalDownloaded} PDFs`);
  console.log(`   Directorio: ${outputDir}`);
  console.log(`\n➡️  Siguiente paso: corre el batchUploader.cjs apuntando a:`);
  console.log(`   ${outputDir}\n`);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Intenta seleccionar la corporación en el filtro del portal */
async function selectCorporation(page: Page, corporation: string): Promise<void> {
  try {
    // El portal puede usar un <select> o un sistema de checkboxes/filtros
    const selectEl = await page.$('select[name*="corporacion"], select[id*="corporacion"], select[name*="corp"]');
    if (selectEl) {
      await page.select('select[name*="corporacion"], select[id*="corporacion"]', corporation);
      return;
    }

    // Alternativa: buscar un checkbox o link con el nombre de la corporación
    const links = await page.$$('a, label, span');
    for (const link of links) {
      const text = await page.evaluate(el => el.textContent?.trim(), link);
      if (text && text.toUpperCase().includes(corporation.slice(0, 15).toUpperCase())) {
        await link.click();
        await sleep(1000);
        return;
      }
    }
  } catch {
    // Si no se puede filtrar por corporación, la búsqueda de texto igual filtra bien
  }
}

/** Extrae URLs de PDF y metadatos de los resultados visibles en la página */
async function extractResultsFromPage(page: Page): Promise<Array<{
  pdfUrl: string;
  title: string;
  caseRef: string;
  date: string;
}>> {
  return page.evaluate(() => {
    const results: any[] = [];
    const rows = document.querySelectorAll('tr, .result-item, .jurisprudencia-item, li.result');

    rows.forEach(row => {
      // Buscar cualquier link que apunte a un PDF
      const links = row.querySelectorAll('a[href]');
      links.forEach(link => {
        const href = (link as HTMLAnchorElement).href;
        if (!href) return;
        if (!href.toLowerCase().includes('.pdf') &&
            !href.toLowerCase().includes('documento') &&
            !href.toLowerCase().includes('download') &&
            !href.toLowerCase().includes('getdocumento')) return;

        const fullUrl = href.startsWith('http') ? href : `https://consultajurisprudencial.ramajudicial.gov.co${href}`;
        results.push({
          pdfUrl: fullUrl,
          title:   row.querySelector('td, .title, h3, h4')?.textContent?.trim() || link.textContent?.trim() || 'Sin título',
          caseRef: row.querySelector('.radicado, .numero, td:nth-child(2)')?.textContent?.trim() || '',
          date:    row.querySelector('.fecha, td:nth-child(3)')?.textContent?.trim() || '',
        });
      });
    });

    // Deduplicar por URL
    const seen = new Set<string>();
    return results.filter(r => {
      if (seen.has(r.pdfUrl)) return false;
      seen.add(r.pdfUrl);
      return true;
    });
  });
}

/** Intenta navegar a la siguiente página de resultados. Retorna true si lo logró. */
async function goToNextPage(page: Page): Promise<boolean> {
  try {
    const nextBtn = await page.$('a.next, a[aria-label="Next"], .pagination-next a, li.next a, a:contains("Siguiente")');
    if (!nextBtn) return false;
    const isDisabled = await page.evaluate(el => el.classList.contains('disabled') || el.hasAttribute('disabled'), nextBtn);
    if (isDisabled) return false;
    await nextBtn.click();
    await page.waitForNetworkIdle({ timeout: 15000 }).catch(() => {});
    return true;
  } catch {
    return false;
  }
}

// ─── Run ──────────────────────────────────────────────────────────────────────

scrapeRamaJudicial().catch(err => {
  console.error('❌ Error fatal en scraper:', err);
  process.exit(1);
});
