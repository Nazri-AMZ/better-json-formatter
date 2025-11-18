'use client';

import { useState, useCallback } from 'react';

export type GlobalExpandState = 'individual' | 'expanded' | 'collapsed';

export function useGlobalExpandControls() {
  const [globalState, setGlobalState] = useState<GlobalExpandState>('individual');

  const expandAll = useCallback(() => {
    setGlobalState('expanded');
  }, []);

  const collapseAll = useCallback(() => {
    setGlobalState('collapsed');
  }, []);

  const resetToIndividual = useCallback(() => {
    setGlobalState('individual');
  }, []);

  return {
    globalState,
    expandAll,
    collapseAll,
    resetToIndividual
  };
}