import { notFound } from 'next/navigation';
import { ArrowLeft, Users, Scale, TrendingUp, TrendingDown } from 'lucide-react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function EntityProfile({ params }: { params: Promise<{ id: string }> }) {
  const param = await params;

  const entity = await prisma.canonicalEntity.findUnique({
    where: { id: param.id },
  });

  if (!entity) notFound();

  // Find all cases where this entity appears (match by any alias)
  const cases = await prisma.case.findMany({
    where: {
      parties: {
        some: {
          name: { in: entity.aliases },
        },
      },
    },
    include: {
      parties: true,
      denialReasons: { select: { code: true, label: true } },
    },
    orderBy: { year: 'desc' },
  });

  // Compute stats
  const actionTypes = new Map<string, number>();
  const outcomes = new Map<string, number>();
  const denialCodes = new Map<string, number>();

  for (const c of cases) {
    actionTypes.set(c.actionType, (actionTypes.get(c.actionType) || 0) + 1);
    outcomes.set(c.outcomeGeneral, (outcomes.get(c.outcomeGeneral) || 0) + 1);
    for (const dr of c.denialReasons) {
      denialCodes.set(dr.code, (denialCodes.get(dr.code) || 0) + 1);
    }
  }

  const sortedActions = Array.from(actionTypes.entries()).sort((a, b) => b[1] - a[1]);
  const sortedOutcomes = Array.from(outcomes.entries()).sort((a, b) => b[1] - a[1]);
  const sortedDenials = Array.from(denialCodes.entries()).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      <Link href="/analytics/deep" className="inline-flex items-center text-sm text-lexia-gray hover:text-lexia-teal transition-colors mb-4 font-medium">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver a Análisis Profundo
      </Link>

      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <Users className="h-6 w-6 text-lexia-teal" />
          <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${
            entity.entityType === 'PERSONA_NATURAL'
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}>
            {entity.entityType === 'PERSONA_NATURAL' ? 'Persona Natural' : 'Persona Jurídica'}
          </span>
        </div>
        <h1 className="text-3xl font-bold text-lexia-black mb-4 tracking-tight">{entity.canonicalName}</h1>

        {entity.aliases.length > 1 && (
          <div className="mb-4">
            <span className="text-xs text-lexia-gray font-medium">Aliases: </span>
            {entity.aliases.map(a => (
              <span key={a} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded mr-1.5 border border-slate-200">{a}</span>
            ))}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6">
          <div className="bg-[#FAFBFC] border border-slate-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-lexia-black">{entity.totalCases}</div>
            <div className="text-xs text-lexia-gray">Casos</div>
          </div>
          <div className="bg-[#FAFBFC] border border-slate-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-600">{entity.asPlaintiff}</div>
            <div className="text-xs text-lexia-gray">Como Demandante</div>
          </div>
          <div className="bg-[#FAFBFC] border border-slate-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-red-600">{entity.asDefendant}</div>
            <div className="text-xs text-lexia-gray">Como Demandado</div>
          </div>
          <div className="bg-[#FAFBFC] border border-slate-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-lexia-teal">
              {entity.winRate !== null ? `${(entity.winRate * 100).toFixed(0)}%` : '—'}
            </div>
            <div className="text-xs text-lexia-gray">Win Rate</div>
          </div>
          <div className="bg-[#FAFBFC] border border-slate-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-slate-600">{cases.length}</div>
            <div className="text-xs text-lexia-gray">Casos Vinculados</div>
          </div>
        </div>
      </div>

      {/* Breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Action Types */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-sm tracking-wider uppercase font-bold text-lexia-gray mb-4 border-b border-slate-100 pb-2">
            Tipos de Acción
          </h3>
          <div className="space-y-2">
            {sortedActions.map(([action, count]) => (
              <div key={action} className="flex justify-between text-sm">
                <span className="text-lexia-black truncate mr-2">{action}</span>
                <span className="font-bold text-lexia-teal shrink-0">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Outcomes */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-sm tracking-wider uppercase font-bold text-lexia-gray mb-4 border-b border-slate-100 pb-2">
            Resultados
          </h3>
          <div className="space-y-2">
            {sortedOutcomes.map(([outcome, count]) => {
              const color = /demandante/i.test(outcome) ? 'text-green-600' : /demandado/i.test(outcome) ? 'text-red-600' : 'text-amber-600';
              return (
                <div key={outcome} className="flex justify-between text-sm">
                  <span className={`${color} font-medium truncate mr-2`}>{outcome}</span>
                  <span className="font-bold text-slate-700 shrink-0">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Denial Reasons */}
        {sortedDenials.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-sm tracking-wider uppercase font-bold text-lexia-gray mb-4 border-b border-slate-100 pb-2">
              Razones de Negación
            </h3>
            <div className="space-y-2">
              {sortedDenials.map(([code, count]) => (
                <div key={code} className="flex justify-between text-sm">
                  <span className="font-mono text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded border border-red-200">{code}</span>
                  <span className="font-bold text-slate-700">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Case List */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-sm tracking-wider uppercase font-bold text-lexia-gray mb-4 border-b border-slate-100 pb-2 flex items-center">
          <Scale className="h-4 w-4 mr-2" /> Casos ({cases.length})
        </h3>
        <div className="space-y-3">
          {cases.map((c) => {
            const role = c.parties.find(p => entity.aliases.includes(p.name))?.role || '—';
            const isWin = /demandante.*prevalece/i.test(c.outcomeGeneral);
            const isLoss = /demandado.*prevalece/i.test(c.outcomeGeneral);
            const OutcomeIcon = isWin ? TrendingUp : isLoss ? TrendingDown : Scale;
            const outcomeColor = isWin ? 'text-green-600' : isLoss ? 'text-red-600' : 'text-amber-600';

            return (
              <Link key={c.id} href={`/cases/${c.id}`}>
                <div className="flex items-center justify-between p-3 bg-[#FAFBFC] border border-slate-200 rounded-lg hover:border-lexia-teal/40 transition-colors cursor-pointer">
                  <div className="min-w-0 flex-1 mr-4">
                    <div className="text-sm font-semibold text-lexia-black truncate">{c.caseName}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-lexia-gray">{c.year}</span>
                      <span className="text-xs bg-lexia-teal/10 text-lexia-teal px-1.5 py-0.5 rounded font-medium">{c.actionType}</span>
                      <span className="text-xs text-slate-500">Rol: {role}</span>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1 shrink-0 ${outcomeColor}`}>
                    <OutcomeIcon className="h-4 w-4" />
                    <span className="text-xs font-bold">{c.outcomeGeneral}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
