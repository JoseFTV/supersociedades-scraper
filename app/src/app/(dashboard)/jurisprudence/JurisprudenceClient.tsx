'use client';

import { useState } from 'react';
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { AlertTriangle, Gavel, Loader2, Network, Clock } from 'lucide-react';
import dynamic from 'next/dynamic';
import EvidenceMetricsClient from './EvidenceMetricsClient';

const DynamicCitationGraph = dynamic(() => import('@/components/CitationGraph'), {
  ssr: false,
  loading: () => <div className="h-[600px] w-full bg-slate-50 animate-pulse rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 font-medium">Cargando Grafo Citacional...</div>
});

interface JurisprudenceEvolutionProps {
  actionTypes: string[];
}

interface YearlyAnalysis {
  year: number;
  probeStandard: string;
  institutionalPosition: string;
  keyShift: string | null;
  dominantRationale: string;
  caseCount: number;
  winRate: number;
}

interface Milestone {
  year: number;
  description: string;
}

interface EvolutionData {
  actionType: string;
  overallNarrative: string;
  yearlyAnalysis: YearlyAnalysis[];
  criticalMilestones: Milestone[];
  currentDoctrine: string;
}

export default function JurisprudenceClient({ actionTypes }: JurisprudenceEvolutionProps) {
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<EvolutionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'TIMELINE' | 'GRAPH' | 'EVIDENCE'>('TIMELINE');
  const [graphData, setGraphData] = useState<{ nodes: { id: string; name: string; year?: number; role?: string; score?: number; isExternal?: boolean; summary?: string }[], links: { source: string; target: string }[], topCited?: { name: string; citations: number }[] } | null>(null);

  const handleAnalyze = async () => {
    if (!selectedAction) return;

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await fetch('/api/jurisprudence-evolution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionType: selectedAction }),
      });

      if (!response.ok) {
        throw new Error('Error recuperando la evolución de la IA.');
      }

      const result = await response.json();
      setData(result);

      // Fetch Graph Data as well
      const graphRes = await fetch(`/api/jurisprudence-graph?actionType=${encodeURIComponent(selectedAction)}`);
      if (graphRes.ok) {
        const graphJson = await graphRes.json();
        setGraphData(graphJson);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const getColorForStandard = (type: string, val: string) => {
    const v = val.toUpperCase();
    if (type === 'probe') {
      if (v === 'BAJO') return 'bg-green-100 text-green-800 border-green-200';
      if (v === 'MEDIO') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      if (v === 'ALTO') return 'bg-orange-100 text-orange-800 border-orange-200';
      if (v === 'MUY ALTO') return 'bg-red-100 text-red-800 border-red-200';
    } else {
      if (v === 'FLEXIBLE') return 'bg-green-100 text-green-800 border-green-200';
      if (v === 'NEUTRO') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      if (v === 'RESTRICTIVO') return 'bg-orange-100 text-orange-800 border-orange-200';
      if (v === 'MUY RESTRICTIVO') return 'bg-red-100 text-red-800 border-red-200';
    }
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  // Custom DOT for line chart when there is a shift
  const CustomizedDot = (props: { cx?: number; cy?: number; payload?: YearlyAnalysis }) => {
    const { cx, cy, payload } = props;
    if (payload?.keyShift) {
      return (
        <svg x={(cx ?? 0) - 10} y={(cy ?? 0) - 10} width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        </svg>
      );
    }
    return <circle cx={cx} cy={cy} r={4} fill="#2563eb" stroke="none" />;
  };

  return (
    <div className="space-y-8 pb-20">

      {/* 1. Selector Actions */}
      <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <label className="block text-sm font-bold text-lexia-black mb-2">Seleccione Acción Societaria</label>
          <select
            className="w-full bg-slate-50 border border-slate-300 text-lexia-black text-sm rounded-lg focus:ring-lexia-teal focus:border-lexia-teal block p-3 outline-none"
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
          >
            <option value="">-- Escoja una acción para analizar --</option>
            {actionTypes.map(act => (
              <option key={act} value={act}>{act}</option>
            ))}
          </select>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={!selectedAction || loading}
          className="bg-lexia-teal hover:bg-lexia-teal-light text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 h-full"
        >
          {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Analizar Evolución'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}

      {loading && !data && (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="animate-spin h-10 w-10 text-lexia-teal" />
          <p className="text-lexia-gray font-medium animate-pulse">Analizando todo el arco jurisprudencial con AI...</p>
        </div>
      )}

      {data && (
        <div className="space-y-8 animate-in fade-in duration-500">

          {/* Tabs for Timeline vs Graph */}
          <div className="flex border-b border-slate-200 gap-6">
            <button
              onClick={() => setActiveTab('TIMELINE')}
              className={`pb-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'TIMELINE' ? 'border-lexia-teal text-lexia-teal' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              <Clock size={16} /> Evolución Doctrinal
            </button>
            <button
              onClick={() => setActiveTab('GRAPH')}
              className={`pb-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'GRAPH' ? 'border-lexia-teal text-lexia-teal' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              <Network size={16} /> Grafo de Precedentes
            </button>
            <button
              onClick={() => setActiveTab('EVIDENCE')}
              className={`pb-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'EVIDENCE' ? 'border-lexia-teal text-lexia-teal' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              <AlertTriangle size={16} /> Insight Probatorio
            </button>
          </div>

          {activeTab === 'EVIDENCE' && (
            <EvidenceMetricsClient actionType={selectedAction} />
          )}

          {activeTab === 'GRAPH' && graphData && (
            <div className="animate-in fade-in duration-300 space-y-6">

              {/* Top 5 Landmark Cases */}
              {graphData.topCited && graphData.topCited.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                  <h3 className="text-xl font-bold text-lexia-black mb-1">Las Sentencias Hito Más Citadas (Top 5)</h3>
                  <p className="text-sm text-lexia-gray mb-4">Fallos fundacionales que sostienen el árbol jurisprudencial actual para esta acción.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {graphData.topCited.map((c: { name: string; citations: number }, idx: number) => (
                      <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col justify-between hover:border-lexia-teal transition-colors">
                        <h4 className="font-bold text-lexia-black text-xs line-clamp-3" title={c.name}>{c.name}</h4>
                        <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3">
                          <span className="text-[10px] text-lexia-gray font-bold uppercase tracking-wider">Veces Citada:</span>
                          <span className="bg-lexia-teal text-white text-xs font-bold px-2 py-1 rounded shadow-sm">
                            {c.citations}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white border border-slate-200 rounded-xl shadow-sm relative overflow-hidden">
                <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-600 shadow-sm pointer-events-none">
                  Nodos más grandes = Más citados
                </div>
                <DynamicCitationGraph data={graphData} />
              </div>
            </div>
          )}

          {activeTab === 'TIMELINE' && (
            <>
              {/* 2. Timeline Graphic */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-xl font-bold text-lexia-black mb-1">Tendencias y Volúmenes de Fallos</h3>
                <p className="text-sm text-lexia-gray mb-6">
                  El gráfico muestra el Win Rate del demandante (Línea) versus la cantidad total de sentencias falladas (Barras).
                  Un ícono de <AlertTriangle className="inline h-4 w-4 text-yellow-500 mx-1" /> indica un cambio doctrinal en ese año.
                </p>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data.yearlyAnalysis} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <CartesianGrid stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="year" stroke="#94a3b8" tick={{ fontSize: 12, fill: '#64748b' }} />
                      <YAxis yAxisId="left" stroke="#94a3b8" tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(t) => `${t}%`} />
                      <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" tick={{ fontSize: 12, fill: '#64748b' }} />
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} />
                      <Bar yAxisId="right" dataKey="caseCount" name="Nº Casos" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={40} />
                      <Line yAxisId="left" type="monotone" dataKey="winRate" name="Win Rate Demandante (%)" stroke="#2563eb" strokeWidth={3} dot={<CustomizedDot />} activeDot={{ r: 6 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 3. Heatmap Standards */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm overflow-x-auto">
                  <h3 className="text-xl font-bold text-lexia-black mb-6">Termómetro de Estándares</h3>
                  <table className="min-w-full text-left">
                    <thead>
                      <tr>
                        <th className="pb-3 text-sm font-bold text-lexia-gray uppercase">Año</th>
                        <th className="pb-3 text-sm font-bold text-lexia-gray uppercase">Carga Probatoria</th>
                        <th className="pb-3 text-sm font-bold text-lexia-gray uppercase">Postura Institucional</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.yearlyAnalysis.map((ya) => (
                        <tr key={ya.year}>
                          <td className="py-4 font-bold text-lexia-black">{ya.year}</td>
                          <td className="py-4 pr-4">
                            <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getColorForStandard('probe', ya.probeStandard)}`}>
                              {ya.probeStandard}
                            </span>
                          </td>
                          <td className="py-4">
                            <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getColorForStandard('inst', ya.institutionalPosition)}`}>
                              {ya.institutionalPosition}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 4. AI Narrative & Milestones */}
                <div className="space-y-6">
                  <div className="bg-slate-50 border-l-4 border-lexia-teal p-5 rounded-r-xl">
                    <h4 className="text-xs font-bold text-lexia-teal uppercase tracking-wider mb-2">El Arco Histórico (AI)</h4>
                    <p className="text-lexia-black font-medium leading-relaxed text-sm">
                      {data.overallNarrative}
                    </p>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                    <h3 className="text-xl font-bold text-lexia-black mb-5">Hitos Doctrinales</h3>
                    <div className="space-y-4">
                      {data.criticalMilestones.map((cm, idx) => (
                        <div key={idx} className="flex gap-4 items-start">
                          <div className="bg-lexia-teal/10 p-2 rounded-lg shrink-0 mt-1">
                            <Gavel className="h-5 w-5 text-lexia-teal" />
                          </div>
                          <div>
                            <span className="inline-block bg-slate-800 text-white text-xs font-bold px-2 py-0.5 rounded mb-1">{cm.year}</span>
                            <p className="text-sm text-lexia-black">{cm.description}</p>
                          </div>
                        </div>
                      ))}
                      {data.criticalMilestones.length === 0 && (
                        <p className="text-sm text-lexia-gray">La IA no detectó hitos doctrinales críticos en este set de sentencias.</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-[#f0fdfa] border border-lexia-teal/20 p-5 rounded-xl">
                    <h4 className="text-xs font-bold text-[#0f766e] uppercase tracking-wider mb-2">Doctrina Vigente</h4>
                    <p className="text-[#0f766e] font-medium leading-relaxed text-sm">
                      {data.currentDoctrine}
                    </p>
                  </div>
                </div>
              </div>

              {/* 5. Rationale Accordion */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-xl font-bold text-lexia-black mb-5">Razonamientos Dominantes por Año</h3>
                <div className="space-y-3">
                  {data.yearlyAnalysis.map((ya) => (
                    <details key={ya.year} className="group bg-slate-50 rounded-lg p-4 cursor-pointer">
                      <summary className="font-bold text-lexia-black list-none flex justify-between items-center">
                        <span>Análisis del año {ya.year}</span>
                        <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                      </summary>
                      <div className="mt-3 text-sm text-lexia-gray leading-relaxed pl-2 border-l-2 border-slate-300">
                        <p><strong>Criterio Dominante:</strong> {ya.dominantRationale}</p>
                        {ya.keyShift && (
                          <p className="mt-2 text-amber-600"><strong>Cambio Doctrinal Detectado:</strong> {ya.keyShift}</p>
                        )}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            </>
          )}

        </div>
      )}
    </div>
  );
}
