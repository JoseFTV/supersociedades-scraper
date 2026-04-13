import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Perfil de Entidad | Lexia Analytics',
  description:
    'Perfil de litigante recurrente: historial de casos, win rate, tipos de acción y razones de negación.',
};

export default function EntityProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
