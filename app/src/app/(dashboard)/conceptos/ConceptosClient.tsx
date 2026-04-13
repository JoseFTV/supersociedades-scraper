'use client';

import { useState } from 'react';
import { Library, Search, ChevronDown, ChevronUp, FileText, TrendingUp } from 'lucide-react';
import type { ConceptoCategoryDefinition } from '@/lib/taxonomy-conceptos';

interface DistItem {
  code: string;
  label: string;
  count: number;
  pct: number;
}

interface YearItem {
  year: number;
  count: number;
}

interface ConceptoPreview {
  id: string;
  filename: string;
  year: number;
  temaPrincipal: string;
  subtema: string;
  confianza: number;
  titulo: string | null;
}

interface Props {
  stats: {
    total: number;
    distribution: DistItem[];
    yearlyTrend: YearItem[];
  };
  recentConceptos: ConceptoPreview[];
  categories: ConceptoCategoryDefinition[];
}

export default function ConceptosClient({ stats, recentConceptos, categories }: Props) {
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ConceptoPreview[] | null>(null);
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/conceptos?q=${encodeURIComponent(searchQuery)}&limit=30`);
      const data = await res.json();
      setSearchResults(data.conceptos);
    } catch (e) {
      console.error(e);
    } finally {
      setSearching(false);
    }
  };

  const maxCount = Math.max(...stats.distribution.map(d => d.count), 1);

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-lexia-black tracking-tight flex items-center">
          <Library className="h-8 w-8 mr-3 text-lexia-teal" />
          Doctrina Societaria
        </h2>
        <p className="text-lexia-gray mt-2 text-sm max-w-3xl">
          {stats.total > 0 ? stats.total.toLocaleString() : '12,758'} conceptos jurídicos de la Superintendencia de Sociedades,
          clasificados en 20 categorías con la taxonomía TX.SOC. Fuente doctrinal que complementa
          la jurisprudencia jurisdiccional y los laudos arbitrales.
        </p>
      </div>

      {/* Banner when data not yet imported */}
      {recentConceptos.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          <strong>Datos pendientes de carga:</strong> Los 12,758 conceptos clasificados se muestran con datos de la taxonomía TX.SOC.
          Para cargar los datos completos, ejecuta: <code className="bg-amber-100 px-1 rounded">npx tsx scripts/data-import/import_conceptos.ts</code>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <span className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Conceptos</span>
          <span className="text-2xl font-bold text-lexia-black">{stats.total.toLocaleString()}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <span className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Categorías</span>
          <span className="text-2xl font-bold text-lexia-black">{stats.distribution.length}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <span className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Rango</span>
          <span className="text-2xl font-bold text-lexia-black">
            {stats.yearlyTrend[0]?.year ?? '?'}–{stats.yearlyTrend[stats.yearlyTrend.length - 1]?.year ?? '?'}
          </span>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <span className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Top Tema</span>
          <span className="text-lg font-bold text-lexia-teal">{stats.distribution[0]?.label ?? '—'}</span>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar conceptos por tema, texto, norma..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lexia-teal/20 focus:border-lexia-teal"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={searching}
            className="px-5 py-2.5 bg-lexia-teal text-white rounded-lg text-sm font-bold hover:bg-lexia-teal-light transition-colors disabled:opacity-50"
          >
            {searching ? 'Buscando...' : 'Buscar'}
          </button>
        </div>

        {searchResults && (
          <div className="mt-4 space-y-2">
            <p className="text-xs text-slate-400 font-bold uppercase">{searchResults.length} resultados</p>
            {searchResults.map(c => (
              <div key={c.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg text-sm">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-lexia-teal flex-shrink-0" />
                  <div>
                    <span className="font-semibold text-lexia-black">{c.titulo || c.filename}</span>
                    <span className="ml-2 text-xs text-slate-400">{c.year}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded bg-lexia-teal/10 text-lexia-teal font-medium">
                    {c.temaPrincipal}
                  </span>
                  <span className="text-xs text-slate-400">{c.subtema}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Distribution */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-lexia-black mb-4 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-lexia-teal" />
          Distribución por Categoría
        </h3>
        <div className="space-y-3">
          {stats.distribution.map(d => {
            const isExpanded = expandedCat === d.code;
            const cat = categories.find(c => c.code === d.code);
            const barWidth = (d.count / maxCount) * 100;

            return (
              <div key={d.code}>
                <button
                  onClick={() => setExpandedCat(isExpanded ? null : d.code)}
                  className="w-full text-left group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-400 w-20">{d.code}</span>
                      <span className="text-sm font-semibold text-lexia-black group-hover:text-lexia-teal transition-colors">
                        {d.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-lexia-black">{d.count.toLocaleString()}</span>
                      <span className="text-xs text-slate-400 w-12 text-right">{d.pct}%</span>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-lexia-teal rounded-full h-2 transition-all"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </button>
                {isExpanded && cat && (
                  <div className="mt-2 ml-22 p-4 bg-slate-50 rounded-lg text-sm">
                    <p className="text-lexia-black/80 mb-2">{cat.description}</p>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {cat.normatividad.map(n => (
                        <span key={n} className="text-[11px] px-2 py-0.5 bg-white border rounded text-slate-600">{n}</span>
                      ))}
                    </div>
                    {cat.relatedAS.length > 0 && (
                      <p className="text-xs text-slate-400">
                        Sentencias relacionadas: {cat.relatedAS.join(', ')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Conceptos */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-lexia-black mb-4">Conceptos Recientes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {recentConceptos.slice(0, 20).map(c => (
            <div key={c.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg text-sm">
              <div className="truncate mr-4">
                <span className="font-semibold text-lexia-black">{c.titulo || c.filename}</span>
                <span className="ml-2 text-xs text-slate-400">{c.year}</span>
              </div>
              <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded bg-lexia-teal/10 text-lexia-teal font-medium">
                {c.temaPrincipal}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
