#!/usr/bin/env python3
"""Full scraper run: index + download all documents from Supersociedades."""

from __future__ import annotations

import json
import sys
import time
from datetime import datetime

from src.config import cfg
from src.dedupe import DedupeIndex
from src.http_client import close_client
from src.logger import setup_logging, get_logger
from src.models import DocumentRecord
from src.scraper.contables import ContablesScraper
from src.scraper.downloader import Downloader
from src.scraper.juridicos import JuridicosScraper
from src.storage import load_csv, save_csv, save_jsonl, save_summary
from src.utils import format_size


def main() -> None:
    cfg.ensure_dirs()
    log = setup_logging(cfg.logs_dir)
    log.info("=" * 60)
    log.info("Supersociedades Scraper — Full Run")
    log.info("Started: %s", datetime.now().isoformat())
    log.info("=" * 60)

    t0 = time.time()

    # --- Phase 1: Index ---
    log.info("--- Phase 1: Indexing juridicos ---")
    jur_scraper = JuridicosScraper()
    jur_existing = load_csv(cfg.metadata_dir / "juridicos_index.csv")
    jur_records = jur_scraper.index_all(existing_records=jur_existing)
    # Merge
    url_map = {r.url_descarga.split("?")[0]: r for r in jur_existing}
    for r in jur_records:
        url_map[r.url_descarga.split("?")[0]] = r
    jur_all = list(url_map.values())
    save_csv(jur_all, cfg.metadata_dir / "juridicos_index.csv")
    log.info("Juridicos indexed: %d", len(jur_all))

    log.info("--- Phase 1: Indexing contables ---")
    cont_scraper = ContablesScraper()
    cont_existing = load_csv(cfg.metadata_dir / "contables_index.csv")
    cont_records = cont_scraper.index_all(existing_records=cont_existing)
    url_map = {r.url_descarga.split("?")[0]: r for r in cont_existing}
    for r in cont_records:
        url_map[r.url_descarga.split("?")[0]] = r
    cont_all = list(url_map.values())
    save_csv(cont_all, cfg.metadata_dir / "contables_index.csv")
    log.info("Contables indexed: %d", len(cont_all))

    t_index = time.time() - t0

    # --- Phase 2: Download ---
    log.info("--- Phase 2: Downloading files ---")
    t_dl_start = time.time()

    dedupe = DedupeIndex()
    dedupe.load_from_records([r for r in jur_all + cont_all if r.estado_descarga == "ok"])

    all_pending = [
        r for r in jur_all + cont_all if r.estado_descarga in ("pending", "error")
    ]
    log.info("Total pending downloads: %d", len(all_pending))

    dl = Downloader(dedupe=dedupe)
    dl.download_all(all_pending)

    t_dl = time.time() - t_dl_start

    # --- Phase 3: Retry errors once ---
    errors_to_retry = [r for r in all_pending if r.estado_descarga == "error"]
    if errors_to_retry:
        log.info("--- Phase 3: Retrying %d errors ---", len(errors_to_retry))
        for r in errors_to_retry:
            r.estado_descarga = "pending"
            r.error = ""
        dl2 = Downloader(dedupe=dedupe)
        dl2.download_all(errors_to_retry)

    # --- Save final metadata ---
    save_csv(jur_all, cfg.metadata_dir / "juridicos_index.csv")
    save_csv(cont_all, cfg.metadata_dir / "contables_index.csv")
    all_docs = jur_all + cont_all
    save_csv(all_docs, cfg.metadata_dir / "all_documents.csv")
    save_jsonl(all_docs, cfg.metadata_dir / "all_documents.jsonl")

    elapsed = time.time() - t0

    # --- Summary ---
    from pathlib import Path

    ok = [r for r in all_docs if r.estado_descarga == "ok"]
    errs = [r for r in all_docs if r.estado_descarga == "error"]
    total_bytes = sum(
        Path(r.local_path).stat().st_size
        for r in ok
        if r.local_path and Path(r.local_path).exists()
    )

    summary = {
        "timestamp": datetime.now().isoformat(),
        "total_juridicos_indexed": len(jur_all),
        "total_contables_indexed": len(cont_all),
        "total_indexed": len(all_docs),
        "total_downloaded_ok": len(ok),
        "total_failed": len(errs),
        "total_skipped": len([r for r in all_docs if r.estado_descarga == "skipped"]),
        "total_pending": len([r for r in all_docs if r.estado_descarga == "pending"]),
        "total_size_bytes": total_bytes,
        "total_size_human": format_size(total_bytes),
        "index_time_sec": round(t_index, 1),
        "download_time_sec": round(t_dl, 1),
        "elapsed_seconds": round(elapsed, 1),
        "elapsed_human": f"{elapsed/60:.1f} min",
        "output_dir": str(cfg.output_dir.resolve()),
        "failed_sample": [
            {"titulo": r.titulo[:80], "error": r.error} for r in errs[:20]
        ],
    }

    save_summary(summary, cfg.exports_dir / "summary.json")

    close_client()

    log.info("=" * 60)
    log.info("COMPLETED")
    log.info("  Juridicos indexed:  %d", summary["total_juridicos_indexed"])
    log.info("  Contables indexed:  %d", summary["total_contables_indexed"])
    log.info("  Downloaded OK:      %d", summary["total_downloaded_ok"])
    log.info("  Failed:             %d", summary["total_failed"])
    log.info("  Total size:         %s", summary["total_size_human"])
    log.info("  Elapsed:            %s", summary["elapsed_human"])
    log.info("  Summary:            %s", cfg.exports_dir / "summary.json")
    log.info("=" * 60)

    print(json.dumps(summary, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
