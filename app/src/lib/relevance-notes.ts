import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' });

export interface RelevanceItem {
  id: string;
  type: 'concepto' | 'laudo';
  title: string;
  detail: string;
}

export interface RelevanceNote {
  id: string;
  note: string;
}

/**
 * Generates short (1-2 sentence) relevance notes explaining WHY each item
 * is relevant to the current case. Uses a single Claude call for all items.
 */
export async function generateRelevanceNotes(
  caseContext: {
    caseName: string;
    actionType: string;
    summary: string;
    factualBackground: string;
  },
  items: RelevanceItem[],
): Promise<RelevanceNote[]> {
  if (items.length === 0) return [];
  if (!process.env.ANTHROPIC_API_KEY) return items.map(i => ({ id: i.id, note: '' }));

  const itemsList = items
    .map((item, idx) => `[${idx}] (${item.type}) ${item.title} — ${item.detail}`)
    .join('\n');

  const prompt = `Eres un abogado societario colombiano. Analiza este caso y explica brevemente por qué cada fuente relacionada es relevante.

CASO ACTUAL:
- Nombre: ${caseContext.caseName}
- Tipo de acción: ${caseContext.actionType}
- Resumen: ${caseContext.summary.substring(0, 400)}
- Hechos: ${caseContext.factualBackground.substring(0, 300)}

FUENTES RELACIONADAS:
${itemsList}

Para cada fuente, genera UNA frase corta (máx 120 chars) explicando POR QUÉ es relevante para este caso específico. Sé concreto: conecta el tema de la fuente con el hecho o problema jurídico del caso.

Responde SOLO con un JSON array sin backticks:
[{"idx": 0, "note": "..."}, ...]`;

  try {
    const result = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    let jsonStr = result.content[0].type === 'text' ? result.content[0].text : '';
    jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(jsonStr);

    return parsed.map((p: any) => ({
      id: items[p.idx]?.id || '',
      note: p.note || '',
    }));
  } catch (err) {
    console.error('[RelevanceNotes] Error:', err);
    return items.map(i => ({ id: i.id, note: '' }));
  }
}
