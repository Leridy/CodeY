/**
 * useLayoutMode Hook
 *
 * Monitors window width and returns the current layout mode.
 * Returns 'desktop' | 'tablet' | 'mobile' based on BREAKPOINTS.
 */

import { useState, useEffect } from 'react';
import { BREAKPOINTS } from '../types/layout';
import type { LayoutMode } from '../types/layout';

function getLayoutMode(width: number): LayoutMode {
  if (width >= BREAKPOINTS.desktop) return 'desktop';
  if (width >= BREAKPOINTS.mobile) return 'tablet';
  return 'mobile';
}

export function useLayoutMode(): LayoutMode {
  const [mode, setMode] = useState<LayoutMode>(() => getLayoutMode(window.innerWidth));

  useEffect(() => {
    function handleResize() {
      const next = getLayoutMode(window.innerWidth);
      setMode((prev) => (prev !== next ? next : prev));
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return mode;
}
