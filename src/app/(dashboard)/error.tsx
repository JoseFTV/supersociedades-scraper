'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Dashboard Error]', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="p-4 rounded-full bg-red-500/10">
        <AlertTriangle className="h-12 w-12 text-red-500" />
      </div>
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold text-slate-200">
          Ocurrio un error inesperado
        </h2>
        <p className="text-sm text-slate-400 max-w-md">
          Hubo un problema al cargar esta pagina. Puedes intentar recargar o
          volver al inicio.
        </p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-lexia-teal text-white text-sm font-medium hover:bg-lexia-teal/80 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Reintentar
        </button>
        <a
          href="/cases"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 text-slate-200 text-sm font-medium hover:bg-slate-600 transition-colors"
        >
          Ir al inicio
        </a>
      </div>
    </div>
  );
}
