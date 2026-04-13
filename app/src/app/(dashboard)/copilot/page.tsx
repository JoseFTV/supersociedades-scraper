'use client';

import { useState, useRef } from 'react';
import { Bot, FileText, Search, AlertCircle, ChevronRight, Scale, BrainCircuit, Copy, Check, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';
import { useCopilot } from '@/context/CopilotContext';

export default function CopilotPage() {
  const { 
    factPattern, 
    setFactPattern, 
    isLoading, 
    memo, 
    citedCases, 
    error, 
    handleGenerate 
  } = useCopilot();
  
  const [isCopied, setIsCopied] = useState(false);
  const memoRef = useRef<HTMLDivElement>(null);

  const handleCopy = () => {
    if (memo) {
      navigator.clipboard.writeText(memo);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleDownloadWord = () => {
    if (!memoRef.current) return;
    
    // Convert React rendered HTML into a Word-compatible blob
    const htmlContent = memoRef.current.innerHTML;
    
    const htmlTemplate = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset='utf-8'>
          <title>Memorando Estratégico - Lexia Abogados</title>
          <style>
            body { font-family: 'Calibri', sans-serif; line-height: 1.5; }
            h1, h2, h3 { color: #1a1a1a; }
            table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
            th, td { border: 1px solid #cccccc; padding: 10px; text-align: left; vertical-align: top; }
            th { background-color: #f2f8f8; color: #005A60; }
            a { color: #008790; text-decoration: none; }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', htmlTemplate], {
      type: 'application/msword'
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Memorando_Estrategico_Lexia.doc';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto px-4">
      <div className="flex flex-col mb-8">
        <h2 className="text-3xl font-bold text-lexia-black tracking-tight flex items-center">
          <Bot className="h-8 w-8 mr-3 text-lexia-teal" />
          Copiloto de Litigios Estratégicos
        </h2>
        <p className="text-lexia-gray mt-2 text-sm max-w-2xl">
          Ingresa los hechos de un nuevo caso o disputa. El Copiloto buscará los precedentes más similares en la jurisprudencia de la Supersociedades y redactará un memorando de estrategia inicial.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left Column: Input Panel */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-sm font-bold text-lexia-black tracking-widest uppercase mb-4 flex items-center">
              <FileText className="w-4 h-4 mr-2 text-lexia-teal" />
              Hechos del Cliente
            </h3>

            <textarea
              value={factPattern}
              onChange={(e) => setFactPattern(e.target.value)}
              placeholder="Ejemplo: Nuestro cliente es accionista minoritario (15%) de una SAS. El gerente general, que también es accionista mayoritario (85%), acaba de constituir una sociedad paralela a la que le está transfiriendo ilegalmente los clientes y contratos más valiosos de la SAS original."
              className="w-full h-64 p-4 text-sm bg-[#FAFBFC] border border-slate-200 rounded-lg focus:ring-2 focus:ring-lexia-teal focus:outline-none text-lexia-black"
            />

            {error && (
              <div className="mt-3 p-3 bg-red-50 text-red-600 rounded-lg text-xs flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={isLoading || !factPattern}
              className={`mt-4 w-full py-3 px-4 rounded-lg font-bold flex justify-center items-center transition-all ${isLoading || !factPattern
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-lexia-teal text-white hover:bg-lexia-teal/90 shadow-md hover:shadow-lg'
                }`}
            >
              {isLoading ? (
                <div className="flex flex-col items-center py-1">
                  <div className="flex items-center">
                    <BrainCircuit className="w-5 h-5 mr-2 animate-pulse" />
                    Generando Memorando Estratégico...
                  </div>
                  <span className="text-[10px] opacity-80 mt-1 font-normal">(Esto puede tardar hasta 1 minuto)</span>
                </div>
              ) : (
                <>
                  Generar Memorando
                  <ChevronRight className="w-5 h-5 ml-1" />
                </>
              )}
            </button>
          </div>

          <div className="bg-[#f0fdfa] p-4 rounded-xl border border-lexia-teal/20">
            <h4 className="text-xs font-bold text-lexia-teal mb-2 uppercase tracking-wide">Pilar 5: Inteligencia Predictiva</h4>
            <p className="text-xs text-lexia-black/80 leading-relaxed">
              Este módulo utiliza búsquedas vectoriales pgvector impulsadas por Gemini para encontrar sentencias análogas basadas en el significado conceptual de los hechos, no solo en palabras clave.
            </p>
          </div>
        </div>

        {/* Right Column: Results Panel */}
        <div className="lg:col-span-8">
          {(!memo && !isLoading) ? (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl bg-white p-12 text-center">
              <div className="w-16 h-16 bg-[#FAFBFC] rounded-full flex items-center justify-center mb-4 border border-slate-100 shadow-sm">
                <Scale className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-400">Esperando Instrucciones</h3>
              <p className="text-sm text-slate-400 max-w-sm mt-2">
                El memorando estratégico y la jurisprudencia de soporte aparecerán aquí.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Memo Result */}
              {memo && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="bg-lexia-black p-4 border-b border-slate-800 flex justify-between items-center">
                    <h3 className="text-white font-bold tracking-wide flex items-center uppercase text-sm">
                      <FileText className="w-4 h-4 mr-2" />
                      Memorando Estratégico Generado
                    </h3>
                    
                    {/* Action Toolbar */}
                    <div className="flex items-center space-x-3">
                      <button 
                        onClick={handleCopy}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md transition-colors flex items-center"
                        title="Copiar al portapapeles"
                      >
                        {isCopied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <button 
                        onClick={handleDownloadWord}
                        className="px-4 py-2 bg-lexia-teal hover:bg-lexia-teal/90 text-white rounded-md transition-colors flex items-center text-xs font-bold uppercase tracking-wider shadow-sm"
                        title="Descargar como documento Word"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Word (.doc)
                      </button>
                    </div>
                  </div>
                  
                  <div ref={memoRef} className="p-8 prose prose-slate max-w-none prose-headings:text-lexia-black prose-a:text-lexia-teal prose-strong:text-lexia-black prose-table:w-full prose-table:border-collapse prose-th:border prose-th:border-slate-300 prose-td:border prose-td:border-slate-300 prose-th:bg-lexia-teal/5 prose-th:p-3 prose-td:p-3 prose-td:align-top">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{memo}</ReactMarkdown>
                  </div>
                </div>
              )}

              {/* Cited Cases */}
              {citedCases.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-lexia-black tracking-widest uppercase mb-4 mt-8 flex items-center">
                    <Search className="w-4 h-4 mr-2 text-lexia-teal" />
                    Jurisprudencia Base Analizada
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {citedCases.map((c) => (
                      <Link href={`/cases/${c.id}`} key={c.id}>
                        <div className="bg-white border border-slate-200 rounded-xl p-4 hover:border-lexia-teal hover:shadow-md transition-all h-full cursor-pointer group">
                          <div className="flexjustify-between items-start">
                            <h4 className="font-bold text-lexia-black text-sm group-hover:text-lexia-teal transition-colors line-clamp-2">
                              {c.sourceReference}
                            </h4>
                          </div>
                          <div className="text-xs text-slate-500 font-medium italic mt-1 line-clamp-2">
                            {c.caseName}
                          </div>
                          <div className="mt-2 text-xs text-lexia-gray line-clamp-3">
                            Sentencia de {c.year} recuperada gracias al análisis visual profundo del Precedente.
                          </div>
                          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold text-lexia-gray tracking-wider bg-slate-100 px-2 py-1 rounded">
                              PGVector Top 5
                            </span>
                            <span className="text-xs font-bold text-lexia-teal flex items-center">
                              {Math.round((c.similarity ?? 0) * 100)}% Similitud
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
