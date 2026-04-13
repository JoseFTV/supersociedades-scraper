"""File downloader with deduplication, resume, and hash verification."""

from __future__ import annotations

import threading
from concurrent.futures import ThreadPoolExecutor, as_completed

from tqdm import tqdm

from src.config import cfg
from src.dedupe import DedupeIndex
from src.http_client import download_file
from src.logger import get_logger
from src.models import DocumentRecord
from src.storage import save_checkpoint
from src.utils import (
    extract_year_from_date,
    guess_extension,
    normalize_filename,
    sha256_bytes,
)

log = get_logger("supersoc.downloader")


class Downloader:
    """Download files concurrently with deduplication, resume, and checkpointing."""

    def __init__(self, dedupe: DedupeIndex | None = None):
        self.dedupe = dedupe or DedupeIndex()
        self.stats = {"downloaded": 0, "skipped": 0, "errors": 0, "bytes": 0}
        self._stats_lock = threading.Lock()
        self._cp_lock = threading.Lock()

    def download_all(self, records: list[DocumentRecord]) -> list[DocumentRecord]:
        """Download files for all records concurrently, updating them in place."""
        total = len(records)
        completed = 0
        progress = tqdm(total=total, unit="doc", desc="Downloading")

        with ThreadPoolExecutor(max_workers=cfg.max_workers) as executor:
            futures = {executor.submit(self._download_one, rec): rec for rec in records}
            for future in as_completed(futures):
                rec = futures[future]
                completed += 1
                try:
                    future.result()
                except Exception as e:
                    rec.estado_descarga = "error"
                    rec.error = str(e)
                    with self._stats_lock:
                        self.stats["errors"] += 1
                    log.error("Error downloading %s: %s", rec.titulo[:60], e)

                progress.update(1)
                progress.set_postfix(
                    ok=self.stats["downloaded"],
                    skip=self.stats["skipped"],
                    err=self.stats["errors"],
                )

                if completed % cfg.checkpoint_every == 0:
                    with self._cp_lock:
                        cp = cfg.checkpoints_dir / f"download_checkpoint_{completed}.jsonl"
                        save_checkpoint(records, cp)
                        log.info(
                            "Checkpoint at %d/%d — OK:%d Skip:%d Err:%d",
                            completed, total,
                            self.stats["downloaded"],
                            self.stats["skipped"],
                            self.stats["errors"],
                        )

        progress.close()
        return records

    def _download_one(self, rec: DocumentRecord) -> None:
        """Download a single file. Thread-safe."""
        if not rec.url_descarga:
            rec.estado_descarga = "error"
            rec.error = "no_url"
            with self._stats_lock:
                self.stats["errors"] += 1
            return

        # Dedupe by URL
        if cfg.skip_existing and self.dedupe.is_url_seen(rec.url_descarga):
            existing = self.dedupe.get_by_url(rec.url_descarga)
            if existing and existing.estado_descarga == "ok":
                rec.estado_descarga = "skipped"
                rec.hash_sha256 = existing.hash_sha256
                rec.local_path = existing.local_path
                with self._stats_lock:
                    self.stats["skipped"] += 1
                return

        # Determine target directory
        year = extract_year_from_date(
            rec.fecha_publicacion or rec.fecha_expedicion or rec.titulo
        )
        subdir = cfg.raw_dir / rec.fuente / year
        subdir.mkdir(parents=True, exist_ok=True)

        fname = rec.nombre_archivo_sugerido
        if not fname:
            fname = normalize_filename(rec.titulo or "documento") + rec.extension_detectada
        target = subdir / fname

        # Skip if file already exists on disk
        if cfg.skip_existing and target.exists() and target.stat().st_size > 0:
            rec.estado_descarga = "skipped"
            rec.local_path = str(target)
            with self._stats_lock:
                self.stats["skipped"] += 1
            log.debug("Skipped (exists): %s", target.name)
            return

        # Fetch bytes
        data, content_type = download_file(rec.url_descarga)

        # Reconcile extension with actual content-type
        actual_ext = guess_extension(rec.url_descarga, content_type)
        if actual_ext != rec.extension_detectada:
            rec.extension_detectada = actual_ext
            if not fname.lower().endswith(actual_ext):
                fname = fname.rsplit(".", 1)[0] + actual_ext if "." in fname else fname + actual_ext
                target = subdir / fname

        # Dedupe by content hash
        file_hash = sha256_bytes(data)
        if self.dedupe.is_hash_seen(file_hash):
            existing = self.dedupe.get_by_hash(file_hash)
            if existing and existing.estado_descarga == "ok":
                rec.estado_descarga = "skipped"
                rec.hash_sha256 = file_hash
                rec.local_path = existing.local_path
                with self._stats_lock:
                    self.stats["skipped"] += 1
                log.debug("Skipped (duplicate content): %s", fname)
                return

        # Write with exclusive creation — handles concurrent filename collisions
        base = target.stem
        ext = target.suffix
        written = False
        for suffix in [""] + [f"_v{n}" for n in range(1, 1000)]:
            candidate = subdir / f"{base}{suffix}{ext}"
            try:
                with candidate.open("xb") as f:
                    f.write(data)
                target = candidate
                written = True
                break
            except FileExistsError:
                continue

        if not written:
            raise RuntimeError(f"Could not write {fname}: all variant names taken")

        rec.estado_descarga = "ok"
        rec.hash_sha256 = file_hash
        rec.local_path = str(target)
        rec.nombre_archivo_sugerido = target.name
        with self._stats_lock:
            self.stats["downloaded"] += 1
            self.stats["bytes"] += len(data)

        self.dedupe.add(rec)
        log.debug("Downloaded: %s (%d bytes)", target.name, len(data))
