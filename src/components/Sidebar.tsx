'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Database, Settings, Library, Search, Bot, TrendingUp, BookOpen, Gavel, Link2, BarChart3 } from 'lucide-react';
import { User } from 'lucide-react';

const navigation = [
  { name: 'Analítica', href: '/analytics', icon: LayoutDashboard },
  { name: 'Análisis Profundo', href: '/analytics/deep', icon: BarChart3 },
  { name: 'Copiloto de Litigios', href: '/copilot', icon: Bot },
  { name: 'Explorador de Casos', href: '/cases', icon: Search },
  { name: 'Taxonomía', href: '/taxonomy', icon: Library },
  { name: 'Evolución Juris...', href: '/jurisprudence', icon: TrendingUp },
  { name: 'Doctrina', href: '/conceptos', icon: BookOpen },
  { name: 'Laudos Arbitrales', href: '/laudos', icon: Gavel },
  { name: 'Búsqueda Unificada', href: '/search', icon: Link2 },
  { name: 'Fuentes', href: '/sources', icon: Database },
  { name: 'Admin', href: '/admin', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col w-64 bg-lexia-black border-r border-slate-800 text-slate-300 h-screen sticky top-0">
      <div className="p-6 flex flex-col justify-center space-y-1 mt-2">
        <span className="font-bold text-3xl tracking-[0.2em] text-white">LEXIA</span>
        <span className="text-xs font-medium tracking-[0.1em] text-lexia-teal-light">ANALYTICS · SOCIETARIO</span>
        <div className="w-8 h-[2px] bg-lexia-teal mt-3"></div>
      </div>
      
      <div className="px-4 pb-4 mt-4">
        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-4 ml-2">Navegación</div>
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href + '/') && item.href !== '/');
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2.5 transition-all duration-200 group relative ${
                  isActive 
                    ? 'text-white font-medium' 
                    : 'text-lexia-gray hover:text-white'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-lexia-teal rounded-r-md"></div>
                )}
                <item.icon className={`h-5 w-5 ${isActive ? 'text-lexia-teal' : 'text-lexia-gray group-hover:text-lexia-teal-light'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      
      <div className="mt-auto p-4 border-t border-slate-800">
        <div className="flex items-center space-x-3 px-3 py-2 text-sm text-lexia-gray transition-colors rounded-lg bg-slate-800/20">
          <div className="w-8 h-8 rounded-full bg-lexia-teal/20 flex items-center justify-center">
            <User className="w-4 h-4 text-lexia-teal" />
          </div>
          <div>
            <p className="font-medium text-white">Cuenta Activa</p>
            <p className="text-[10px] opacity-70">Lexia Analytics</p>
          </div>
        </div>
      </div>
    </div>
  );
}
