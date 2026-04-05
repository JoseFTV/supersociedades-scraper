"""File downloader with deduplication, resume, and hash verification."""

from __future__ import annotations

from pathlib import Path
from typing import Sequence

from src.config import cfg
from src.dedupe import DedupeIndex
from src.http_client import download_file
from src.models import DocumentRecord
from src.storage import save_checkpoint
from src.utils import (
    extract_year_from_date,
    guess_extension,
    normalize_filename,
    sha256_bytes,
)
from src.logger import get_logger

log = get_logger("supersoc.downloader")


class Downloader:
    """Download files with deduplication, resume, and checkpointing."""

    def __init__(self, dedupe: DedupeIndex | None = None):
        self.dedupe = dedupe or DedupeIndex()
        self.stats = {"downloaded": 0, "skipped": 0, "errors": 0, "bytes": 0}

    def download_all(self, records: list[DocumentRecord]) -> list[DocumentRecord]:
        """Download files for all records, updating them in place."""
        total = len(records)
        for i, rec in enumerate(records, 1):
            try:
                self._download_one(rec)
            except Exception as e:
                rec.estado_descarga = "error"
                rec.error = str(e)
                self.stats["errors"] += 1
                log.error(
                    "[%d/%d] Error downloading %s: %s",
                    i, total, rec.titulo[:60], e,
                )

            # Checkpoint
            if i % cfg.checkpoint_every == 0:
                cp = cfg.checkpoints_dir / f"download_checkpoint_{i}.jsonl"
                save_checkpoint(records, cp)
                log.info(
                    "Checkpoint at %d/%d — OK:%d Skip:%d Err:%d",
                    i, total,
                    self.stats["downloaded"],
                    self.stats["skipped"],
                    self.stats["errors"],
                )

            if i % 100 == 0:
                log.info(
                    "Progress: %d/%d — OK:%d Skip:%d Err:%d",
                    i, total,
                    self.stats["downloaded"],
                    self.stats["skipped"],
                    self.stats["errors"],
                )

        return records

    def _download_one(self, rec: DocumentRecord) -> None:
        """Download a single file."""
        if not rec.url_descarga:
            rec.estado_descarga = "error"
            rec.error = "no_url"
            self.stats["errors"] += 1
            return

        # Check if URL already downloaded (dedupe by URL)
        if cfg.skip_existing and self.dedupe.is_url_seen(rec.url_descarga):
            existing = self.dedupe._by_url.get(rec.url_descarga.split("?")[0])
            if existing and existing.estado_descarga == "ok":
                rec.estado_descarga = "skipped"
                rec.hash_sha256 = existing.hash_sha256
                rec.local_path = existing.local_path
                self.stats["skipped"] += 1
                return

        # Determine target path
        year = extract_year_from_date(
            rec.fecha_publicacion or rec.fecha_expedicion or rec.titulo
        )
        subdir = cfg.raw_dir / rec.fuente / year
        subdir.mkdir(parents=True, exist_ok=True)

        fname = rec.nombre_archivo_sugerido
        if not fname:
            fname = normalize_filename(rec.titulo or "documento") + rec.extension_detectada
        target = subdir / fname

        # Skip if file exists and skip_existing is on
        if cfg.skip_existing and target.exists() and target.stat().st_size > 0:
            rec.estado_descarga = "skipped"
            rec.local_path = str(target)
            self.stats["skipped"] += 1
            log.debug("Skipped (exists): %s", target.name)
            return

        # Download
        data, content_type = download_file(rec.url_descarga)

        # Update extension based on actual content-type
        actual_ext = guess_extension(rec.url_descarga, content_type)
        if actual_ext != rec.extension_detectada:
            rec.extension_detectada = actual_ext
            if not fname.lower().endswith(actual_ext):
                fname = fname.rsplit(".", 1)[0] + actual_ext if "." in fname else fname + actual_ext
                target = subdir / fname

        # Hash check for content dedup
        file_hash = sha256_bytes(data)
        if self.dedupe.is_hash_seen(file_hash):
            existing = self.dedupe.get_by_hash(file_hash)
            if existing and existing.estado_descarga == "ok":
                rec.estado_descarga = "skipped"
                rec.hash_sha256 = file_hash
                rec.local_path = existing.local_path
                self.stats["skipped"] += 1
                log.debug("Skipped (duplicate content): %s", fname)
                return

        # Handle filename collision
        if target.exists():
            base = target.stem
            ext = target.suffix
            counter = 1
            while target.exists():
                target = subdir / f"{base}_v{counter}{ext}"
                counter += 1

        # Write file
        target.write_bytes(data)
        rec.estado_descarga = "ok"
        rec.hash_sha256 = file_hash
        rec.local_path = str(target)
        rec.nombre_archivo_sugerido = target.name
        self.stats["downloaded"] += 1
        self.stats["bytes"] += len(data)

        self.dedupe.add(rec)
        log.debug("Downloaded: %s (%d bytes)", target.name, len(data))
