"""CLI interface for the Supersociedades scraper."""

from __future__ import annotations

import json
import time
from datetime import datetime
from pathlib import Path

import click

from src.config import cfg
from src.dedupe import DedupeIndex
from src.http_client import close_client
from src.logger import setup_logging, get_logger
from src.models import DocumentRecord
from src.scraper.contables import ContablesScraper
from src.scraper.downloader import Downloader
from src.scraper.juridicos import JuridicosScraper
from src.storage import (
    load_checkpoint,
    load_csv,
    save_checkpoint,
    save_csv,
    save_jsonl,
    save_summary,
)
from src.utils import format_size


def _init() -> None:
    cfg.ensure_dirs()
    setup_logging(cfg.logs_dir)


def _run_index(
    fuente: str,
    max_pages: int | None = None,
    limit: int | None = None,
) -> list[DocumentRecord]:
    """Index a single source."""
    log = get_logger("supersoc.cli")
    if fuente == "juridicos":
        scraper = JuridicosScraper()
    else:
        scraper = ContablesScraper()

    # Load existing index if available for dedup
    csv_path = cfg.metadata_dir / f"{fuente}_index.csv"
    existing = load_csv(csv_path)

    records = scraper.index_all(
        max_pages=max_pages, limit=limit, existing_records=existing
    )

    # Merge with existing (keep new, update old)
    url_map = {r.url_descarga.split("?")[0]: r for r in existing}
    for rec in records:
        url_key = rec.url_descarga.split("?")[0]
        url_map[url_key] = rec
    merged = list(url_map.values())

    save_csv(merged, csv_path)
    log.info("[%s] Index saved: %d total records", fuente, len(merged))
    return merged


def _run_download(records: list[DocumentRecord]) -> Downloader:
    """Download files for given records."""
    dedupe = DedupeIndex()
    # Load previous download state
    for source in ("juridicos", "contables"):
        csv_path = cfg.metadata_dir / f"{source}_index.csv"
        prev = load_csv(csv_path)
        dedupe.load_from_records([r for r in prev if r.estado_descarga == "ok"])

    dl = Downloader(dedupe=dedupe)
    dl.download_all(records)
    return dl


def _save_all_metadata(jur: list[DocumentRecord], cont: list[DocumentRecord]) -> None:
    """Save combined metadata files."""
    all_docs = jur + cont
    save_csv(all_docs, cfg.metadata_dir / "all_documents.csv")
    save_jsonl(all_docs, cfg.metadata_dir / "all_documents.jsonl")
    save_csv(jur, cfg.metadata_dir / "juridicos_index.csv")
    save_csv(cont, cfg.metadata_dir / "contables_index.csv")


def _build_summary(
    jur: list[DocumentRecord],
    cont: list[DocumentRecord],
    elapsed: float,
) -> dict:
    all_docs = jur + cont
    ok = [r for r in all_docs if r.estado_descarga == "ok"]
    errs = [r for r in all_docs if r.estado_descarga == "error"]
    total_bytes = sum(
        Path(r.local_path).stat().st_size
        for r in ok
        if r.local_path and Path(r.local_path).exists()
    )
    return {
        "timestamp": datetime.now().isoformat(),
        "total_juridicos_indexed": len(jur),
        "total_contables_indexed": len(cont),
        "total_indexed": len(all_docs),
        "total_downloaded_ok": len(ok),
        "total_failed": len(errs),
        "total_skipped": len([r for r in all_docs if r.estado_descarga == "skipped"]),
        "total_pending": len([r for r in all_docs if r.estado_descarga == "pending"]),
        "total_size_bytes": total_bytes,
        "total_size_human": format_size(total_bytes),
        "elapsed_seconds": round(elapsed, 1),
        "elapsed_human": f"{elapsed/60:.1f} min",
        "output_dir": str(cfg.output_dir.resolve()),
        "metadata_dir": str(cfg.metadata_dir.resolve()),
        "errors": [
            {"titulo": r.titulo[:80], "url": r.url_descarga, "error": r.error}
            for r in errs[:50]
        ],
    }


@click.group()
def cli():
    """Supersociedades document scraper."""
    pass


@cli.command()
@click.option("--source", type=click.Choice(["juridicos", "contables", "all"]), default="all")
@click.option("--max-pages", type=int, default=None, help="Limit pages to index")
@click.option("--limit", type=int, default=None, help="Max records to index")
def index(source: str, max_pages: int | None, limit: int | None):
    """Index documents from the website."""
    _init()
    log = get_logger("supersoc.cli")
    t0 = time.time()

    jur, cont = [], []
    if source in ("juridicos", "all"):
        jur = _run_index("juridicos", max_pages=max_pages, limit=limit)
    if source in ("contables", "all"):
        cont = _run_index("contables", max_pages=max_pages, limit=limit)

    _save_all_metadata(jur, cont)
    close_client()
    log.info("Indexing done in %.1f seconds", time.time() - t0)


@cli.command()
@click.option("--source", type=click.Choice(["juridicos", "contables", "all"]), default="all")
def download(source: str):
    """Download indexed documents."""
    _init()
    log = get_logger("supersoc.cli")
    t0 = time.time()

    records = []
    if source in ("juridicos", "all"):
        records.extend(load_csv(cfg.metadata_dir / "juridicos_index.csv"))
    if source in ("contables", "all"):
        records.extend(load_csv(cfg.metadata_dir / "contables_index.csv"))

    pending = [r for r in records if r.estado_descarga in ("pending", "error")]
    log.info("Downloading %d pending files (of %d total)", len(pending), len(records))

    dl = _run_download(pending)

    # Re-save updated metadata
    for source_name in ("juridicos", "contables"):
        csv_path = cfg.metadata_dir / f"{source_name}_index.csv"
        source_recs = [r for r in records if r.fuente == source_name]
        save_csv(source_recs, csv_path)

    close_client()
    log.info(
        "Download done in %.1f sec — OK:%d Skip:%d Err:%d",
        time.time() - t0,
        dl.stats["downloaded"],
        dl.stats["skipped"],
        dl.stats["errors"],
    )


@cli.command()
def resume():
    """Resume interrupted downloads."""
    _init()
    log = get_logger("supersoc.cli")

    all_recs = []
    for source in ("juridicos", "contables"):
        recs = load_csv(cfg.metadata_dir / f"{source}_index.csv")
        all_recs.extend(recs)

    pending = [r for r in all_recs if r.estado_descarga in ("pending", "error")]
    log.info("Resuming: %d pending/errored files", len(pending))

    if not pending:
        log.info("Nothing to resume.")
        close_client()
        return

    dl = _run_download(pending)

    for source in ("juridicos", "contables"):
        csv_path = cfg.metadata_dir / f"{source}_index.csv"
        source_recs = [r for r in all_recs if r.fuente == source]
        save_csv(source_recs, csv_path)

    close_client()
    log.info("Resume done — OK:%d Err:%d", dl.stats["downloaded"], dl.stats["errors"])


@cli.command("dry-run")
@click.option("--source", type=click.Choice(["juridicos", "contables"]), default="juridicos")
@click.option("--pages", type=int, default=2)
@click.option("--limit", type=int, default=20)
def dry_run(source: str, pages: int, limit: int):
    """Dry run: index a few pages, download a few files."""
    _init()
    log = get_logger("supersoc.cli")
    t0 = time.time()

    records = _run_index(source, max_pages=pages, limit=limit)
    log.info("Dry run indexed %d records", len(records))

    # Download first 5
    sample = [r for r in records if r.estado_descarga == "pending"][:5]
    if sample:
        dl = _run_download(sample)
        log.info(
            "Dry run downloaded %d files, %d errors",
            dl.stats["downloaded"], dl.stats["errors"],
        )

    close_client()
    log.info("Dry run done in %.1f seconds", time.time() - t0)

    # Print sample
    for r in records[:5]:
        click.echo(f"  {r.titulo[:70]} | {r.url_descarga[:80]} | {r.estado_descarga}")


@cli.command()
@click.option("--source", type=click.Choice(["juridicos", "contables"]), required=True)
@click.option("--index-only", is_flag=True, default=False)
@click.option("--download-only", is_flag=True, default=False)
def single(source: str, index_only: bool, download_only: bool):
    """Run index and/or download for a single source."""
    _init()
    log = get_logger("supersoc.cli")

    if not download_only:
        records = _run_index(source)
    else:
        records = load_csv(cfg.metadata_dir / f"{source}_index.csv")

    if not index_only:
        pending = [r for r in records if r.estado_descarga in ("pending", "error")]
        dl = _run_download(pending)
        save_csv(records, cfg.metadata_dir / f"{source}_index.csv")

    close_client()


@cli.command("export")
def export_cmd():
    """Export combined metadata."""
    _init()
    log = get_logger("supersoc.cli")

    jur = load_csv(cfg.metadata_dir / "juridicos_index.csv")
    cont = load_csv(cfg.metadata_dir / "contables_index.csv")
    _save_all_metadata(jur, cont)

    summary = _build_summary(jur, cont, 0)
    save_summary(summary, cfg.exports_dir / "summary.json")
    log.info("Export complete")
    click.echo(json.dumps(summary, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    cli()
