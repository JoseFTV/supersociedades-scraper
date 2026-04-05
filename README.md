# Supersociedades Scraper

Scraper para indexar y descargar **todos** los conceptos jurídicos y contables publicados por la [Superintendencia de Sociedades de Colombia](https://www.supersociedades.gov.co).

## Alcance

| Fuente | URL | Documentos aprox. |
|--------|-----|-------------------|
| Conceptos Jurídicos | `/web/nuestra-entidad/conceptos-juridicos` | ~12,790 |
| Conceptos Contables | `/web/nuestra-entidad/conceptos-contables` | ~878 |

El scraper extrae metadatos completos de cada documento y descarga los archivos asociados (principalmente PDF).

## Arquitectura

```
run_full.py          ← Ejecución completa (index + download + retry)
src/
  config.py          ← Configuración vía .env
  logger.py          ← Logging a consola y archivo
  models.py          ← DocumentRecord dataclass
  utils.py           ← Normalización, hashing, fechas
  http_client.py     ← HTTP con retries y rate limiting
  parsers.py         ← Parsing HTML (BeautifulSoup + lxml)
  storage.py         ← CSV, JSONL, checkpoints
  dedupe.py          ← Deduplicación por URL, nombre y hash
  cli.py             ← Interfaz CLI (Click)
  scraper/
    base.py          ← Lógica compartida de indexación
    juridicos.py     ← Scraper conceptos jurídicos
    contables.py     ← Scraper conceptos contables
    downloader.py    ← Descarga con dedup y resume
    paginator.py     ← Paginación del portlet Liferay
```

### Flujo de datos

1. **Indexación**: Recorre todas las páginas del listado HTML, extrae metadatos de cada documento.
2. **Descarga**: Para cada registro indexado, descarga el archivo si no existe o si cambió.
3. **Retry**: Reintenta automáticamente los fallidos una vez adicional.
4. **Exportación**: Genera CSV, JSONL y resumen JSON.

## Instalación

```bash
git clone https://github.com/<tu-usuario>/supersociedades-scraper.git
cd supersociedades-scraper
python -m venv .venv
source .venv/bin/activate      # Linux/Mac
# .venv\Scripts\activate       # Windows
pip install -r requirements.txt
cp .env.example .env           # Ajustar si es necesario
```

## Configuración

Variables en `.env`:

| Variable | Default | Descripción |
|----------|---------|-------------|
| `BASE_URL_JURIDICOS` | URL Supersociedades | URL base conceptos jurídicos |
| `BASE_URL_CONTABLES` | URL Supersociedades | URL base conceptos contables |
| `CATEGORY_ID_JURIDICOS` | `1256460` | ID categoría Liferay jurídicos |
| `CATEGORY_ID_CONTABLES` | `1256459` | ID categoría Liferay contables |
| `REQUEST_TIMEOUT` | `30` | Timeout HTTP en segundos |
| `REQUEST_DELAY_SECONDS` | `0.5` | Delay entre requests |
| `MAX_RETRIES` | `3` | Reintentos por request |
| `USER_AGENT` | `SupersociedadesScraper/1.0` | User-Agent HTTP |
| `MAX_WORKERS` | `3` | Workers concurrentes |
| `SKIP_EXISTING` | `true` | Saltar archivos ya descargados |
| `CHECKPOINT_EVERY` | `50` | Frecuencia de checkpoints |
| `PAGE_SIZE` | `20` | Documentos por página |

## Uso

### Ejecución completa

```bash
python run_full.py
```

Ejecuta: indexación → descarga → retry de errores → exportación.

### Comandos CLI

```bash
# Indexar todo
python -m src.cli index

# Indexar solo jurídicos
python -m src.cli index --source juridicos

# Descargar todo lo indexado
python -m src.cli download

# Reanudar descargas interrumpidas
python -m src.cli resume

# Dry run (prueba con pocas páginas)
python -m src.cli dry-run --source juridicos --pages 2 --limit 20

# Fuente individual
python -m src.cli single --source contables --index-only
python -m src.cli single --source juridicos --download-only

# Exportar metadatos combinados
python -m src.cli export
```

## Estructura de salida

```
data/
  raw/
    juridicos/
      2024/
        OFICIO_220-011414_DE_25_DE_ENERO_DE_2024.pdf
      2023/
        ...
    contables/
      2024/
        ...
  metadata/
    juridicos_index.csv
    contables_index.csv
    all_documents.csv
    all_documents.jsonl
  logs/
    scraper.log
  checkpoints/
    juridicos_index_p50.jsonl
    ...
  exports/
    summary.json
```

## Metadatos por documento

Cada registro incluye:

| Campo | Descripción |
|-------|-------------|
| `fuente` | `juridicos` o `contables` |
| `tipo_documento` | Categoría original del sitio |
| `numero_oficio` | Número de oficio extraído |
| `titulo` | Título completo |
| `asunto` | Tema/asunto |
| `fecha_publicacion` | Fecha de publicación (YYYY-MM-DD) |
| `fecha_expedicion` | Fecha de expedición (YYYY-MM-DD) |
| `tamano_reportado` | Tamaño reportado por el sitio |
| `url_descarga` | URL directa del archivo |
| `nombre_archivo_sugerido` | Nombre normalizado |
| `extension_detectada` | Extensión real del archivo |
| `estado_descarga` | `ok`, `error`, `skipped`, `pending` |
| `hash_sha256` | Hash SHA-256 del archivo |
| `error` | Mensaje de error si aplica |

## Estrategia de reanudación

- El scraper guarda **checkpoints periódicos** (cada N documentos).
- Al reiniciar, carga el CSV existente y salta documentos ya descargados.
- `python -m src.cli resume` reintenta todos los registros con estado `pending` o `error`.
- La deduplicación por hash evita descargar el mismo contenido dos veces.

## Estrategia de deduplicación

Tres niveles:

1. **Por URL**: Si la URL base (sin query params) ya fue procesada, se salta.
2. **Por archivo existente**: Si el archivo ya existe en disco, se salta.
3. **Por hash SHA-256**: Si el contenido descargado es idéntico a otro archivo, se registra pero no se duplica.

## Limitaciones conocidas

- El sitio usa un portlet Liferay custom con paginación JavaScript; la paginación funciona via parámetros HTTP (`start`/`end`), pero si el sitio cambia la estructura, los selectores deben actualizarse.
- Algunos documentos muy antiguos pueden estar en formatos legacy (HTML, MHT).
- El delay entre requests (0.5s default) es conservador; ajustar según políticas del sitio.
- El total de documentos reportado por el sitio puede variar (el sitio dice ~12,790 jurídicos y ~878 contables).

## Consideraciones legales y éticas

- Los documentos de la Superintendencia de Sociedades son **información pública** publicada por una entidad estatal colombiana.
- El `robots.txt` del sitio permite crawling completo (`Disallow:` vacío).
- El scraper implementa rate limiting y un User-Agent identificable.
- Este proyecto tiene fines de **investigación académica y análisis legal**.
- No se redistribuyen los documentos; se facilita su descarga organizada.

## Troubleshooting

| Problema | Solución |
|----------|----------|
| Timeout en descargas | Aumentar `REQUEST_TIMEOUT` en `.env` |
| Muchos errores 429 | Aumentar `REQUEST_DELAY_SECONDS` |
| SSL errors | Poner `VERIFY_SSL=false` en `.env` |
| Parser no encuentra docs | Revisar si el sitio cambió la estructura HTML |
| Descarga interrumpida | Ejecutar `python -m src.cli resume` |

## Cómo volver a correr el scraper

```bash
# Opción 1: Ejecución completa (salta existentes por defecto)
python run_full.py

# Opción 2: Solo indexar nuevos
python -m src.cli index

# Opción 3: Solo descargar pendientes
python -m src.cli download

# Opción 4: Reanudar errores
python -m src.cli resume
```

El scraper es idempotente: puede ejecutarse múltiples veces sin duplicar datos.

## Tests

```bash
pytest tests/ -v
```
