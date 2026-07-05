/**
 * useLayoutMode Tests
 *
 * Validates layout mode detection based on window width,
 * including resize event handling and mode transitions.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLayoutMode } from '../useLayoutMode';
import { BREAKPOINTS } from '../../types/layout';

describe('useLayoutMode', () => {
  const originalInnerWidth = window.innerWidth;

  function setWidth(width: number) {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });
  }

  beforeEach(() => {
    setWidth(BREAKPOINTS.desktop);
  });

  afterEach(() => {
    setWidth(originalInnerWidth);
  });

  describe('initial mode', () => {
    it('should return desktop for width >= 1280', () => {
      setWidth(1280);
      const { result } = renderHook(() => useLayoutMode());
      expect(result.current).toBe('desktop');
    });

    it('should return desktop for very large width', () => {
      setWidth(2560);
      const { result } = renderHook(() => useLayoutMode());
      expect(result.current).toBe('desktop');
    });

    it('should return tablet for width 768-1279', () => {
      setWidth(1024);
      const { result } = renderHook(() => useLayoutMode());
      expect(result.current).toBe('tablet');
    });

    it('should return mobile for width < 768', () => {
      setWidth(500);
      const { result } = renderHook(() => useLayoutMode());
      expect(result.current).toBe('mobile');
    });
  });

  describe('boundary values', () => {
    it('should return desktop at exact desktop breakpoint', () => {
      setWidth(BREAKPOINTS.desktop);
      const { result } = renderHook(() => useLayoutMode());
      expect(result.current).toBe('desktop');
    });

    it('should return tablet just below desktop breakpoint', () => {
      setWidth(BREAKPOINTS.desktop - 1);
      const { result } = renderHook(() => useLayoutMode());
      expect(result.current).toBe('tablet');
    });

    it('should return tablet at exact mobile breakpoint', () => {
      setWidth(BREAKPOINTS.mobile);
      const { result } = renderHook(() => useLayoutMode());
      expect(result.current).toBe('tablet');
    });

    it('should return mobile just below mobile breakpoint', () => {
      setWidth(BREAKPOINTS.mobile - 1);
      const { result } = renderHook(() => useLayoutMode());
      expect(result.current).toBe('mobile');
    });
  });

  describe('resize events', () => {
    it('should update mode on resize', () => {
      setWidth(BREAKPOINTS.desktop);
      const { result } = renderHook(() => useLayoutMode());
      expect(result.current).toBe('desktop');

      act(() => {
        setWidth(800);
        window.dispatchEvent(new Event('resize'));
      });
      expect(result.current).toBe('tablet');
    });

    it('should update to mobile on small resize', () => {
      setWidth(BREAKPOINTS.desktop);
      const { result } = renderHook(() => useLayoutMode());
      expect(result.current).toBe('desktop');

      act(() => {
        setWidth(400);
        window.dispatchEvent(new Event('resize'));
      });
      expect(result.current).toBe('mobile');
    });

    it('should not update state when mode unchanged', () => {
      setWidth(BREAKPOINTS.desktop);
      const { result } = renderHook(() => useLayoutMode());
      const firstRender = result.current;

      act(() => {
        setWidth(BREAKPOINTS.desktop + 100);
        window.dispatchEvent(new Event('resize'));
      });
      expect(result.current).toBe(firstRender);
    });

    it('should clean up resize listener on unmount', () => {
      const removeSpy = vi.spyOn(window, 'removeEventListener');
      const { unmount } = renderHook(() => useLayoutMode());
      unmount();
      expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function));
      removeSpy.mockRestore();
    });
  });
});
