# Supersociedades — Monorepo

Plataforma de inteligencia juridica para litigios ante la Superintendencia de Sociedades de Colombia. Incluye el scraper de documentos y la aplicacion web de analytics.

## Estructura

```
supersociedades/
├── scraper/        ← Python: scraper de conceptos juridicos y contables
├── app/            ← Next.js: plataforma web Lexia Analytics (Vercel)
└── data/           ← Taxonomias y datos compartidos
```

## Proyectos

### `scraper/` — Scraper de documentos

Indexa y descarga ~13,000 PDFs de conceptos juridicos y contables de Supersociedades.

```bash
cd scraper
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python -m src.cli run
```

Ver [scraper/README.md](scraper/README.md) para documentacion completa.

### `app/` — Lexia Analytics (Next.js)

Plataforma web con copiloto IA, buscador semantico, analytics y jurisprudencia.  
Desplegada en Vercel: [supersociedades-chat-gpt.vercel.app](https://supersociedades-chat-gpt.vercel.app)

```bash
cd app
npm install
npm run dev
```

**Vercel:** Root Directory configurado como `app/`.

### `data/` — Datos compartidos

Taxonomias de conceptos y sentencias usadas por ambos proyectos.
