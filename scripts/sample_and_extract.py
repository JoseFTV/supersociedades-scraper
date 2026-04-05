#!/usr/bin/env python3
"""Sample PDFs stratified by year, extract first ~1500 chars of text from each."""

import json
import random
import sys
from pathlib import Path

import fitz  # pymupdf

JURIDICOS_DIR = Path("data/raw/juridicos")
OUTPUT = Path("data/exports/sample_texts.jsonl")
SAMPLE_SIZE = 300
MAX_CHARS = 2000  # first ~2000 chars per doc
random.seed(42)


def extract_text(pdf_path: Path, max_chars: int = MAX_CHARS) -> str:
    try:
        doc = fitz.open(str(pdf_path))
        text = ""
        for page in doc:
            text += page.get_text()
            if len(text) >= max_chars:
                break
        doc.close()
        return text[:max_chars].strip()
    except Exception as e:
        return f"[ERROR: {e}]"


def main():
    # Gather all PDFs by year
    by_year: dict[str, list[Path]] = {}
    for pdf in JURIDICOS_DIR.rglob("*.pdf"):
        year = pdf.parent.name
        by_year.setdefault(year, []).append(pdf)

    total = sum(len(v) for v in by_year.values())
    print(f"Total PDFs: {total}, Years: {len(by_year)}")

    # Stratified sample proportional to year size
    sample: list[Path] = []
    for year, pdfs in sorted(by_year.items()):
        n = max(1, round(SAMPLE_SIZE * len(pdfs) / total))
        n = min(n, len(pdfs))
        sample.extend(random.sample(pdfs, n))

    # If over target, trim; if under, add more from largest year
    if len(sample) > SAMPLE_SIZE:
        sample = random.sample(sample, SAMPLE_SIZE)

    print(f"Sample size: {len(sample)}")

    # Extract text
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    results = []
    for i, pdf in enumerate(sample):
        text = extract_text(pdf)
        rec = {
            "file": str(pdf),
            "year": pdf.parent.name,
            "filename": pdf.name,
            "text_preview": text,
        }
        results.append(rec)
        if (i + 1) % 50 == 0:
            print(f"  Extracted {i+1}/{len(sample)}")

    with open(OUTPUT, "w", encoding="utf-8") as f:
        for r in results:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")

    print(f"Done. Output: {OUTPUT}")


if __name__ == "__main__":
    main()
