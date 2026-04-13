/**
 * batchUploader.js
 * 
 * Script to read all PDFs from a specified directory, convert them to Base64,
 * and POST them to the local Next.js /api/admin/upload endpoint one by one.
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Target directory containing the PDFs
const targetDir = 'C:\\Users\\57310\\OneDrive - Lexia Abogados\\Documentos\\Todas las sentencias';
// Local API endpoint URL
const apiUrl = 'http://localhost:3000/api/admin/upload?mode=UPDATE';

async function processDirectory() {
  console.log(`Buscando PDFs en: ${targetDir}`);

  if (!fs.existsSync(targetDir)) {
    console.error(`¡Error! El directorio no existe: ${targetDir}`);
    return;
  }

  function getAllPdfFiles(dir) {
    let results = [];
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

  const pdfFiles = getAllPdfFiles(targetDir);

  console.log(`Se encontraron ${pdfFiles.length} archivos PDF.\n`);

  if (pdfFiles.length === 0) {
    console.log("No hay nada que subir.");
    return;
  }

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

      const response = await axios.post(apiUrl, {
        fileName: fileName,
        fileData: base64Data
      }, {
        headers: { 'Content-Type': 'application/json' },
        maxBodyLength: Infinity,
        maxContentLength: Infinity
      });

      const data = response.data;
      if (data.skipped) {
        console.log(`[~] Saltado (Ya existe en BD): ${fileName}`);
        skippedCount++;
      } else {
        console.log(`[+] ¡Éxito! Caso guardado con ID: ${data.case?.id || 'Desconocido'}`);
        successCount++;
      }
    } catch (error) {
       console.error(`[-] Excepción subiendo ${fileName}:`);
       if (error.response) {
         console.error('Status:', error.response.status);
         console.error('Data:', JSON.stringify(error.response.data));
       } else {
         console.error('Message:', error.message, '| Code:', error.code, '| Full:', error.toString());
       }
       errorCount++;
    }

    // Optional delay between requests just to be nice to the LLM rate limits
    if (i < pdfFiles.length - 1) {
      console.log(`Esperando 5 segundos antes del siguiente archivo para cuidar los Rate Limits de Gemini...`);
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  console.log(`\n================================`);
  console.log(`PROCESO FINALIZADO`);
  console.log(`Total de archivos: ${pdfFiles.length}`);
  console.log(`Nuevos subidos: ${successCount}`);
  console.log(`Saltados (Ya existían): ${skippedCount}`);
  console.log(`Errores: ${errorCount}`);
  console.log(`================================\n`);
}

processDirectory().catch(console.error);
