'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { TrendingUp, Scale, AlertTriangle, Clock, Library, Search, Database } from 'lucide-react';
import Link from 'next/link';
import { Case, Remedy, StrategicFlags } from '@prisma/client';

type CaseWithData = Case & { remedies: Remedy[], strategicFlags: StrategicFlags | null };

export default function DashboardClient({ cases }: { cases: CaseWithData[] }) {
  // Aggregate data for Outcome Distribution
  const outcomesCount = cases.reduce((acc, curr) => {
    acc[curr.outcomeGeneral] = (acc[curr.outcomeGeneral] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const outcomeData = Object.keys(outcomesCount).map(key => ({
    name: key,
    value: outcomesCount[key]
  }));

  const COLORS = ['#008080', '#16a34a', '#d97706', '#dc2626', '#85d3d4']; // Semantic: Teal, Favorable (Green), Parcial (Amber), Desfavorable (Red), Light Teal

  // Aggregate data for Remedies Requested vs Granted
  const remediesOverview = { requested: 0, granted: 0 };
  let totalMonths = 0;
  let plaintiffWins = 0;
  let highEvidentiaryCount = 0;

  cases.forEach(c => {
    // Remedies
    if (c.remedies) {
      c.remedies.forEach(r => {
        remediesOverview.requested++;
        if (r.granted) remediesOverview.granted++;
      });
    }

    // Outcomes
    if (c.outcomeGeneral === 'Demandante prevalece') {
      plaintiffWins++;
    }

    // Parse duration string like "14 meses" or "14 months" to int
    const match = c.duration?.match(/\d+/);
    if (match) {
      totalMonths += parseInt(match[0], 10);
    }

    // Check strategic flags
    if (c.strategicFlags?.highEvidentiaryBurden) {
      highEvidentiaryCount++;
    }
  });

  const remediesData = [
    { name: 'Pretensiones', Solicitadas: remediesOverview.requested, Otorgadas: remediesOverview.granted }
  ];

  const avgDuration = cases.length > 0 ? Math.round(totalMonths / cases.length) : 0;
  const winRate = cases.length > 0 ? Math.round((plaintiffWins / cases.length) * 100) : 0;
  const highEvidentiaryRate = cases.length > 0 ? Math.round((highEvidentiaryCount / cases.length) * 100) : 0;

  return (
    <div className="space-y-8 pb-20">
      
      {/* 1. Hero Banner */}
      <div className="bg-lexia-black rounded-2xl p-8 relative overflow-hidden shadow-lg">
        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-white mb-2">Lexia Analytics · Societario</h2>
          <p className="text-lexia-gray text-base max-w-2xl mb-6">
            Inteligencia jurisprudencial agregada para litigios ante la Superintendencia de Sociedades de Colombia.
          </p>
          <div className="flex space-x-3">
            <span className="px-3 py-1 bg-lexia-teal/20 text-lexia-teal-light rounded-full border border-lexia-teal/30 text-xs font-semibold tracking-wide">
              {cases.length} Casos Encontrados
            </span>
            <span className="px-3 py-1 bg-lexia-teal/20 text-lexia-teal-light rounded-full border border-lexia-teal/30 text-xs font-semibold tracking-wide">
              Conexión DB Activa
            </span>
          </div>
        </div>
        <div className="absolute right-0 bottom-0 pointer-events-none opacity-10 blur-3xl rounded-full bg-lexia-teal w-96 h-96 transform translate-x-1/3 translate-y-1/3"></div>
      </div>

      {/* 2. KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Volumen Documental', value: cases.length, icon: Scale, color: 'text-lexia-black', bg: 'bg-lexia-bg' },
          { label: 'Tasa Éxito Demandante', value: `${winRate}%`, icon: TrendingUp, color: 'text-[#16a34a]', bg: 'bg-[#16a34a]/10' },
          { label: 'Alta Carga Probatoria', value: `${highEvidentiaryRate}%`, icon: AlertTriangle, color: 'text-[#d97706]', bg: 'bg-[#d97706]/10' },
          { label: 'Tiempo Promedio Decisión', value: `${avgDuration} meses`, icon: Clock, color: 'text-lexia-teal', bg: 'bg-lexia-teal/10' },
        ].map((stat, i) => (
          <div key={i} className="bg-white border-y border-r border-slate-200 border-l-4 border-l-lexia-teal rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-lexia-gray text-xs uppercase tracking-wider font-semibold mb-2">{stat.label}</p>
                <h3 className="text-3xl font-bold text-lexia-black">{stat.value}</h3>
              </div>
              <div className={`p-2.5 rounded-md ${stat.bg} ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2">
        
        {/* 3. Outcomes Pie Chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 lg:col-span-1 shadow-sm">
          <h3 className="text-lg font-bold text-lexia-black mb-6 border-b border-slate-100 pb-2">
            Resultados Generales
          </h3>
          <div className="h-64">
            {outcomeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={outcomeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {outcomeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#060606', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: '#060606', fontWeight: 500 }}
                  />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px', color: '#8B8C8E', fontWeight: 500 }}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-lexia-gray">No hay datos de resultados todavía.</div>
            )}
          </div>
        </div>

        {/* 4. Insight Card & Remedies */}
        <div className="lg:col-span-2 flex flex-col space-y-6">
          <div className="bg-[#f0fdfa] border border-lexia-teal/20 rounded-xl p-6 shadow-sm flex items-start space-x-4">
            <div className="p-3 bg-white rounded-lg shadow-sm text-lexia-teal">
              <span className="text-xl">💡</span>
            </div>
            <div>
              <h4 className="text-sm font-bold text-lexia-teal tracking-wide uppercase mb-1">Insight Estratégico</h4>
              <p className="text-lexia-black font-medium text-lg leading-snug">
                {cases.length > 0 
                  ? `El tiempo promedio de resolución es de ${avgDuration} meses. La tasa de éxito general del demandante es de ${winRate}%.`
                  : 'Sube jurisprudencia en el panel de administración para empezar a generar insights de IA.'
                }
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex-1">
            <h3 className="text-lg font-bold text-lexia-black mb-6 border-b border-slate-100 pb-2">Pretensiones: Solicitadas vs Otorgadas</h3>
            <div className="h-48">
              {remediesOverview.requested > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={remediesData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis type="number" stroke="#8B8C8E" />
                    <YAxis dataKey="name" type="category" stroke="#8B8C8E" width={80} tick={{fontWeight: 500}} />
                    <Tooltip 
                      cursor={{fill: '#f1f5f9'}}
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#060606', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#8B8C8E', fontWeight: 500 }} />
                    <Bar dataKey="Solicitadas" fill="#8B8C8E" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="Otorgadas" fill="#008080" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-lexia-gray">No se han analizado pretensiones todavía.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Recent Cases Table Style */}
      <h3 className="text-xl font-bold text-lexia-black mt-10 mb-6 px-1">Casos Recientes DB</h3>
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-[#FAFBFC]">
            <tr>
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-lexia-gray uppercase tracking-wider">Referencia</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-lexia-gray uppercase tracking-wider">Acción Estudiada</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-lexia-gray uppercase tracking-wider">Año</th>
              <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-lexia-gray uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {cases.slice(0, 5).map(c => (
              <tr key={c.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-semibold text-lexia-black">{c.caseName}</div>
                  <div className="text-sm text-lexia-gray line-clamp-1 max-w-sm">{c.summary}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-lexia-teal/10 text-lexia-teal">
                    {c.actionType}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-lexia-black font-medium">
                  {c.year}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link href={`/cases/${c.id}`} className="text-lexia-teal hover:text-lexia-teal-light transition-colors font-bold">
                    Ver Expediente <span aria-hidden="true">&rarr;</span>
                  </Link>
                </td>
              </tr>
            ))}
            {cases.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-lexia-gray font-medium">No hay casos indexados en la base de datos de IA. Sube jurisprudencia en el módulo Admin.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 6. Quick Access Links */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-5">
        <Link href="/taxonomy" className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-lexia-teal transition-all group">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 bg-lexia-bg rounded-lg text-lexia-black group-hover:text-lexia-teal group-hover:bg-lexia-teal/10 transition-colors">
               <Library className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-lexia-black group-hover:text-lexia-teal transition-colors">Taxonomía Legal</h4>
          </div>
          <p className="text-sm text-lexia-gray">Explora la definición exacta de las acciones societarias y sus subtópicos.</p>
        </Link>
        <Link href="/cases" className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-lexia-teal transition-all group">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 bg-lexia-bg rounded-lg text-lexia-black group-hover:text-lexia-teal group-hover:bg-lexia-teal/10 transition-colors">
               <Search className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-lexia-black group-hover:text-lexia-teal transition-colors">Explorador Base de Datos</h4>
          </div>
          <p className="text-sm text-lexia-gray">Busca y filtra sentencias específicas por año, resultado y pretensión.</p>
        </Link>
        <Link href="/admin" className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-lexia-teal transition-all cursor-pointer group">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 bg-lexia-bg rounded-lg text-lexia-black group-hover:text-lexia-teal group-hover:bg-lexia-teal/10 transition-colors">
               <Database className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-lexia-black group-hover:text-lexia-teal transition-colors">Ingesta de Datos</h4>
          </div>
          <p className="text-sm text-lexia-gray">Sincroniza y extrae nueva jurisprudencia desde el motor de IA de Lexia.</p>
        </Link>
      </div>

    </div>
  );
}
