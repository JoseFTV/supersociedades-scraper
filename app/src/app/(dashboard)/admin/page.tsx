'use client';

import { useState, useEffect } from 'react';
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Scale,
  Search,
  FileDown,
  Link2,
  BadgeCheck,
  XCircle,
  ChevronRight,
  ClipboardCheck,
  Filter,
  ChevronLeft,
  Save,
  RefreshCw,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScrapedEntry {
  year: number;
  magistrado: string;
  expediente: string;
  tema: string;
  pdfUrl: string;
  isSSCandidate: boolean;
}

interface IngestResult {
  success: boolean;
  skipped?: boolean;
  error?: string;
  case?: { id: string; caseName: string; actionType: string };
  match?: {
    ssCase: { id: string; caseName: string; sourceReference: string };
    confidence: number;
    method: string;
  } | null;
  radicadoSSExtracted?: string;
  appealsOutcome?: string;
}

type EntryStatus = 'idle' | 'processing' | 'done' | 'error' | 'skipped';

// ─── Tab 1: Supersociedades Upload ────────────────────────────────────────────

function UploadTab() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<{ case: { id: string; caseName: string; actionType: string } } | null>(null);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setError('');
      setResult(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped?.type === 'application/pdf') {
      setFile(dropped);
      setError('');
      setResult(null);
    } else {
      setError('Por favor sube solo archivos PDF.');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setError('');
    setResult(null);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        const base64String = (reader.result as string).split(',')[1];
        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: file.name, fileData: base64String }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error procesando el archivo.');
        setResult(data);
        setFile(null);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error de conexión con el servidor.');
      } finally {
        setIsUploading(false);
      }
    };
    reader.onerror = () => {
      setError('Error al leer el archivo PDF localmente.');
      setIsUploading(false);
    };
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
      <label
        htmlFor="dropzone-file"
        className="flex flex-col items-center justify-center w-full h-64 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-[#FAFBFC] hover:bg-slate-50 transition-colors"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <UploadCloud className="w-12 h-12 mb-4 text-lexia-gray" />
          <p className="mb-2 text-sm text-lexia-black font-semibold text-center px-4">
            {file ? file.name : 'Haz clic para subir un PDF o arrástralo aquí'}
          </p>
          <p className="text-xs text-slate-500">PDF (Max 20MB)</p>
        </div>
        <input id="dropzone-file" type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />
      </label>

      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center text-sm">
          <AlertCircle className="w-5 h-5 mr-3 shrink-0" />
          {error}
        </div>
      )}

      {result && (
        <div className="mt-6 p-5 bg-green-50 border border-green-200 rounded-lg text-sm">
          <div className="flex items-center text-green-800 font-bold mb-3">
            <CheckCircle2 className="w-5 h-5 mr-2" />
            Caso Ingerido Exitosamente
          </div>
          <div className="space-y-2 text-green-900 bg-white/60 p-4 rounded-md border border-green-100">
            <p><span className="font-semibold">ID Generado:</span> {result.case.id}</p>
            <p><span className="font-semibold">Nombre:</span> {result.case.caseName}</p>
            <p><span className="font-semibold">Acción Clave:</span> {result.case.actionType}</p>
            <p><span className="font-semibold">Vectores Guardados:</span> Sí. Ya es buscable por el Copiloto.</p>
          </div>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || isUploading}
        className={`mt-8 w-full py-4 px-4 rounded-lg font-bold flex justify-center items-center transition-all text-lg ${
          !file || isUploading
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
            : 'bg-lexia-black text-white hover:bg-lexia-teal shadow-md'
        }`}
      >
        {isUploading ? (
          <>
            <Loader2 className="w-6 h-6 mr-3 animate-spin" />
            Extrayendo datos con Gemini & Guardando en Postgres (puede tardar hasta 1 minuto)...
          </>
        ) : (
          'Procesar e Ingerir Sentencia'
        )}
      </button>
    </div>
  );
}

// ─── Tab 2: Segunda Instancia / Tribunal ─────────────────────────────────────

function TribunalTab() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanData, setScanData] = useState<{ total: number; candidatesFound: number; entries: ScrapedEntry[] } | null>(null);
  const [scanError, setScanError] = useState('');
  const [processingIdx, setProcessingIdx] = useState<number | null>(null);
  const [entryResults, setEntryResults] = useState<Record<number, { status: EntryStatus; result?: IngestResult }>>({});

  // Manual upload state
  const [tribunalFile, setTribunalFile] = useState<File | null>(null);
  const [isIngesting, setIsIngesting] = useState(false);
  const [manualResult, setManualResult] = useState<IngestResult | null>(null);
  const [manualError, setManualError] = useState('');

  // ── Scraper ─────────────────────────────────────────────────────────────
  const handleScan = async () => {
    setIsScanning(true);
    setScanError('');
    setScanData(null);
    setEntryResults({});

    try {
      const res = await fetch('/api/admin/tribunal/scrape-index?filter=candidates');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error escaneando el Tribunal.');
      setScanData(data);
    } catch (err: unknown) {
      setScanError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsScanning(false);
    }
  };

  const handleProcessEntry = async (entry: ScrapedEntry, idx: number) => {
    setProcessingIdx(idx);
    setEntryResults((prev) => ({ ...prev, [idx]: { status: 'processing' } }));

    try {
      const res = await fetch('/api/admin/tribunal/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfUrl: entry.pdfUrl }),
      });
      const data: IngestResult = await res.json();

      if (!res.ok) {
        setEntryResults((prev) => ({ ...prev, [idx]: { status: 'error', result: data } }));
      } else if (data.skipped) {
        setEntryResults((prev) => ({ ...prev, [idx]: { status: 'skipped', result: data } }));
      } else {
        setEntryResults((prev) => ({ ...prev, [idx]: { status: 'done', result: data } }));
      }
    } catch (err: unknown) {
      setEntryResults((prev) => ({
        ...prev,
        [idx]: { status: 'error', result: { success: false, error: err instanceof Error ? err.message : 'Error desconocido' } },
      }));
    } finally {
      setProcessingIdx(null);
    }
  };

  // ── Manual drag & drop ──────────────────────────────────────────────────
  const handleTribunalDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped?.type === 'application/pdf') {
      setTribunalFile(dropped);
      setManualError('');
      setManualResult(null);
    } else {
      setManualError('Por favor sube solo archivos PDF.');
    }
  };

  const handleManualIngest = async () => {
    if (!tribunalFile) return;
    setIsIngesting(true);
    setManualError('');
    setManualResult(null);

    const reader = new FileReader();
    reader.readAsDataURL(tribunalFile);
    reader.onload = async () => {
      try {
        const base64String = (reader.result as string).split(',')[1];
        const res = await fetch('/api/admin/tribunal/ingest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileData: base64String, fileName: tribunalFile.name }),
        });
        const data: IngestResult = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error procesando la sentencia del Tribunal.');
        setManualResult(data);
        setTribunalFile(null);
      } catch (err: unknown) {
        setManualError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setIsIngesting(false);
      }
    };
    reader.onerror = () => {
      setManualError('Error al leer el archivo PDF localmente.');
      setIsIngesting(false);
    };
  };

  // ── Render helpers ──────────────────────────────────────────────────────
  const renderEntryStatus = (idx: number) => {
    const state = entryResults[idx];
    if (!state) return null;

    if (state.status === 'processing') {
      return <Loader2 className="w-4 h-4 animate-spin text-lexia-teal" />;
    }
    if (state.status === 'skipped') {
      return <BadgeCheck className="w-4 h-4 text-slate-400" aria-label="Ya ingerido previamente" />;
    }
    if (state.status === 'error') {
      return <XCircle className="w-4 h-4 text-red-500" aria-label={state.result?.error} />;
    }
    if (state.status === 'done') {
      const r = state.result!;
      return (
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          {r.match ? (
            <span className="text-xs text-green-700 font-medium">
              Vinculado a SS ({r.match.method}) · {r.appealsOutcome}
            </span>
          ) : (
            <span className="text-xs text-amber-600 font-medium">Guardado · Sin match SS</span>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">

      {/* ── Section 1: Auto-scanner ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-lexia-black flex items-center">
              <Search className="h-4 w-4 mr-2 text-lexia-teal" />
              Escanear Portal del Tribunal (2020–2024)
            </h3>
            <p className="text-xs text-lexia-gray mt-1">
              Busca en los listados de sentencias del Tribunal Superior de Bogotá, Sala Civil, y filtra automáticamente las que tienen TEMA relacionado con derecho societario.
            </p>
          </div>
          <button
            onClick={handleScan}
            disabled={isScanning}
            className="flex items-center gap-2 px-5 py-2.5 bg-lexia-black text-white text-sm font-bold rounded-lg hover:bg-lexia-teal transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {isScanning ? 'Escaneando...' : 'Escanear Tribunal'}
          </button>
        </div>

        {scanError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center text-sm">
            <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
            {scanError}
          </div>
        )}

        {scanData && (
          <div className="mt-4">
            <div className="flex gap-4 mb-4 text-sm text-lexia-gray">
              <span>Total sentencias encontradas: <strong className="text-lexia-black">{scanData.total}</strong></span>
              <span>Candidatos societarios: <strong className="text-lexia-teal">{scanData.candidatesFound}</strong></span>
            </div>

            {scanData.entries.length === 0 ? (
              <div className="text-sm text-lexia-gray italic p-4 bg-slate-50 rounded-lg border border-slate-100">
                No se encontraron candidatos societarios. Puede que el formato HTML del portal haya cambiado, o intenta con "Subida Manual" abajo.
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {scanData.entries.map((entry, idx) => {
                  const state = entryResults[idx];
                  const isDone = state?.status === 'done' || state?.status === 'skipped';
                  return (
                    <div
                      key={`${entry.year}-${idx}`}
                      className={`flex items-start gap-3 p-3 rounded-lg border text-sm transition-colors ${
                        isDone ? 'bg-green-50 border-green-200' : 'bg-[#FAFBFC] border-slate-200 hover:border-lexia-teal/50'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold px-2 py-0.5 bg-lexia-teal/10 text-lexia-teal rounded">
                            {entry.year}
                          </span>
                          <span className="text-xs text-lexia-gray truncate">{entry.magistrado}</span>
                        </div>
                        <div className="font-semibold text-lexia-black truncate" title={entry.tema}>
                          {entry.tema}
                        </div>
                        <div className="text-xs text-lexia-gray mt-0.5 font-mono">{entry.expediente || '—'}</div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {renderEntryStatus(idx)}
                        <a
                          href={entry.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded text-slate-400 hover:text-lexia-teal hover:bg-slate-100 transition-colors"
                          title="Ver PDF"
                        >
                          <FileDown className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => handleProcessEntry(entry, idx)}
                          disabled={processingIdx !== null || isDone}
                          className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                            isDone
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              : processingIdx === idx
                              ? 'bg-lexia-teal/10 text-lexia-teal cursor-not-allowed'
                              : 'bg-lexia-black text-white hover:bg-lexia-teal'
                          }`}
                        >
                          {processingIdx === idx ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <ChevronRight className="w-3 h-3" />
                          )}
                          {isDone ? 'Procesado' : 'Procesar'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Section 2: Manual drag & drop ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-base font-bold text-lexia-black flex items-center mb-1">
          <UploadCloud className="h-4 w-4 mr-2 text-lexia-teal" />
          Subida Manual de Sentencia del Tribunal
        </h3>
        <p className="text-xs text-lexia-gray mb-4">
          Si el escaneo no encontró la sentencia, descarga el PDF del portal y arrástralo aquí.
        </p>

        <label
          htmlFor="tribunal-dropzone"
          className="flex flex-col items-center justify-center w-full h-40 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-[#FAFBFC] hover:bg-slate-50 transition-colors"
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onDrop={handleTribunalDrop}
        >
          <div className="flex flex-col items-center justify-center">
            <Scale className="w-10 h-10 mb-3 text-lexia-gray" />
            <p className="text-sm text-lexia-black font-semibold text-center px-4">
              {tribunalFile ? tribunalFile.name : 'Sentencia del Tribunal — arrastra el PDF aquí'}
            </p>
            <p className="text-xs text-slate-500 mt-1">PDF (Max 20MB)</p>
          </div>
          <input
            id="tribunal-dropzone"
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) { setTribunalFile(f); setManualError(''); setManualResult(null); }
            }}
          />
        </label>

        {manualError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center text-sm">
            <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
            {manualError}
          </div>
        )}

        {manualResult && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-sm">
            <div className="flex items-center text-green-800 font-bold mb-2">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Sentencia del Tribunal Ingerida
            </div>
            <div className="space-y-1 text-green-900 text-xs bg-white/60 p-3 rounded border border-green-100">
              <p><span className="font-semibold">ID:</span> {manualResult.case?.id}</p>
              <p><span className="font-semibold">Radicado SS extraído:</span> {manualResult.radicadoSSExtracted ?? 'No encontrado'}</p>
              <p><span className="font-semibold">Decisión:</span> {manualResult.appealsOutcome ?? '—'}</p>
              {manualResult.match ? (
                <p className="flex items-center gap-1">
                  <Link2 className="w-3 h-3" />
                  <span className="font-semibold">Vinculado a:</span> {manualResult.match.ssCase.caseName} ({manualResult.match.method})
                </p>
              ) : (
                <p className="text-amber-700">No se encontró caso SS coincidente. Revisión manual requerida.</p>
              )}
            </div>
          </div>
        )}

        <button
          onClick={handleManualIngest}
          disabled={!tribunalFile || isIngesting}
          className={`mt-4 w-full py-3 px-4 rounded-lg font-bold flex justify-center items-center transition-all ${
            !tribunalFile || isIngesting
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-lexia-black text-white hover:bg-lexia-teal shadow-md'
          }`}
        >
          {isIngesting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Procesando con Gemini...
            </>
          ) : (
            'Procesar Sentencia del Tribunal'
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Tab 3: Revisión Manual de Clasificación ────────────────────────────────

interface ReviewCase {
  id: string;
  caseName: string;
  sourceReference: string;
  actionType: string;
  year: number;
  summary: string;
  outcomeGeneral: string;
  sourceUrl: string | null;
}

interface ActionTypeCount {
  actionType: string;
  count: number;
}

const CANONICAL_ACTION_TYPES = [
  'Abuso del derecho de voto',
  'Reconocimiento de presupuestos de ineficacia',
  'Impugnación de decisiones sociales',
  'Disputas societarias',
  'Responsabilidad de administradores',
  'Desestimación de la personalidad jurídica',
  'Designación de peritos',
  'Disputas sobre causales de disolución',
  'Cumplimiento de acuerdos de accionistas',
  'Responsabilidad de socios y liquidadores',
  'Oposición a reactivación societaria',
  'Conflicto de intereses de administradores',
  'Responsabilidad de matrices y controlantes',
  'Ejecución de pactos parasociales',
  'Cláusula compromisoria',
];

function ReviewTab() {
  const [cases, setCases] = useState<ReviewCase[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [needsReviewCount, setNeedsReviewCount] = useState(0);
  const [actionTypeCounts, setActionTypeCounts] = useState<ActionTypeCount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'needs_review' | 'all'>('needs_review');
  const [actionTypeFilter, setActionTypeFilter] = useState('');

  // Track per-case edits: caseId -> selected new actionType
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  const fetchCases = async (p: number = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        filter,
        page: String(p),
        limit: '25',
      });
      if (filter === 'all' && actionTypeFilter) {
        params.set('actionType', actionTypeFilter);
      }
      const res = await fetch(`/api/admin/review?${params}`);
      const data = await res.json();
      setCases(data.cases || []);
      setTotal(data.total || 0);
      setPage(data.page || 1);
      setTotalPages(data.totalPages || 1);
      setNeedsReviewCount(data.needsReviewCount || 0);
      setActionTypeCounts(data.actionTypeCounts || []);
    } catch (err) {
      console.error('Error fetching review cases:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch on mount and filter change
  useEffect(() => { fetchCases(1); }, [filter, actionTypeFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async (caseId: string) => {
    const newActionType = edits[caseId];
    if (!newActionType) return;

    setSaving(prev => ({ ...prev, [caseId]: true }));
    setSaved(prev => ({ ...prev, [caseId]: false }));

    try {
      const res = await fetch('/api/admin/review', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId, newActionType }),
      });
      const data = await res.json();
      if (data.success) {
        // Update local state
        setCases(prev => prev.map(c =>
          c.id === caseId ? { ...c, actionType: newActionType } : c
        ));
        setSaved(prev => ({ ...prev, [caseId]: true }));
        setEdits(prev => {
          const next = { ...prev };
          delete next[caseId];
          return next;
        });
        setTimeout(() => setSaved(prev => ({ ...prev, [caseId]: false })), 3000);
      }
    } catch (err) {
      console.error('Error saving:', err);
    } finally {
      setSaving(prev => ({ ...prev, [caseId]: false }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      <div className="flex gap-4 items-center flex-wrap">
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <span className="text-sm font-bold text-amber-800">{needsReviewCount} casos pendientes de revisión</span>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
          <span className="text-sm text-slate-600">Total en DB: <strong className="text-lexia-black">{actionTypeCounts.reduce((sum, a) => sum + a.count, 0)}</strong></span>
        </div>
      </div>

      {/* Filter controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Filter className="h-4 w-4 text-lexia-gray" />
          <select
            className="bg-[#FAFBFC] border border-slate-200 rounded-lg text-sm text-lexia-black py-2 pl-3 pr-8 focus:outline-none focus:ring-1 focus:ring-lexia-teal appearance-none cursor-pointer"
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value as 'needs_review' | 'all');
              setActionTypeFilter('');
            }}
          >
            <option value="needs_review">Solo pendientes de revisión</option>
            <option value="all">Todos los casos</option>
          </select>

          {filter === 'all' && (
            <select
              className="bg-[#FAFBFC] border border-slate-200 rounded-lg text-sm text-lexia-black py-2 pl-3 pr-8 focus:outline-none focus:ring-1 focus:ring-lexia-teal appearance-none cursor-pointer"
              value={actionTypeFilter}
              onChange={(e) => {
                setActionTypeFilter(e.target.value);
              }}
            >
              <option value="">Todas las acciones</option>
              {actionTypeCounts.map(a => (
                <option key={a.actionType} value={a.actionType}>
                  {a.actionType} ({a.count})
                </option>
              ))}
            </select>
          )}
        </div>

        <button
          onClick={() => fetchCases(page)}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-lexia-black text-sm font-medium rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Recargar
        </button>
      </div>

      {/* Case list */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12 bg-white border border-slate-200 rounded-xl">
          <Loader2 className="animate-spin h-8 w-8 text-lexia-teal" />
        </div>
      ) : cases.length === 0 ? (
        <div className="text-center p-12 bg-white border border-slate-200 rounded-xl shadow-sm">
          <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-700">Sin casos pendientes</h3>
          <p className="text-slate-500 mt-2">Todos los casos tienen un tipo de acción asignado.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm divide-y divide-slate-100 overflow-hidden">
          {cases.map((c) => (
            <div key={c.id} className="p-5 hover:bg-slate-50/50 transition-colors">
              <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                {/* Case info */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold px-2 py-0.5 bg-amber-100 text-amber-700 rounded border border-amber-200">
                      {c.actionType}
                    </span>
                    <span className="text-xs text-lexia-gray font-medium">
                      {c.sourceReference || 'Sin radicado'} • {c.year}
                    </span>
                  </div>
                  <h4 className="font-bold text-lexia-black text-sm">{c.caseName}</h4>
                  <p className="text-xs text-lexia-gray line-clamp-2">{c.summary}</p>
                </div>

                {/* Reclassification controls */}
                <div className="flex items-center gap-2 shrink-0 min-w-[340px]">
                  <select
                    className="flex-1 bg-[#FAFBFC] border border-slate-200 rounded-lg text-xs text-lexia-black py-2 pl-3 pr-6 focus:outline-none focus:ring-1 focus:ring-lexia-teal appearance-none cursor-pointer"
                    value={edits[c.id] || ''}
                    onChange={(e) => setEdits(prev => ({ ...prev, [c.id]: e.target.value }))}
                  >
                    <option value="">— Seleccionar acción correcta —</option>
                    {CANONICAL_ACTION_TYPES.map(at => (
                      <option key={at} value={at}>{at}</option>
                    ))}
                  </select>

                  <button
                    onClick={() => handleSave(c.id)}
                    disabled={!edits[c.id] || saving[c.id]}
                    className={`flex items-center gap-1 px-3 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                      saved[c.id]
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : !edits[c.id]
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-lexia-teal text-white hover:bg-lexia-teal/90 shadow-sm'
                    }`}
                  >
                    {saving[c.id] ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : saved[c.id] ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : (
                      <Save className="w-3 h-3" />
                    )}
                    {saved[c.id] ? 'Guardado' : 'Guardar'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-5 py-3 shadow-sm">
          <span className="text-sm text-lexia-gray">
            Mostrando {(page - 1) * 25 + 1}–{Math.min(page * 25, total)} de {total}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchCases(page - 1)}
              disabled={page <= 1}
              className="p-2 rounded-lg text-lexia-gray hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-lexia-black">{page} / {totalPages}</span>
            <button
              onClick={() => fetchCases(page + 1)}
              disabled={page >= totalPages}
              className="p-2 rounded-lg text-lexia-gray hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'supersociedades' | 'tribunal' | 'revision'>('supersociedades');

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      <div className="flex flex-col mb-6">
        <h2 className="text-3xl font-bold text-lexia-black tracking-tight flex items-center">
          <UploadCloud className="h-8 w-8 mr-3 text-lexia-teal" />
          Panel de Administración
        </h2>
        <p className="text-lexia-gray mt-2 text-sm max-w-2xl">
          Ingesta de sentencias, vinculación de providencias del Tribunal y revisión de clasificación de acciones.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('supersociedades')}
          className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'supersociedades'
              ? 'bg-white text-lexia-black shadow-sm'
              : 'text-lexia-gray hover:text-lexia-black'
          }`}
        >
          Supersociedades
        </button>
        <button
          onClick={() => setActiveTab('tribunal')}
          className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'tribunal'
              ? 'bg-white text-lexia-black shadow-sm'
              : 'text-lexia-gray hover:text-lexia-black'
          }`}
        >
          Segunda Instancia · Tribunal
        </button>
        <button
          onClick={() => setActiveTab('revision')}
          className={`px-5 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'revision'
              ? 'bg-white text-lexia-black shadow-sm'
              : 'text-lexia-gray hover:text-lexia-black'
          }`}
        >
          <ClipboardCheck className="w-3.5 h-3.5" />
          Revisión Manual
        </button>
      </div>

      {activeTab === 'supersociedades' ? <UploadTab /> : activeTab === 'tribunal' ? <TribunalTab /> : <ReviewTab />}
    </div>
  );
}
