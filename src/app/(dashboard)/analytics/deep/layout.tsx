import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Análisis Profundo | Lexia Analytics',
  description:
    'Métricas de segundo orden: razones de negación × tipo de acción, resolución de entidades, distribución de citas.',
};

export default function DeepAnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
