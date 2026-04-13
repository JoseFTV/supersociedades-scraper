'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, FileText, BookOpen, Gavel, Loader2, Link2, Filter } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

type Source = 'all' | 'sentencias' | 'conceptos' | 'laudos';

export default function UnifiedSearchPage() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState('');
  const [source, setSource] = useState<Source>('all');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    query: string;
    counts: { sentencias: number; conceptos: number; laudos: number };
    results: {
      sentencias: { id: string; caseName: string; actionType: string; year: number; summary: string; outcomeGeneral: string; searchMethod?: string; similarity?: number; relevanceHint?: string }[];
      conceptos: { id: string; filename: string; titulo?: string; temaPrincipal: string; subtema?: string; year: number; textPreview?: string; searchMethod?: string; similarity?: number; relevanceHint?: string; resumen?: string }[];
      laudos: { id: string; caseTitle: string; vertical: string; year?: number; cuantia?: string; searchMethod?: string; similarity?: number; relevanceHint?: string; subVertical?: string }[];
    };
    crossReferences?: { relationship: string; txSocLabels?: string[]; lexiaLabels?: string[] };
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async (searchQuery?: string) => {
    const q = (searchQuery ?? query).trim();
    if (!q) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/unified-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, source, limit: 30 }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error en la busqueda');
      setResults(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [query, source]);

  // Auto-search when arriving from TopNav with ?q= parameter
  useEffect(() => {
    const q = searchParams.get('q');
    if (q && q.trim()) {
      setQuery(q.trim());
      handleSearch(q.trim());
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalResults = results
    ? results.counts.sentencias + results.counts.conceptos + results.counts.laudos
    : 0;

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto px-4">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-lexia-black tracking-tight flex items-center">
          <Link2 className="h-8 w-8 mr-3 text-lexia-teal" />
          Búsqueda Unificada
        </h2>
        <p className="text-lexia-gray mt-2 text-sm max-w-3xl">
          Búsqueda semántica con IA en sentencias, conceptos jurídicos y laudos arbitrales.
          El sistema usa embeddings vectoriales y cruza las tres taxonomías para encontrar resultados por significado, no solo por palabras clave.
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por tema, norma, tipo de acción, nombre de caso..."
              className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lexia-teal/20 focus:border-lexia-teal"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch(query)}
            />
          </div>
          <button
            onClick={() => handleSearch(query)}
            disabled={loading || !query.trim()}
            className="px-6 py-3 bg-lexia-teal text-white rounded-lg text-sm font-bold hover:bg-lexia-teal-light transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Buscar
          </button>
        </div>

        {/* Source Filter */}
        <div className="flex items-center gap-2 mt-4">
          <Filter className="h-4 w-4 text-slate-400" />
          <span className="text-xs text-slate-400 font-bold uppercase mr-1">Fuente:</span>
          {(['all', 'sentencias', 'conceptos', 'laudos'] as Source[]).map(s => (
            <button
              key={s}
              onClick={() => setSource(s)}
              className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-colors ${
                source === s
                  ? 'bg-lexia-teal text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s === 'all' ? 'Todas' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md text-red-700 text-sm">{error}</div>
      )}

      {/* Cross-References */}
      {results?.crossReferences && (
        <div className="bg-[#f0fdfa] border border-lexia-teal/20 rounded-xl p-4">
          <h4 className="text-xs font-bold text-lexia-teal uppercase tracking-wider mb-1 flex items-center">
            <Link2 className="h-3.5 w-3.5 mr-1.5" /> Mapeo Cruzado de Taxonomías
          </h4>
          <p className="text-sm text-lexia-black/80">{results.crossReferences.relationship}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {results.crossReferences.txSocLabels?.map((l: string) => (
              <span key={l} className="text-[11px] px-2 py-0.5 bg-white rounded border border-lexia-teal/20 text-lexia-teal font-medium">Doctrina: {l}</span>
            ))}
            {results.crossReferences.lexiaLabels?.map((l: string) => (
              <span key={l} className="text-[11px] px-2 py-0.5 bg-white rounded border border-amber-200 text-amber-700 font-medium">Arbitraje: {l}</span>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="space-y-6">
          <div className="flex items-center gap-4 text-sm">
            <span className="font-bold text-lexia-black">{totalResults} resultados</span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-500">{results.counts.sentencias} sentencias</span>
            <span className="text-slate-500">{results.counts.conceptos} conceptos</span>
            <span className="text-slate-500">{results.counts.laudos} laudos</span>
          </div>

          {/* Sentencias */}
          {results.results.sentencias.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-lexia-black uppercase tracking-wider mb-3 flex items-center">
                <FileText className="h-4 w-4 mr-2 text-lexia-teal" />
                Sentencias ({results.counts.sentencias})
              </h3>
              <div className="space-y-2">
                {results.results.sentencias.map((s) => (
                  <Link href={`/cases/${s.id}`} key={s.id}>
                    <div className="bg-white border border-slate-200 rounded-lg p-4 hover:border-lexia-teal hover:shadow-sm transition-all group">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-lexia-black text-sm group-hover:text-lexia-teal transition-colors truncate mr-4">
                          {s.caseName}
                        </h4>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-lexia-teal/10 text-lexia-teal font-medium">{s.actionType}</span>
                          <span className="text-xs text-slate-400 font-bold">{s.year}</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2">{s.summary}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          s.outcomeGeneral === 'Demandante prevalece' ? 'bg-green-50 text-green-700' :
                          s.outcomeGeneral === 'Demandado prevalece' ? 'bg-red-50 text-red-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {s.outcomeGeneral}
                        </span>
                        {s.searchMethod === 'semantic' && s.similarity != null && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-bold">
                            {Math.round(s.similarity * 100)}% similar
                          </span>
                        )}
                        {s.searchMethod === 'text' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-50 text-slate-500">
                            búsqueda textual
                          </span>
                        )}
                      </div>
                      {s.relevanceHint && (
                        <p className="text-[11px] text-purple-600 mt-1.5 italic">{s.relevanceHint}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Conceptos */}
          {results.results.conceptos.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-lexia-black uppercase tracking-wider mb-3 flex items-center">
                <BookOpen className="h-4 w-4 mr-2 text-lexia-teal" />
                Conceptos Jurídicos ({results.counts.conceptos})
              </h3>
              <div className="space-y-2">
                {results.results.conceptos.map((c) => (
                  <div key={c.id} className="bg-white border border-slate-200 rounded-lg p-4 hover:border-lexia-teal/30 transition-all">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-lexia-black text-sm truncate mr-4">
                        {c.titulo || c.filename}
                      </h4>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">{c.temaPrincipal}</span>
                        <span className="text-xs text-slate-400 font-bold">{c.year}</span>
                      </div>
                    </div>
                    {c.subtema && <p className="text-xs text-slate-500">{c.subtema}</p>}
                    {c.resumen && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{c.resumen}</p>}
                    {!c.resumen && c.textPreview && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{c.textPreview}</p>}
                    <div className="mt-2 flex items-center gap-2">
                      {c.searchMethod === 'semantic' && c.similarity != null && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-bold">
                          {Math.round(c.similarity * 100)}% similar
                        </span>
                      )}
                      {c.searchMethod === 'text' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-50 text-slate-500">
                          búsqueda textual
                        </span>
                      )}
                    </div>
                    {c.relevanceHint && (
                      <p className="text-[11px] text-purple-600 mt-1 italic">{c.relevanceHint}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Laudos */}
          {results.results.laudos.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-lexia-black uppercase tracking-wider mb-3 flex items-center">
                <Gavel className="h-4 w-4 mr-2 text-lexia-teal" />
                Laudos Arbitrales ({results.counts.laudos})
              </h3>
              <div className="space-y-2">
                {results.results.laudos.map((l) => (
                  <Link href="/laudos" key={l.id}>
                    <div className="bg-white border border-slate-200 rounded-lg p-4 hover:border-lexia-teal/30 transition-all group">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-lexia-black text-sm truncate mr-4 group-hover:text-lexia-teal transition-colors">
                          {l.caseTitle}
                        </h4>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium border border-amber-100">{l.vertical}</span>
                          {l.year && <span className="text-xs text-slate-400 font-bold">{l.year}</span>}
                        </div>
                      </div>
                      {l.subVertical && <p className="text-xs text-slate-500">{l.subVertical}</p>}
                      {l.cuantia && <p className="text-xs text-slate-500">Cuantía: {l.cuantia}</p>}
                      <div className="mt-2 flex items-center gap-2">
                        {l.searchMethod === 'semantic' && l.similarity != null && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-bold">
                            {Math.round(l.similarity * 100)}% similar
                          </span>
                        )}
                        {l.searchMethod === 'text' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-50 text-slate-500">
                            búsqueda textual
                          </span>
                        )}
                      </div>
                      {l.relevanceHint && (
                        <p className="text-[11px] text-purple-600 mt-1 italic">{l.relevanceHint}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {totalResults === 0 && !loading && (
            <div className="text-center py-16 text-lexia-gray">
              <Search className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p className="font-medium">No se encontraron resultados para &ldquo;{results.query}&rdquo;</p>
              <p className="text-sm mt-1">Intenta con otros términos o cambia el filtro de fuente.</p>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!results && !loading && (
        <div className="text-center py-20 text-lexia-gray">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
            <Link2 className="h-10 w-10 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-400">El Triángulo de Oro</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mt-2">
            Busca cualquier tema legal y obtén resultados cruzados de 292 sentencias,
            12,750 conceptos jurídicos y 49 laudos arbitrales.
          </p>
        </div>
      )}
    </div>
  );
}
