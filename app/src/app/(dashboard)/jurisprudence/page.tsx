import type { Metadata } from 'next';
import JurisprudenceClient from './JurisprudenceClient';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = { title: 'Evolución Jurisprudencial' };

// Prevent static caching to always fetch the latest action types available
export const dynamic = 'force-dynamic';

export default async function JurisprudencePage() {
  // Get all unique action types from the database to populate the dropdown
  const uniqueActions = await prisma.case.findMany({
    select: {
      actionType: true,
    },
    distinct: ['actionType'],
  });

  const availableTypes = uniqueActions
    .map((c) => c.actionType)
    .filter(Boolean)
    .sort();

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-lexia-black mb-2">Evolución Jurisprudencial</h1>
        <p className="text-lexia-gray max-w-3xl leading-relaxed">
          Analiza el arco histórico y los cambios doctrinales de la Superintendencia de Sociedades.
          Selecciona una acción societaria para generar un diagnóstico interactivo impulsado por IA.
        </p>
      </div>

      <JurisprudenceClient actionTypes={availableTypes} />
    </div>
  );
}
