'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, Search } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

const routeTitles: Record<string, string> = {
  '/': 'Analitica Jurisprudencial',
  '/cases': 'Explorador de Casos',
  '/taxonomy': 'Definicion de Taxonomia Legal',
  '/sources': 'Fuentes de Datos',
  '/admin': 'Administracion',
  '/search': 'Busqueda Unificada',
  '/copilot': 'Copiloto Estrategico',
  '/conceptos': 'Conceptos Juridicos',
  '/laudos': 'Laudos Arbitrales',
  '/jurisprudence': 'Evolucion Jurisprudencial',
  '/analytics': 'Dashboard Analitico',
};

export default function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  // Determine page title
  let title = routeTitles[pathname] || 'Analitica Jurisprudencial';
  if (pathname.startsWith('/cases/') && pathname !== '/cases') {
    title = 'Detalle de Caso';
  }

  // Handle search submit — navigate to /search with query
  const handleSearch = useCallback(() => {
    const q = searchQuery.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
    setSearchQuery('');
  }, [searchQuery, router]);

  // Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const input = document.getElementById('topnav-search') as HTMLInputElement;
        input?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="h-16 border-b border-slate-200 bg-white/70 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-8">
      <div>
        <h1 className="text-xl font-semibold text-lexia-black tracking-tight">{title}</h1>
      </div>

      <div className="flex items-center space-x-6">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
          className="relative hidden md:block group"
        >
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-lexia-teal transition-colors" />
          <input
            id="topnav-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar en todos los modulos (Ctrl+K)"
            className="pl-9 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm text-lexia-black focus:outline-none focus:ring-2 focus:ring-lexia-teal w-64 transition-all focus:w-80"
          />
        </form>

        <button className="relative p-2 text-slate-500 hover:text-lexia-teal hover:bg-slate-100 rounded-full transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-lexia-teal rounded-full border-2 border-white"></span>
        </button>
      </div>
    </header>
  );
}
