"""HTML parsers for Supersociedades document listings."""

from __future__ import annotations

import re
from typing import Optional
from urllib.parse import urljoin, unquote

from bs4 import BeautifulSoup, Tag

from src.models import DocumentRecord
from src.utils import parse_spanish_date, guess_extension, normalize_filename
from src.logger import get_logger

log = get_logger("supersoc.parser")


def parse_total_results(html: str) -> int:
    """Extract total result count from page JavaScript."""
    m = re.search(r"var\s+totalArticulos\s*=\s*['\"](\d+)['\"]", html)
    if m:
        return int(m.group(1))
    m = re.search(r"Total\s+Resultado:\s*(\d+)", html)
    if m:
        return int(m.group(1))
    return 0


def parse_listing_page(
    html: str,
    fuente: str,
    page_url: str,
    base_url: str = "https://www.supersociedades.gov.co",
) -> list[DocumentRecord]:
    """Parse a listing page and extract document records."""
    soup = BeautifulSoup(html, "lxml")
    records: list[DocumentRecord] = []

    # Find document links — only from the main document repository (107391),
    # excluding UI assets (images, icons from /documents/20122/)
    links = soup.find_all("a", href=re.compile(r"/documents/107391/\d+/"))

    # Process links in pairs (title link + subject link) or individually
    seen_urls: set[str] = set()

    for link in links:
        href = link.get("href", "")
        if not href:
            continue

        # Make absolute URL
        if href.startswith("/"):
            href = base_url + href

        # Skip duplicates within same page
        url_key = href.split("?")[0]
        if url_key in seen_urls:
            # This might be the subject/description link for the same document
            # Try to attach it to the previous record
            if records:
                text = link.get_text(strip=True)
                if text and not records[-1].asunto:
                    records[-1].asunto = text
            continue
        seen_urls.add(url_key)

        text = link.get_text(strip=True)
        if not text:
            continue

        rec = DocumentRecord()
        rec.fuente = fuente
        rec.url_descarga = href
        rec.url_detalle = page_url
        rec.titulo = text

        # Extract numero_oficio from title
        oficio_match = re.match(r"(OFICIO\s+[\d\-]+(?:\s+DE\s+\d+)?)", text, re.I)
        if oficio_match:
            rec.numero_oficio = oficio_match.group(1).strip()

        # Guess extension from URL
        rec.extension_detectada = guess_extension(href)

        # Generate suggested filename
        fname = normalize_filename(text)
        if not fname.lower().endswith(rec.extension_detectada):
            fname += rec.extension_detectada
        rec.nombre_archivo_sugerido = fname

        # Try to extract metadata from surrounding context
        _extract_context(link, rec)

        records.append(rec)

    log.debug("Parsed %d records from %s", len(records), page_url)
    return records


def _extract_context(link: Tag, rec: DocumentRecord) -> None:
    """Extract size, dates, and category from elements near the link."""
    # Walk up to find a reasonable container
    container = link.parent
    if container is None:
        return

    # Go up a few levels to find all sibling content
    for _ in range(4):
        if container.parent is not None:
            container = container.parent
        else:
            break

    text_block = container.get_text(" ", strip=True)

    # Extract file size (e.g., "1053 Kb", "347 Kb")
    size_match = re.search(r"(\d+(?:\.\d+)?)\s*(Kb|Mb|KB|MB|bytes)", text_block, re.I)
    if size_match:
        rec.tamano_reportado = f"{size_match.group(1)} {size_match.group(2)}"

    # Extract category / tipo_documento
    if "Conceptos Jurídicos" in text_block:
        rec.tipo_documento = "Conceptos Jurídicos"
    elif "Conceptos Contables" in text_block:
        rec.tipo_documento = "Conceptos Contables"
    elif "Normatividad" in text_block:
        rec.tipo_documento = "Normatividad"

    # Extract dates
    pub_match = re.search(
        r"Publicaci[oó]n:\s*(\d{1,2}\s+\w{3}\s+\d{4})", text_block
    )
    if pub_match:
        rec.fecha_publicacion = parse_spanish_date(pub_match.group(1))

    exp_match = re.search(
        r"Expedici[oó]n[:\s]+(\d{1,2}\s+\w{3}\s+\d{4})", text_block
    )
    if exp_match:
        rec.fecha_expedicion = parse_spanish_date(exp_match.group(1))
