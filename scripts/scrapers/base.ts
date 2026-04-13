import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';

export const DOWNLOAD_DIR = path.join(process.cwd(), 'script_output', 'downloaded_pdfs');

/** Crea el directorio de descarga si no existe */
export function ensureDownloadDir(subdir: string): string {
  const dir = path.join(DOWNLOAD_DIR, subdir);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/** Descarga un PDF desde una URL y lo guarda en disco. Retorna la ruta local. */
export function downloadPdf(url: string, destPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    const protocol = url.startsWith('https') ? https : http;

    protocol.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        // Seguir redirecciones
        file.close();
        fs.unlinkSync(destPath);
        downloadPdf(res.headers.location!, destPath).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        file.close();
        fs.unlinkSync(destPath);
        reject(new Error(`HTTP ${res.statusCode} al descargar ${url}`));
        return;
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(destPath); });
    }).on('error', (err) => {
      fs.unlinkSync(destPath);
      reject(err);
    });
  });
}

/** Espera N milisegundos */
export const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

/** Sanitiza un nombre de archivo */
export function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_\-\.]/g, '_').slice(0, 120);
}

/** Registra en un log JSON los PDFs ya descargados para no repetir */
export class DownloadLog {
  private logPath: string;
  private downloaded: Set<string>;

  constructor(logFile: string) {
    this.logPath = logFile;
    if (fs.existsSync(logFile)) {
      const raw = JSON.parse(fs.readFileSync(logFile, 'utf8'));
      this.downloaded = new Set(raw);
    } else {
      this.downloaded = new Set();
    }
  }

  has(url: string): boolean { return this.downloaded.has(url); }

  add(url: string): void {
    this.downloaded.add(url);
    fs.writeFileSync(this.logPath, JSON.stringify([...this.downloaded], null, 2));
  }
}
