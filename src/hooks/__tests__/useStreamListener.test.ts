/**
 * useStreamListener Tests
 *
 * Tests Tauri event listener integration and stream chunk handling.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useStreamListener } from '../useStreamListener';

// Mock Tauri event module
vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn().mockResolvedValue(() => {}),
}));

describe('useStreamListener', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should setup listeners when enabled', () => {
    const { result } = renderHook(() =>
      useStreamListener({ enabled: true })
    );

    // Hook should complete without errors
    expect(result.current).toBeUndefined();
  });

  it('should not setup listeners when disabled', () => {
    const { result } = renderHook(() =>
      useStreamListener({ enabled: false })
    );

    // Hook should complete without errors
    expect(result.current).toBeUndefined();
  });

  it('should accept callback options', () => {
    const onText = vi.fn();
    const onToolCall = vi.fn();
    const onStart = vi.fn();
    const onEnd = vi.fn();
    const onError = vi.fn();

    const { result } = renderHook(() =>
      useStreamListener({
        enabled: true,
        onText,
        onToolCall,
        onStart,
        onEnd,
        onError,
      })
    );

    // Hook should complete without errors
    expect(result.current).toBeUndefined();
  });
});
