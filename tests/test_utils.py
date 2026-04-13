"""Tests for utility functions."""

import hashlib

from src.utils import (
    extract_year_from_date,
    format_size,
    guess_extension,
    normalize_filename,
    parse_spanish_date,
    sha256_bytes,
    sha256_file,
)

# ---------------------------------------------------------------------------
# normalize_filename
# ---------------------------------------------------------------------------


def test_normalize_filename_basic():
    assert normalize_filename("OFICIO 220-011414") == "OFICIO_220-011414"


def test_normalize_filename_special_chars_removed():
    result = normalize_filename('file<>:"/\\|?*name')
    for ch in '<>:"/\\|?*':
        assert ch not in result


def test_normalize_filename_collapses_spaces():
    assert normalize_filename("  hello   world  ") == "hello_world"


def test_normalize_filename_accents_stripped():
    result = normalize_filename("concepto_jurídico")
    assert "í" not in result


def test_normalize_filename_max_len():
    result = normalize_filename("a" * 300)
    assert len(result) <= 200


def test_normalize_filename_empty_ish():
    # Only special chars → stripped down to empty or minimal
    result = normalize_filename("___")
    assert result == "" or len(result) < 3


# ---------------------------------------------------------------------------
# sha256_bytes / sha256_file
# ---------------------------------------------------------------------------


def test_sha256_bytes():
    data = b"hello world"
    assert sha256_bytes(data) == hashlib.sha256(data).hexdigest()


def test_sha256_bytes_empty():
    assert sha256_bytes(b"") == hashlib.sha256(b"").hexdigest()


def test_sha256_file(tmp_path):
    data = b"test content for hashing"
    f = tmp_path / "test.bin"
    f.write_bytes(data)
    assert sha256_file(f) == hashlib.sha256(data).hexdigest()


# ---------------------------------------------------------------------------
# parse_spanish_date
# ---------------------------------------------------------------------------


def test_parse_spanish_date_all_months():
    months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun",
              "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
    expected_nums = ["01", "02", "03", "04", "05", "06",
                     "07", "08", "09", "10", "11", "12"]
    for m, num in zip(months, expected_nums, strict=True):
        assert parse_spanish_date(f"1 {m} 2024") == f"2024-{num}-01"


def test_parse_spanish_date_pads_day():
    assert parse_spanish_date("5 Mar 2022") == "2022-03-05"


def test_parse_spanish_date_max_day():
    assert parse_spanish_date("31 Dic 2023") == "2023-12-31"


def test_parse_spanish_date_case_insensitive():
    assert parse_spanish_date("25 ene 2024") == "2024-01-25"
    assert parse_spanish_date("25 ENE 2024") == "2024-01-25"


def test_parse_spanish_date_invalid_returns_original():
    raw = "not a date at all"
    assert parse_spanish_date(raw) == raw


# ---------------------------------------------------------------------------
# extract_year_from_date
# ---------------------------------------------------------------------------


def test_extract_year_from_iso_date():
    assert extract_year_from_date("2024-01-25") == "2024"


def test_extract_year_from_raw_text():
    assert extract_year_from_date("25 Ene 2023") == "2023"


def test_extract_year_no_year():
    assert extract_year_from_date("sin fecha") == "sin_fecha"


def test_extract_year_prefers_first_four_digit_sequence():
    assert extract_year_from_date("2021-something-2022") == "2021"


# ---------------------------------------------------------------------------
# guess_extension
# ---------------------------------------------------------------------------


def test_guess_extension_from_pdf_url():
    assert guess_extension("https://example.com/doc.pdf") == ".pdf"


def test_guess_extension_from_docx_url():
    assert guess_extension("https://example.com/report.docx") == ".docx"


def test_guess_extension_from_content_type_pdf():
    assert guess_extension("https://example.com/file", "application/pdf") == ".pdf"


def test_guess_extension_from_content_type_word():
    assert guess_extension("https://example.com/file", "application/msword") == ".doc"


def test_guess_extension_url_beats_content_type():
    # URL has .pdf → wins over content-type .doc
    assert guess_extension("https://example.com/doc.pdf", "application/msword") == ".pdf"


def test_guess_extension_unknown_falls_back_to_pdf():
    assert guess_extension("https://example.com/doc", "application/octet-stream") == ".pdf"


def test_guess_extension_content_type_with_charset():
    # content-type with semicolon parameters parsed correctly
    assert guess_extension("https://example.com/file", "application/pdf; charset=utf-8") == ".pdf"


# ---------------------------------------------------------------------------
# format_size
# ---------------------------------------------------------------------------


def test_format_size_bytes():
    assert format_size(512) == "512.0 B"


def test_format_size_kilobytes():
    assert format_size(1024) == "1.0 KB"


def test_format_size_megabytes():
    assert format_size(1024 * 1024) == "1.0 MB"


def test_format_size_gigabytes():
    assert format_size(1024 ** 3) == "1.0 GB"
