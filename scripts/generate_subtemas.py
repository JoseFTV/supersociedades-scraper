#!/usr/bin/env python3
"""
Phase 2: Generate formal subtema taxonomy for each major category.
Uses the 300 classified samples + their texts to propose structured subtemas.
"""

import json
import os
import time
from pathlib import Path

import anthropic

CLASSIFICATIONS_FILE = Path("data/exports/theme_classifications.jsonl")
SAMPLES_FILE = Path("data/exports/sample_texts.jsonl")
OUTPUT_FILE = Path("data/exports/subtemas_by_category.json")
MODEL = "claude-sonnet-4-20250514"

# Only generate subtemas for categories with >= 3 samples
MIN_SAMPLES = 3

SYSTEM_PROMPT = """Eres un abogado colombiano experto en derecho societario, comercial e insolvencia.

Tu tarea es analizar los subtemas sugeridos y textos de conceptos jurídicos de la Superintendencia de Sociedades que pertenecen a UNA categoría temática, y proponer una lista FORMAL de subtemas para esa categoría.

Reglas:
1. Cada subtema debe ser mutuamente excluyente con los demás de la misma categoría
2. Los subtemas deben cubrir al menos el 90% de los documentos de esa categoría
3. Incluye un subtema "OTRO_[CATEGORIA]" como residual
4. Cada subtema necesita: código, label corto, definición precisa, normatividad frecuente
5. Los códigos usan formato: TX.SOC.XX.YY donde XX es el número de categoría y YY es secuencial (01, 02, ...)
6. Máximo 12 subtemas por categoría (incluyendo el residual)
7. Mínimo 3 subtemas por categoría
8. Si dos subtemas propuestos son muy similares, fusiónalos
9. Incluye un campo "frecuencia_estimada" con porcentaje aproximado dentro de la categoría

Responde EXCLUSIVAMENTE en JSON con esta estructura:
{
  "categoria": "CODIGO_CATEGORIA",
  "total_docs_analizados": N,
  "subtemas": [
    {
      "codigo": "TX.SOC.XX.YY",
      "label": "label_corto_snake_case",
      "nombre": "Nombre descriptivo",
      "definicion": "Definición precisa de qué cubre este subtema",
      "normatividad": ["norma1", "norma2"],
      "frecuencia_estimada_pct": 25.0,
      "ejemplos_observados": ["ejemplo1 breve", "ejemplo2 breve"]
    }
  ]
}"""


def load_data():
    """Load classifications and sample texts, merge by index."""
    samples = []
    with open(SAMPLES_FILE, "r", encoding="utf-8") as f:
        for line in f:
            samples.append(json.loads(line))

    classifications = []
    with open(CLASSIFICATIONS_FILE, "r", encoding="utf-8") as f:
        for line in f:
            classifications.append(json.loads(line))

    # Merge: add text_preview to classifications
    for c in classifications:
        idx = c.get("idx", 0)
        if 0 <= idx < len(samples):
            c["text_preview"] = samples[idx].get("text_preview", "")
    return classifications


def group_by_category(classifications):
    """Group classifications by tema_principal."""
    groups = {}
    for c in classifications:
        tema = c.get("tema_principal", "OTRO")
        groups.setdefault(tema, []).append(c)
    return groups


def build_category_prompt(category: str, docs: list[dict], cat_number: int) -> str:
    """Build prompt for one category."""
    parts = [f"CATEGORÍA: {category} (TX.SOC.{cat_number:02d})\n"]
    parts.append(f"Total de documentos en esta categoría: {len(docs)}\n")
    parts.append("DOCUMENTOS Y SUBTEMAS SUGERIDOS:\n")

    for i, doc in enumerate(docs):
        subtema = doc.get("subtema_sugerido", "N/A")
        text = doc.get("text_preview", "")[:800]
        parts.append(f"--- Doc {i+1} ---")
        parts.append(f"Subtema sugerido: {subtema}")
        parts.append(f"Texto (extracto): {text}\n")

    return "\n".join(parts)


# Category number mapping
CAT_NUMBERS = {
    "INSPECCION_VIGILANCIA": 1,
    "INSOLVENCIA": 2,
    "SOCIOS_ACCIONISTAS": 3,
    "DISOLUCION_LIQUIDACION": 4,
    "ORGANOS_SOCIALES": 5,
    "TIPOS_SOCIETARIOS": 6,
    "REFORMAS_ESTATUTARIAS": 7,
    "CAPITAL_APORTES": 8,
    "ADMINISTRADORES": 9,
    "GRUPOS_EMPRESARIALES": 10,
    "CONTRATACION_COMERCIAL": 11,
    "REVISOR_FISCAL": 12,
    "UTILIDADES_DIVIDENDOS": 13,
    "LIBROS_CONTABILIDAD": 14,
    "PROCEDIMIENTO": 15,
    "ENTIDADES_SIN_ANIMO_LUCRO": 16,
    "REGIMEN_CAMBIARIO": 17,
    "REGISTRO_MERCANTIL": 18,
    "PROPIEDAD_INTELECTUAL": 19,
    "OTRO": 20,
}


def generate_subtemas(client: anthropic.Anthropic, category: str, docs: list[dict]) -> dict:
    """Call Claude to generate subtemas for one category."""
    cat_number = CAT_NUMBERS.get(category, 20)
    prompt = build_category_prompt(category, docs, cat_number)

    msg = client.messages.create(
        model=MODEL,
        max_tokens=4096,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
    )
    text = msg.content[0].text.strip()

    # Parse JSON
    start = text.find("{")
    end = text.rfind("}") + 1
    if start >= 0 and end > start:
        return json.loads(text[start:end])
    print(f"  WARNING: Could not parse response for {category}")
    return {"categoria": category, "error": "parse_failed", "raw": text[:500]}


def main():
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        env_path = Path(".env")
        if env_path.exists():
            for line in env_path.read_text().splitlines():
                if line.startswith("ANTHROPIC_API_KEY="):
                    api_key = line.split("=", 1)[1].strip()
                    break

    client = anthropic.Anthropic(api_key=api_key)
    classifications = load_data()
    groups = group_by_category(classifications)

    print(f"Categories found: {len(groups)}")
    for cat, docs in sorted(groups.items(), key=lambda x: -len(x[1])):
        print(f"  {cat}: {len(docs)} docs")

    results = {}
    # Process categories in order of frequency
    sorted_cats = sorted(groups.items(), key=lambda x: -len(x[1]))

    for category, docs in sorted_cats:
        if len(docs) < MIN_SAMPLES:
            print(f"\n  Skipping {category} ({len(docs)} docs < {MIN_SAMPLES} minimum)")
            continue
        if category in ("ILEGIBLE",):
            print(f"\n  Skipping {category}")
            continue

        print(f"\n  Generating subtemas for {category} ({len(docs)} docs)...")
        try:
            result = generate_subtemas(client, category, docs)
            results[category] = result
            n_subtemas = len(result.get("subtemas", []))
            print(f"  -> {n_subtemas} subtemas generated")
        except Exception as e:
            print(f"  ERROR: {e}")
            results[category] = {"categoria": category, "error": str(e)}

        time.sleep(1)  # rate limiting

    # Save results
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    # Print summary
    print(f"\n{'='*60}")
    print(f"RESUMEN DE SUBTEMAS GENERADOS")
    print(f"{'='*60}")
    total_subtemas = 0
    for cat in sorted(results.keys()):
        r = results[cat]
        subtemas = r.get("subtemas", [])
        total_subtemas += len(subtemas)
        print(f"\n{cat} ({len(subtemas)} subtemas):")
        for s in subtemas:
            code = s.get("codigo", "?")
            nombre = s.get("nombre", "?")
            pct = s.get("frecuencia_estimada_pct", 0)
            print(f"  {code} - {nombre} ({pct}%)")

    print(f"\nTotal: {total_subtemas} subtemas across {len(results)} categories")
    print(f"Output: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
