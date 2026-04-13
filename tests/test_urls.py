"""Tests for URL and utility functions."""

from src.utils import (
    extract_year_from_date,
    guess_extension,
    normalize_filename,
    parse_spanish_date,
    sha256_bytes,
)


def test_normalize_filename():
    assert normalize_filename("OFICIO 220-011414 DE 25 DE ENERO") == "OFICIO_220-011414_DE_25_DE_ENERO"
    assert normalize_filename('file<>:"/name') == "file_name"
    assert normalize_filename("a" * 300) == "a" * 200


def test_parse_spanish_date():
    assert parse_spanish_date("25 Ene 2024") == "2024-01-25"
    assert parse_spanish_date("01 Dic 2021") == "2021-12-01"
    assert parse_spanish_date("15 Jul 2019") == "2019-07-15"
    assert parse_spanish_date("bad date") == "bad date"


def test_extract_year():
    assert extract_year_from_date("2024-01-25") == "2024"
    assert extract_year_from_date("some text 2019 here") == "2019"
    assert extract_year_from_date("no year") == "sin_fecha"


def test_guess_extension():
    assert guess_extension("https://example.com/file.pdf?v=1") == ".pdf"
    assert guess_extension("https://example.com/file.docx?v=1") == ".docx"
    assert guess_extension("https://example.com/noext", "application/pdf") == ".pdf"
    assert guess_extension("https://example.com/noext", "text/html") == ".html"


def test_sha256():
    h = sha256_bytes(b"hello")
    assert len(h) == 64
    assert h == sha256_bytes(b"hello")  # deterministic
