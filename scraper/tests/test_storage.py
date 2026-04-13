"""Tests for storage round-trips and merge logic."""


from src.models import DocumentRecord
from src.storage import (
    append_csv,
    load_checkpoint,
    load_csv,
    merge_records,
    save_checkpoint,
    save_csv,
    save_jsonl,
)


def _rec(n: int, estado: str = "ok", url_suffix: str = "") -> DocumentRecord:
    url = f"https://example.com/{n}{url_suffix}.pdf"
    return DocumentRecord(
        fuente="juridicos",
        titulo=f"Documento {n}",
        url_descarga=url,
        nombre_archivo_sugerido=f"doc_{n}.pdf",
        estado_descarga=estado,
        hash_sha256=f"hash{n}",
        asunto=f"Asunto {n}",
    )


# ---------------------------------------------------------------------------
# save_csv / load_csv
# ---------------------------------------------------------------------------


def test_csv_roundtrip(tmp_path):
    records = [_rec(i) for i in range(3)]
    path = tmp_path / "index.csv"
    save_csv(records, path)
    loaded = load_csv(path)

    assert len(loaded) == 3
    assert loaded[0].titulo == "Documento 0"
    assert loaded[1].url_descarga == "https://example.com/1.pdf"
    assert loaded[2].hash_sha256 == "hash2"


def test_csv_preserves_all_fields(tmp_path):
    rec = _rec(1)
    rec.error = "some error"
    rec.local_path = "/data/raw/doc.pdf"
    path = tmp_path / "out.csv"
    save_csv([rec], path)
    loaded = load_csv(path)

    assert loaded[0].error == "some error"
    assert loaded[0].local_path == "/data/raw/doc.pdf"
    assert loaded[0].fuente == "juridicos"


def test_csv_empty_list(tmp_path):
    path = tmp_path / "empty.csv"
    save_csv([], path)
    loaded = load_csv(path)
    assert loaded == []


def test_load_csv_missing_file(tmp_path):
    assert load_csv(tmp_path / "nonexistent.csv") == []


# ---------------------------------------------------------------------------
# append_csv
# ---------------------------------------------------------------------------


def test_append_csv_creates_file_with_header(tmp_path):
    path = tmp_path / "append.csv"
    append_csv(_rec(1), path)
    loaded = load_csv(path)
    assert len(loaded) == 1
    assert loaded[0].titulo == "Documento 1"


def test_append_csv_no_duplicate_header(tmp_path):
    path = tmp_path / "append.csv"
    append_csv(_rec(1), path)
    append_csv(_rec(2), path)
    loaded = load_csv(path)
    assert len(loaded) == 2
    assert loaded[1].titulo == "Documento 2"


# ---------------------------------------------------------------------------
# save_jsonl / load_checkpoint (JSONL)
# ---------------------------------------------------------------------------


def test_jsonl_roundtrip(tmp_path):
    records = [_rec(i) for i in range(5)]
    path = tmp_path / "docs.jsonl"
    save_jsonl(records, path)
    loaded = load_checkpoint(path)

    assert len(loaded) == 5
    assert loaded[4].hash_sha256 == "hash4"
    assert loaded[0].asunto == "Asunto 0"


def test_load_checkpoint_missing_file(tmp_path):
    assert load_checkpoint(tmp_path / "missing.jsonl") == []


def test_checkpoint_roundtrip(tmp_path):
    records = [_rec(i) for i in range(3)]
    path = tmp_path / "cp.jsonl"
    save_checkpoint(records, path)
    loaded = load_checkpoint(path)
    assert len(loaded) == 3


# ---------------------------------------------------------------------------
# merge_records
# ---------------------------------------------------------------------------


def test_merge_new_record_wins_over_existing():
    existing = [_rec(1, "ok")]
    updated = DocumentRecord(url_descarga="https://example.com/1.pdf", titulo="Updated")
    result = merge_records(existing, [updated])
    assert len(result) == 1
    assert result[0].titulo == "Updated"


def test_merge_strips_query_string_for_keying():
    r1 = DocumentRecord(url_descarga="https://example.com/1.pdf?v=1", titulo="Old")
    r2 = DocumentRecord(url_descarga="https://example.com/1.pdf?v=2", titulo="New")
    result = merge_records([r1], [r2])
    assert len(result) == 1
    assert result[0].titulo == "New"


def test_merge_adds_new_records():
    existing = [_rec(1)]
    new = [_rec(2), _rec(3)]
    result = merge_records(existing, new)
    assert len(result) == 3


def test_merge_empty_existing():
    new = [_rec(1), _rec(2)]
    result = merge_records([], new)
    assert len(result) == 2


def test_merge_empty_new():
    existing = [_rec(1), _rec(2)]
    result = merge_records(existing, [])
    assert len(result) == 2


def test_merge_both_empty():
    assert merge_records([], []) == []
