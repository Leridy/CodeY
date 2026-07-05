/**
 * useStreaming Hook
 *
 * Manages streaming text rendering state with batch character animation.
 * Uses a recurring interval timer to advance multiple characters per tick,
 * and auto-detects when all text has been displayed.
 */

import { useState, useCallback, useRef, useEffect } from 'react';

interface UseStreamingOptions {
  /** Per-character delay in ms (default: 50) */
  speed?: number;
  /** Number of characters to advance per tick (default: 1) */
  batchSize?: number;
  /** Callback when streaming completes */
  onComplete?: () => void;
}

export function useStreaming(options: UseStreamingOptions = {}) {
  const { speed = 50, batchSize = 1, onComplete } = options;
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const fullTextRef = useRef('');
  const indexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = undefined;
    }
  }, []);

  const startTimer = useCallback(() => {
    if (timerRef.current) return;

    timerRef.current = setInterval(() => {
      const remaining = fullTextRef.current.length - indexRef.current;
      if (remaining <= 0) {
        stopTimer();
        setIsComplete(true);
        onCompleteRef.current?.();
        return;
      }

      const advance = Math.min(batchSize, remaining);
      indexRef.current += advance;
      setDisplayedText(fullTextRef.current.slice(0, indexRef.current));

      // Auto-complete if we just finished the last characters
      if (indexRef.current >= fullTextRef.current.length) {
        stopTimer();
        setIsComplete(true);
        onCompleteRef.current?.();
      }
    }, speed);
  }, [speed, batchSize, stopTimer]);

  const append = useCallback(
    (text: string) => {
      fullTextRef.current += text;
      startTimer();
    },
    [startTimer]
  );

  const setFull = useCallback(
    (text: string) => {
      stopTimer();
      fullTextRef.current = text;
      indexRef.current = text.length;
      setDisplayedText(text);
      setIsComplete(true);
      onCompleteRef.current?.();
    },
    [stopTimer]
  );

  const reset = useCallback(() => {
    stopTimer();
    fullTextRef.current = '';
    indexRef.current = 0;
    setDisplayedText('');
    setIsComplete(false);
  }, [stopTimer]);

  useEffect(() => {
    return () => {
      stopTimer();
    };
  }, [stopTimer]);

  return { displayedText, isComplete, append, setFull, reset };
}
