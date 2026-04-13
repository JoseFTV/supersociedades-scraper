import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function checkModels() {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await response.json();
    console.log(JSON.stringify(data.models.filter(m => m.name.includes('embed')), null, 2));
  } catch (e) {
    console.error(e);
  }
}

checkModels();
