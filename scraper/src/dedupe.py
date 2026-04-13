"""Deduplication logic: by URL, filename, and content hash."""

from __future__ import annotations

import threading
from collections.abc import Sequence

from src.logger import get_logger
from src.models import DocumentRecord

log = get_logger("supersoc.dedupe")


class DedupeIndex:
    """Track seen documents by URL, normalized name, and hash.

    All public methods are thread-safe.
    """

    def __init__(self) -> None:
        self._by_url: dict[str, DocumentRecord] = {}
        self._by_name: dict[str, DocumentRecord] = {}
        self._by_hash: dict[str, DocumentRecord] = {}
        self._lock = threading.Lock()

    def load_from_records(self, records: Sequence[DocumentRecord]) -> None:
        with self._lock:
            for rec in records:
                self._index(rec)

    def _index(self, rec: DocumentRecord) -> None:
        # Must be called with self._lock held.
        url_key = rec.url_descarga.split("?")[0]
        if url_key:
            self._by_url[url_key] = rec
        if rec.nombre_archivo_sugerido:
            self._by_name[rec.nombre_archivo_sugerido] = rec
        if rec.hash_sha256:
            self._by_hash[rec.hash_sha256] = rec

    def is_url_seen(self, url: str) -> bool:
        with self._lock:
            return url.split("?")[0] in self._by_url

    def is_hash_seen(self, sha: str) -> bool:
        with self._lock:
            return sha in self._by_hash

    def get_by_url(self, url: str) -> DocumentRecord | None:
        with self._lock:
            return self._by_url.get(url.split("?")[0])

    def get_by_hash(self, sha: str) -> DocumentRecord | None:
        with self._lock:
            return self._by_hash.get(sha)

    def add(self, rec: DocumentRecord) -> None:
        with self._lock:
            self._index(rec)

    @property
    def count(self) -> int:
        with self._lock:
            return len(self._by_url)
