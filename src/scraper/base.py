"""Base scraper with shared indexing logic."""

from __future__ import annotations

from src.config import cfg
from src.http_client import fetch_page
from src.logger import get_logger
from src.models import DocumentRecord
from src.parsers import parse_listing_page, parse_total_results
from src.scraper.paginator import PaginationState
from src.storage import save_checkpoint

log = get_logger("supersoc.scraper")


class BaseScraper:
    """Shared scraper logic for both juridicos and contables."""

    def __init__(
        self,
        base_url: str,
        category_id: str,
        fuente: str,
        page_size: int = 20,
    ):
        self.base_url = base_url
        self.category_id = category_id
        self.fuente = fuente
        self.page_size = page_size

    def _build_url_params(self, start: int, end: int) -> dict[str, str]:
        return {
            "keyword": "",
            "id": self.category_id,
            "start": str(start),
            "end": str(end),
        }

    def discover_total(self) -> int:
        """Fetch page 1 to discover total document count."""
        params = self._build_url_params(0, self.page_size)
        resp = fetch_page(self.base_url, params=params)
        total = parse_total_results(resp.text)
        log.info("[%s] Total documents reported: %d", self.fuente, total)
        return total

    def index_all(
        self,
        max_pages: int | None = None,
        limit: int | None = None,
        existing_records: list[DocumentRecord] | None = None,
    ) -> list[DocumentRecord]:
        """Index all documents from all pages."""
        total = self.discover_total()
        pagination = PaginationState(total=total, page_size=self.page_size)
        all_records: list[DocumentRecord] = []
        seen_urls: set[str] = set()

        # Build set of already-known URLs to avoid re-parsing
        if existing_records:
            seen_urls = {r.url_descarga.split("?")[0] for r in existing_records}

        pages_to_fetch = pagination.total_pages
        if max_pages:
            pages_to_fetch = min(pages_to_fetch, max_pages)

        log.info(
            "[%s] Indexing %d pages (total_docs=%d, page_size=%d)",
            self.fuente, pages_to_fetch, total, self.page_size,
        )

        for page_num in range(1, pages_to_fetch + 1):
            try:
                params = self._build_url_params(
                    (page_num - 1) * self.page_size,
                    page_num * self.page_size,
                )
                resp = fetch_page(self.base_url, params=params)
                records = parse_listing_page(
                    resp.text,
                    fuente=self.fuente,
                    page_url=f"{self.base_url}?start={params['start']}&end={params['end']}",
                )

                new_count = 0
                for rec in records:
                    url_key = rec.url_descarga.split("?")[0]
                    if url_key not in seen_urls:
                        seen_urls.add(url_key)
                        all_records.append(rec)
                        new_count += 1

                log.info(
                    "[%s] Page %d/%d: %d new records (total so far: %d)",
                    self.fuente, page_num, pages_to_fetch, new_count, len(all_records),
                )

                # Checkpoint
                if page_num % max(1, cfg.checkpoint_every // self.page_size) == 0:
                    cp_path = cfg.checkpoints_dir / f"{self.fuente}_index_p{page_num}.jsonl"
                    save_checkpoint(all_records, cp_path)

                # Limit check
                if limit and len(all_records) >= limit:
                    all_records = all_records[:limit]
                    log.info("[%s] Reached limit of %d records", self.fuente, limit)
                    break

            except Exception as e:
                log.error("[%s] Error on page %d: %s", self.fuente, page_num, e)
                continue

        log.info("[%s] Indexing complete: %d records", self.fuente, len(all_records))
        return all_records
