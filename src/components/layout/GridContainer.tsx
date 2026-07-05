/**
 * GridContainer Component
 *
 * Top-level CSS Grid container that manages the configurable layout.
 * Renders panels in a grid with responsive breakpoints and preset support.
 */

import React, { useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useGridLayout } from '../../hooks/useGridLayout'
import { useLayoutStore } from '../../stores/layoutStore'
import { useLayoutMode } from '../../hooks/useLayoutMode'
import type { GridState } from '../../types/grid'
import type { LayoutMode } from '../../types/layout'

export interface GridContainerProps {
  /** Grid configuration */
  gridConfig: GridState
  /** Child panels */
  children: React.ReactNode
  /** Layout change callback */
  onLayoutChange?: (config: GridState) => void
  /** Custom class name */
  className?: string
}

function getResponsiveGridConfig(
  gridConfig: GridState,
  mode: LayoutMode
): GridState {
  if (mode === 'mobile') {
    // Mobile: single column, full width
    return {
      columns: [{ size: 1, min: 1, max: 1, unit: 'fr' }],
      rows: [{ size: 1, min: 1, max: 1, unit: 'fr' }],
      areas: [
        { panelId: 'content', columnStart: 1, columnEnd: 2, rowStart: 1, rowEnd: 2 },
      ],
    }
  }

  if (mode === 'tablet') {
    // Tablet: collapse sidebar to icon bar, hide details
    return {
      columns: [
        { size: 48, min: 48, max: 48, unit: 'px' },
        { size: 1, min: 0.5, max: 1, unit: 'fr' },
      ],
      rows: [
        { size: 1, min: 0.5, max: 0.8, unit: 'fr' },
        { size: 240, min: 120, max: 480, unit: 'px' },
      ],
      areas: [
        { panelId: 'explorer', columnStart: 1, columnEnd: 2, rowStart: 1, rowEnd: 2 },
        { panelId: 'content', columnStart: 2, columnEnd: 3, rowStart: 1, rowEnd: 2 },
        { panelId: 'terminal', columnStart: 1, columnEnd: 3, rowStart: 2, rowEnd: 3 },
      ],
    }
  }

  // Desktop: use full grid config
  return gridConfig
}

export function GridContainer({
  gridConfig,
  children,
  className,
}: GridContainerProps) {
  const mode = useLayoutMode()
  const responsiveConfig = getResponsiveGridConfig(gridConfig, mode)
  const { gridStyle, getPanelArea } = useGridLayout(responsiveConfig)
  const panelStates = useLayoutStore((s) => s.panelStates)

  const renderChildren = useCallback(() => {
    return React.Children.map(children, (child) => {
      if (!React.isValidElement(child)) return child

      const panelId = (child.props as Record<string, unknown>).panelId as
        | string
        | undefined
      if (!panelId) return child

      const panelState = panelStates[panelId]
      if (!panelState?.visible) return null

      const area = getPanelArea(panelId)
      return (
        <div
          key={panelId}
          style={{
            gridArea: area || undefined,
            overflow: 'hidden',
          }}
        >
          {child}
        </div>
      )
    })
  }, [children, panelStates, getPanelArea])

  return (
    <div
      className={`h-full w-full overflow-hidden ${className ?? ''}`}
      style={{
        ...gridStyle,
        background: 'var(--color-bg)',
      }}
    >
      <AnimatePresence mode="popLayout">
        {renderChildren()}
      </AnimatePresence>
    </div>
  )
}
