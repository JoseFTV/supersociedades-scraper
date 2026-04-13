const fs = require('fs');

const files = [
    "C:\\Users\\57310\\OneDrive - Lexia Abogados\\Documentos\\SuperSociedades - Sentencias\\Auto 2013-801-163 - Medidas cautelares - Abuso de mayorias en Farben SA (Mancilla y Correa vs Martinez y Castillo).pdf",
    "C:\\Users\\57310\\OneDrive - Lexia Abogados\\Documentos\\SuperSociedades - Sentencias\\Auto 2014-801-163 - Medidas cautelares - Abuso de mayorias capitalización (Roa Mendez vs Serrano Delgado).pdf",
    "C:\\Users\\57310\\OneDrive - Lexia Abogados\\Documentos\\SuperSociedades - Sentencias\\Auto 2015-800-128 - Medidas cautelares - Abuso de mayorias (Corredor Ospina vs Induesa Pinilla).pdf",
    "C:\\Users\\57310\\OneDrive - Lexia Abogados\\Documentos\\SuperSociedades - Sentencias\\Auto 2015-800-237 - Medidas cautelares - Abuso de mayorias (Limiti vs Limiti).pdf",
    "C:\\Users\\57310\\OneDrive - Lexia Abogados\\Documentos\\SuperSociedades - Sentencias\\Auto 2016-800-95 - Medidas cautelares - Abuso de mayorias distribucion utilidades (Crear Calle 81 vs Upper Side).pdf",
    "C:\\Users\\57310\\OneDrive - Lexia Abogados\\Documentos\\SuperSociedades - Sentencias\\Sentencia 2012-801-052 - 2013-12-19 - Nulidad por abuso de mayorias (Serviucis vs Nueva Clinica Sagrado Corazon).pdf",
    "C:\\Users\\57310\\OneDrive - Lexia Abogados\\Documentos\\SuperSociedades - Sentencias\\Sentencia 2016-02-22 - Abuso de mayorias - Desestimacion de pretensiones (Cardenas vs Cardenas).pdf",
    "C:\\Users\\57310\\OneDrive - Lexia Abogados\\Documentos\\SuperSociedades - Sentencias\\Sentencia 2016-04-04 - Abuso de mayorias - Impugnacion decisiones asamblearias (Bedoya Henao vs Sandoval y Cristal 2010).pdf",
    "C:\\Users\\57310\\OneDrive - Lexia Abogados\\Documentos\\SuperSociedades - Sentencias\\Sentencia 2017-800-00317 - 2019-08-06 - Nulidad por abuso del derecho de voto (Sforza Emprendimientos vs Proyecto Calle 100).pdf",
    "C:\\Users\\57310\\OneDrive - Lexia Abogados\\Documentos\\SuperSociedades - Sentencias\\Sentencia 2018-800-00216 - 2019-08-08 - Nulidad y accion social - Abuso del derecho (Martinez Gonzalez vs Sagrotran y otros).pdf",
    "C:\\Users\\57310\\OneDrive - Lexia Abogados\\Documentos\\SuperSociedades - Sentencias\\Nueva carpeta\\Auto 2019-800-00327 - 2020-02-11 - Medidas cautelares - Abuso de mayorias (Payan Rojas vs Amezquita y Cedelec).pdf"
];

async function main() {
    for (let i = 0; i < files.length; i++) {
        const filePath = files[i];
        console.log(`\n--- Archivo ${i + 1} de ${files.length}: ${filePath.split('\\').pop()} ---`);
        try {
            if (!fs.existsSync(filePath)) {
                console.log(`[-] Archivo no encontrado: ${filePath}`);
                continue;
            }

            const fileBuffer = fs.readFileSync(filePath);
            const blob = new Blob([fileBuffer], { type: 'application/pdf' });

            const formData = new FormData();
            formData.append('file', blob, filePath.split('\\').pop());

            console.log('Enviando a /api/upload...');
            const reqStart = Date.now();

            // Llamar al local API 
            const response = await fetch('http://localhost:3000/api/upload', {
                method: 'POST',
                headers: {
                    'x-bypass-auth': 'true' // if any auth is present
                },
                body: formData,
            });

            const responseData = await response.json();
            console.log(`HTTP ${response.status} en ${(Date.now() - reqStart) / 1000}s`);

            if (!response.ok) {
                console.error('Error de API:', responseData.error || responseData.details);
            } else {
                console.log(`[+] Éxito: ${responseData.caseId} subido y analizado dualmente (Pruebas extraídas: ${responseData.evidenceExtracted || '?'})`);
            }

        } catch (e) {
            console.error(`[-] Excepción subiendo ${filePath}:`, e.message);
        }

        if (i < files.length - 1) {
            console.log('Esperando 10 segundos para Gemini Limits...');
            await new Promise(r => setTimeout(r, 10000));
        }
    }
}

main().catch(console.error);
