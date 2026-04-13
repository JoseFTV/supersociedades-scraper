#!/usr/bin/env python3
"""
Classify sampled legal concepts into themes using Claude API.
Processes in batches of 15 docs per API call to minimize cost.
"""

import json
import os
import time
from pathlib import Path

import anthropic

SAMPLE_FILE = Path("data/exports/sample_texts.jsonl")
OUTPUT_FILE = Path("data/exports/theme_classifications.jsonl")
SUMMARY_FILE = Path("data/exports/theme_summary.json")
BATCH_SIZE = 15
MODEL = "claude-sonnet-4-20250514"

SYSTEM_PROMPT = """Eres un abogado colombiano experto en derecho societario y comercial.
Tu tarea es clasificar conceptos jurídicos de la Superintendencia de Sociedades en TEMAS GRUESOS.

Para cada documento, asigna exactamente UN tema principal de la lista, y opcionalmente un tema secundario si aplica.

TEMAS DISPONIBLES (usa exactamente estos códigos):

1. TIPOS_SOCIETARIOS — Constitución, características, diferencias entre tipos (SAS, SA, Ltda, SCA, colectiva, empresa unipersonal, sucursal extranjera, SEM)
2. REFORMAS_ESTATUTARIAS — Modificación de estatutos, aumento/disminución de capital, cambio de objeto social, prórroga, transformación, fusión, escisión
3. ORGANOS_SOCIALES — Asamblea de accionistas, junta de socios, junta directiva, representante legal, convocatorias, quórum, mayorías, actas
4. ADMINISTRADORES — Deberes, responsabilidad, conflicto de intereses, rendición de cuentas, inhabilidades, remuneración de administradores
5. CAPITAL_APORTES — Capital social, aportes en especie, aportes de industria, avalúo, capitalización, acciones, cuotas, participaciones, prima en colocación
6. SOCIOS_ACCIONISTAS — Derechos de socios/accionistas, derecho de preferencia, restricción de negociación, exclusión, retiro, cesión de cuotas/acciones, libro de accionistas
7. UTILIDADES_DIVIDENDOS — Distribución de utilidades, reservas, dividendos, recompra de acciones, absorción de pérdidas
8. DISOLUCION_LIQUIDACION — Causales de disolución, enervatoria, liquidación voluntaria y judicial, liquidador, reactivación societaria
9. REGISTRO_MERCANTIL — Inscripción, cancelación, renovación, matrícula mercantil, certificados, registros en cámara de comercio
10. GRUPOS_EMPRESARIALES — Situación de control, grupo empresarial, subordinación, matrices y filiales, empresa unipersonal, vinculación económica
11. INSOLVENCIA — Reorganización empresarial (Ley 1116), liquidación judicial, validación judicial de acuerdos, intervención, toma de posesión
12. INSPECCION_VIGILANCIA — Funciones de Supersociedades, competencia, facultades administrativas, sanciones, multas, visitas, requerimientos
13. CONTRATACION_COMERCIAL — Contratos comerciales, compraventa, prestación de servicios, mandato, agencia, suministro, fiducia, leasing
14. PROPIEDAD_INTELECTUAL — Marcas, patentes, nombres comerciales, propiedad industrial, derechos de autor (en contexto societario)
15. REVISOR_FISCAL — Nombramiento, funciones, inhabilidades, responsabilidad, dictámenes, requisitos de revisoría fiscal
16. LIBROS_CONTABILIDAD — Libros de comercio, contabilidad, estados financieros, NIIF, normas contables, información financiera
17. REGIMEN_CAMBIARIO — Inversión extranjera, régimen cambiario, operaciones en divisas, registro de inversión
18. PROCEDIMIENTO — Aspectos procesales, competencia, jurisdicción, acciones judiciales, arbitraje, conciliación
19. ENTIDADES_SIN_ANIMO_LUCRO — ESAL, fundaciones, asociaciones, cooperativas, entidades del sector solidario
20. OTRO — Temas que no encajen en ninguna categoría anterior

Si el texto está vacío, corrupto o no es legible, clasifica como "ILEGIBLE".

Responde EXCLUSIVAMENTE en formato JSON array, un objeto por documento:
[
  {"idx": 0, "tema_principal": "CODIGO", "tema_secundario": "CODIGO_O_NULL", "subtema_sugerido": "breve descripción libre del subtema específico"},
  ...
]
No agregues explicación fuera del JSON."""


def load_samples() -> list[dict]:
    samples = []
    with open(SAMPLE_FILE, "r", encoding="utf-8") as f:
        for line in f:
            samples.append(json.loads(line))
    return samples


def build_batch_prompt(samples: list[dict], start_idx: int) -> str:
    parts = []
    for i, s in enumerate(samples):
        idx = start_idx + i
        text = s["text_preview"][:1500]  # trim to save tokens
        parts.append(f"--- DOCUMENTO {idx} ---\nArchivo: {s['filename']}\nAño: {s['year']}\nTexto:\n{text}\n")
    return "\n".join(parts)


def classify_batch(client: anthropic.Anthropic, samples: list[dict], start_idx: int) -> list[dict]:
    prompt = build_batch_prompt(samples, start_idx)
    msg = client.messages.create(
        model=MODEL,
        max_tokens=4096,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": f"Clasifica estos {len(samples)} documentos:\n\n{prompt}"}],
    )
    text = msg.content[0].text.strip()
    # Extract JSON from response
    if text.startswith("["):
        return json.loads(text)
    # Try to find JSON array in response
    start = text.find("[")
    end = text.rfind("]") + 1
    if start >= 0 and end > start:
        return json.loads(text[start:end])
    print(f"  WARNING: Could not parse response for batch starting at {start_idx}")
    return []


def main():
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        # Try loading from .env
        env_path = Path(".env")
        if env_path.exists():
            for line in env_path.read_text().splitlines():
                if line.startswith("ANTHROPIC_API_KEY="):
                    api_key = line.split("=", 1)[1].strip()
                    break

    client = anthropic.Anthropic(api_key=api_key)
    samples = load_samples()
    print(f"Loaded {len(samples)} samples")

    all_results = []
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

    # Process existing results if resuming
    if OUTPUT_FILE.exists():
        with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
            for line in f:
                all_results.append(json.loads(line))
        print(f"Resuming from {len(all_results)} existing results")

    start_from = len(all_results)

    with open(OUTPUT_FILE, "a", encoding="utf-8") as out:
        for batch_start in range(start_from, len(samples), BATCH_SIZE):
            batch_end = min(batch_start + BATCH_SIZE, len(samples))
            batch = samples[batch_start:batch_end]
            print(f"  Classifying {batch_start}-{batch_end} of {len(samples)}...")

            try:
                results = classify_batch(client, batch, batch_start)
                for r in results:
                    # Enrich with file info
                    idx = r.get("idx", batch_start)
                    if 0 <= idx < len(samples):
                        r["filename"] = samples[idx]["filename"]
                        r["year"] = samples[idx]["year"]
                    all_results.append(r)
                    out.write(json.dumps(r, ensure_ascii=False) + "\n")
                out.flush()
            except Exception as e:
                print(f"  ERROR at batch {batch_start}: {e}")
                # Continue with next batch
                continue

            # Rate limiting
            time.sleep(1)

    # Generate summary
    print(f"\nTotal classified: {len(all_results)}")
    theme_counts: dict[str, int] = {}
    subtemas: dict[str, list[str]] = {}
    secondary_counts: dict[str, int] = {}

    for r in all_results:
        tema = r.get("tema_principal", "OTRO")
        theme_counts[tema] = theme_counts.get(tema, 0) + 1
        sub = r.get("subtema_sugerido", "")
        if sub:
            subtemas.setdefault(tema, []).append(sub)
        sec = r.get("tema_secundario")
        if sec and sec != "null" and sec is not None:
            secondary_counts[sec] = secondary_counts.get(sec, 0) + 1

    # Sort by count
    sorted_themes = sorted(theme_counts.items(), key=lambda x: -x[1])

    summary = {
        "total_classified": len(all_results),
        "total_samples": len(samples),
        "theme_distribution": [{"theme": t, "count": c, "pct": round(100 * c / len(all_results), 1)} for t, c in sorted_themes],
        "secondary_distribution": sorted(secondary_counts.items(), key=lambda x: -x[1]),
        "subtemas_by_theme": {t: list(set(subs)) for t, subs in subtemas.items()},
    }

    with open(SUMMARY_FILE, "w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)

    print(f"\nDistribución temática:")
    for t, c in sorted_themes:
        pct = round(100 * c / len(all_results), 1)
        bar = "█" * int(pct / 2)
        print(f"  {t:35s} {c:4d} ({pct:5.1f}%) {bar}")

    print(f"\nSummary saved to {SUMMARY_FILE}")


if __name__ == "__main__":
    main()
