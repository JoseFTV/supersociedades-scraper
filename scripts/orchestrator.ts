/**
 * orchestrator.ts
 *
 * Orquestador del pipeline de ingesta multi-fuente.
 * Corre los scrapers y luego el batchUploader sobre los PDFs descargados.
 *
 * USO:
 *   npx ts-node scripts/orchestrator.ts                     → todo
 *   npx ts-node scripts/orchestrator.ts --source=tribunal   → solo Tribunales
 *   npx ts-node scripts/orchestrator.ts --source=csj        → solo CSJ
 *   npx ts-node scripts/orchestrator.ts --max=30            → máximo 30 PDFs
 *   npx ts-node scripts/orchestrator.ts --skip-scrape       → solo sube los PDFs ya descargados
 */

import { execSync, spawnSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const args      = process.argv.slice(2);
const source    = args.find(a => a.startsWith('--source='))?.split('=')[1] ?? 'all';
const maxArg    = args.find(a => a.startsWith('--max='))?.split('=')[1];
const skipScrape = args.includes('--skip-scrape');
const apiUrl    = 'http://localhost:3000/api/admin/upload';

const DOWNLOAD_DIR = path.join(process.cwd(), 'script_output', 'downloaded_pdfs', 'rama_judicial');

function log(msg: string) {
  console.log(`[Orchestrator] ${msg}`);
}

async function main() {
  console.log('\n══════════════════════════════════════════════');
  console.log('  Lexia · Pipeline de Ingesta Multi-Fuente    ');
  console.log('══════════════════════════════════════════════\n');
  log(`Fuente: ${source} | Max: ${maxArg ?? 'sin límite'} | Skip scrape: ${skipScrape}`);

  // ── Paso 1: Scraping ──────────────────────────────────────────────────────
  if (!skipScrape) {
    log('Iniciando scraper de Rama Judicial...');
    const scraperArgs = [
      'ts-node', 'scripts/scrapers/ramajudicial.ts',
      `--source=${source}`,
      ...(maxArg ? [`--max=${maxArg}`] : []),
    ];
    const result = spawnSync('npx', scraperArgs, { stdio: 'inherit', shell: true });
    if (result.status !== 0) {
      log('❌ El scraper terminó con errores. Revisa los logs de arriba.');
      log('   Tip: puedes continuar solo con el upload usando --skip-scrape');
      process.exit(1);
    }
    log('✅ Scraping completado.');
  } else {
    log('Saltando scraping (--skip-scrape activo).');
  }

  // ── Paso 2: Verificar que el servidor local esté corriendo ────────────────
  log(`Verificando servidor local en ${apiUrl}...`);
  try {
    execSync(`curl -s -o /dev/null -w "%{http_code}" ${apiUrl}`, { timeout: 5000 });
    log('✅ Servidor local detectado.');
  } catch {
    log('⚠️  No se detectó el servidor en localhost:3000.');
    log('   Asegúrate de tener corriendo: npm run dev');
    log('   Luego vuelve a correr: npx ts-node scripts/orchestrator.ts --skip-scrape');
    process.exit(1);
  }

  // ── Paso 3: Upload de los PDFs descargados ────────────────────────────────
  if (!fs.existsSync(DOWNLOAD_DIR)) {
    log(`❌ No se encontró el directorio de descarga: ${DOWNLOAD_DIR}`);
    log('   Corre primero el scraper sin --skip-scrape.');
    process.exit(1);
  }

  const pdfs = fs.readdirSync(DOWNLOAD_DIR).filter(f => f.toLowerCase().endsWith('.pdf'));
  log(`📂 ${pdfs.length} PDFs listos para subir desde: ${DOWNLOAD_DIR}`);

  if (pdfs.length === 0) {
    log('No hay PDFs nuevos que procesar. Fin.');
    return;
  }

  // Reusar batchUploader apuntando al directorio correcto
  log('Iniciando batch upload...');
  const uploaderPath = path.join(process.cwd(), 'scripts', 'batchUploader.cjs');

  // Reemplazar temporalmente el targetDir en el uploader (simple patch en memoria)
  const originalContent = fs.readFileSync(uploaderPath, 'utf8');
  const patched = originalContent.replace(
    /const targetDir = .+;/,
    `const targetDir = ${JSON.stringify(DOWNLOAD_DIR.replace(/\//g, '\\\\'))};`
  );
  const tempUploader = path.join(process.cwd(), 'scripts', '_temp_uploader.cjs');
  fs.writeFileSync(tempUploader, patched);

  try {
    spawnSync('node', [tempUploader], { stdio: 'inherit' });
    log('✅ Batch upload completado.');
  } finally {
    fs.unlinkSync(tempUploader); // Limpiar archivo temporal
  }

  console.log('\n══════════════════════════════════════════════');
  console.log('  ✅ Pipeline completo                         ');
  console.log('══════════════════════════════════════════════\n');
}

main().catch(err => {
  console.error('[Orchestrator] Error fatal:', err);
  process.exit(1);
});
