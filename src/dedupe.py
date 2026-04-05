"""Deduplication logic: by URL, filename, and content hash."""

from __future__ import annotations

from pathlib import Path
from typing import Sequence

from src.models import DocumentRecord
from src.logger import get_logger

log = get_logger("supersoc.dedupe")


class DedupeIndex:
    """Track seen documents by URL, normalized name, and hash."""

    def __init__(self) -> None:
        self._by_url: dict[str, DocumentRecord] = {}
        self._by_name: dict[str, DocumentRecord] = {}
        self._by_hash: dict[str, DocumentRecord] = {}

    def load_from_records(self, records: Sequence[DocumentRecord]) -> None:
        for rec in records:
            self._index(rec)

    def _index(self, rec: DocumentRecord) -> None:
        url_key = rec.url_descarga.split("?")[0]
        if url_key:
            self._by_url[url_key] = rec
        if rec.nombre_archivo_sugerido:
            self._by_name[rec.nombre_archivo_sugerido] = rec
        if rec.hash_sha256:
            self._by_hash[rec.hash_sha256] = rec

    def is_url_seen(self, url: str) -> bool:
        return url.split("?")[0] in self._by_url

    def is_hash_seen(self, sha: str) -> bool:
        return sha in self._by_hash

    def get_by_hash(self, sha: str) -> DocumentRecord | None:
        return self._by_hash.get(sha)

    def add(self, rec: DocumentRecord) -> None:
        self._index(rec)

    @property
    def count(self) -> int:
        return len(self._by_url)
