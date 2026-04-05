"""Scraper for Conceptos Contables."""

from src.config import cfg
from src.scraper.base import BaseScraper


class ContablesScraper(BaseScraper):
    def __init__(self) -> None:
        super().__init__(
            base_url=cfg.base_url_contables,
            category_id=cfg.category_id_contables,
            fuente="contables",
            page_size=cfg.page_size,
        )
