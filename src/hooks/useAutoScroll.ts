/**
 * useAutoScroll Hook
 *
 * Manages auto-scrolling behavior for message lists.
 * Detects when user scrolls manually and provides controls
 * to re-enable auto-scrolling.
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export interface UseAutoScrollOptions {
  /** Whether to enable auto-scrolling (default: true) */
  enabled?: boolean;
  /** Scroll trigger threshold in px (default: 100) */
  threshold?: number;
}

export interface UseAutoScrollReturn {
  /** Scroll container ref */
  scrollRef: React.RefObject<HTMLDivElement | null>;
  /** Whether scrolled to bottom */
  isAtBottom: boolean;
  /** Manually scroll to bottom */
  scrollToBottom: (behavior?: ScrollBehavior) => void;
  /** Disable auto-scroll (when user scrolls manually) */
  disableAutoScroll: () => void;
  /** Re-enable auto-scroll */
  enableAutoScroll: () => void;
}

export function useAutoScroll(options: UseAutoScrollOptions = {}): UseAutoScrollReturn {
  const { enabled: initialEnabled = true, threshold = 100 } = options;

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const autoScrollEnabledRef = useRef(initialEnabled);
  const thresholdRef = useRef(threshold);

  // Update refs when options change
  useEffect(() => {
    thresholdRef.current = threshold;
  }, [threshold]);

  const checkScrollPosition = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const atBottom = distanceFromBottom <= thresholdRef.current;

    setIsAtBottom(atBottom);

    // If user scrolled away from bottom, disable auto-scroll
    if (!atBottom) {
      autoScrollEnabledRef.current = false;
    }
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const container = scrollRef.current;
    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior,
    });

    setIsAtBottom(true);
    autoScrollEnabledRef.current = true;
  }, []);

  const disableAutoScroll = useCallback(() => {
    autoScrollEnabledRef.current = false;
  }, []);

  const enableAutoScroll = useCallback(() => {
    autoScrollEnabledRef.current = true;
    scrollToBottom();
  }, [scrollToBottom]);

  // Auto-scroll when content changes
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const observer = new MutationObserver(() => {
      if (autoScrollEnabledRef.current) {
        // Use requestAnimationFrame to ensure DOM has updated
        requestAnimationFrame(() => {
          container.scrollTop = container.scrollHeight;
        });
      }
    });

    observer.observe(container, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  // Add scroll event listener
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    container.addEventListener('scroll', checkScrollPosition, { passive: true });

    return () => {
      container.removeEventListener('scroll', checkScrollPosition);
    };
  }, [checkScrollPosition]);

  return {
    scrollRef,
    isAtBottom,
    scrollToBottom,
    disableAutoScroll,
    enableAutoScroll,
  };
}
