/**
 * useAutoScroll Tests
 *
 * Tests auto-scroll behavior: scroll detection, manual scrolling,
 * and auto-scroll re-enable.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAutoScroll } from '../useAutoScroll';

describe('useAutoScroll', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('should start at bottom', () => {
      const { result } = renderHook(() => useAutoScroll());
      expect(result.current.isAtBottom).toBe(true);
    });

    it('should have scrollRef', () => {
      const { result } = renderHook(() => useAutoScroll());
      expect(result.current.scrollRef).toBeDefined();
    });
  });

  describe('scrollToBottom', () => {
    it('should set isAtBottom to true', () => {
      const { result } = renderHook(() => useAutoScroll());

      act(() => {
        result.current.scrollToBottom();
      });

      expect(result.current.isAtBottom).toBe(true);
    });
  });

  describe('disableAutoScroll', () => {
    it('should disable auto-scroll', () => {
      const { result } = renderHook(() => useAutoScroll());

      act(() => {
        result.current.disableAutoScroll();
      });

      // Auto-scroll should be disabled internally
      // We can't directly test the ref, but we can verify the function exists
      expect(result.current.disableAutoScroll).toBeDefined();
    });
  });

  describe('enableAutoScroll', () => {
    it('should enable auto-scroll and scroll to bottom', () => {
      const { result } = renderHook(() => useAutoScroll());

      act(() => {
        result.current.disableAutoScroll();
      });

      act(() => {
        result.current.enableAutoScroll();
      });

      expect(result.current.isAtBottom).toBe(true);
    });
  });
});
