"""HTTP client with retries, rate limiting, and session pooling."""

from __future__ import annotations

import time
from typing import Optional

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from src.config import cfg
from src.logger import get_logger

log = get_logger("supersoc.http")

_client: Optional[httpx.Client] = None


def get_client() -> httpx.Client:
    global _client
    if _client is None or _client.is_closed:
        _client = httpx.Client(
            timeout=httpx.Timeout(cfg.request_timeout, connect=10),
            verify=cfg.verify_ssl,
            headers={"User-Agent": cfg.user_agent},
            follow_redirects=True,
            limits=httpx.Limits(
                max_connections=cfg.max_workers + 2,
                max_keepalive_connections=cfg.max_workers,
            ),
        )
    return _client


def close_client() -> None:
    global _client
    if _client and not _client.is_closed:
        _client.close()
        _client = None


def _throttle() -> None:
    if cfg.request_delay > 0:
        time.sleep(cfg.request_delay)


@retry(
    stop=stop_after_attempt(cfg.max_retries),
    wait=wait_exponential(multiplier=1, min=2, max=30),
    retry=retry_if_exception_type((httpx.HTTPError, httpx.TimeoutException)),
    reraise=True,
)
def fetch_page(url: str, params: dict | None = None) -> httpx.Response:
    """Fetch an HTML page with retries and throttling."""
    _throttle()
    client = get_client()
    resp = client.get(url, params=params)
    resp.raise_for_status()
    return resp


@retry(
    stop=stop_after_attempt(cfg.max_retries),
    wait=wait_exponential(multiplier=1, min=2, max=30),
    retry=retry_if_exception_type((httpx.HTTPError, httpx.TimeoutException)),
    reraise=True,
)
def download_file(url: str) -> tuple[bytes, str]:
    """Download a file, return (content_bytes, content_type)."""
    _throttle()
    client = get_client()
    resp = client.get(url)
    resp.raise_for_status()
    ct = resp.headers.get("content-type", "")
    return resp.content, ct
