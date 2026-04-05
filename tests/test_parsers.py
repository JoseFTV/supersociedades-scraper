"""Tests for HTML parsers."""

from src.parsers import parse_total_results, parse_listing_page


SAMPLE_HTML = """
<html>
<head>
<script>
var keyword = '';
var category = '1256460';
var start = '0';
var end = '20';
var totalArticulos = '12790';
</script>
</head>
<body>
<div class="portlet-content">
  <div>
    <img src="/o/gov.co.supersociedades.buscador.interno/imagenes/pdf-svgrepo-com.svg" alt="">
    1053 Kb
    <p>Conceptos Jurídicos</p>
    <a href="/documents/107391/159040/OFICIO+220-011414+DE+25+DE+ENERO+DE+2024.pdf/0498d06a-5cb3-1803-f2f5-e85fc2cca5be?version=1.0&t=1743209017162">
        OFICIO 220-011414 DE 25 DE ENERO DE 2024
    </a>
    <a href="/documents/107391/159040/OFICIO+220-011414+DE+25+DE+ENERO+DE+2024.pdf/0498d06a-5cb3-1803-f2f5-e85fc2cca5be?version=1.0&t=1743209017162">
        UN GRUPO EMPRESARIAL EN LOS TÉRMINOS DEL ARTÍCULO 28
    </a>
    <p>Publicación: 25 Ene 2024 | Expedición 25 Ene 2024</p>
  </div>
  <hr>
  <div>
    <img src="/o/gov.co.supersociedades.buscador.interno/imagenes/pdf-svgrepo-com.svg" alt="">
    645 Kb
    <p>Conceptos Jurídicos</p>
    <a href="/documents/107391/159040/OFICIO+220-005167+DE+23+DE+ENERO+DE+2024.pdf/5b687aaf-e636-68cb-0d23-6821ee4a9c77?version=1.0&t=1743209016973">
        OFICIO 220-005167 DE 23 DE ENERO DE 2024
    </a>
    <a href="/documents/107391/159040/OFICIO+220-005167+DE+23+DE+ENERO+DE+2024.pdf/5b687aaf-e636-68cb-0d23-6821ee4a9c77?version=1.0&t=1743209016973">
        ESCISIÓN INTERNACIONAL
    </a>
    <p>Publicación: 23 Ene 2024 | Expedición 23 Ene 2024</p>
  </div>
</div>
</body>
</html>
"""


def test_parse_total_results():
    assert parse_total_results(SAMPLE_HTML) == 12790


def test_parse_total_results_missing():
    assert parse_total_results("<html></html>") == 0


def test_parse_listing_page():
    records = parse_listing_page(
        SAMPLE_HTML, fuente="juridicos", page_url="http://test.com"
    )
    assert len(records) == 2

    r1 = records[0]
    assert "OFICIO 220-011414" in r1.titulo
    assert r1.fuente == "juridicos"
    assert r1.extension_detectada == ".pdf"
    assert r1.url_descarga.endswith("?version=1.0&t=1743209017162") or "/documents/" in r1.url_descarga
    assert r1.fecha_publicacion == "2024-01-25"
    assert r1.tipo_documento == "Conceptos Jurídicos"
    assert r1.tamano_reportado == "1053 Kb"

    r2 = records[1]
    assert "005167" in r2.titulo


def test_parse_listing_empty():
    records = parse_listing_page("<html></html>", fuente="juridicos", page_url="")
    assert records == []
