/**
 * usePanelVisibility Hook
 *
 * Derives each panel's visibility and display mode from the current layout mode.
 */

import { useMemo } from 'react';
import type { LayoutMode, PanelVisibility } from '../types/layout';

export function usePanelVisibility(mode: LayoutMode): PanelVisibility {
  return useMemo(() => {
    switch (mode) {
      case 'desktop':
        return {
          explorer: { visible: true, mode: 'sidebar' },
          details: { visible: true, mode: 'panel' },
          terminal: { visible: true, mode: 'panel' },
        };
      case 'tablet':
        return {
          explorer: { visible: true, mode: 'icon' },
          details: { visible: true, mode: 'floating' },
          terminal: { visible: true, mode: 'panel' },
        };
      case 'mobile':
        return {
          explorer: { visible: true, mode: 'drawer' },
          details: { visible: true, mode: 'drawer' },
          terminal: { visible: true, mode: 'drawer' },
        };
    }
  }, [mode]);
}
