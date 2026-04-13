import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';
import { POST } from '../src/app/api/admin/upload/route';
import * as dotenv from 'dotenv';

dotenv.config();

const targetDir = 'C:\\Users\\57310\\OneDrive - Lexia Abogados\\Documentos\\Antigravity\\Supersociedades\\SuperSociedades - Sentencias';

function getAllPdfFiles(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllPdfFiles(fullPath));
    } else if (file.toLowerCase().endsWith('.pdf')) {
      results.push(fullPath);
    }
  });
  return results;
}

async function main() {
  console.log(`Buscando PDFs en: ${targetDir}`);
  if (!fs.existsSync(targetDir)) {
    console.error(`¡Error! El directorio no existe: ${targetDir}`);
    return;
  }

  const pdfFiles = getAllPdfFiles(targetDir);
  console.log(`Se encontraron ${pdfFiles.length} archivos PDF.\n`);

  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < pdfFiles.length; i++) {
    const filePath = pdfFiles[i];
    const fileName = path.basename(filePath);

    console.log(`--- Archivo ${i + 1} de ${pdfFiles.length}: ${fileName} ---`);
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const base64Data = fileBuffer.toString('base64');

      // Create a mocked NextRequest
      const req = new NextRequest('http://localhost:3000/api/admin/upload?mode=UPDATE', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: fileName,
          fileData: base64Data
        })
      });

      // Invoke the Next.js Route Handler directly
      const response = await POST(req);
      const data = await response.json();

      if (response.status !== 200) {
         console.error(`[-] Error del handler (${response.status}):`, data);
         errorCount++;
         continue;
      }

      if (data.skipped) {
        console.log(`[~] Saltado (Ya existe o saltado): ${fileName}`);
        skippedCount++;
      } else {
        console.log(`[+] ¡Éxito! Caso guardado con ID: ${data.case?.id || 'Desconocido'}`);
        successCount++;
      }
    } catch (error: any) {
       console.error(`[-] Excepción subiendo ${fileName}:`, error.message);
       errorCount++;
    }

    // Rate limiting precaution for Gemini API natively
    if (i < pdfFiles.length - 1) {
      console.log(`Esperando 6 segundos por límite de tokens Gemini...`);
      await new Promise(r => setTimeout(r, 6000));
    }
  }

  console.log(`\n================================`);
  console.log(`PROCESO FINALIZADO NATIVAMENTE`);
  console.log(`Total de archivos: ${pdfFiles.length}`);
  console.log(`Nuevos subidos/actualizados: ${successCount}`);
  console.log(`Saltados: ${skippedCount}`);
  console.log(`Errores: ${errorCount}`);
  console.log(`================================`);
}

main().catch(console.error).finally(() => process.exit(0));
