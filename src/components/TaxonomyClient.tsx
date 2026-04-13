'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Bot, Loader2, ArrowRight, Scale } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';
import { Case } from '@prisma/client';
import { ACTION_TYPES, canonicalize } from '@/lib/taxonomy';

type TaxonomyCategory = {
  type: string;
  description: string;
  subtopics: string[];
  icon: React.ComponentType<{ className?: string }>;
};

// We only fetched partial data in the Server Component to keep it lightweight!
type LightCase = Pick<Case, 'id' | 'caseName' | 'actionType' | 'year' | 'duration' | 'outcomeGeneral'>;

// Derive UI categories from the canonical taxonomy (single source of truth)
const taxonomyCategories: TaxonomyCategory[] = ACTION_TYPES
  .filter(at => at.code !== 'AS.99') // Don't show "Requiere revisión manual" in UI
  .map(at => ({
    type: at.label,
    description: at.description,
    subtopics: at.subtopics,
    icon: at.icon,
  }));

export default function TaxonomyClient({ 
  cases 
}: { 
  cases: LightCase[] 
}) {
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [insightsTracker, setInsightsTracker] = useState<Record<string, { loading: boolean, data?: string, error?: string }>>({});

  const toggleCategory = (type: string) => {
    if (expandedCat === type) {
      setExpandedCat(null);
    } else {
      setExpandedCat(type);
    }
  };

  const handleGenerateInsight = async (type: string, categoryCases: LightCase[]) => {
    // If we have no cases, don't generate
    if (categoryCases.length === 0) return;

    setInsightsTracker(prev => ({
      ...prev,
      [type]: { loading: true, error: undefined }
    }));

    try {
      const res = await fetch('/api/taxonomy-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          actionType: type,
          // Just pass IDs to keep payload small, the server can refetch the necessary details like 'outcomeDetailed' using Prisma
          caseIds: categoryCases.map(c => c.id) 
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Generación fallida');
      }

      setInsightsTracker(prev => ({
        ...prev,
        [type]: { loading: false, data: data.insight }
      }));

    } catch (error: unknown) {
      setInsightsTracker(prev => ({
        ...prev,
        [type]: { loading: false, error: error instanceof Error ? error.message : 'Error desconocido' }
      }));
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-lexia-black tracking-tight flex items-center">
            <Scale className="h-8 w-8 mr-3 text-lexia-teal" /> Taxonomía Dinámica Estratégica
          </h2>
          <p className="text-lexia-gray mt-2 text-sm max-w-2xl">
            Ontología interactiva conectada a tu base de datos de casos reales. Haz clic en una categoría para ver sus métricas y generar Insights de Inteligencia Artificial sobre las razones de victoria y derrota procesal.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {taxonomyCategories.map((cat, idx) => {
          const isExpanded = expandedCat === cat.type;
          
          // Compute KPIs for this specific category
          // Match using canonicalize() so old/variant actionTypes map correctly
          const categoryCases = cases.filter(c => canonicalize(c.actionType).label === cat.type);
          const totalCategoryCases = categoryCases.length;
          
          let plaintiffWins = 0;
          let totalMonths = 0;
          const recentCases = categoryCases.slice(0, 3); // top 3 most recent

          categoryCases.forEach(c => {
            if (c.outcomeGeneral === 'Demandante prevalece' || c.outcomeGeneral === 'DEMANDANTE_GANA') plaintiffWins++;
            const match = c.duration?.match(/\d+/);
            if (match) totalMonths += parseInt(match[0], 10);
          });

          const winRate = totalCategoryCases > 0 ? Math.round((plaintiffWins / totalCategoryCases) * 100) : 0;
          const avgDuration = totalCategoryCases > 0 ? Math.round(totalMonths / totalCategoryCases) : 0;
          
          const insightState = insightsTracker[cat.type];

          return (
            <div key={idx} className={`bg-white border rounded-xl overflow-hidden shadow-sm transition-all duration-300 ${isExpanded ? 'border-lexia-teal ring-1 ring-lexia-teal/20' : 'border-slate-200 hover:border-slate-300'}`}>
              
              {/* Header / Clickable Area */}
              <button 
                onClick={() => toggleCategory(cat.type)}
                className="w-full text-left p-6 flex items-center justify-between hover:bg-slate-50 transition-colors focus:outline-none"
              >
                <div className="flex items-center">
                  <div className={`p-2.5 rounded-lg mr-4 transition-colors ${isExpanded ? 'bg-lexia-teal text-white' : 'bg-lexia-teal/10 text-lexia-teal'}`}>
                    <cat.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className={`text-xl font-bold transition-colors ${isExpanded ? 'text-lexia-teal' : 'text-lexia-black'}`}>
                      {cat.type}
                    </h3>
                    {!isExpanded && (
                      <div className="mt-1 flex items-center space-x-3 text-xs font-semibold text-lexia-gray">
                        <span className={totalCategoryCases > 0 ? 'text-lexia-teal' : ''}>{totalCategoryCases} casos</span>
                        <span>•</span>
                        <span>{winRate}% Tasa Éxito Dem.</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-slate-400">
                  {isExpanded ? <ChevronUp className="h-6 w-6" /> : <ChevronDown className="h-6 w-6" />}
                </div>
              </button>

              {/* Expanded Content Body */}
              {isExpanded && (
                <div className="px-6 pb-6 pt-2 border-t border-slate-100 bg-[#FAFBFC]/50">
                  <p className="text-lexia-black/80 text-sm mb-6 leading-relaxed">
                    {cat.description}
                  </p>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Left Col: KPI & Subtopics */}
                    <div className="col-span-1 space-y-6">
                      <div className="bg-white border border-slate-200 rounded-lg p-4">
                        <h4 className="text-xs tracking-wider uppercase text-lexia-gray font-bold mb-4">Métricas Internas</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Volumen</span>
                            <span className="text-xl font-bold text-lexia-black">{totalCategoryCases}</span>
                          </div>
                          <div>
                            <span className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Duración Prom.</span>
                            <span className="text-xl font-bold text-lexia-black">{avgDuration || '-'} <span className="text-xs font-normal text-lexia-gray">meses</span></span>
                          </div>
                          <div>
                            <span className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Éxito Demandante</span>
                            <span className={`text-xl font-bold ${winRate > 50 ? 'text-green-600' : 'text-amber-600'}`}>
                              {totalCategoryCases > 0 ? `${winRate}%` : '-'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white border border-slate-200 rounded-lg p-4">
                        <h4 className="text-xs tracking-wider uppercase text-lexia-gray font-bold mb-3">Subtemas Conocidos</h4>
                        <div className="flex flex-wrap gap-2">
                          {cat.subtopics.map(st => (
                            <span key={st} className="text-[11px] px-2 py-1 rounded bg-[#f1f5f9] text-lexia-gray font-medium">
                              {st}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right Col: AI Insights and Recent Cases */}
                    <div className="col-span-2 space-y-6">
                      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                        <div className="bg-lexia-black p-3 flex justify-between items-center">
                          <h4 className="text-xs tracking-wider uppercase text-white font-bold flex items-center">
                            <Bot className="h-4 w-4 mr-2" />
                            Insight Estratégico (Gemini IA)
                          </h4>
                          {(!insightState || (!insightState.data && !insightState.loading)) && totalCategoryCases > 0 && (
                            <button 
                              onClick={() => handleGenerateInsight(cat.type, categoryCases)}
                              className="text-xs bg-lexia-teal hover:bg-lexia-teal-light text-white px-3 py-1.5 rounded font-bold transition-colors"
                            >
                              Generar Razones Éxito/Fracaso
                            </button>
                          )}
                        </div>
                        
                        <div className="p-4 prose prose-sm max-w-none text-lexia-black bg-[#f0fdfa]/30">
                          {totalCategoryCases === 0 ? (
                            <p className="text-lexia-gray text-sm italic m-0">No hay data histórica suficiente para generar un insight.</p>
                          ) : insightState?.loading ? (
                            <div className="flex items-center text-lexia-teal text-sm font-medium py-4 justify-center">
                              <Loader2 className="animate-spin h-5 w-5 mr-3" />
                              Analizando jurisprudencia asociada en profundidad... (aprox 30s)
                            </div>
                          ) : insightState?.error ? (
                            <p className="text-red-500 text-sm m-0">Error: {insightState.error}</p>
                          ) : insightState?.data ? (
                            <div className="prose-headings:text-lexia-black prose-a:text-lexia-teal animate-in fade-in duration-500 text-[13px]">
                              <ReactMarkdown>{insightState.data}</ReactMarkdown>
                            </div>
                          ) : (
                            <p className="text-lexia-gray text-sm italic m-0">Haz clic en Generar para analizar los fallos recientes de {cat.type}.</p>
                          )}
                        </div>
                      </div>

                      {totalCategoryCases > 0 && (
                        <div>
                           <h4 className="text-xs tracking-wider uppercase text-lexia-gray font-bold mb-3 flex items-center justify-between">
                             Top Casos Recientes
                             <Link href="/cases" className="text-lexia-teal flex items-center hover:underline">
                               Ver todos <ArrowRight className="h-3 w-3 ml-1" />
                             </Link>
                           </h4>
                           <div className="grid grid-cols-1 gap-2">
                             {recentCases.map(c => (
                                <Link href={`/cases/${c.id}`} key={c.id}>
                                  <div className="text-sm bg-white border border-slate-200 p-3 rounded hover:border-lexia-teal hover:shadow-sm transition-all flex justify-between items-center group">
                                    <span className="font-semibold text-lexia-black group-hover:text-lexia-teal truncate pr-4">
                                      {c.caseName}
                                    </span>
                                    <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-bold">
                                      {c.year}
                                    </span>
                                  </div>
                                </Link>
                             ))}
                           </div>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
