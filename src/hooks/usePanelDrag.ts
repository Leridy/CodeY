/**
 * usePanelDrag Hook
 *
 * Encapsulates panel drag-to-resize logic for both mouse and touch events.
 * Handles size constraints and calls the onResize callback with the new size.
 */

import { useCallback, useRef, useState } from 'react';

interface UsePanelDragOptions {
  /** Target panel ID */
  panelId: string;
  /** Drag direction */
  direction: 'horizontal' | 'vertical';
  /** Minimum size (px) */
  min: number;
  /** Maximum size (px) */
  max: number;
  /** Current size (px) */
  size: number;
  /** Resize callback */
  onResize: (newSize: number) => void;
  /** Drag start callback */
  onDragStart?: () => void;
  /** Drag end callback */
  onDragEnd?: () => void;
}

export function usePanelDrag(options: UsePanelDragOptions): {
  isDragging: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
} {
  const { direction, min, max, size, onResize, onDragStart, onDragEnd } = options;

  const [isDragging, setIsDragging] = useState(false);
  const startRef = useRef({ pos: 0, size: 0 });

  const getPos = useCallback(
    (clientX: number, clientY: number): number => {
      return direction === 'horizontal' ? clientX : clientY;
    },
    [direction]
  );

  const handleMove = useCallback(
    (currentPos: number) => {
      const delta = currentPos - startRef.current.pos;
      const newSize = Math.min(max, Math.max(min, startRef.current.size + delta));
      onResize(newSize);
    },
    [min, max, onResize]
  );

  const handleEnd = useCallback(() => {
    setIsDragging(false);
    onDragEnd?.();
  }, [onDragEnd]);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      startRef.current = {
        pos: getPos(e.clientX, e.clientY),
        size,
      };
      onDragStart?.();

      const onMouseMove = (ev: MouseEvent) => {
        handleMove(getPos(ev.clientX, ev.clientY));
      };

      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        handleEnd();
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },
    [getPos, size, onDragStart, handleMove, handleEnd]
  );

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      setIsDragging(true);
      startRef.current = {
        pos: getPos(touch.clientX, touch.clientY),
        size,
      };
      onDragStart?.();

      const onTouchMove = (ev: TouchEvent) => {
        const t = ev.touches[0];
        handleMove(getPos(t.clientX, t.clientY));
      };

      const onTouchEnd = () => {
        document.removeEventListener('touchmove', onTouchMove);
        document.removeEventListener('touchend', onTouchEnd);
        handleEnd();
      };

      document.addEventListener('touchmove', onTouchMove);
      document.addEventListener('touchend', onTouchEnd);
    },
    [getPos, size, onDragStart, handleMove, handleEnd]
  );

  return { isDragging, onMouseDown, onTouchStart };
}
