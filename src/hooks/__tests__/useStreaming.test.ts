/**
 * useStreaming Tests
 *
 * Validates streaming text rendering: append, batch animation,
 * completion detection, setFull, and reset.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStreaming } from '../useStreaming';

describe('useStreaming', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('should have empty displayedText', () => {
      const { result } = renderHook(() => useStreaming());
      expect(result.current.displayedText).toBe('');
    });

    it('should not be complete', () => {
      const { result } = renderHook(() => useStreaming());
      expect(result.current.isComplete).toBe(false);
    });
  });

  describe('append', () => {
    it('should accumulate full text in internal buffer', () => {
      const { result } = renderHook(() => useStreaming({ speed: 50 }));
      act(() => {
        result.current.append('Hello');
      });
      act(() => {
        vi.advanceTimersByTime(50);
      });
      expect(result.current.displayedText.length).toBeGreaterThan(0);
      expect(result.current.displayedText.length).toBeLessThanOrEqual(5);
    });

    it('should display characters incrementally', () => {
      const { result } = renderHook(() => useStreaming({ speed: 50 }));
      act(() => {
        result.current.append('AB');
      });

      act(() => {
        vi.advanceTimersByTime(50);
      });
      expect(result.current.displayedText).toBe('A');

      act(() => {
        vi.advanceTimersByTime(50);
      });
      expect(result.current.displayedText).toBe('AB');
    });

    it('should complete after all characters are displayed', () => {
      const { result } = renderHook(() => useStreaming({ speed: 50 }));
      act(() => {
        result.current.append('Hi');
      });

      act(() => {
        vi.advanceTimersByTime(150);
      });
      expect(result.current.isComplete).toBe(true);
      expect(result.current.displayedText).toBe('Hi');
    });

    it('should call onComplete when streaming finishes', () => {
      const onComplete = vi.fn();
      const { result } = renderHook(() => useStreaming({ speed: 50, onComplete }));
      act(() => {
        result.current.append('OK');
      });

      act(() => {
        vi.advanceTimersByTime(150);
      });
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('should support batch character advancement', () => {
      const { result } = renderHook(() => useStreaming({ speed: 50, batchSize: 3 }));
      act(() => {
        result.current.append('ABCDEF');
      });

      act(() => {
        vi.advanceTimersByTime(50);
      });
      expect(result.current.displayedText).toBe('ABC');

      act(() => {
        vi.advanceTimersByTime(50);
      });
      expect(result.current.displayedText).toBe('ABCDEF');
      expect(result.current.isComplete).toBe(true);
    });

    it('should handle multiple append calls', () => {
      const { result } = renderHook(() => useStreaming({ speed: 50 }));
      act(() => {
        result.current.append('Hel');
      });
      act(() => {
        result.current.append('lo');
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(result.current.displayedText).toBe('Hello');
      expect(result.current.isComplete).toBe(true);
    });
  });

  describe('setFull', () => {
    it('should immediately set full text', () => {
      const { result } = renderHook(() => useStreaming());
      act(() => {
        result.current.setFull('Complete text');
      });
      expect(result.current.displayedText).toBe('Complete text');
      expect(result.current.isComplete).toBe(true);
    });

    it('should call onComplete', () => {
      const onComplete = vi.fn();
      const { result } = renderHook(() => useStreaming({ onComplete }));
      act(() => {
        result.current.setFull('Done');
      });
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('should stop any running timer', () => {
      const { result } = renderHook(() => useStreaming({ speed: 50 }));
      act(() => {
        result.current.append('Slow text here');
      });
      act(() => {
        result.current.setFull('Fast');
      });
      expect(result.current.displayedText).toBe('Fast');

      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(result.current.displayedText).toBe('Fast');
    });
  });

  describe('reset', () => {
    it('should clear all state', () => {
      const { result } = renderHook(() => useStreaming({ speed: 50 }));
      act(() => {
        result.current.append('Some text');
      });
      act(() => {
        vi.advanceTimersByTime(200);
      });

      act(() => {
        result.current.reset();
      });
      expect(result.current.displayedText).toBe('');
      expect(result.current.isComplete).toBe(false);
    });

    it('should stop any running timer', () => {
      const { result } = renderHook(() => useStreaming({ speed: 50 }));
      act(() => {
        result.current.append('Timer running');
      });

      act(() => {
        result.current.reset();
      });

      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(result.current.displayedText).toBe('');
    });

    it('should allow append after reset', () => {
      const { result } = renderHook(() => useStreaming({ speed: 50 }));
      act(() => {
        result.current.append('First');
      });
      act(() => {
        vi.advanceTimersByTime(300);
      });

      act(() => {
        result.current.reset();
      });

      act(() => {
        result.current.append('Second');
      });
      act(() => {
        vi.advanceTimersByTime(50);
      });
      expect(result.current.displayedText).toBe('S');
    });
  });

  describe('empty text', () => {
    it('should handle append with empty string', () => {
      const { result } = renderHook(() => useStreaming({ speed: 50 }));
      act(() => {
        result.current.append('');
      });
      expect(result.current.displayedText).toBe('');
    });

    it('should handle setFull with empty string', () => {
      const { result } = renderHook(() => useStreaming());
      act(() => {
        result.current.setFull('');
      });
      expect(result.current.displayedText).toBe('');
      expect(result.current.isComplete).toBe(true);
    });
  });

  describe('cleanup', () => {
    it('should stop timer on unmount', () => {
      const { result, unmount } = renderHook(() => useStreaming({ speed: 50 }));
      act(() => {
        result.current.append('Text');
      });
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('batch size larger than remaining', () => {
    it('should not overshoot when batchSize > remaining chars', () => {
      const { result } = renderHook(() => useStreaming({ speed: 50, batchSize: 10 }));
      act(() => {
        result.current.append('Hi');
      });

      act(() => {
        vi.advanceTimersByTime(50);
      });
      expect(result.current.displayedText).toBe('Hi');
      expect(result.current.isComplete).toBe(true);
    });
  });
});
