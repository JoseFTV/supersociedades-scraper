'use client';

import { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, LabelList
} from 'recharts';
import { Loader2, Scale, Target } from 'lucide-react';

interface EvidenceMetric {
    category: string;
    totalAppeared: number;
    decisiveWins: number;
    decisivelyWinRate: number; // Porcentaje 0-100
}

interface EvidenceMetricsResponse {
    success: boolean;
    totalAnalyzedCases: number;
    plaintiffWins: number;
    metrics: EvidenceMetric[];
    topInsight: string | null;
    error?: string;
}

interface EvidenceMetricsClientProps {
    actionType: string;
}

export default function EvidenceMetricsClient({ actionType }: EvidenceMetricsClientProps) {
    const [data, setData] = useState<EvidenceMetricsResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!actionType) return;

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`/api/evidence-metrics?actionType=${encodeURIComponent(actionType)}`);
                if (!res.ok) throw new Error('Error recuperando analítica probatoria');
                const json = await res.json();

                if (json.error) throw new Error(json.error);
                setData(json);
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : 'Error de conexión');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [actionType]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white border border-slate-200 rounded-xl shadow-sm">
                <Loader2 className="animate-spin h-8 w-8 text-lexia-teal mb-4" />
                <p className="text-slate-500 font-medium">Cruzando pesos probatorios vs ratios de éxito...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                <p className="text-red-700 font-medium">{error}</p>
            </div>
        );
    }

    if (!data || !data.metrics || data.metrics.length === 0) {
        return (
            <div className="text-center p-12 bg-white border border-slate-200 rounded-xl shadow-sm">
                <Scale className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-700">Sin Datos Probatorios</h3>
                <p className="text-slate-500 mt-2">
                    No hay suficiente volumen de sentencias extraídas con IA para perfilar estadísticamente el peso de las pruebas en esta acción.
                </p>
            </div>
        );
    }

    // Los colores de las barras dependen del Win Rate (Más alto = más Lexia Teal oscuro)
    const getBarColor = (winRate: number) => {
        if (winRate > 60) return '#0f766e'; // Teal 700
        if (winRate > 30) return '#14b8a6'; // Teal 500
        if (winRate > 10) return '#5eead4'; // Teal 300
        return '#cbd5e1'; // Slate 300
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* Insight Card */}
            {data.topInsight && (
                <div className="bg-gradient-to-br from-[#0f766e] to-lexia-teal border border-lexia-teal/50 rounded-xl p-6 shadow-md text-white">
                    <div className="flex items-start gap-4">
                        <div className="bg-white/20 p-3 rounded-xl shrink-0">
                            <Target className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-wider text-lexia-teal-light mb-2">Insight Asimétrico del Algoritmo</h3>
                            <p className="text-lg leading-relaxed font-medium">
                                {data.topInsight}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Chart and Stats Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Main Chart */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-lexia-black mb-1">Efectividad por Categoría Probatoria</h3>
                    <p className="text-sm text-lexia-gray mb-6">Frecuencia con la que el Juez la cataloga como 'DECISIVA' en fallos favorables al demandante.</p>

                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.metrics} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                                <XAxis type="number" domain={[0, 100]} tickFormatter={(val) => `${val}%`} stroke="#94a3b8" fontSize={12} />
                                <YAxis dataKey="category" type="category" stroke="#475569" fontSize={12} fontWeight="bold" width={100} />
                                <RechartsTooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value) => [`${value}% de Win Rate Decisivo`, 'Efectividad']}
                                />
                                <Bar dataKey="decisivelyWinRate" radius={[0, 4, 4, 0]} barSize={32}>
                                    {data.metrics.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={getBarColor(entry.decisivelyWinRate)} />
                                    ))}
                                    <LabelList dataKey="decisivelyWinRate" position="right" formatter={(v) => `${v}%`} fill="#475569" fontSize={12} fontWeight="bold" />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Breakdown Stats Box */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-lexia-black mb-6">Métrica Base</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                                <span className="text-slate-500 font-medium">Muestra Analizada</span>
                                <span className="text-lexia-black font-bold text-lg">{data.totalAnalyzedCases} fallos</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                                <span className="text-slate-500 font-medium">Victorias del Accionante</span>
                                <span className="text-lexia-teal font-bold text-lg">{data.plaintiffWins} fallos</span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-8 bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <p className="text-xs text-slate-500 leading-relaxed text-center">
                            El porcentaje mide qué tan vital fue esa categoría específica de prueba dentro del subconjunto de procesos que el demandante ganó.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}
