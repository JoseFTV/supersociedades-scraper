"""Paginator for Supersociedades custom Liferay portlet."""

from __future__ import annotations

import math
from dataclasses import dataclass


@dataclass
class PaginationState:
    total: int
    page_size: int
    current_start: int = 0

    @property
    def total_pages(self) -> int:
        return math.ceil(self.total / self.page_size) if self.total > 0 else 0

    @property
    def current_page(self) -> int:
        return (self.current_start // self.page_size) + 1

    def params_for_page(self, page_num: int) -> dict[str, str]:
        """Return query params for a given 1-based page number."""
        start = (page_num - 1) * self.page_size
        end = start + self.page_size
        return {"start": str(start), "end": str(end)}

    def all_page_params(self) -> list[dict[str, str]]:
        """Return params for all pages."""
        return [self.params_for_page(p) for p in range(1, self.total_pages + 1)]
