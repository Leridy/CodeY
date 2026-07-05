/**
 * PanelSlot Component
 *
 * Panel container that renders header, content, and resize handles.
 * Manages collapse/expand and close behavior via the layout store.
 */

import React, { useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PanelHeader } from './PanelHeader'
import { ResizeHandle } from './ResizeHandle'
import { usePanelState } from '../../hooks/usePanelState'
import { useLayoutStore } from '../../stores/layoutStore'
import type { PanelHeaderRenderProps } from './PanelHeader'

export interface PanelSlotProps {
  /** Unique panel ID */
  panelId: string
  /** Panel title */
  title: string
  /** Panel icon */
  icon: React.ReactNode
  /** Panel content */
  children: React.ReactNode
  /** Whether the panel can be collapsed (default: true) */
  collapsible?: boolean
  /** Whether the panel can be closed (default: true) */
  closable?: boolean
  /** Whether collapsed by default (default: false) */
  defaultCollapsed?: boolean
  /** Minimum width (px, default: 200) */
  minWidth?: number
  /** Minimum height (px, default: 120) */
  minHeight?: number
  /** Width when collapsed (px, default: 48) */
  collapsedWidth?: number
  /** Collapse callback */
  onCollapse?: () => void
  /** Expand callback */
  onExpand?: () => void
  /** Close callback */
  onClose?: () => void
  /** Custom header renderer */
  renderHeader?: (props: PanelHeaderRenderProps) => React.ReactNode
}

export function PanelSlot({
  panelId,
  title,
  icon,
  children,
  collapsible = true,
  closable = true,
  minWidth = 200,
  minHeight = 120,
  collapsedWidth = 48,
  onCollapse,
  onExpand,
  onClose,
  renderHeader,
}: PanelSlotProps) {
  const { visible, collapsed, size } = usePanelState(panelId)
  const togglePanelCollapse = useLayoutStore((s) => s.togglePanelCollapse)
  const hidePanel = useLayoutStore((s) => s.hidePanel)

  const handleToggleCollapse = useCallback(() => {
    togglePanelCollapse(panelId)
    if (collapsed) {
      onExpand?.()
    } else {
      onCollapse?.()
    }
  }, [panelId, collapsed, togglePanelCollapse, onCollapse, onExpand])

  const handleClose = useCallback(() => {
    hidePanel(panelId)
    onClose?.()
  }, [panelId, hidePanel, onClose])

  const handleResize = useCallback(
    (newSize: number) => {
      // Resize is handled by the ResizeHandle via the store
      // Store the newSize for potential future use
      void newSize
    },
    []
  )

  if (!visible) {
    return null
  }

  const headerProps: PanelHeaderRenderProps = {
    title,
    icon,
    collapsed,
    onToggleCollapse: handleToggleCollapse,
    onClose: handleClose,
  }

  return (
    <div
      className="flex flex-col overflow-hidden border"
      style={{
        borderColor: 'var(--color-border)',
        background: 'var(--color-surface)',
        minWidth: collapsed ? collapsedWidth : minWidth,
        minHeight: collapsed ? undefined : minHeight,
        width: collapsed ? collapsedWidth : undefined,
      }}
      data-panel-id={panelId}
    >
      {/* Header */}
      {renderHeader ? (
        renderHeader(headerProps)
      ) : (
        <PanelHeader
          title={title}
          icon={icon}
          collapsed={collapsed}
          collapsible={collapsible}
          closable={closable}
          onToggleCollapse={handleToggleCollapse}
          onClose={handleClose}
        />
      )}

      {/* Content area with collapse animation */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            key="content"
            className="flex-1 overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <div className="h-full overflow-auto">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resize handle (right edge for horizontal) */}
      {!collapsed && (
        <ResizeHandle
          direction="horizontal"
          panelId={panelId}
          size={size.width}
          min={minWidth}
          max={800}
          onResize={handleResize}
        />
      )}
    </div>
  )
}
