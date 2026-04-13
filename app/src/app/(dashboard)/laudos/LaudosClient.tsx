'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Gavel, Search, Building2, Calendar, DollarSign, AlertTriangle, ChevronDown, ChevronUp, Users, Scale, FileText, Link2 } from 'lucide-react';

interface Controversy {
  primary_controversy: string;
  primary_controversy_description?: string;
  secondary_controversies?: { code: string; description: string }[];
}

interface Failure {
  severity: string;
  description: string;
  confidence?: string;
}

interface RelatedCase {
  id: string;
  caseName: string;
  actionType: string;
  outcomeGeneral: string;
}

interface LaudoPreview {
  id: string;
  caseTitle: string;
  vertical: string;
  subVertical: string | null;
  year: number | null;
  arbitrationCenter: string;
  cuantia: string | null;
  confidenceScore: number | null;
  needsHumanReview: boolean;
  contractType: string | null;
  parties: { name: string; role: string }[] | null;
  controversies: Controversy | null;
  failures: Failure[] | null;
  relatedCase: RelatedCase | null;
}

interface Stats {
  total: number;
  verticals: { vertical: string; count: number }[];
  yearRange: { min: number; max: number };
}

const SUB_VERTICAL_COLORS: Record<string, string> = {
  default: 'bg-lexia-teal/10 text-lexia-teal border-lexia-teal/20',
};

export default function LaudosClient({ laudos, stats }: { laudos: LaudoPreview[]; stats: Stats }) {
  const [filterSubVertical, setFilterSubVertical] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = laudos.filter(l => {
    if (filterSubVertical && (l.subVertical || 'Sin clasificar') !== filterSubVertical) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return l.caseTitle.toLowerCase().includes(q) || (l.contractType || '').toLowerCase().includes(q);
    }
    return true;
  });

  const getPartyNames = (parties: { name: string; role: string }[] | null): { demandante: string; demandado: string } => {
    if (!parties || !Array.isArray(parties)) return { demandante: '—', demandado: '—' };
    const dem = parties.find((p: { name: string; role: string }) => p.role?.toLowerCase().includes('demandante') || p.role?.toLowerCase().includes('convocante'));
    const ddo = parties.find((p: { name: string; role: string }) => p.role?.toLowerCase().includes('demandado') || p.role?.toLowerCase().includes('convocad'));
    return {
      demandante: dem?.name || parties[0]?.name || '—',
      demandado: ddo?.name || parties[1]?.name || '—',
    };
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-lexia-black tracking-tight flex items-center">
          <Gavel className="h-8 w-8 mr-3 text-lexia-teal" />
          Laudos Arbitrales
        </h2>
        <p className="text-lexia-gray mt-2 text-sm max-w-3xl">
          Corpus de {stats.total} laudos arbitrales societarios del Centro de Arbitraje de la Cámara de Comercio de Bogotá,
          analizados con IA. Disputas entre socios, administradores y sociedades.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <span className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Total Laudos</span>
          <span className="text-2xl font-bold text-lexia-black">{stats.total}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <span className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Vertical</span>
          <span className="text-lg font-bold text-lexia-teal">Societario</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <span className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Centro</span>
          <span className="text-lg font-bold text-lexia-teal">CCB</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <span className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Periodo</span>
          <span className="text-lg font-bold text-lexia-black">
            {stats.yearRange.min && stats.yearRange.max ? `${stats.yearRange.min}–${stats.yearRange.max}` : '—'}
          </span>
        </div>
      </div>

      {/* Sub-Vertical Distribution */}
      {stats.verticals.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-lexia-black mb-4">Distribución por Sub-tema</h3>
          <div className="flex flex-wrap gap-3">
            {stats.verticals.map(v => {
              const pct = stats.total > 0 ? Math.round((v.count / stats.total) * 100) : 0;
              return (
                <button
                  key={v.vertical}
                  onClick={() => setFilterSubVertical(filterSubVertical === v.vertical ? '' : v.vertical)}
                  className={`px-4 py-2 rounded-lg border text-sm font-semibold transition-all ${
                    filterSubVertical === v.vertical
                      ? 'bg-lexia-teal text-white border-lexia-teal'
                      : 'bg-lexia-teal/10 text-lexia-teal border-lexia-teal/20'
                  }`}
                >
                  {v.vertical} — {v.count} ({pct}%)
                </button>
              );
            })}
            {filterSubVertical && (
              <button
                onClick={() => setFilterSubVertical('')}
                className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-500 hover:text-slate-700"
              >
                Limpiar filtro
              </button>
            )}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar laudos por nombre de caso, tipo de contrato..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lexia-teal/20 focus:border-lexia-teal"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Laudos List */}
      <div className="space-y-3">
        <p className="text-xs text-slate-400 font-bold uppercase">
          {filtered.length} laudos societarios {filterSubVertical ? `· ${filterSubVertical}` : ''}
        </p>

        {filtered.map(l => {
          const isExpanded = expandedId === l.id;
          const parties = getPartyNames(l.parties);

          return (
            <div
              key={l.id}
              className={`bg-white border rounded-xl overflow-hidden shadow-sm transition-all ${
                isExpanded ? 'border-lexia-teal ring-1 ring-lexia-teal/20' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : l.id)}
                className="w-full text-left p-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex-1 min-w-0 mr-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs px-2 py-0.5 rounded-full border font-semibold bg-lexia-teal/10 text-lexia-teal border-lexia-teal/20">
                      {l.subVertical || 'Societario'}
                    </span>
                    {l.year && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-bold">
                        {l.year}
                      </span>
                    )}
                    {l.needsHumanReview && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 font-medium flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Revisión pendiente
                      </span>
                    )}
                  </div>
                  <h3 className={`font-bold truncate transition-colors ${isExpanded ? 'text-lexia-teal' : 'text-lexia-black'}`}>
                    {l.caseTitle}
                  </h3>
                </div>
                <div className="text-slate-400 flex-shrink-0">
                  {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </div>
              </button>

              {isExpanded && (
                <div className="px-5 pb-5 pt-2 border-t border-slate-100 bg-[#FAFBFC]/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-white border border-slate-200 rounded-lg p-4">
                      <h4 className="text-xs text-slate-400 uppercase font-bold mb-3 flex items-center">
                        <Users className="h-3.5 w-3.5 mr-1.5" /> Partes
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-xs text-slate-400">Convocante:</span>
                          <p className="font-semibold text-lexia-black">{parties.demandante}</p>
                        </div>
                        <div>
                          <span className="text-xs text-slate-400">Convocado:</span>
                          <p className="font-semibold text-lexia-black">{parties.demandado}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg p-4">
                      <h4 className="text-xs text-slate-400 uppercase font-bold mb-3 flex items-center">
                        <Building2 className="h-3.5 w-3.5 mr-1.5" /> Detalles
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Centro:</span>
                          <span className="font-medium text-lexia-black">{l.arbitrationCenter}</span>
                        </div>
                        {l.contractType && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Contrato:</span>
                            <span className="font-medium text-lexia-black">{l.contractType}</span>
                          </div>
                        )}
                        {l.subVertical && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Sub-vertical:</span>
                            <span className="font-medium text-lexia-black">{l.subVertical}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg p-4">
                      <h4 className="text-xs text-slate-400 uppercase font-bold mb-3 flex items-center">
                        <DollarSign className="h-3.5 w-3.5 mr-1.5" /> Cuantía y Calidad
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Cuantía:</span>
                          <span className="font-medium text-lexia-black">{l.cuantia || '—'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Confianza IA:</span>
                          <span className={`font-bold ${(l.confidenceScore ?? 0) >= 0.8 ? 'text-green-600' : 'text-amber-600'}`}>
                            {l.confidenceScore ? `${Math.round(l.confidenceScore * 100)}%` : '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Controversies (Lexia v3.0) */}
                  {l.controversies && (
                    <div className="mt-4 bg-white border border-slate-200 rounded-lg p-4">
                      <h4 className="text-xs text-slate-400 uppercase font-bold mb-3 flex items-center">
                        <Scale className="h-3.5 w-3.5 mr-1.5" /> Controversias (Taxonomía Lexia)
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <span className="text-xs font-mono bg-lexia-teal/10 text-lexia-teal px-2 py-0.5 rounded border border-lexia-teal/20 shrink-0">
                            {l.controversies.primary_controversy}
                          </span>
                          <span className="text-sm text-lexia-black">{l.controversies.primary_controversy_description}</span>
                        </div>
                        {l.controversies.secondary_controversies && l.controversies.secondary_controversies.length > 0 && (
                          <div className="pl-4 space-y-1.5 border-l-2 border-slate-200 mt-2">
                            {l.controversies.secondary_controversies.map((sc, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded shrink-0">{sc.code}</span>
                                <span className="text-xs text-slate-600">{sc.description}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Failures (Lexia v3.0) */}
                  {l.failures && l.failures.length > 0 && (
                    <div className="mt-4 bg-white border border-slate-200 rounded-lg p-4">
                      <h4 className="text-xs text-slate-400 uppercase font-bold mb-3 flex items-center">
                        <AlertTriangle className="h-3.5 w-3.5 mr-1.5" /> Fallas Detectadas
                      </h4>
                      <div className="space-y-2">
                        {l.failures.slice(0, 5).map((f, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${
                              f.severity === 'critical' ? 'bg-red-50 text-red-700 border border-red-200' :
                              f.severity === 'high' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                              'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}>
                              {f.severity}
                            </span>
                            <span className="text-xs text-lexia-black line-clamp-2">{f.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cross-reference to Sentencia */}
                  {l.relatedCase && (
                    <div className="mt-4 bg-[#f0fdfa] border border-lexia-teal/20 rounded-lg p-4">
                      <h4 className="text-xs text-lexia-teal uppercase font-bold mb-2 flex items-center">
                        <Link2 className="h-3.5 w-3.5 mr-1.5" /> Sentencia Relacionada (Supersociedades)
                      </h4>
                      <Link href={`/cases/${l.relatedCase.id}`} className="group">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-lexia-black group-hover:text-lexia-teal transition-colors">
                              {l.relatedCase.caseName}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-lexia-teal/10 text-lexia-teal font-medium">
                                {l.relatedCase.actionType}
                              </span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                l.relatedCase.outcomeGeneral === 'Demandante prevalece' ? 'bg-green-50 text-green-700' :
                                l.relatedCase.outcomeGeneral === 'Demandado prevalece' ? 'bg-red-50 text-red-700' :
                                'bg-amber-50 text-amber-700'
                              }`}>
                                {l.relatedCase.outcomeGeneral}
                              </span>
                            </div>
                          </div>
                          <FileText className="h-4 w-4 text-lexia-teal shrink-0" />
                        </div>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-lexia-gray">
            <Gavel className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            <p className="font-medium">No se encontraron laudos con estos filtros.</p>
          </div>
        )}
      </div>
    </div>
  );
}
