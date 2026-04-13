"""Scraper for Conceptos Jurídicos."""

from src.config import cfg
from src.scraper.base import BaseScraper


class JuridicosScraper(BaseScraper):
    def __init__(self) -> None:
        super().__init__(
            base_url=cfg.base_url_juridicos,
            category_id=cfg.category_id_juridicos,
            fuente="juridicos",
            page_size=cfg.page_size,
        )
