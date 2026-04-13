import { FileQuestion } from 'lucide-react';
import Link from 'next/link';

export default function DashboardNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="p-4 rounded-full bg-slate-700">
        <FileQuestion className="h-12 w-12 text-slate-400" />
      </div>
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold text-slate-200">
          Pagina no encontrada
        </h2>
        <p className="text-sm text-slate-400 max-w-md">
          La pagina que buscas no existe o fue movida.
        </p>
      </div>
      <Link
        href="/cases"
        className="px-4 py-2 rounded-lg bg-lexia-teal text-white text-sm font-medium hover:bg-lexia-teal/80 transition-colors"
      >
        Volver al Case Explorer
      </Link>
    </div>
  );
}
