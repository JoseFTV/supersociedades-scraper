'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Filter, Search, ChevronRight, Sparkles, Loader2 } from 'lucide-react';
import { Case } from '@prisma/client';

export default function CaseExplorerClient({ initialCases }: { initialCases: Case[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOutcome, setSelectedOutcome] = useState('All');
  
  // Semantic Search State
  const [isSearching, setIsSearching] = useState(false);
  const [semanticResults, setSemanticResults] = useState<(Case & { similarity?: number })[] | null>(null);
  
  const handleSemanticSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      setSemanticResults(null);
      return;
    }
    
    setIsSearching(true);
    try {
      const res = await fetch('/api/cases/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchTerm })
      });
      const data = await res.json();
      if (data.results) {
        setSemanticResults(data.results);
      }
    } catch (error) {
      console.error('Semantic search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  type CaseWithSimilarity = Case & { similarity?: number };

  // Basic filtering (Fallback for initial DB data or reset state)
  const filteredCases: CaseWithSimilarity[] = semanticResults ? semanticResults : initialCases.filter(c => {
    const matchesSearch = c.caseName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.summary.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesOutcome = selectedOutcome === 'All' || c.outcomeGeneral === selectedOutcome;
    return matchesSearch && matchesOutcome;
  });

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
        <div>
          <h2 className="text-3xl font-bold text-lexia-black tracking-tight">Explorador de Casos</h2>
          <p className="text-lexia-gray mt-2 text-sm max-w-2xl">
            Explora, filtra y busca en el corpus jurisprudencial usando IA.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        <form onSubmit={handleSemanticSearch} className="flex w-full md:w-auto items-center space-x-2 flex-grow max-w-2xl">
          <div className="relative w-full group">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-lexia-gray group-focus-within:text-lexia-teal transition-colors" />
            <input 
              type="text" 
              placeholder="Ej: Casos donde se discutió la legitimación en la causa por acuerdos parasocietarios..." 
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (e.target.value === '') setSemanticResults(null);
              }}
              className="pl-9 pr-4 py-2.5 w-full bg-[#FAFBFC] border border-slate-200 rounded-lg text-sm text-lexia-black focus:outline-none focus:ring-1 focus:ring-lexia-teal focus:border-lexia-teal transition-all"
            />
          </div>
          <button 
            type="submit"
            disabled={isSearching || !searchTerm.trim()}
            className="flex items-center space-x-2 bg-lexia-teal hover:bg-[#006666] text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            <span>Búsqueda con IA</span>
          </button>
        </form>

        <div className="flex w-full md:w-auto items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-lexia-gray" />
            <select 
              className="bg-[#FAFBFC] border border-slate-200 rounded-lg text-sm text-lexia-black py-2.5 pl-3 pr-8 focus:outline-none focus:ring-1 focus:ring-lexia-teal focus:border-lexia-teal appearance-none cursor-pointer transition-all"
              value={selectedOutcome}
              onChange={(e) => setSelectedOutcome(e.target.value)}
            >
              <option value="All">Todos los Resultados</option>
              <option value="Demandante prevalece">Demandante prevalece</option>
              <option value="Demandado prevalece">Demandado prevalece</option>
              <option value="Mixto/Parcial">Mixto/Parcial</option>
              <option value="Desestimado">Desestimado</option>
              <option value="Transado">Transado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Case List */}
      <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 shadow-sm overflow-hidden flex-grow">
        
        {semanticResults && (
          <div className="p-3 bg-[#008080]/5 border-b border-[#008080]/10 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-lexia-teal font-medium">
              <Sparkles className="h-4 w-4" />
              <span>Mostrando resultados más relevantes por similitud semántica ({semanticResults.length})</span>
            </div>
            <button 
              onClick={() => { setSearchTerm(''); setSemanticResults(null); }}
              className="text-xs text-lexia-gray hover:text-lexia-black underline"
            >
              Limpiar búsqueda
            </button>
          </div>
        )}

        {filteredCases.map((c) => (
          <Link href={`/cases/${c.id}`} key={c.id}>
            <div className="p-6 hover:bg-slate-50 transition-colors cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex-1 space-y-3">
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-semibold px-2.5 py-1 bg-lexia-teal/10 text-lexia-teal rounded-md border border-lexia-teal/20">
                    {c.actionType}
                  </span>
                  <span className="text-xs text-lexia-gray flex items-center font-medium">
                     {c.sourceReference || 'Radicado N/A'} • {c.decisionDate || c.year}
                  </span>
                  {c.similarity !== undefined && (
                     <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100 flex items-center">
                       <Sparkles className="h-3 w-3 mr-1" /> Relevancia: {(c.similarity * 100).toFixed(1)}%
                     </span>
                  )}
                </div>
                {c.similarity !== undefined && c.similarity >= 0.55 && (
                  <p className="text-[11px] text-purple-600 italic mt-1">
                    {c.similarity >= 0.85
                      ? `Alta coincidencia semántica — el patrón fáctico y jurídico es muy similar a tu búsqueda`
                      : c.similarity >= 0.70
                      ? `Relevancia moderada — comparte elementos jurídicos con tu consulta (${c.actionType})`
                      : `Conexión parcial — tema relacionado en ${c.actionType}`}
                  </p>
                )}
                <h3 className="text-lg font-bold text-lexia-black group-hover:text-lexia-teal transition-colors">
                  {c.caseName}
                </h3>
                <p className="text-sm text-lexia-gray line-clamp-2">
                  {c.summary}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {(c.subtopics || []).map((st: string) => (
                    <span key={st} className="text-xs px-2.5 py-0.5 rounded-full bg-[#FAFBFC] text-lexia-gray border border-slate-200">
                      {st}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-start md:items-end justify-between min-w-[140px] h-full space-y-4">
                <div className={`text-xs px-3 py-1.5 rounded-md border font-bold ${
                  c.outcomeGeneral === 'Demandante prevalece' ? 'bg-[#16a34a]/10 text-[#16a34a] border-[#16a34a]/20' :
                  c.outcomeGeneral === 'Demandado prevalece' ? 'bg-[#dc2626]/10 text-[#dc2626] border-[#dc2626]/20' :
                  'bg-[#d97706]/10 text-[#d97706] border-[#d97706]/20'
                }`}>
                  {c.outcomeGeneral}
                </div>
                <div className="flex items-center text-lexia-teal text-sm font-bold group-hover:translate-x-1 transition-transform">
                  Ver Expediente <ChevronRight className="h-4 w-4 ml-1" />
                </div>
              </div>
            </div>
          </Link>
        ))}
        {filteredCases.length === 0 && !isSearching && (
          <div className="p-12 text-center text-lexia-gray font-medium">
            Ningún caso coincide con tus filtros o aún no hay casos en la base de datos.
          </div>
        )}
      </div>
    </div>
  );
}
