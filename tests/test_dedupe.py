"""Tests for deduplication logic."""

from src.dedupe import DedupeIndex
from src.models import DocumentRecord


def test_dedupe_by_url():
    idx = DedupeIndex()
    rec = DocumentRecord(
        url_descarga="https://example.com/docs/file.pdf?v=1",
        estado_descarga="ok",
        hash_sha256="abc123",
    )
    idx.add(rec)
    assert idx.is_url_seen("https://example.com/docs/file.pdf?v=2")
    assert not idx.is_url_seen("https://example.com/docs/other.pdf")


def test_dedupe_by_hash():
    idx = DedupeIndex()
    rec = DocumentRecord(
        url_descarga="https://example.com/a.pdf",
        hash_sha256="deadbeef",
        estado_descarga="ok",
    )
    idx.add(rec)
    assert idx.is_hash_seen("deadbeef")
    assert not idx.is_hash_seen("other")


def test_load_from_records():
    recs = [
        DocumentRecord(url_descarga=f"https://example.com/{i}.pdf", hash_sha256=f"h{i}")
        for i in range(5)
    ]
    idx = DedupeIndex()
    idx.load_from_records(recs)
    assert idx.count == 5
