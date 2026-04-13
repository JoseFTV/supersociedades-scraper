"""Persistence: CSV, JSONL, checkpoints."""

from __future__ import annotations

import csv
import json
from collections.abc import Sequence
from pathlib import Path

from src.logger import get_logger
from src.models import DocumentRecord

log = get_logger("supersoc.storage")


def save_csv(records: Sequence[DocumentRecord], path: Path) -> None:
    """Write records to a CSV file."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=DocumentRecord.csv_headers())
        writer.writeheader()
        for r in records:
            writer.writerow(r.to_dict())
    log.info("Saved %d records to %s", len(records), path)


def append_csv(record: DocumentRecord, path: Path) -> None:
    """Append a single record to a CSV file, creating it if needed."""
    path.parent.mkdir(parents=True, exist_ok=True)
    write_header = not path.exists() or path.stat().st_size == 0
    with open(path, "a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=DocumentRecord.csv_headers())
        if write_header:
            writer.writeheader()
        writer.writerow(record.to_dict())


def save_jsonl(records: Sequence[DocumentRecord], path: Path) -> None:
    """Write records to a JSONL file."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        for r in records:
            f.write(r.to_json_line() + "\n")
    log.info("Saved %d records to %s", len(records), path)


def load_csv(path: Path) -> list[DocumentRecord]:
    """Load records from a CSV file."""
    if not path.exists():
        return []
    records = []
    with open(path, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rec = DocumentRecord(**{k: v for k, v in row.items() if k in DocumentRecord.__dataclass_fields__})
            records.append(rec)
    return records


def save_checkpoint(records: Sequence[DocumentRecord], path: Path) -> None:
    """Save a checkpoint (just a JSONL snapshot)."""
    save_jsonl(records, path)
    log.info("Checkpoint saved: %d records at %s", len(records), path)


def load_checkpoint(path: Path) -> list[DocumentRecord]:
    """Load records from a checkpoint JSONL file."""
    if not path.exists():
        return []
    records = []
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                data = json.loads(line)
                rec = DocumentRecord(**{k: v for k, v in data.items() if k in DocumentRecord.__dataclass_fields__})
                records.append(rec)
    return records


def merge_records(
    existing: list[DocumentRecord],
    new: list[DocumentRecord],
) -> list[DocumentRecord]:
    """Merge new records into existing, keyed by URL (without query string).

    New records take precedence over existing ones with the same URL.
    """
    url_map = {r.url_descarga.split("?")[0]: r for r in existing}
    for r in new:
        url_map[r.url_descarga.split("?")[0]] = r
    return list(url_map.values())


def save_summary(summary: dict, path: Path) -> None:
    """Save final run summary as JSON."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)
    log.info("Summary saved to %s", path)
