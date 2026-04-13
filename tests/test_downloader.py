"""Tests for Downloader: dedup, resume, hash check, filename collision."""

import hashlib
from pathlib import Path
from unittest.mock import MagicMock, patch

from src.dedupe import DedupeIndex
from src.models import DocumentRecord
from src.scraper.downloader import Downloader

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _rec(**kwargs) -> DocumentRecord:
    defaults = {
        "fuente": "juridicos",
        "titulo": "Test Document",
        "url_descarga": "https://example.com/doc.pdf",
        "nombre_archivo_sugerido": "test_doc.pdf",
        "extension_detectada": ".pdf",
        "fecha_publicacion": "2024-01-25",
        "estado_descarga": "pending",
    }
    defaults.update(kwargs)
    return DocumentRecord(**defaults)


def _cfg(tmp_path: Path) -> MagicMock:
    cfg = MagicMock()
    cfg.skip_existing = True
    cfg.max_workers = 2
    cfg.checkpoint_every = 10_000  # won't trigger in unit tests
    cfg.raw_dir = tmp_path / "raw"
    cfg.checkpoints_dir = tmp_path / "checkpoints"
    cfg.checkpoints_dir.mkdir(parents=True, exist_ok=True)
    return cfg


# ---------------------------------------------------------------------------
# _download_one: happy path
# ---------------------------------------------------------------------------


class TestDownloadOne:
    def test_downloads_new_file(self, tmp_path):
        data = b"fake pdf content"
        expected_hash = hashlib.sha256(data).hexdigest()
        cfg = _cfg(tmp_path)

        with patch("src.scraper.downloader.cfg", cfg), \
             patch("src.scraper.downloader.download_file", return_value=(data, "application/pdf")):
            dl = Downloader()
            rec = _rec()
            dl._download_one(rec)

        assert rec.estado_descarga == "ok"
        assert rec.hash_sha256 == expected_hash
        assert rec.local_path != ""
        assert Path(rec.local_path).exists()
        assert dl.stats["downloaded"] == 1
        assert dl.stats["errors"] == 0

    def test_stats_bytes_accumulated(self, tmp_path):
        data = b"x" * 1024
        cfg = _cfg(tmp_path)

        with patch("src.scraper.downloader.cfg", cfg), \
             patch("src.scraper.downloader.download_file", return_value=(data, "application/pdf")):
            dl = Downloader()
            dl._download_one(_rec())

        assert dl.stats["bytes"] == 1024

    # ---------------------------------------------------------------------------
    # _download_one: dedup by URL
    # ---------------------------------------------------------------------------

    def test_skips_when_url_already_downloaded(self, tmp_path):
        cfg = _cfg(tmp_path)
        dedupe = DedupeIndex()
        existing = _rec(estado_descarga="ok", hash_sha256="abc123", local_path="/prev/doc.pdf")
        dedupe.add(existing)

        with patch("src.scraper.downloader.cfg", cfg), \
             patch("src.scraper.downloader.download_file") as mock_dl:
            dl = Downloader(dedupe=dedupe)
            rec = _rec()  # same url_descarga
            dl._download_one(rec)

        mock_dl.assert_not_called()
        assert rec.estado_descarga == "skipped"
        assert rec.hash_sha256 == "abc123"
        assert dl.stats["skipped"] == 1

    def test_does_not_skip_url_when_previous_not_ok(self, tmp_path):
        """If dedupe has the URL but estado != ok, re-download."""
        data = b"retry content"
        cfg = _cfg(tmp_path)
        dedupe = DedupeIndex()
        prev = _rec(estado_descarga="error")
        dedupe.add(prev)

        with patch("src.scraper.downloader.cfg", cfg), \
             patch("src.scraper.downloader.download_file", return_value=(data, "application/pdf")):
            dl = Downloader(dedupe=dedupe)
            rec = _rec()
            dl._download_one(rec)

        assert rec.estado_descarga == "ok"

    # ---------------------------------------------------------------------------
    # _download_one: skip if file exists on disk
    # ---------------------------------------------------------------------------

    def test_skips_existing_file_on_disk(self, tmp_path):
        cfg = _cfg(tmp_path)
        subdir = tmp_path / "raw" / "juridicos" / "2024"
        subdir.mkdir(parents=True)
        (subdir / "test_doc.pdf").write_bytes(b"already downloaded")

        with patch("src.scraper.downloader.cfg", cfg), \
             patch("src.scraper.downloader.download_file") as mock_dl:
            dl = Downloader()
            rec = _rec()
            dl._download_one(rec)

        mock_dl.assert_not_called()
        assert rec.estado_descarga == "skipped"
        assert dl.stats["skipped"] == 1

    # ---------------------------------------------------------------------------
    # _download_one: dedup by content hash
    # ---------------------------------------------------------------------------

    def test_skips_duplicate_content_by_hash(self, tmp_path):
        data = b"identical content"
        file_hash = hashlib.sha256(data).hexdigest()
        cfg = _cfg(tmp_path)

        dedupe = DedupeIndex()
        prev = _rec(
            url_descarga="https://example.com/other.pdf",
            estado_descarga="ok",
            hash_sha256=file_hash,
            local_path="/prev/other.pdf",
        )
        dedupe.add(prev)

        with patch("src.scraper.downloader.cfg", cfg), \
             patch("src.scraper.downloader.download_file", return_value=(data, "application/pdf")):
            dl = Downloader(dedupe=dedupe)
            rec = _rec(url_descarga="https://example.com/new_unique.pdf")
            dl._download_one(rec)

        assert rec.estado_descarga == "skipped"
        assert rec.hash_sha256 == file_hash
        assert dl.stats["skipped"] == 1

    # ---------------------------------------------------------------------------
    # _download_one: filename collision
    # ---------------------------------------------------------------------------

    def test_handles_filename_collision(self, tmp_path):
        """When target filename exists and skip_existing=False, appends _v1."""
        cfg = _cfg(tmp_path)
        cfg.skip_existing = False  # forces download even if file exists

        subdir = tmp_path / "raw" / "juridicos" / "2024"
        subdir.mkdir(parents=True)
        (subdir / "test_doc.pdf").write_bytes(b"pre-existing content")

        data = b"new content with different hash"
        with patch("src.scraper.downloader.cfg", cfg), \
             patch("src.scraper.downloader.download_file", return_value=(data, "application/pdf")):
            dl = Downloader()
            rec = _rec(url_descarga="https://example.com/unique_new.pdf")
            dl._download_one(rec)

        assert rec.estado_descarga == "ok"
        assert "_v1" in rec.local_path
        assert Path(rec.local_path).exists()

    # ---------------------------------------------------------------------------
    # _download_one: missing URL
    # ---------------------------------------------------------------------------

    def test_missing_url_sets_error(self, tmp_path):
        cfg = _cfg(tmp_path)

        with patch("src.scraper.downloader.cfg", cfg):
            dl = Downloader()
            rec = _rec(url_descarga="")
            dl._download_one(rec)

        assert rec.estado_descarga == "error"
        assert rec.error == "no_url"
        assert dl.stats["errors"] == 1

    # ---------------------------------------------------------------------------
    # _download_one: extension update from content-type
    # ---------------------------------------------------------------------------

    def test_updates_extension_from_content_type(self, tmp_path):
        data = b"word doc bytes"
        cfg = _cfg(tmp_path)

        with patch("src.scraper.downloader.cfg", cfg), \
             patch("src.scraper.downloader.download_file",
                   return_value=(data, "application/msword")):
            dl = Downloader()
            rec = _rec(
                url_descarga="https://example.com/doc_no_ext",
                nombre_archivo_sugerido="test_doc_no_ext",
                extension_detectada=".pdf",  # will be overridden
            )
            dl._download_one(rec)

        assert rec.extension_detectada == ".doc"


# ---------------------------------------------------------------------------
# download_all
# ---------------------------------------------------------------------------


class TestDownloadAll:
    def test_returns_same_list(self, tmp_path):
        data = b"content"
        cfg = _cfg(tmp_path)

        with patch("src.scraper.downloader.cfg", cfg), \
             patch("src.scraper.downloader.download_file", return_value=(data, "application/pdf")):
            dl = Downloader()
            records = [_rec(url_descarga=f"https://example.com/{i}.pdf") for i in range(3)]
            result = dl.download_all(records)

        assert result is records

    def test_downloads_all_pending(self, tmp_path):
        cfg = _cfg(tmp_path)

        # Unique data per URL avoids hash-dedup skipping subsequent records;
        # unique filenames avoid the file-exists-on-disk skip.
        def unique_content(url):
            return url.encode(), "application/pdf"

        with patch("src.scraper.downloader.cfg", cfg), \
             patch("src.scraper.downloader.download_file", side_effect=unique_content):
            dl = Downloader()
            records = [
                _rec(url_descarga=f"https://example.com/{i}.pdf",
                     nombre_archivo_sugerido=f"test_doc_{i}.pdf")
                for i in range(4)
            ]
            dl.download_all(records)

        assert dl.stats["downloaded"] == 4
        assert dl.stats["errors"] == 0

    def test_error_on_one_continues_rest(self, tmp_path):
        cfg = _cfg(tmp_path)

        # Unique data per URL prevents hash-dedup from turning successes into
        # skips; unique filenames prevent file-exists skips.
        def mixed(url):
            if url.endswith("/1.pdf"):
                raise ConnectionError("timeout")
            return url.encode(), "application/pdf"

        with patch("src.scraper.downloader.cfg", cfg), \
             patch("src.scraper.downloader.download_file", side_effect=mixed):
            dl = Downloader()
            records = [
                _rec(url_descarga=f"https://example.com/{i}.pdf",
                     nombre_archivo_sugerido=f"test_doc_{i}.pdf")
                for i in range(3)
            ]
            dl.download_all(records)

        assert dl.stats["errors"] == 1
        assert dl.stats["downloaded"] == 2
        failed = [r for r in records if r.estado_descarga == "error"]
        assert len(failed) == 1
        assert "timeout" in failed[0].error
