#!/usr/bin/env python3
"""Extract text from ALL juridicos PDFs. Resumable."""

import json
import sys
from pathlib import Path

import fitz  # pymupdf

JURIDICOS_DIR = Path("data/raw/juridicos")
OUTPUT = Path("data/exports/all_texts.jsonl")
MAX_CHARS = 1500


def extract_text(pdf_path: Path) -> str:
    try:
        doc = fitz.open(str(pdf_path))
        text = ""
        for page in doc:
            text += page.get_text()
            if len(text) >= MAX_CHARS:
                break
        doc.close()
        return text[:MAX_CHARS].strip()
    except Exception as e:
        return f"[ERROR: {e}]"


def main():
    # Gather all PDFs
    all_pdfs = sorted(JURIDICOS_DIR.rglob("*.pdf"))
    print(f"Total PDFs found: {len(all_pdfs)}")

    # Check what's already done
    done = set()
    if OUTPUT.exists():
        with open(OUTPUT, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    rec = json.loads(line)
                    done.add(rec["file"])
                except:
                    pass
        print(f"Already extracted: {len(done)}")

    remaining = [p for p in all_pdfs if str(p) not in done]
    print(f"Remaining: {len(remaining)}")

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)

    with open(OUTPUT, "a", encoding="utf-8") as f:
        for i, pdf in enumerate(remaining):
            text = extract_text(pdf)
            rec = {
                "file": str(pdf),
                "year": pdf.parent.name,
                "filename": pdf.name,
                "text_preview": text,
            }
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")

            if (i + 1) % 500 == 0:
                f.flush()
                print(f"  Extracted {i+1}/{len(remaining)} (total done: {len(done)+i+1})")

    total = len(done) + len(remaining)
    print(f"Done. Total: {total} records in {OUTPUT}")


if __name__ == "__main__":
    main()
