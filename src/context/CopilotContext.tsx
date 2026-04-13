'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface CopilotContextType {
  factPattern: string;
  setFactPattern: (val: string) => void;
  isLoading: boolean;
  memo: string;
  citedCases: { id: string; caseName: string; sourceReference?: string; actionType: string; year: number; similarity?: number; markdownContent?: string }[];
  error: string;
  handleGenerate: () => Promise<void>;
}

const CopilotContext = createContext<CopilotContextType | undefined>(undefined);

export const CopilotProvider = ({ children }: { children: ReactNode }) => {
  const [factPattern, setFactPattern] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [memo, setMemo] = useState('');
  const [citedCases, setCitedCases] = useState<{ id: string; caseName: string; sourceReference?: string; actionType: string; year: number; similarity?: number; markdownContent?: string }[]>([]);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!factPattern.trim() || factPattern.length < 50) {
      setError('Por favor, proporciona una descripción más detallada de los hechos.');
      return;
    }

    setIsLoading(true);
    setError('');
    setMemo('');
    setCitedCases([]);

    try {
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ factPattern })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Ocurrió un error al generar el memorando.');
      }

      setMemo(data.memo);
      setCitedCases(data.citedCases);

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error de conexión con el servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CopilotContext.Provider value={{ factPattern, setFactPattern, isLoading, memo, citedCases, error, handleGenerate }}>
      {children}
    </CopilotContext.Provider>
  );
};

export const useCopilot = () => {
  const context = useContext(CopilotContext);
  if (context === undefined) {
    throw new Error('useCopilot must be used within a CopilotProvider');
  }
  return context;
};
