'use client';

import { useEffect, useState } from 'react';
import {
  BarChart3, Users, Scale, AlertTriangle, TrendingDown, TrendingUp,
  Loader2, BookOpen, ArrowLeft, Download, FileSpreadsheet
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
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <Loader2 className="animate-spin mr-3" size={24} />
        Cargando métricas de segundo orden...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-red-400">
        Error: {error || 'Sin datos'}
      </div>
    );
  }

  const totalDR = data.denialFrequency?.reduce((s, r) => s + r.count, 0) || 1;
  const totalCitations = data.citationTypes?.reduce((s, c) => s + c.count, 0) || 1;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/analytics" className="text-gray-400 hover:text-white transition">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Análisis Profundo</h1>
            <p className="text-gray-400 text-sm">
              Métricas de segundo orden: razones de negación × tipo de acción, resolución de entidades, grafo citacional
            </p>
          </div>
          <div className="flex gap-2">
            <a
              href="/api/exports/excel?sheet=cases"
              className="flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-lg transition"
            >
              <FileSpreadsheet size={14} /> Sentencias CSV
            </a>
            <a
              href="/api/exports/excel?sheet=denial-reasons"
              className="flex items-center gap-1.5 text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-2 rounded-lg transition"
            >
              <Download size={14} /> Negaciones CSV
            </a>
            <a
              href="/api/exports/excel?sheet=entities"
              className="flex items-center gap-1.5 text-xs bg-orange-600 hover:bg-orange-500 text-white px-3 py-2 rounded-lg transition"
            >
              <Users size={14} /> Entidades CSV
            </a>
          </div>
        </div>

        {/* Summary Cards */}
        {data.summary && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {[
              { label: 'Sentencias', value: data.summary.totalCases, icon: Scale },
              { label: 'Razones de Negación', value: data.summary.totalDenialReasons, icon: AlertTriangle },
              { label: 'Citas Tipificadas', value: data.summary.totalAuthorities, icon: BookOpen },
              { label: 'Entidades', value: data.summary.totalEntities, icon: Users },
              { label: 'Conceptos', value: data.summary.totalConceptos, icon: BarChart3 },
              { label: 'Laudos', value: data.summary.totalLaudos, icon: Scale },
            ].map((card) => (
              <div key={card.label} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <card.icon size={16} className="text-gray-500 mb-2" />
                <div className="text-2xl font-bold">{card.value.toLocaleString()}</div>
                <div className="text-xs text-gray-400">{card.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Win Rates by Action Type */}
        {data.winRates && (
          <section className="mb-10">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BarChart3 size={20} className="text-blue-400" />
              Win Rate por Tipo de Acción
            </h2>
            <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400">
                    <th className="text-left p-3">Tipo de Acción</th>
                    <th className="text-right p-3">Casos</th>
                    <th className="text-right p-3">Win Rate</th>
                    <th className="text-left p-3 w-64">Distribución</th>
                    <th className="text-center p-3">Perfil</th>
                  </tr>
                </thead>
                <tbody>
                  {data.winRates.map((wr) => (
                    <tr key={wr.actionType} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                      <td className="p-3 font-medium">{wr.actionType}</td>
                      <td className="p-3 text-right text-gray-300">{wr.total}</td>
                      <td className="p-3 text-right">
                        <span className={wr.winRate >= 50 ? 'text-green-400' : 'text-red-400'}>
                          {wr.winRate}%
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex h-4 rounded overflow-hidden bg-gray-700">
                          <div
                            className="bg-green-500"
                            style={{ width: `${wr.total > 0 ? (wr.wins / wr.total) * 100 : 0}%` }}
                            title={`Demandante: ${wr.wins}`}
                          />
                          <div
                            className="bg-yellow-500"
                            style={{ width: `${wr.total > 0 ? (wr.mixed / wr.total) * 100 : 0}%` }}
                            title={`Mixto: ${wr.mixed}`}
                          />
                          <div
                            className="bg-red-500"
                            style={{ width: `${wr.total > 0 ? (wr.losses / wr.total) * 100 : 0}%` }}
                            title={`Demandado: ${wr.losses}`}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-500 mt-0.5">
                          <span>{wr.wins}G</span>
                          <span>{wr.mixed}M</span>
                          <span>{wr.losses}P</span>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <a
                          href={`/api/exports/action-profile?actionType=${encodeURIComponent(wr.actionType)}`}
                          className="inline-flex items-center gap-1 text-[10px] bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1 rounded transition"
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
          <section className="mb-10">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle size={20} className="text-amber-400" />
              Impacto de Razones de Negación en Win Rate
            </h2>
            <p className="text-xs text-gray-400 mb-3">
              Cómo cada razón de negación afecta la probabilidad de éxito del demandante vs el win rate global ({data.denialImpact[0]?.globalWinRate}%)
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.denialImpact.map((di) => {
                const def = DENIAL_REASON_BY_CODE[di.code];
                return (
                  <div key={di.code} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs bg-gray-800 px-2 py-0.5 rounded">{di.code}</span>
                      <span className={`text-sm font-bold flex items-center gap-1 ${di.winRateDelta < 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {di.winRateDelta < 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                        {di.winRateDelta > 0 ? '+' : ''}{di.winRateDelta}%
                      </span>
                    </div>
                    <div className="text-sm font-medium mb-1">{def?.label || di.code}</div>
                    <div className="text-xs text-gray-400 mb-2 line-clamp-2">{def?.definition}</div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{di.casesAffected} casos</span>
                      <span>WR: {di.winRateWithCode}% vs {di.globalWinRate}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Denial Frequency Bar Chart (CSS) */}
        {data.denialFrequency && (
          <section className="mb-10">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Scale size={20} className="text-purple-400" />
              Frecuencia de Razones de Negación (Serie RN v1.1)
            </h2>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-2">
              {data.denialFrequency.map((df) => {
                const def = DENIAL_REASON_BY_CODE[df.code];
                const pct = (df.count / totalDR) * 100;
                return (
                  <div key={df.code} className="flex items-center gap-3">
                    <span className="font-mono text-xs w-14 text-gray-400">{df.code}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm">{def?.label || df.code}</span>
                        <span className="text-xs text-gray-500">{df.count} ({pct.toFixed(1)}%)</span>
                      </div>
                      <div className="h-3 bg-gray-800 rounded overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Denial × Action Type Matrix */}
        {data.denialMatrix && (
          <section className="mb-10">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BarChart3 size={20} className="text-cyan-400" />
              Matriz: Razón de Negación x Tipo de Acción
            </h2>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 overflow-x-auto">
              {data.denialMatrix.map((row) => {
                const def = DENIAL_REASON_BY_CODE[row.code];
                const topActions = Object.entries(row.byActionType).slice(0, 5);
                return (
                  <div key={row.code} className="mb-4 last:mb-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs bg-gray-800 px-2 py-0.5 rounded">{row.code}</span>
                      <span className="text-sm font-medium">{def?.label}</span>
                      <span className="text-xs text-gray-500">({row.total} total)</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {topActions.map(([action, count]) => (
                        <span
                          key={action}
                          className="text-xs bg-gray-800 border border-gray-700 rounded px-2 py-1"
                        >
                          {action}: <strong>{count}</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Citation Types */}
        {data.citationTypes && (
          <section className="mb-10">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BookOpen size={20} className="text-teal-400" />
              Distribución de Tipos de Cita
            </h2>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {data.citationTypes.map((ct) => {
                  const pct = ((ct.count / totalCitations) * 100).toFixed(1);
                  return (
                    <div key={ct.type} className="bg-gray-800 rounded-lg p-3">
                      <div className="text-lg font-bold">{ct.count}</div>
                      <div className="text-xs text-gray-400">{ct.type}</div>
                      <div className="text-xs text-teal-400">{pct}%</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Entity Leaderboard */}
        {data.topEntities && (
          <section className="mb-10">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users size={20} className="text-orange-400" />
              Litigantes Recurrentes (Top 30)
            </h2>
            <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400">
                    <th className="text-left p-3">#</th>
                    <th className="text-left p-3">Nombre</th>
                    <th className="text-center p-3">Tipo</th>
                    <th className="text-right p-3">Casos</th>
                    <th className="text-right p-3">Plt</th>
                    <th className="text-right p-3">Def</th>
                    <th className="text-right p-3">Win Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topEntities.map((e, i) => (
                    <tr key={e.canonicalName} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                      <td className="p-3 text-gray-500">{i + 1}</td>
                      <td className="p-3 font-medium">
                        <Link href={`/entities/${e.id}`} className="hover:text-teal-400 transition">{e.canonicalName}</Link>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          e.entityType === 'PERSONA_NATURAL' ? 'bg-blue-900/50 text-blue-300' : 'bg-emerald-900/50 text-emerald-300'
                        }`}>
                          {e.entityType === 'PERSONA_NATURAL' ? 'Natural' : 'Juridica'}
                        </span>
                      </td>
                      <td className="p-3 text-right font-bold">{e.totalCases}</td>
                      <td className="p-3 text-right text-green-400">{e.asPlaintiff}</td>
                      <td className="p-3 text-right text-red-400">{e.asDefendant}</td>
                      <td className="p-3 text-right">
                        {e.winRate !== null ? (
                          <span className={e.winRate >= 0.5 ? 'text-green-400' : 'text-red-400'}>
                            {(e.winRate * 100).toFixed(0)}%
                          </span>
                        ) : (
                          <span className="text-gray-600">-</span>
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
    </div>
  );
}
