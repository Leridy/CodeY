/**
 * useGridLayout Tests
 *
 * Validates CSS Grid style computation, track template generation,
 * and panel area lookup.
 */

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useGridLayout } from '../useGridLayout';
import { DEFAULT_PRESET } from '../../stores/presets';
import type { GridState } from '../../types/grid';

describe('useGridLayout', () => {
  const defaultGrid = DEFAULT_PRESET.gridConfig;

  describe('gridStyle', () => {
    it('should return a grid style with display: grid', () => {
      const { result } = renderHook(() => useGridLayout(defaultGrid));
      expect(result.current.gridStyle.display).toBe('grid');
    });

    it('should set width and height to 100%', () => {
      const { result } = renderHook(() => useGridLayout(defaultGrid));
      expect(result.current.gridStyle.width).toBe('100%');
      expect(result.current.gridStyle.height).toBe('100%');
    });

    it('should compute gridTemplateColumns from column tracks', () => {
      const { result } = renderHook(() => useGridLayout(defaultGrid));
      expect(result.current.gridStyle.gridTemplateColumns).toBe('260px 1fr 320px');
    });

    it('should compute gridTemplateRows from row tracks', () => {
      const { result } = renderHook(() => useGridLayout(defaultGrid));
      expect(result.current.gridStyle.gridTemplateRows).toBe('1fr 240px');
    });

    it('should handle all-fr columns', () => {
      const grid: GridState = {
        ...defaultGrid,
        columns: [
          { size: 1, min: 0, max: 1, unit: 'fr' },
          { size: 2, min: 0, max: 1, unit: 'fr' },
        ],
      };
      const { result } = renderHook(() => useGridLayout(grid));
      expect(result.current.gridStyle.gridTemplateColumns).toBe('1fr 2fr');
    });

    it('should handle all-px tracks', () => {
      const grid: GridState = {
        ...defaultGrid,
        columns: [
          { size: 100, min: 50, max: 200, unit: 'px' },
          { size: 200, min: 100, max: 400, unit: 'px' },
        ],
        rows: [{ size: 300, min: 100, max: 500, unit: 'px' }],
      };
      const { result } = renderHook(() => useGridLayout(grid));
      expect(result.current.gridStyle.gridTemplateColumns).toBe('100px 200px');
      expect(result.current.gridStyle.gridTemplateRows).toBe('300px');
    });
  });

  describe('getPanelArea', () => {
    it('should return grid area string for a known panel', () => {
      const { result } = renderHook(() => useGridLayout(defaultGrid));
      expect(result.current.getPanelArea('explorer')).toBe('1 / 1 / 2 / 2');
    });

    it('should return correct area for content panel', () => {
      const { result } = renderHook(() => useGridLayout(defaultGrid));
      expect(result.current.getPanelArea('content')).toBe('1 / 2 / 2 / 3');
    });

    it('should return correct area for terminal panel', () => {
      const { result } = renderHook(() => useGridLayout(defaultGrid));
      expect(result.current.getPanelArea('terminal')).toBe('2 / 1 / 3 / 4');
    });

    it('should return empty string for unknown panel', () => {
      const { result } = renderHook(() => useGridLayout(defaultGrid));
      expect(result.current.getPanelArea('nonexistent')).toBe('');
    });
  });

  describe('updateTrackSize', () => {
    it('should be a function', () => {
      const { result } = renderHook(() => useGridLayout(defaultGrid));
      expect(typeof result.current.updateTrackSize).toBe('function');
    });

    it('should not throw when called with valid params', () => {
      const { result } = renderHook(() => useGridLayout(defaultGrid));
      expect(() => result.current.updateTrackSize('columns', 0, 300)).not.toThrow();
    });

    it('should not throw for out-of-bounds index', () => {
      const { result } = renderHook(() => useGridLayout(defaultGrid));
      expect(() => result.current.updateTrackSize('rows', 99, 100)).not.toThrow();
    });
  });
});
