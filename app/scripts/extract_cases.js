import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const INPUT_DIR = path.join(__dirname, '../SuperSociedades - Sentencias');
const OUTPUT_FILE = path.join(__dirname, '../script_output/extracted_cases_ai.json');

const caseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    caseName: { type: SchemaType.STRING, description: "Nombres de las partes (e.g., 'Empresa A vs. Persona B')" },
    filingDate: { type: SchemaType.STRING, description: "Fecha de radicación o inicio (YYYY-MM-DD)" },
    decisionDate: { type: SchemaType.STRING, description: "Fecha de la decisión final de la sentencia (YYYY-MM-DD)" },
    actionType: { 
      type: SchemaType.STRING, 
      description: "Tipo de Acción Legal. Opciones exactas: 'Abuso del derecho de voto' | 'Responsabilidad de administradores' | 'Disputas societarias' | 'Desestimación de la personalidad jurídica' | 'Designación de peritos' | 'Disputas sobre causales de disolución' | 'Cumplimiento específico de acuerdos de accionistas' | 'Impugnación de decisiones sociales' | 'Reconocimiento de presupuestos de ineficacia' | 'Responsabilidad de socios y liquidadores' | 'Oposición a la reactivación de sociedades o sucursales'" 
    },
    subtopic: { 
      type: SchemaType.ARRAY, 
      items: { type: SchemaType.STRING },
      description: "Arreglo de strings con los subtemas jurídicos identificados" 
    },
    summary: { type: SchemaType.STRING, description: "Un párrafo corto que resuma toda la decisión" },
    factualBackground: { type: SchemaType.STRING, description: "Resumen de los antecedentes fácticos (Hechos probados)" },
    legalIssue: { type: SchemaType.STRING, description: "El problema jurídico analizado por el juez" },
    proceduralTrack: { type: SchemaType.STRING, description: "El trámite procesal (e.g. 'Proceso Verbal Sumario')" },
    outcomeGeneral: { 
      type: SchemaType.STRING, 
      description: "Resultado General. Opciones exactas: 'Demandante prevalece' | 'Demandado prevalece' | 'Mixto/Parcial' | 'Desestimado' | 'Transado'" 
    },
    outcomeDetailed: { type: SchemaType.STRING, description: "Resolución detallada de las pretensiones y daños" },
    parties: {
      type: SchemaType.ARRAY,
      description: "Las partes involucradas",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          role: { type: SchemaType.STRING, description: "Exactamente 'Demandante', 'Demandado', o 'Tercero'" },
          type: { type: SchemaType.STRING, description: "Exactamente 'Individuo', 'Sociedad', 'Administrador', 'Accionista', o 'Otro'" }
        }
      }
    },
    claims: {
      type: SchemaType.ARRAY,
      description: "Pretensiones principales de la demanda",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          type: { type: SchemaType.STRING, description: "Tipo de pretensión (e.g. 'Perjuicios')" },
          text: { type: SchemaType.STRING },
          requestedRemedy: { type: SchemaType.STRING }
        }
      }
    },
    remedies: {
      type: SchemaType.ARRAY,
      description: "Pretensiones concedidas/otorgadas por el juez",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          type: { type: SchemaType.STRING },
          granted: { type: SchemaType.BOOLEAN },
          detail: { type: SchemaType.STRING }
        }
      }
    },
    authorities: {
      type: SchemaType.ARRAY,
      description: "Leyes o jurisprudencia citada",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          normType: { type: SchemaType.STRING, description: "Exactamente 'Ley', 'Decreto', 'Jurisprudencia' o 'Contrato'" },
          citationText: { type: SchemaType.STRING, description: "Referencia a la norma" },
          articleNumber: { type: SchemaType.STRING }
        }
      }
    },
    strategicFlags: {
      type: SchemaType.OBJECT,
      properties: {
        standingDiscussed: { type: SchemaType.BOOLEAN, description: "Legitimación en la causa discutida" },
        jurisdictionDiscussed: { type: SchemaType.BOOLEAN, description: "Jurisdicción discutida" },
        highEvidentiaryBurden: { type: SchemaType.BOOLEAN, description: "Alta carga probatoria mencionada" },
        highestBodyAuthorization: { type: SchemaType.BOOLEAN, description: "Requisito de autorización del máximo órgano" },
        shareholderAgreementDeposit: { type: SchemaType.BOOLEAN, description: "Discusión sobre depósito de acuerdos" },
        interimRelief: { type: SchemaType.BOOLEAN, description: "Medidas cautelares decretadas" }
      }
    }
  }
};

async function processWithGemini(pdfBuffer, retries = 3) {
  const prompt = `Analiza la siguiente sentencia judicial adjunta en formato PDF y extrae los metadatos exactos de acuerdo al esquema JSON estructurado proporcionado. Asegúrate de clasificarlo correctamente en las opciones permitidas en español. Usa el año y los nombres de las partes para deducir cualquier información faltante razonablemente.`;
  
  const pdfPart = {
    inlineData: {
      data: pdfBuffer.toString("base64"),
      mimeType: "application/pdf"
    }
  };

  for (let i = 0; i < retries; i++) {
    const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
    try {
      const response = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              pdfPart
            ]
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: caseSchema,
          temperature: 0.1,
        }
      });
      
      return JSON.parse(response.response.text());
    } catch (error) {
      if (error.status === 429 && i < retries - 1) {
        console.log(`    [Rate Limit 429] Quota exceeded. Waiting 15 seconds before retry ${i + 1}/${retries}...`);
        await new Promise(resolve => setTimeout(resolve, 15000));
        continue;
      }
      console.error("AI Generation Error:", error.message || error);
      return null;
    }
  }
}

async function main() {
  if (!fs.existsSync(INPUT_DIR)) {
    console.error("Input directory not found:", INPUT_DIR);
    return;
  }
  
  if (!process.env.GEMINI_API_KEY) {
     console.error("🚨 Missing GEMINI_API_KEY in .env");
     return;
  }

  const files = fs.readdirSync(INPUT_DIR).filter(f => f.toLowerCase().endsWith('.pdf'));
  
  // Processing all available PDF files in the directory
  const targetFiles = files; 
  let extractedCases = [];

  console.log(`Starting extraction pipeline for ${targetFiles.length} local PDFs...`);

  for (let i = 0; i < targetFiles.length; i++) {
    const filename = targetFiles[i];
    console.log(`[Doc ${i+1}/${targetFiles.length}] Processing: ${filename}`);
    
    const filePath = path.join(INPUT_DIR, filename);
    
    try {
      const dataBuffer = fs.readFileSync(filePath);
      
      console.log(`  -> Sending PDF to Gemini 2.5 Flash for Multimodal Structured Extraction...`);
      const structuredData = await processWithGemini(dataBuffer);
      
      if (structuredData) {
        structuredData.id = `case-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        structuredData.sourceReference = filename;
        
        // Calculate dynamic duration
        try {
            const fDate = new Date(structuredData.filingDate);
            const dDate = new Date(structuredData.decisionDate);
            if (!isNaN(fDate) && !isNaN(dDate)) {
               const durationMonths = (dDate.getFullYear() - fDate.getFullYear()) * 12 + (dDate.getMonth() - fDate.getMonth());
               structuredData.duration = `${Math.max(1, durationMonths)} meses`;
               structuredData.year = dDate.getFullYear();
            } else {
               structuredData.duration = "12 meses";
               structuredData.year = 2020;
            }
        } catch(e) {
            structuredData.duration = "12 meses";
            structuredData.year = 2020;
        }
        
        structuredData.office = 'Delegatura para Procedimientos Mercantiles';

        // Canonicalize actionType to match taxonomy (Serie AS)
        const CANONICAL_MAP = {
          'cumplimiento específico de acuerdos de accionistas': 'Cumplimiento de acuerdos de accionistas',
          'oposición a la reactivación de sociedades o sucursales': 'Oposición a reactivación societaria',
          'ineficacia de decisiones sociales': 'Reconocimiento de presupuestos de ineficacia',
          'nulidad o inexistencia de decisiones': 'Impugnación de decisiones sociales',
          'conflictos societarios (residual)': 'Disputas societarias',
          'responsabilidad de matrices / grupos': 'Responsabilidad de matrices y controlantes',
          'acción social de responsabilidad': 'Responsabilidad de administradores',
          'responsabilidad civil de administradores': 'Responsabilidad de administradores',
          'levantamiento del velo corporativo': 'Desestimación de la personalidad jurídica',
        };
        if (structuredData.actionType) {
          const key = structuredData.actionType.toLowerCase();
          if (CANONICAL_MAP[key]) {
            structuredData.actionType = CANONICAL_MAP[key];
          }
        }

        extractedCases.push(structuredData);
        console.log(`  -> Successfully extracted case: ${structuredData.caseName}`);
      }
    } catch (e) {
      console.error(`  -> Error processing document: ${e.message}`);
    }
    
    // Rate limit sleep buffer for Free Tier (Safety margin)
    await new Promise(r => setTimeout(r, 6000));
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(extractedCases, null, 2));
  
  // Inject into mockData.ts automatically for seamless UI update
  const mockDataContent = `import { Case } from './types';\n\nexport const mockCases: Case[] = ${JSON.stringify(extractedCases, null, 2)};\n`;
  fs.writeFileSync(path.join(__dirname, '../src/lib/mockData.ts'), mockDataContent, 'utf8');
  
  console.log(`✅ Pipeline finished. Extracted ${extractedCases.length} cases to: ${OUTPUT_FILE}`);
  console.log(`✅ Updated src/lib/mockData.ts automatically!`);
}

main().catch(console.error);
