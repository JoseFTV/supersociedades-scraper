'use client';

import { useEffect, useState } from 'react';
import {
  BarChart3, Users, Scale, AlertTriangle, TrendingDown, TrendingUp,
  Loader2, BookOpen, Download, FileSpreadsheet
} from 'lucide-react';
import Link from 'next/link';
import { DENIAL_REASON_BY_CODE } from '@/lib/taxonomy';

interface WinRate {
  actionType: string;
  total: number;
  wins: number;
  losses: number;
  mixed: number;
  winRate: number;
}

interface DenialImpact {
  code: string;
  casesAffected: number;
  winRateWithCode: number;
  globalWinRate: number;
  winRateDelta: number;
}

interface DenialFreq {
  code: string;
  count: number;
}

interface DenialMatrixRow {
  code: string;
  total: number;
  outcomeBreakdown: { total: number; loss: number; mixed: number };
  byActionType: Record<string, number>;
}

interface Entity {
  id: string;
  canonicalName: string;
  entityType: string;
  totalCases: number;
  asPlaintiff: number;
  asDefendant: number;
  winRate: number | null;
}

interface CitationType {
  type: string;
  count: number;
}

interface SummaryStats {
  totalCases: number;
  totalDenialReasons: number;
  totalAuthorities: number;
  totalEntities: number;
  totalConceptos: number;
  totalLaudos: number;
}

interface MetricsData {
  winRates?: WinRate[];
  denialFrequency?: DenialFreq[];
  denialImpact?: DenialImpact[];
  denialMatrix?: DenialMatrixRow[];
  topEntities?: Entity[];
  citationTypes?: CitationType[];
  summary?: SummaryStats;
}

export default function DeepAnalyticsPage() {
  const [data, setData] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/second-order-metrics')
      .then(res => {
        if (!res.ok) throw new Error('Error al cargar las métricas');
        return res.json();
      })
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-lexia-gray">
        <Loader2 className="animate-spin mr-3 text-lexia-teal" size={24} />
        Cargando métricas de segundo orden...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center py-32 text-red-500">
        Error: {error || 'Sin datos'}
      </div>
    );
  }

  const totalDR = data.denialFrequency?.reduce((s, r) => s + r.count, 0) || 1;
  const totalCitations = data.citationTypes?.reduce((s, c) => s + c.count, 0) || 1;

  return (
    <div className="space-y-8 pb-20">

      {/* Hero Banner */}
      <div className="bg-lexia-black rounded-2xl p-8 relative overflow-hidden shadow-lg">
        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-white mb-2">Análisis Profundo</h2>
          <p className="text-lexia-gray text-base max-w-2xl mb-6">
            Métricas de segundo orden: razones de negación × tipo de acción, resolución de entidades, grafo citacional.
          </p>
          <div className="flex flex-wrap gap-2">
            <a
              href="/api/exports/excel?sheet=cases"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-lexia-teal/20 text-lexia-teal-light rounded-full border border-lexia-teal/30 text-xs font-semibold tracking-wide hover:bg-lexia-teal/30 transition"
            >
              <FileSpreadsheet size={13} /> Sentencias CSV
            </a>
            <a
              href="/api/exports/excel?sheet=denial-reasons"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-lexia-teal/20 text-lexia-teal-light rounded-full border border-lexia-teal/30 text-xs font-semibold tracking-wide hover:bg-lexia-teal/30 transition"
            >
              <Download size={13} /> Negaciones CSV
            </a>
            <a
              href="/api/exports/excel?sheet=entities"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-lexia-teal/20 text-lexia-teal-light rounded-full border border-lexia-teal/30 text-xs font-semibold tracking-wide hover:bg-lexia-teal/30 transition"
            >
              <Users size={13} /> Entidades CSV
            </a>
          </div>
        </div>
        <div className="absolute right-0 bottom-0 pointer-events-none opacity-10 blur-3xl rounded-full bg-lexia-teal w-96 h-96 transform translate-x-1/3 translate-y-1/3" />
      </div>

      {/* Summary KPI Cards */}
      {data.summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
          {[
            { label: 'Sentencias', value: data.summary.totalCases, icon: Scale, color: 'text-lexia-teal', bg: 'bg-lexia-teal/10' },
            { label: 'Razones Negación', value: data.summary.totalDenialReasons, icon: AlertTriangle, color: 'text-[#d97706]', bg: 'bg-[#d97706]/10' },
            { label: 'Citas Tipificadas', value: data.summary.totalAuthorities, icon: BookOpen, color: 'text-[#7c3aed]', bg: 'bg-[#7c3aed]/10' },
            { label: 'Entidades', value: data.summary.totalEntities, icon: Users, color: 'text-[#ea580c]', bg: 'bg-[#ea580c]/10' },
            { label: 'Conceptos', value: data.summary.totalConceptos, icon: BarChart3, color: 'text-[#2563eb]', bg: 'bg-[#2563eb]/10' },
            { label: 'Laudos', value: data.summary.totalLaudos, icon: Scale, color: 'text-[#16a34a]', bg: 'bg-[#16a34a]/10' },
          ].map((card) => (
            <div key={card.label} className="bg-white border-y border-r border-slate-200 border-l-4 border-l-lexia-teal rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-lexia-gray text-[10px] uppercase tracking-wider font-semibold mb-2">{card.label}</p>
                  <h3 className="text-2xl font-bold text-lexia-black">{card.value.toLocaleString()}</h3>
                </div>
                <div className={`p-2 rounded-md ${card.bg} ${card.color}`}>
                  <card.icon className="h-4 w-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Win Rates by Action Type */}
      {data.winRates && (
        <section>
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <div className="p-2 bg-[#2563eb]/10 rounded-md">
                <BarChart3 size={16} className="text-[#2563eb]" />
              </div>
              <h3 className="text-lg font-bold text-lexia-black">Win Rate por Tipo de Acción</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-6 py-3 text-lexia-gray text-xs uppercase tracking-wider font-semibold">Tipo de Acción</th>
                  <th className="text-right px-4 py-3 text-lexia-gray text-xs uppercase tracking-wider font-semibold">Casos</th>
                  <th className="text-right px-4 py-3 text-lexia-gray text-xs uppercase tracking-wider font-semibold">Win Rate</th>
                  <th className="text-left px-4 py-3 text-lexia-gray text-xs uppercase tracking-wider font-semibold w-64">Distribución</th>
                  <th className="text-center px-4 py-3 text-lexia-gray text-xs uppercase tracking-wider font-semibold">Perfil</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.winRates.map((wr) => (
                  <tr key={wr.actionType} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3 font-medium text-lexia-black">{wr.actionType}</td>
                    <td className="px-4 py-3 text-right text-lexia-gray">{wr.total}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-semibold ${wr.winRate >= 50 ? 'text-[#16a34a]' : 'text-red-500'}`}>
                        {wr.winRate}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex h-4 rounded-full overflow-hidden bg-slate-100">
                        <div
                          className="bg-[#16a34a]"
                          style={{ width: `${wr.total > 0 ? (wr.wins / wr.total) * 100 : 0}%` }}
                          title={`Demandante: ${wr.wins}`}
                        />
                        <div
                          className="bg-[#d97706]"
                          style={{ width: `${wr.total > 0 ? (wr.mixed / wr.total) * 100 : 0}%` }}
                          title={`Mixto: ${wr.mixed}`}
                        />
                        <div
                          className="bg-red-500"
                          style={{ width: `${wr.total > 0 ? (wr.losses / wr.total) * 100 : 0}%` }}
                          title={`Demandado: ${wr.losses}`}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-lexia-gray mt-0.5">
                        <span>{wr.wins}G</span>
                        <span>{wr.mixed}M</span>
                        <span>{wr.losses}P</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <a
                        href={`/api/exports/action-profile?actionType=${encodeURIComponent(wr.actionType)}`}
                        className="inline-flex items-center gap-1 text-[10px] bg-slate-100 hover:bg-lexia-teal/10 text-lexia-gray hover:text-lexia-teal px-2.5 py-1 rounded-md transition font-medium"
                        title="Descargar perfil Markdown"
                      >
                        <Download size={10} /> .md
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Denial Reasons Impact */}
      {data.denialImpact && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-[#d97706]/10 rounded-md">
              <AlertTriangle size={16} className="text-[#d97706]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-lexia-black">Impacto de Razones de Negación en Win Rate</h3>
              <p className="text-xs text-lexia-gray">
                Cómo cada razón afecta la probabilidad de éxito del demandante vs el win rate global ({data.denialImpact[0]?.globalWinRate}%)
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.denialImpact.map((di) => {
              const def = DENIAL_REASON_BY_CODE[di.code];
              return (
                <div key={di.code} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs bg-slate-100 text-lexia-gray px-2 py-0.5 rounded-md">{di.code}</span>
                    <span className={`text-sm font-bold flex items-center gap-1 ${di.winRateDelta < 0 ? 'text-red-500' : 'text-[#16a34a]'}`}>
                      {di.winRateDelta < 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                      {di.winRateDelta > 0 ? '+' : ''}{di.winRateDelta}%
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-lexia-black mb-1">{def?.label || di.code}</div>
                  <div className="text-xs text-lexia-gray mb-3 line-clamp-2">{def?.definition}</div>
                  <div className="flex justify-between text-xs text-lexia-gray pt-3 border-t border-slate-100">
                    <span>{di.casesAffected} casos</span>
                    <span>WR: <strong className="text-lexia-black">{di.winRateWithCode}%</strong> vs {di.globalWinRate}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Denial Frequency Bar Chart (CSS) */}
      {data.denialFrequency && (
        <section>
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <div className="p-2 bg-[#7c3aed]/10 rounded-md">
                <Scale size={16} className="text-[#7c3aed]" />
              </div>
              <h3 className="text-lg font-bold text-lexia-black">Frecuencia de Razones de Negación</h3>
              <span className="text-xs text-lexia-gray ml-1">(Serie RN v1.1)</span>
            </div>
            <div className="p-6 space-y-3">
              {data.denialFrequency.map((df) => {
                const def = DENIAL_REASON_BY_CODE[df.code];
                const pct = (df.count / totalDR) * 100;
                return (
                  <div key={df.code} className="flex items-center gap-3">
                    <span className="font-mono text-xs w-14 text-lexia-gray">{df.code}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm text-lexia-black font-medium">{def?.label || df.code}</span>
                        <span className="text-xs text-lexia-gray">{df.count} ({pct.toFixed(1)}%)</span>
                      </div>
                      <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#7c3aed] rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Denial x Action Type Matrix */}
      {data.denialMatrix && (
        <section>
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <div className="p-2 bg-lexia-teal/10 rounded-md">
                <BarChart3 size={16} className="text-lexia-teal" />
              </div>
              <h3 className="text-lg font-bold text-lexia-black">Matriz: Razón de Negación x Tipo de Acción</h3>
            </div>
            <div className="p-6 space-y-5">
              {data.denialMatrix.map((row) => {
                const def = DENIAL_REASON_BY_CODE[row.code];
                const topActions = Object.entries(row.byActionType).slice(0, 5);
                return (
                  <div key={row.code} className="pb-5 border-b border-slate-100 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-xs bg-slate-100 text-lexia-gray px-2 py-0.5 rounded-md">{row.code}</span>
                      <span className="text-sm font-semibold text-lexia-black">{def?.label}</span>
                      <span className="text-xs text-lexia-gray">({row.total} total)</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {topActions.map(([action, count]) => (
                        <span
                          key={action}
                          className="text-xs bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1 text-lexia-black"
                        >
                          {action}: <strong className="text-lexia-teal">{count}</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Citation Types */}
      {data.citationTypes && (
        <section>
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <div className="p-2 bg-lexia-teal/10 rounded-md">
                <BookOpen size={16} className="text-lexia-teal" />
              </div>
              <h3 className="text-lg font-bold text-lexia-black">Distribución de Tipos de Cita</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {data.citationTypes.map((ct) => {
                  const pct = ((ct.count / totalCitations) * 100).toFixed(1);
                  return (
                    <div key={ct.type} className="bg-slate-50 border border-slate-100 rounded-lg p-4 hover:border-lexia-teal/30 transition-colors">
                      <div className="text-2xl font-bold text-lexia-black">{ct.count}</div>
                      <div className="text-xs text-lexia-gray mt-1">{ct.type}</div>
                      <div className="text-xs text-lexia-teal font-semibold mt-0.5">{pct}%</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Entity Leaderboard */}
      {data.topEntities && (
        <section>
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <div className="p-2 bg-[#ea580c]/10 rounded-md">
                <Users size={16} className="text-[#ea580c]" />
              </div>
              <h3 className="text-lg font-bold text-lexia-black">Litigantes Recurrentes</h3>
              <span className="text-xs text-lexia-gray ml-1">(Top 30)</span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-6 py-3 text-lexia-gray text-xs uppercase tracking-wider font-semibold">#</th>
                  <th className="text-left px-4 py-3 text-lexia-gray text-xs uppercase tracking-wider font-semibold">Nombre</th>
                  <th className="text-center px-4 py-3 text-lexia-gray text-xs uppercase tracking-wider font-semibold">Tipo</th>
                  <th className="text-right px-4 py-3 text-lexia-gray text-xs uppercase tracking-wider font-semibold">Casos</th>
                  <th className="text-right px-4 py-3 text-lexia-gray text-xs uppercase tracking-wider font-semibold">Plt</th>
                  <th className="text-right px-4 py-3 text-lexia-gray text-xs uppercase tracking-wider font-semibold">Def</th>
                  <th className="text-right px-4 py-3 text-lexia-gray text-xs uppercase tracking-wider font-semibold">Win Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.topEntities.map((e, i) => (
                  <tr key={e.canonicalName} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3 text-lexia-gray">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-lexia-black">
                      <Link href={`/entities/${e.id}`} className="hover:text-lexia-teal transition">{e.canonicalName}</Link>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                        e.entityType === 'PERSONA_NATURAL'
                          ? 'bg-[#2563eb]/10 text-[#2563eb]'
                          : 'bg-[#16a34a]/10 text-[#16a34a]'
                      }`}>
                        {e.entityType === 'PERSONA_NATURAL' ? 'Natural' : 'Jurídica'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-lexia-black">{e.totalCases}</td>
                    <td className="px-4 py-3 text-right text-[#16a34a] font-medium">{e.asPlaintiff}</td>
                    <td className="px-4 py-3 text-right text-red-500 font-medium">{e.asDefendant}</td>
                    <td className="px-4 py-3 text-right">
                      {e.winRate !== null ? (
                        <span className={`font-semibold ${e.winRate >= 0.5 ? 'text-[#16a34a]' : 'text-red-500'}`}>
                          {(e.winRate * 100).toFixed(0)}%
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
