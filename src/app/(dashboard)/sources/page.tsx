import type { Metadata } from 'next';
import { Database } from 'lucide-react';

export const metadata: Metadata = { title: 'Fuentes de Datos' };

export default function SourcesPage() {
  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      <div className="flex flex-col mb-8">
        <h2 className="text-3xl font-bold text-lexia-black tracking-tight flex items-center">
          <Database className="h-8 w-8 mr-3 text-lexia-teal" /> 
          Fuentes de Datos
        </h2>
        <p className="text-lexia-gray mt-2 text-sm max-w-2xl">
          Listado de las fuentes documentales utilizadas para entrenar y nutrir el motor de Lexia Analytics.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
         <div className="p-6 border-b border-slate-200 bg-[#FAFBFC] flex justify-between items-center">
            <h3 className="font-bold text-lexia-black">Conexiones Activas</h3>
            <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-bold flex items-center">
                ● Sincronizado
            </span>
         </div>
         <div className="p-6">
            <div className="flex items-start">
               <div className="h-10 w-10 rounded bg-blue-50 text-blue-600 flex items-center justify-center mr-4 border border-blue-100 shrink-0">
                  <Database className="h-5 w-5" />
               </div>
               <div>
                  <h4 className="font-bold text-lexia-black">PostgreSQL (Neon) + pgvector</h4>
                  <p className="text-sm text-lexia-gray mt-1">Base de datos principal que aloja los metadatos de los expedientes y sus embeddings vectoriales de 3072 dimensiones (gemini-embedding-001) para recuperación semántica.</p>
                  <p className="text-xs text-slate-400 mt-2 font-mono bg-slate-50 px-2 py-1 inline-block rounded">URL: env(DATABASE_URL)</p>
               </div>
            </div>
            
            <div className="w-full h-px bg-slate-100 my-6"></div>

            <div className="flex items-start opacity-70">
               <div className="h-10 w-10 rounded bg-slate-50 text-slate-500 flex items-center justify-center mr-4 border border-slate-200 shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
               </div>
               <div>
                  <h4 className="font-bold text-slate-700 flex items-center">
                    supersociedades.gov.co
                    <span className="ml-3 bg-amber-100 text-amber-700 text-[10px] uppercase font-bold px-2 py-0.5 rounded">Pendiente - Fase 12</span>
                  </h4>
                  <p className="text-sm text-slate-500 mt-1">Scraper automatizado mensual que consulta directamente el portal de relatoría para ingerir nuevos fallos en la base de datos.</p>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
