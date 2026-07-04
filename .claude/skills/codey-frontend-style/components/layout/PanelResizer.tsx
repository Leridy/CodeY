/**
 * PanelResizer Component
 *
 * Draggable handle for resizing panels (sidebar width, terminal height).
 */

import React, { useCallback, useRef, useState } from 'react'

interface PanelResizerProps {
  /** Resize direction */
  direction: 'horizontal' | 'vertical'
  /** Current size in pixels */
  size: number
  /** Minimum allowed size */
  min: number
  /** Maximum allowed size */
  max: number
  /** Called on resize with new size */
  onResize: (newSize: number) => void
}

export function PanelResizer({
  direction,
  size,
  min,
  max,
  onResize,
}: PanelResizerProps) {
  const [dragging, setDragging] = useState(false)
  const startRef = useRef({ pos: 0, size: 0 })

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      setDragging(true)

      const startPos = direction === 'horizontal' ? e.clientX : e.clientY
      startRef.current = { pos: startPos, size }

      const handleMouseMove = (ev: MouseEvent) => {
        const currentPos = direction === 'horizontal' ? ev.clientX : ev.clientY
        const delta = currentPos - startRef.current.pos
        const newSize = Math.min(max, Math.max(min, startRef.current.size + delta))
        onResize(newSize)
      }

      const handleMouseUp = () => {
        setDragging(false)
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    },
    [direction, size, min, max, onResize]
  )

  const isHorizontal = direction === 'horizontal'

  return (
    <div
      role="separator"
      aria-orientation={isHorizontal ? 'vertical' : 'horizontal'}
      className={`
        flex-shrink-0 select-none
        ${isHorizontal ? 'w-1 cursor-col-resize' : 'h-1 cursor-row-resize'}
        ${dragging ? 'opacity-100' : 'opacity-0 hover:opacity-100'}
        transition-opacity
      `}
      style={{ background: 'var(--color-accent)' }}
      onMouseDown={handleMouseDown}
    />
  )
}
