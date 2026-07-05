/**
 * usePanelDrag Tests
 *
 * Validates drag-to-resize logic for mouse and touch events,
 * size clamping, and callback invocation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePanelDrag } from '../usePanelDrag';

function createMouseEvent(
  type: 'mousedown' | 'mousemove' | 'mouseup',
  clientX: number,
  clientY: number
): MouseEvent {
  return new MouseEvent(type, {
    clientX,
    clientY,
    bubbles: true,
    cancelable: true,
  });
}

function createTouchEvent(
  type: 'touchstart' | 'touchmove' | 'touchend',
  clientX: number,
  clientY: number
): TouchEvent {
  const touch = { clientX, clientY, identifier: 0 } as Touch;
  return new TouchEvent(type, {
    touches: type === 'touchend' ? [] : [touch],
    bubbles: true,
    cancelable: true,
  });
}

describe('usePanelDrag', () => {
  const defaultProps = {
    panelId: 'explorer',
    direction: 'horizontal' as const,
    min: 200,
    max: 400,
    size: 260,
    onResize: vi.fn(),
    onDragStart: vi.fn(),
    onDragEnd: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return isDragging as false initially', () => {
    const { result } = renderHook(() => usePanelDrag(defaultProps));
    expect(result.current.isDragging).toBe(false);
  });

  it('should return onMouseDown and onTouchStart handlers', () => {
    const { result } = renderHook(() => usePanelDrag(defaultProps));
    expect(typeof result.current.onMouseDown).toBe('function');
    expect(typeof result.current.onTouchStart).toBe('function');
  });

  describe('mouse drag', () => {
    it('should set isDragging to true on mousedown', () => {
      const { result } = renderHook(() => usePanelDrag(defaultProps));
      const mouseEvent = createMouseEvent('mousedown', 260, 0);
      vi.spyOn(mouseEvent, 'preventDefault');
      act(() => {
        result.current.onMouseDown(mouseEvent as unknown as React.MouseEvent);
      });
      expect(result.current.isDragging).toBe(true);
    });

    it('should call onDragStart on mousedown', () => {
      const { result } = renderHook(() => usePanelDrag(defaultProps));
      const mouseEvent = createMouseEvent('mousedown', 260, 0);
      vi.spyOn(mouseEvent, 'preventDefault');
      act(() => {
        result.current.onMouseDown(mouseEvent as unknown as React.MouseEvent);
      });
      expect(defaultProps.onDragStart).toHaveBeenCalledTimes(1);
    });

    it('should call onResize with clamped value on mousemove', () => {
      const { result } = renderHook(() => usePanelDrag(defaultProps));
      const mouseEvent = createMouseEvent('mousedown', 260, 0);
      vi.spyOn(mouseEvent, 'preventDefault');
      act(() => {
        result.current.onMouseDown(mouseEvent as unknown as React.MouseEvent);
      });

      act(() => {
        document.dispatchEvent(createMouseEvent('mousemove', 310, 0));
      });
      expect(defaultProps.onResize).toHaveBeenCalledWith(310);
    });

    it('should clamp size to max', () => {
      const { result } = renderHook(() => usePanelDrag(defaultProps));
      const mouseEvent = createMouseEvent('mousedown', 260, 0);
      vi.spyOn(mouseEvent, 'preventDefault');
      act(() => {
        result.current.onMouseDown(mouseEvent as unknown as React.MouseEvent);
      });

      act(() => {
        document.dispatchEvent(createMouseEvent('mousemove', 600, 0));
      });
      expect(defaultProps.onResize).toHaveBeenCalledWith(400);
    });

    it('should clamp size to min', () => {
      const { result } = renderHook(() => usePanelDrag(defaultProps));
      const mouseEvent = createMouseEvent('mousedown', 260, 0);
      vi.spyOn(mouseEvent, 'preventDefault');
      act(() => {
        result.current.onMouseDown(mouseEvent as unknown as React.MouseEvent);
      });

      act(() => {
        document.dispatchEvent(createMouseEvent('mousemove', 0, 0));
      });
      expect(defaultProps.onResize).toHaveBeenCalledWith(200);
    });

    it('should set isDragging to false on mouseup', () => {
      const { result } = renderHook(() => usePanelDrag(defaultProps));
      const mouseEvent = createMouseEvent('mousedown', 260, 0);
      vi.spyOn(mouseEvent, 'preventDefault');
      act(() => {
        result.current.onMouseDown(mouseEvent as unknown as React.MouseEvent);
      });
      expect(result.current.isDragging).toBe(true);

      act(() => {
        document.dispatchEvent(createMouseEvent('mouseup', 300, 0));
      });
      expect(result.current.isDragging).toBe(false);
    });

    it('should call onDragEnd on mouseup', () => {
      const { result } = renderHook(() => usePanelDrag(defaultProps));
      const mouseEvent = createMouseEvent('mousedown', 260, 0);
      vi.spyOn(mouseEvent, 'preventDefault');
      act(() => {
        result.current.onMouseDown(mouseEvent as unknown as React.MouseEvent);
      });

      act(() => {
        document.dispatchEvent(createMouseEvent('mouseup', 300, 0));
      });
      expect(defaultProps.onDragEnd).toHaveBeenCalledTimes(1);
    });

    it('should remove event listeners on mouseup', () => {
      const removeSpy = vi.spyOn(document, 'removeEventListener');
      const { result } = renderHook(() => usePanelDrag(defaultProps));
      const mouseEvent = createMouseEvent('mousedown', 260, 0);
      vi.spyOn(mouseEvent, 'preventDefault');
      act(() => {
        result.current.onMouseDown(mouseEvent as unknown as React.MouseEvent);
      });

      act(() => {
        document.dispatchEvent(createMouseEvent('mouseup', 300, 0));
      });
      expect(removeSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
      expect(removeSpy).toHaveBeenCalledWith('mouseup', expect.any(Function));
      removeSpy.mockRestore();
    });
  });

  describe('touch drag', () => {
    it('should set isDragging to true on touchstart', () => {
      const { result } = renderHook(() => usePanelDrag(defaultProps));
      act(() => {
        result.current.onTouchStart(
          createTouchEvent('touchstart', 260, 0) as unknown as React.TouchEvent
        );
      });
      expect(result.current.isDragging).toBe(true);
    });

    it('should call onDragStart on touchstart', () => {
      const { result } = renderHook(() => usePanelDrag(defaultProps));
      act(() => {
        result.current.onTouchStart(
          createTouchEvent('touchstart', 260, 0) as unknown as React.TouchEvent
        );
      });
      expect(defaultProps.onDragStart).toHaveBeenCalledTimes(1);
    });

    it('should call onResize on touchmove', () => {
      const { result } = renderHook(() => usePanelDrag(defaultProps));
      act(() => {
        result.current.onTouchStart(
          createTouchEvent('touchstart', 260, 0) as unknown as React.TouchEvent
        );
      });

      act(() => {
        document.dispatchEvent(createTouchEvent('touchmove', 310, 0));
      });
      expect(defaultProps.onResize).toHaveBeenCalledWith(310);
    });

    it('should set isDragging to false on touchend', () => {
      const { result } = renderHook(() => usePanelDrag(defaultProps));
      act(() => {
        result.current.onTouchStart(
          createTouchEvent('touchstart', 260, 0) as unknown as React.TouchEvent
        );
      });
      expect(result.current.isDragging).toBe(true);

      act(() => {
        document.dispatchEvent(createTouchEvent('touchend', 300, 0));
      });
      expect(result.current.isDragging).toBe(false);
    });

    it('should call onDragEnd on touchend', () => {
      const { result } = renderHook(() => usePanelDrag(defaultProps));
      act(() => {
        result.current.onTouchStart(
          createTouchEvent('touchstart', 260, 0) as unknown as React.TouchEvent
        );
      });

      act(() => {
        document.dispatchEvent(createTouchEvent('touchend', 300, 0));
      });
      expect(defaultProps.onDragEnd).toHaveBeenCalledTimes(1);
    });
  });

  describe('vertical drag', () => {
    it('should use clientY for position in vertical direction', () => {
      const props = { ...defaultProps, direction: 'vertical' as const, size: 240 };
      const { result } = renderHook(() => usePanelDrag(props));
      act(() => {
        result.current.onTouchStart(
          createTouchEvent('touchstart', 0, 240) as unknown as React.TouchEvent
        );
      });

      act(() => {
        document.dispatchEvent(createTouchEvent('touchmove', 0, 300));
      });
      expect(props.onResize).toHaveBeenCalledWith(300);
    });
  });

  describe('optional callbacks', () => {
    it('should work without onDragStart and onDragEnd', () => {
      const { result } = renderHook(() =>
        usePanelDrag({
          panelId: 'test',
          direction: 'horizontal',
          min: 100,
          max: 500,
          size: 200,
          onResize: vi.fn(),
        })
      );
      const mouseEvent = createMouseEvent('mousedown', 200, 0);
      vi.spyOn(mouseEvent, 'preventDefault');
      expect(() => {
        act(() => {
          result.current.onMouseDown(mouseEvent as unknown as React.MouseEvent);
        });
      }).not.toThrow();
    });
  });
});
