"""Configuration loaded from environment variables with sensible defaults."""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()


def _bool(val: str) -> bool:
    return val.strip().lower() in ("1", "true", "yes")


@dataclass(frozen=True)
class Config:
    base_url_juridicos: str = os.getenv(
        "BASE_URL_JURIDICOS",
        "https://www.supersociedades.gov.co/web/nuestra-entidad/conceptos-juridicos",
    )
    base_url_contables: str = os.getenv(
        "BASE_URL_CONTABLES",
        "https://www.supersociedades.gov.co/web/nuestra-entidad/conceptos-contables",
    )
    category_id_juridicos: str = os.getenv("CATEGORY_ID_JURIDICOS", "1256460")
    category_id_contables: str = os.getenv("CATEGORY_ID_CONTABLES", "1256459")
    documents_base_url: str = os.getenv(
        "DOCUMENTS_BASE_URL", "https://www.supersociedades.gov.co"
    )

    request_timeout: int = int(os.getenv("REQUEST_TIMEOUT", "30"))
    request_delay: float = float(os.getenv("REQUEST_DELAY_SECONDS", "0.5"))
    max_retries: int = int(os.getenv("MAX_RETRIES", "3"))
    user_agent: str = os.getenv(
        "USER_AGENT",
        "SupersociedadesScraper/1.0 (academic-research; +https://github.com)",
    )
    max_workers: int = int(os.getenv("MAX_WORKERS", "3"))
    verify_ssl: bool = _bool(os.getenv("VERIFY_SSL", "true"))
    skip_existing: bool = _bool(os.getenv("SKIP_EXISTING", "true"))
    checkpoint_every: int = int(os.getenv("CHECKPOINT_EVERY", "50"))
    output_dir: Path = Path(os.getenv("OUTPUT_DIR", "data"))
    page_size: int = int(os.getenv("PAGE_SIZE", "20"))

    # Derived paths
    @property
    def raw_dir(self) -> Path:
        return self.output_dir / "raw"

    @property
    def metadata_dir(self) -> Path:
        return self.output_dir / "metadata"

    @property
    def logs_dir(self) -> Path:
        return self.output_dir / "logs"

    @property
    def checkpoints_dir(self) -> Path:
        return self.output_dir / "checkpoints"

    @property
    def exports_dir(self) -> Path:
        return self.output_dir / "exports"

    def ensure_dirs(self) -> None:
        for d in [
            self.raw_dir / "juridicos",
            self.raw_dir / "contables",
            self.metadata_dir,
            self.logs_dir,
            self.checkpoints_dir,
            self.exports_dir,
        ]:
            d.mkdir(parents=True, exist_ok=True)


cfg = Config()
