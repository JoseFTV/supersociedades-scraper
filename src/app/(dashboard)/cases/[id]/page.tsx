import { notFound } from 'next/navigation';
import { ArrowLeft, BookOpen, AlertCircle, FileStack, Scale, ShieldAlert, FileText, CheckCircle2, Gavel, TrendingUp, TrendingDown, Minus, Link2, Library } from 'lucide-react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { canonicalize, DENIAL_REASON_BY_CODE } from '@/lib/taxonomy';
import { getRelatedConceptos, CROSS_MAP } from '@/lib/taxonomy-cross-map';
import { generateRelevanceNotes, type RelevanceItem } from '@/lib/relevance-notes';

// Prevent static generation caching
export const dynamic = 'force-dynamic';

export default async function CaseDetail({ params }: { params: { id: string } }) {
  // Wait for params as required by Next >= 15
  const param = await params;
  
  // Fetch from Prisma with all relations
  const c = await prisma.case.findUnique({
    where: { id: param.id },
    include: {
      parties: true,
      claims: true,
      remedies: true,
      authorities: true,
      strategicFlags: true,
      denialReasons: true,
    }
  });

  if (!c) {
    notFound();
  }

  // Fetch Tribunal decisions that reviewed this Supersociedades case
  const tribunalDecisions = await prisma.case.findMany({
    where: {
      firstInstanceRef: c.sourceReference,
      court: 'Tribunal Superior de Bogotá',
    },
    orderBy: { decisionDate: 'desc' },
  });

  // Cross-references: related conceptos and laudos via taxonomy mapping
  const { code: asCode } = canonicalize(c.actionType);
  const crossEntry = CROSS_MAP.find(m => m.as === asCode);
  const relatedTxCodes = getRelatedConceptos(asCode);

  let relatedConceptos: { id: string; filename: string; year: number | null; temaPrincipal: string | null; subtema: string | null; titulo: string | null; resumen: string | null }[] = [];
  if (relatedTxCodes.length > 0) {
    relatedConceptos = await prisma.concepto.findMany({
      where: { temaPrincipal: { in: relatedTxCodes }, confianza: { gte: 0.7 } },
      select: { id: true, filename: true, year: true, temaPrincipal: true, subtema: true, titulo: true, resumen: true },
      orderBy: { year: 'desc' },
      take: 5,
    });
  }

  const relatedLaudos = await prisma.laudo.findMany({
    where: { vertical: 'societario', needsHumanReview: false },
    select: { id: true, caseTitle: true, year: true, vertical: true, subVertical: true, cuantia: true },
    orderBy: { confidenceScore: 'desc' },
    take: 5,
  });

  // Generate AI relevance notes for Triángulo de Oro
  const relevanceItems: RelevanceItem[] = [
    ...relatedConceptos.map((con) => ({
      id: con.id,
      type: 'concepto' as const,
      title: con.titulo || con.filename,
      detail: con.resumen || con.subtema || '',
    })),
    ...relatedLaudos.map((lau) => ({
      id: lau.id,
      type: 'laudo' as const,
      title: lau.caseTitle,
      detail: `${lau.subVertical || 'societario'} — cuantía: ${lau.cuantia || 'N/A'}`,
    })),
  ];

  const relevanceNotes = await generateRelevanceNotes(
    { caseName: c.caseName, actionType: c.actionType, summary: c.summary, factualBackground: c.factualBackground },
    relevanceItems,
  );
  const noteMap = new Map(relevanceNotes.map(n => [n.id, n.note]));

  return (
    <div className="space-y-6 pb-20 max-w-[100rem] mx-auto xl:px-8">
      {/* Header */}
      <Link href="/cases" className="inline-flex items-center text-sm text-lexia-gray hover:text-lexia-teal transition-colors mb-4 font-medium">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver al Explorador
      </Link>
      
      <div className="bg-white border border-slate-200 rounded-xl p-8 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
          <Scale className="h-64 w-64 text-lexia-teal translate-x-1/4 -translate-y-1/4" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-4">
            <span className="text-sm font-bold px-3 py-1 bg-lexia-teal/10 text-lexia-teal rounded-md border border-lexia-teal/20">
              {c.actionType}
            </span>
            <span className="text-sm text-lexia-gray font-medium">{c.year} • {c.office}</span>
          </div>
          <h1 className="text-3xl font-bold text-lexia-black mb-6 tracking-tight leading-tight">{c.caseName}</h1>
          <p className="text-lg text-lexia-black/80 leading-relaxed max-w-4xl border-l-4 border-lexia-teal pl-4 py-1">
            {c.summary}
          </p>
        </div>
      </div>

      {/* Segunda Instancia — Tribunal Superior de Bogotá */}
      {tribunalDecisions.length > 0 && (
        <div className="space-y-3">
          {tribunalDecisions.map((td) => {
            const outcome = td.appealsOutcome ?? '';
            const isConfirmed = outcome === 'Confirmó';
            const isRevoked = outcome === 'Revocó';

            const outcomeColor = isConfirmed
              ? 'bg-[#16a34a]/10 text-[#16a34a] border-[#16a34a]/20'
              : isRevoked
              ? 'bg-red-50 text-red-700 border-red-200'
              : 'bg-[#d97706]/10 text-[#d97706] border-[#d97706]/20';

            const OutcomeIcon = isConfirmed ? TrendingUp : isRevoked ? TrendingDown : Minus;

            return (
              <div
                key={td.id}
                className={`border rounded-xl p-5 shadow-sm ${
                  isConfirmed
                    ? 'bg-[#f0fdf4] border-[#16a34a]/30'
                    : isRevoked
                    ? 'bg-red-50 border-red-200'
                    : 'bg-amber-50 border-amber-200'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Gavel className="h-5 w-5 text-slate-500" />
                    <h3 className="text-sm font-bold text-lexia-black tracking-wide uppercase">
                      Segunda Instancia — Tribunal Superior de Bogotá, Sala Civil
                    </h3>
                  </div>
                  <span
                    className={`flex items-center gap-1.5 text-sm font-bold px-3 py-1 rounded-md border ${outcomeColor}`}
                  >
                    <OutcomeIcon className="h-4 w-4" />
                    {outcome || 'Sin clasificar'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm mb-3">
                  <div>
                    <span className="text-lexia-gray text-xs">Radicado Tribunal:</span>
                    <div className="font-semibold text-lexia-black font-mono text-xs mt-0.5">{td.sourceReference}</div>
                  </div>
                  <div>
                    <span className="text-lexia-gray text-xs">Fecha de Decisión:</span>
                    <div className="font-semibold text-lexia-black mt-0.5">{td.decisionDate || '—'}</div>
                  </div>
                </div>

                {td.summary && (
                  <p className="text-xs text-lexia-black/80 leading-relaxed bg-white/60 p-3 rounded-lg border border-white/80">
                    {td.summary}
                  </p>
                )}

                {td.sourceUrl && (
                  <a
                    href={td.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center mt-3 text-xs text-lexia-teal font-medium hover:underline"
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    Ver sentencia del Tribunal
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex flex-col xl:flex-row gap-6 mt-6 items-start">
        
        {/* Left Column - Extracted Insights & Metadata */}
        <div className="w-full xl:w-1/2 space-y-6 xl:pr-2">
          
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-lexia-black mb-4 flex items-center border-b border-slate-100 pb-3">
              <BookOpen className="h-5 w-5 mr-2 text-lexia-teal" />
              Antecedentes Fácticos
            </h3>
            <p className="text-lexia-black/80 text-sm leading-relaxed whitespace-pre-wrap">
              {c.factualBackground}
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-lexia-black mb-4 flex items-center border-b border-slate-100 pb-3">
              <AlertCircle className="h-5 w-5 mr-2 text-[#d97706]" />
              Problema Jurídico
            </h3>
            <p className="text-lexia-black text-sm leading-relaxed font-medium bg-[#FAFBFC] p-4 rounded-lg border border-slate-200">
              {c.legalIssue}
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-lexia-black mb-4 flex items-center border-b border-slate-100 pb-3">
              <Scale className="h-5 w-5 mr-2 text-[#16a34a]" />
              Resultados y Pretensiones
            </h3>
            <div className="mb-6">
              <div className="text-xs tracking-wider uppercase text-lexia-gray font-bold mb-2">Resultado General</div>
              <div className={`inline-flex items-center text-sm font-bold px-3 py-1 rounded-md border ${
                c.outcomeGeneral === 'Demandante prevalece' ? 'bg-[#16a34a]/10 text-[#16a34a] border-[#16a34a]/20' :
                c.outcomeGeneral === 'Demandado prevalece' ? 'bg-red-50 text-red-700 border-red-200' :
                c.outcomeGeneral === 'Mixto/Parcial' ? 'bg-[#d97706]/10 text-[#d97706] border-[#d97706]/20' :
                c.outcomeGeneral === 'Desestimado' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                {c.outcomeGeneral}
              </div>
              <p className="mt-3 text-sm text-lexia-black/80 bg-[#FAFBFC] p-4 rounded-lg border border-slate-200">{c.outcomeDetailed}</p>
            </div>
            
            <div className="text-xs tracking-wider uppercase text-lexia-gray font-bold mb-3">Análisis de Pretensiones</div>
            <div className="space-y-3">
              {c.remedies.length > 0 ? c.remedies.map(r => (
                <div key={r.id} className="flex items-start bg-[#FAFBFC] border border-slate-200 p-3 rounded-lg">
                  {r.granted ? (
                    <CheckCircle2 className="h-5 w-5 text-[#16a34a] mt-0.5 mr-3 shrink-0" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-[#dc2626] mt-0.5 mr-3 shrink-0" />
                  )}
                  <div>
                    <div className="text-sm font-bold text-lexia-black">{r.type} <span className="text-lexia-gray text-xs font-normal ml-2">Solicitada</span></div>
                    {r.detail && <div className="text-xs text-lexia-gray mt-1">{r.detail}</div>}
                  </div>
                </div>
              )) : (
                <div className="text-sm text-lexia-gray italic bg-[#FAFBFC] p-3 rounded-lg border border-slate-200">No hay detalles estructurados de pretensiones para este caso.</div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column - Native PDF Viewer */}
        <div className="w-full xl:w-1/2 xl:sticky xl:top-24 h-[calc(100vh-7rem)] bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div className="p-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-lexia-black tracking-wide flex items-center">
              <FileText className="h-4 w-4 mr-2 text-lexia-teal" /> Documento Original
            </h3>
            {c.pdfBlobUrl && (
              <a href={c.pdfBlobUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-lexia-teal hover:underline bg-lexia-teal/10 px-3 py-1.5 rounded-md">
                Abrir en nueva pestaña
              </a>
            )}
          </div>
          <div className="flex-1 bg-slate-100/50 relative">
            {c.pdfBlobUrl ? (
              <iframe src={`/api/pdf-proxy?caseId=${c.id}#view=FitH`} className="absolute inset-0 w-full h-full border-0" title="Visor Nativo de PDF" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                <FileText className="h-16 w-16 mb-4 text-slate-300" />
                <h3 className="text-lg font-bold text-lexia-black mb-2">Documento No Disponible</h3>
                <p className="text-sm text-lexia-gray max-w-sm mx-auto">El archivo PDF subyacente para esta providencia no se encontraba disponible o no fue sincronizado en la nube durante la ingesta de datos.</p>
              </div>
            )}
          </div>
        </div>

        {/* Below Insights - Flags & Metadata (Grid) */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-sm tracking-wider uppercase font-bold text-lexia-gray mb-4 border-b border-slate-100 pb-2 flex items-center">
            Metadatos del Caso
          </h3>
            <ul className="space-y-3 text-sm">
              <li className="flex justify-between border-b border-slate-50 pb-2">
                <span className="text-lexia-gray">Radicación:</span>
                <span className="text-lexia-black font-semibold text-right">{c.sourceReference}</span>
              </li>
              <li className="flex justify-between border-b border-slate-50 pb-2">
                <span className="text-lexia-gray">Fecha de Decisión:</span>
                <span className="text-lexia-black font-bold">{c.decisionDate}</span>
              </li>
              <li className="flex justify-between border-b border-slate-50 pb-2">
                <span className="text-lexia-gray">Duración del Caso:</span>
                <span className="text-lexia-teal font-bold">{c.duration}</span>
              </li>
              {c.filingDate && (
                <li className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-lexia-gray">Fecha de Radicación:</span>
                  <span className="text-lexia-black font-bold">{c.filingDate}</span>
                </li>
              )}
              {c.sourceUrl && (
                <li className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-lexia-gray">Archivo Fuente:</span>
                  <span className="text-lexia-black font-semibold text-xs truncate max-w-[150px]" title={c.sourceUrl}>{c.sourceUrl}</span>
                </li>
              )}
              <li className="flex flex-col mt-2">
                <span className="text-lexia-gray mb-1">Trámite Procesal:</span>
                <span className="text-lexia-black font-bold bg-[#FAFBFC] px-2 py-1 rounded inline-block w-fit text-xs border border-slate-200">{c.proceduralTrack}</span>
              </li>
              <li className="flex flex-col mt-2">
                <span className="text-lexia-gray mb-2">Subtemas Clave:</span>
                <div className="flex flex-wrap gap-2">
                  {c.subtopics && c.subtopics.length > 0 ? c.subtopics.map(st => (
                    <span key={st} className="text-xs px-2.5 py-1 rounded-full bg-[#FAFBFC] text-lexia-gray border border-slate-200 font-medium">
                      {st}
                    </span>
                  )) : (
                    <span className="text-xs text-lexia-gray italic">No hay subtemas</span>
                  )}
                </div>
              </li>
            </ul>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-sm tracking-wider uppercase font-bold text-lexia-gray mb-4 border-b border-slate-100 pb-2 flex items-center">
              <ShieldAlert className="h-4 w-4 mr-2" /> Banderas Estratégicas
            </h3>
            <ul className="space-y-2">
              {c.strategicFlags ? Object.entries(c.strategicFlags).map(([key, val]) => {
                if (!val || typeof val !== 'boolean' || key === 'id' || key === 'caseId') return null;
                // Format camelCase to Title Case
                const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                return (
                  <li key={key} className="flex items-center text-xs text-[#d97706] font-bold bg-[#d97706]/10 px-3 py-2 rounded-md border border-[#d97706]/20">
                    <AlertCircle className="h-4 w-4 mr-2" /> {formattedKey}
                  </li>
                );
              }) : null}
              {(!c.strategicFlags || !Object.entries(c.strategicFlags).some(([k,v]) => typeof v === 'boolean' && v === true)) && (
                <li className="text-xs text-lexia-gray italic">No se identificaron banderas estratégicas principales.</li>
              )}
            </ul>
          </div>

          {/* Denial Reasons */}
          {c.denialReasons && c.denialReasons.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-sm tracking-wider uppercase font-bold text-lexia-gray mb-4 border-b border-slate-100 pb-2 flex items-center">
                <AlertCircle className="h-4 w-4 mr-2 text-red-500" /> Razones de Negación (Serie RN)
              </h3>
              <div className="space-y-3">
                {c.denialReasons.map((dr) => {
                  const def = DENIAL_REASON_BY_CODE[dr.code];
                  const confColor = dr.confidence === 'high' ? 'bg-green-50 text-green-700 border-green-200' :
                    dr.confidence === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-slate-50 text-slate-600 border-slate-200';
                  return (
                    <div key={dr.id} className="bg-[#FAFBFC] border border-slate-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold bg-red-50 text-red-700 px-2 py-0.5 rounded border border-red-200">{dr.code}</span>
                          <span className="text-sm font-semibold text-lexia-black">{def?.label || dr.code}</span>
                        </div>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${confColor}`}>{dr.confidence}</span>
                      </div>
                      <p className="text-xs text-lexia-black/70 leading-relaxed">{dr.reasoning}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-sm tracking-wider uppercase font-bold text-lexia-gray mb-4 border-b border-slate-100 pb-2 flex items-center">
               <FileStack className="h-4 w-4 mr-2" /> Autoridades Citadas
            </h3>
            <ul className="space-y-3">
              {c.authorities.length > 0 ? c.authorities.map(a => (
                <li key={a.id} className="text-sm bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="text-lexia-black font-semibold flex items-start">
                    <FileText className="h-4 w-4 mr-2 text-lexia-gray shrink-0 mt-0.5" />
                    <span className="leading-tight text-xs">{a.citationText} <span className="font-bold ml-1">({a.normType})</span></span>
                  </div>
                  {a.articleNumber && <div className="text-xs text-lexia-gray font-medium ml-6 mt-1.5 bg-white w-fit px-2 py-0.5 rounded border border-slate-200">Art. {a.articleNumber}</div>}
                </li>
              )) : (
                <li className="text-xs text-lexia-gray italic">No se registraron autoridades específicas citadas.</li>
              )}
            </ul>
          </div>

        </div>

      {/* Cross-References: Triángulo de Oro */}
      {(relatedConceptos.length > 0 || relatedLaudos.length > 0) && (
        <div className="mt-8">
          <h3 className="text-lg font-bold text-lexia-black mb-1 flex items-center">
            <Link2 className="h-5 w-5 mr-2 text-lexia-teal" />
            Triángulo de Oro — Fuentes Relacionadas
          </h3>
          {crossEntry && (
            <p className="text-xs text-lexia-gray mb-4">{crossEntry.relationship}</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Related Conceptos */}
            {relatedConceptos.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <h4 className="text-xs tracking-wider uppercase text-lexia-gray font-bold mb-3 flex items-center justify-between">
                  <span className="flex items-center"><Library className="h-4 w-4 mr-1.5" /> Doctrina Relacionada</span>
                  <Link href="/conceptos" className="text-lexia-teal hover:underline text-[10px] font-bold">Ver todos</Link>
                </h4>
                <div className="space-y-2">
                  {relatedConceptos.map((con) => (
                    <div key={con.id} className="p-3 bg-slate-50 rounded-lg text-sm border border-slate-100 hover:border-lexia-teal/30 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-lexia-black text-xs truncate mr-3">{con.titulo || con.filename}</span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-lexia-teal/10 text-lexia-teal font-medium">{con.temaPrincipal}</span>
                          {con.year && <span className="text-[10px] text-slate-400 font-bold">{con.year}</span>}
                        </div>
                      </div>
                      {noteMap.get(con.id) && (
                        <p className="text-[11px] text-lexia-teal/80 leading-relaxed mt-1 italic">{noteMap.get(con.id)}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Related Laudos */}
            {relatedLaudos.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <h4 className="text-xs tracking-wider uppercase text-lexia-gray font-bold mb-3 flex items-center justify-between">
                  <span className="flex items-center"><Gavel className="h-4 w-4 mr-1.5" /> Laudos Arbitrales Relacionados</span>
                  <Link href="/laudos" className="text-lexia-teal hover:underline text-[10px] font-bold">Ver todos</Link>
                </h4>
                <div className="space-y-2">
                  {relatedLaudos.map((lau) => (
                    <Link href="/laudos" key={lau.id}>
                      <div className="p-3 bg-slate-50 rounded-lg text-sm border border-slate-100 hover:border-lexia-teal/30 transition-colors cursor-pointer">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-lexia-black text-xs truncate mr-3">{lau.caseTitle}</span>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-medium border border-amber-100">{lau.subVertical || lau.vertical}</span>
                            {lau.year && <span className="text-[10px] text-slate-400 font-bold">{lau.year}</span>}
                          </div>
                        </div>
                        {noteMap.get(lau.id) && (
                          <p className="text-[11px] text-amber-700/70 leading-relaxed mt-1 italic">{noteMap.get(lau.id)}</p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      </div>
  );
}
