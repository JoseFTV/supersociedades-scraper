"""Utility functions: filename normalization, hashing, date parsing."""

from __future__ import annotations

import hashlib
import re
import unicodedata
from pathlib import Path
from typing import Optional

_MONTH_MAP = {
    "ene": "01", "feb": "02", "mar": "03", "abr": "04",
    "may": "05", "jun": "06", "jul": "07", "ago": "08",
    "sep": "09", "oct": "10", "nov": "11", "dic": "12",
}


def normalize_filename(name: str, max_len: int = 200) -> str:
    """Normalize a filename: remove special chars, limit length."""
    name = unicodedata.normalize("NFKD", name)
    name = name.encode("ascii", "ignore").decode("ascii")
    name = re.sub(r'[<>:"/\\|?*\x00-\x1f]', '_', name)
    name = re.sub(r'\s+', '_', name)
    name = re.sub(r'_+', '_', name)
    name = name.strip('_. ')
    if len(name) > max_len:
        name = name[:max_len]
    return name


def sha256_file(path: Path) -> str:
    """Compute SHA-256 hash of a file."""
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def parse_spanish_date(text: str) -> str:
    """Parse 'DD MMM YYYY' Spanish date to 'YYYY-MM-DD'."""
    text = text.strip()
    m = re.match(r"(\d{1,2})\s+(\w{3})\s+(\d{4})", text)
    if not m:
        return text
    day, month_str, year = m.groups()
    month_num = _MONTH_MAP.get(month_str.lower()[:3], "00")
    return f"{year}-{month_num}-{int(day):02d}"


def extract_year_from_date(date_str: str) -> str:
    """Extract year from YYYY-MM-DD or raw text."""
    m = re.search(r"(\d{4})", date_str)
    return m.group(1) if m else "sin_fecha"


def guess_extension(url: str, content_type: str = "") -> str:
    """Guess file extension from URL or content-type."""
    # From URL
    url_path = url.split("?")[0]
    if "." in url_path.split("/")[-1]:
        ext = "." + url_path.split("/")[-1].rsplit(".", 1)[-1].lower()
        if ext in (".pdf", ".doc", ".docx", ".xls", ".xlsx", ".html", ".mht", ".rtf", ".txt"):
            return ext

    # From content-type
    ct_map = {
        "application/pdf": ".pdf",
        "application/msword": ".doc",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
        "text/html": ".html",
        "message/rfc822": ".mht",
        "application/rtf": ".rtf",
    }
    ct = content_type.lower().split(";")[0].strip()
    return ct_map.get(ct, ".pdf")


def format_size(size_bytes: int) -> str:
    """Format bytes to human-readable string."""
    for unit in ("B", "KB", "MB", "GB"):
        if abs(size_bytes) < 1024:
            return f"{size_bytes:.1f} {unit}"
        size_bytes /= 1024
    return f"{size_bytes:.1f} TB"
