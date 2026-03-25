'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface PointsContextType {
  award: { points: number; reason: string } | null;
  showAward: (points: number, reason: string) => void;
  clearAward: () => void;
}

const PointsContext = createContext<PointsContextType | undefined>(undefined);

export function PointsProvider({ children }: { children: React.ReactNode }) {
  const [award, setAward] = useState<{ points: number; reason: string } | null>(null);

  const showAward = useCallback((points: number, reason: string) => {
    setAward({ points, reason });
  }, []);

  const clearAward = useCallback(() => {
    setAward(null);
  }, []);

  return (
    <PointsContext.Provider value={{ award, showAward, clearAward }}>
      {children}
    </PointsContext.Provider>
  );
}

export function usePoints() {
  const context = useContext(PointsContext);
  if (context === undefined) {
    throw new Error('usePoints must be used within a PointsProvider');
  }
  return context;
}
