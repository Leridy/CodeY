/**
 * ResizeHandle Component
 *
 * Draggable handle for resizing panels.
 * Supports horizontal and vertical directions with size constraints and snapping.
 */

import { useCallback } from 'react'
import { usePanelDrag } from '../../hooks/usePanelDrag'
import { useLayoutStore } from '../../stores/layoutStore'

export interface ResizeHandleProps {
  /** Resize direction */
  direction: 'horizontal' | 'vertical'
  /** Target panel ID */
  panelId: string
  /** Current size (px) */
  size: number
  /** Minimum size (px) */
  min: number
  /** Maximum size (px) */
  max: number
  /** Whether snap is enabled */
  snapEnabled?: boolean
  /** Snap threshold (px) */
  snapThreshold?: number
  /** Size change callback */
  onResize: (newSize: number) => void
  /** Drag start callback */
  onDragStart?: () => void
  /** Drag end callback */
  onDragEnd?: () => void
}

export function ResizeHandle({
  direction,
  panelId,
  size,
  min,
  max,
  snapEnabled = false,
  snapThreshold = 10,
  onResize,
  onDragStart,
  onDragEnd,
}: ResizeHandleProps) {
  const startDrag = useLayoutStore((s) => s.startDrag)
  const endDrag = useLayoutStore((s) => s.endDrag)

  const handleDragStart = useCallback(() => {
    startDrag(panelId, 'resize', direction)
    onDragStart?.()
  }, [panelId, direction, startDrag, onDragStart])

  const handleDragEnd = useCallback(() => {
    endDrag()
    onDragEnd?.()
  }, [endDrag, onDragEnd])

  const handleResize = useCallback(
    (newSize: number) => {
      let adjustedSize = newSize

      // Apply snapping if enabled
      if (snapEnabled) {
        const snapPoints = [min, max]
        for (const point of snapPoints) {
          if (Math.abs(adjustedSize - point) <= snapThreshold) {
            adjustedSize = point
            break
          }
        }
      }

      onResize(adjustedSize)
    },
    [snapEnabled, snapThreshold, min, max, onResize]
  )

  const { isDragging, onMouseDown, onTouchStart } = usePanelDrag({
    panelId,
    direction,
    min,
    max,
    size,
    onResize: handleResize,
    onDragStart: handleDragStart,
    onDragEnd: handleDragEnd,
  })

  const isHorizontal = direction === 'horizontal'

  return (
    <div
      role="separator"
      aria-orientation={isHorizontal ? 'vertical' : 'horizontal'}
      data-panel-id={panelId}
      data-direction={direction}
      className={`
        flex-shrink-0 select-none
        ${isHorizontal ? 'w-1 cursor-col-resize' : 'h-1 cursor-row-resize'}
        ${isDragging ? 'opacity-100' : 'opacity-0 hover:opacity-50'}
        transition-opacity duration-150
      `}
      style={{ background: isDragging ? 'var(--color-accent)' : 'var(--color-border-hover)' }}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
    />
  )
}
