#!/usr/bin/env python3
"""
Classify ALL 12,758 juridicos documents using the TX.SOC taxonomy.
Processes in batches of 25 docs. Fully resumable.
Uses Claude Haiku for cost efficiency on this volume.
"""

import csv
import json
import os
import sys
import time
import traceback
from pathlib import Path

# Force unbuffered stdout for background execution
sys.stdout.reconfigure(line_buffering=True)
sys.stderr.reconfigure(line_buffering=True)

import anthropic

ALL_TEXTS = Path("data/exports/all_texts.jsonl")
OUTPUT_JSONL = Path("data/exports/all_classified.jsonl")
OUTPUT_CSV = Path("data/exports/all_classified.csv")
PROGRESS_FILE = Path("data/checkpoints/classify_progress.json")
BATCH_SIZE = 25
MODEL = "claude-sonnet-4-20250514"
MAX_RETRIES = 5

SYSTEM_PROMPT = """Eres un abogado colombiano experto en derecho societario.
Clasifica cada concepto jurídico de la Superintendencia de Sociedades usando la taxonomía TX.SOC.

CATEGORÍAS (usa el código exacto):
TX.SOC.01 INSPECCION_VIGILANCIA - Funciones, competencias, facultades de Supersociedades
TX.SOC.02 INSOLVENCIA - Reorganización Ley 1116, liquidación judicial, Ley 550, concordatos
TX.SOC.03 SOCIOS_ACCIONISTAS - Derechos, cesión, inspección, exclusión, retiro, preferencia
TX.SOC.04 DISOLUCION_LIQUIDACION - Causales, enervatoria, liquidación voluntaria/judicial, reactivación
TX.SOC.05 ORGANOS_SOCIALES - Asamblea, junta directiva, representante legal, quórum, actas
TX.SOC.06 TIPOS_SOCIETARIOS - SAS, SA, Ltda, EU, SCA, sucursales extranjeras, constitución
TX.SOC.07 REFORMAS_ESTATUTARIAS - Fusión, escisión, transformación, aumento/disminución capital
TX.SOC.08 CAPITAL_APORTES - Aportes, acciones, cuotas, prima, emisión, colocación
TX.SOC.09 ADMINISTRADORES - Deberes, responsabilidad, conflicto intereses, inhabilidades
TX.SOC.10 GRUPOS_EMPRESARIALES - Control, subordinación, grupo empresarial, consolidación
TX.SOC.11 CONTRATACION_COMERCIAL - Contratos, fiducia, garantías mobiliarias
TX.SOC.12 REVISOR_FISCAL - Nombramiento, funciones, inhabilidades, obligatoriedad
TX.SOC.13 UTILIDADES_DIVIDENDOS - Distribución, reservas, dividendos
TX.SOC.14 LIBROS_CONTABILIDAD - Libros de comercio, estados financieros, NIIF
TX.SOC.15 PROCEDIMIENTO - Acciones judiciales, impugnación, conciliación
TX.SOC.16 ENTIDADES_SIN_ANIMO_LUCRO - ESAL, fundaciones, cooperativas
TX.SOC.17 REGIMEN_CAMBIARIO - Inversión extranjera, régimen cambiario
TX.SOC.18 REGISTRO_MERCANTIL - Matrícula, inscripción, certificados
TX.SOC.19 PROPIEDAD_INTELECTUAL - Marcas, nombres comerciales
TX.SOC.20 OTRO - No encaja en ninguna anterior
ILEGIBLE - Texto vacío o corrupto

REGLAS:
- Si trata sobre competencia de Supersociedades para X → TX.SOC.01, no X
- Un tema principal obligatorio, tema secundario solo si aplica
- Confianza: 0.0-1.0

Responde SOLO JSON array:
[{"i":0,"tp":"TX.SOC.XX","ts":"TX.SOC.XX|null","sub":"subtema breve","c":0.9},...]
Sin explicación fuera del JSON. "i" es el índice del documento en el batch."""


def load_all_texts():
    records = []
    with open(ALL_TEXTS, "r", encoding="utf-8") as f:
        for line in f:
            records.append(json.loads(line))
    return records


def load_progress():
    if PROGRESS_FILE.exists():
        with open(PROGRESS_FILE, "r") as f:
            return json.load(f)
    return {"classified": 0, "errors": 0, "last_batch": -1}


def save_progress(prog):
    PROGRESS_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(PROGRESS_FILE, "w") as f:
        json.dump(prog, f)


def classify_batch(client, records, batch_idx):
    parts = []
    for i, r in enumerate(records):
        text = r["text_preview"][:1200]
        parts.append(f"[{i}] {r['filename']} ({r['year']}): {text}")
    prompt = "\n---\n".join(parts)

    for attempt in range(MAX_RETRIES):
        try:
            msg = client.messages.create(
                model=MODEL,
                max_tokens=4096,
                system=SYSTEM_PROMPT,
                messages=[{"role": "user", "content": f"Clasifica estos {len(records)} documentos:\n\n{prompt}"}],
            )
            text = msg.content[0].text.strip()
            start = text.find("[")
            end = text.rfind("]") + 1
            if start >= 0 and end > start:
                results = json.loads(text[start:end])
                return results
            print(f"    WARNING: no JSON array in response (attempt {attempt+1})")
        except anthropic.RateLimitError:
            wait = 30 * (attempt + 1)
            print(f"    Rate limited, waiting {wait}s...")
            time.sleep(wait)
        except Exception as e:
            print(f"    Error (attempt {attempt+1}): {e}")
            if attempt < MAX_RETRIES - 1:
                time.sleep(5)

    # Return empty classifications on total failure
    return [{"i": i, "tp": "ERROR", "ts": None, "sub": "classification_failed", "c": 0.0} for i in range(len(records))]


def main():
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        env_path = Path(".env")
        if env_path.exists():
            for line in env_path.read_text().splitlines():
                if line.startswith("ANTHROPIC_API_KEY="):
                    api_key = line.split("=", 1)[1].strip()

    client = anthropic.Anthropic(api_key=api_key)
    all_records = load_all_texts()
    progress = load_progress()

    print(f"Total documents: {len(all_records)}")
    print(f"Already classified: {progress['classified']}")

    start_idx = progress["classified"]
    if start_idx >= len(all_records):
        print("All documents already classified!")
        generate_csv(all_records)
        return

    total_batches = (len(all_records) - start_idx + BATCH_SIZE - 1) // BATCH_SIZE
    print(f"Remaining: {len(all_records) - start_idx} docs in {total_batches} batches")
    print(f"Estimated time: {total_batches * 3 / 60:.0f} minutes")

    OUTPUT_JSONL.parent.mkdir(parents=True, exist_ok=True)
    t0 = time.time()
    batch_count = 0

    with open(OUTPUT_JSONL, "a", encoding="utf-8") as out:
        for batch_start in range(start_idx, len(all_records), BATCH_SIZE):
            batch_end = min(batch_start + BATCH_SIZE, len(all_records))
            batch = all_records[batch_start:batch_end]
            batch_count += 1

            results = classify_batch(client, batch, batch_count)

            # Write results
            for r in results:
                idx = batch_start + r.get("i", 0)
                if idx < len(all_records):
                    rec = all_records[idx]
                    output_rec = {
                        "idx": idx,
                        "file": rec["file"],
                        "filename": rec["filename"],
                        "year": rec["year"],
                        "tema_principal": r.get("tp", "ERROR"),
                        "tema_secundario": r.get("ts"),
                        "subtema": r.get("sub", ""),
                        "confianza": r.get("c", 0.0),
                    }
                    out.write(json.dumps(output_rec, ensure_ascii=False) + "\n")

            out.flush()

            progress["classified"] = batch_end
            progress["last_batch"] = batch_count
            save_progress(progress)

            elapsed = time.time() - t0
            rate = batch_count / elapsed * 60 if elapsed > 0 else 0
            remaining_batches = total_batches - batch_count
            eta_min = remaining_batches / rate if rate > 0 else 0

            if batch_count % 10 == 0 or batch_count <= 3:
                print(
                    f"  Batch {batch_count}/{total_batches} | "
                    f"Docs {batch_end}/{len(all_records)} | "
                    f"{rate:.1f} batches/min | "
                    f"ETA: {eta_min:.0f} min"
                )

            # Small delay between batches
            time.sleep(0.5)

    elapsed = time.time() - t0
    print(f"\nClassification complete!")
    print(f"  Total: {len(all_records)} docs in {elapsed/60:.1f} min")
    print(f"  Rate: {len(all_records)/elapsed:.1f} docs/sec")

    # Generate CSV
    generate_csv(all_records)


def generate_csv(all_records):
    """Convert JSONL to CSV."""
    if not OUTPUT_JSONL.exists():
        return

    print("Generating CSV...")
    records = []
    with open(OUTPUT_JSONL, "r", encoding="utf-8") as f:
        for line in f:
            try:
                records.append(json.loads(line))
            except:
                pass

    with open(OUTPUT_CSV, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=["idx", "file", "filename", "year", "tema_principal", "tema_secundario", "subtema", "confianza"],
        )
        writer.writeheader()
        for r in records:
            writer.writerow(r)

    # Also generate summary
    tema_counts = {}
    for r in records:
        t = r.get("tema_principal", "ERROR")
        tema_counts[t] = tema_counts.get(t, 0) + 1

    summary = {
        "total_classified": len(records),
        "distribution": sorted(tema_counts.items(), key=lambda x: -x[1]),
    }

    summary_file = Path("data/exports/classification_summary.json")
    with open(summary_file, "w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)

    print(f"CSV: {OUTPUT_CSV} ({len(records)} records)")
    print(f"Summary: {summary_file}")
    print("\nDistribution:")
    for t, c in sorted(tema_counts.items(), key=lambda x: -x[1]):
        pct = 100 * c / len(records)
        print(f"  {t:35s} {c:5d} ({pct:5.1f}%)")


if __name__ == "__main__":
    main()
