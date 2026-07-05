/**
 * useGridLayout Hook
 *
 * Computes CSS Grid style objects from GridState configuration.
 * Provides helpers for track size updates and panel area lookup.
 */

import { useMemo, useCallback } from 'react';
import { useLayoutStore } from '../stores/layoutStore';
import type { GridState } from '../types/grid';

function formatTrackSize(size: number, unit: 'px' | 'fr'): string {
  if (unit === 'fr') return `${size}fr`;
  return `${size}px`;
}

function buildTrackTemplate(tracks: { size: number; unit: 'px' | 'fr' }[]): string {
  return tracks.map((t) => formatTrackSize(t.size, t.unit)).join(' ');
}

export function useGridLayout(gridConfig: GridState): {
  gridStyle: React.CSSProperties;
  updateTrackSize: (dimension: 'columns' | 'rows', trackIndex: number, newSize: number) => void;
  getPanelArea: (panelId: string) => string;
} {
  const gridStyle = useMemo<React.CSSProperties>(() => {
    const columnTemplate = buildTrackTemplate(gridConfig.columns);
    const rowTemplate = buildTrackTemplate(gridConfig.rows);

    return {
      display: 'grid',
      gridTemplateColumns: columnTemplate,
      gridTemplateRows: rowTemplate,
      width: '100%',
      height: '100%',
    };
  }, [gridConfig.columns, gridConfig.rows]);

  const getPanelArea = useCallback(
    (panelId: string): string => {
      const area = gridConfig.areas.find((a) => a.panelId === panelId);
      if (!area) return '';
      return `${area.rowStart} / ${area.columnStart} / ${area.rowEnd} / ${area.columnEnd}`;
    },
    [gridConfig.areas]
  );

  const updateGridConfig = useLayoutStore((s) => s.updateGridConfig);

  const updateTrackSize = useCallback(
    (dimension: 'columns' | 'rows', trackIndex: number, newSize: number) => {
      const tracks = gridConfig[dimension];
      if (trackIndex < 0 || trackIndex >= tracks.length) return;

      const track = tracks[trackIndex];
      const clampedSize = Math.min(Math.max(newSize, track.min), track.max);

      const updatedTracks = tracks.map((t, i) =>
        i === trackIndex ? { ...t, size: clampedSize } : t
      );

      updateGridConfig({ [dimension]: updatedTracks });
    },
    [gridConfig, updateGridConfig]
  );

  return { gridStyle, updateTrackSize, getPanelArea };
}
