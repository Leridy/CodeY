/**
 * PanelHeader Component
 *
 * Displays panel title with collapse/expand and close action buttons.
 */

import React from 'react'
import { motion } from 'framer-motion'

export interface PanelHeaderRenderProps {
  title: string
  icon: React.ReactNode
  collapsed: boolean
  onToggleCollapse: () => void
  onClose: () => void
}

export interface PanelHeaderProps {
  /** Panel title */
  title: string
  /** Panel icon */
  icon: React.ReactNode
  /** Whether the panel is collapsed */
  collapsed: boolean
  /** Whether the panel can be collapsed */
  collapsible: boolean
  /** Whether the panel can be closed */
  closable: boolean
  /** Toggle collapse callback */
  onToggleCollapse: () => void
  /** Close panel callback */
  onClose: () => void
  /** Custom action buttons */
  actions?: React.ReactNode
}

export function PanelHeader({
  title,
  icon,
  collapsed,
  collapsible,
  closable,
  onToggleCollapse,
  onClose,
  actions,
}: PanelHeaderProps) {
  return (
    <div
      className="flex items-center justify-between px-3 py-1.5 border-b select-none"
      style={{
        borderColor: 'var(--color-border)',
        background: 'var(--color-surface)',
        minHeight: 32,
      }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="flex-shrink-0">{icon}</span>
        <span
          className="text-xs font-semibold uppercase tracking-wider truncate"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {title}
        </span>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        {actions}

        {collapsible && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onToggleCollapse}
            className="p-1 rounded hover:opacity-80 transition-opacity"
            style={{ color: 'var(--color-text-secondary)' }}
            title={collapsed ? '展开面板' : '折叠面板'}
            aria-label={collapsed ? '展开面板' : '折叠面板'}
          >
            {collapsed ? (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M9 3l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </motion.button>
        )}

        {closable && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-1 rounded hover:opacity-80 transition-opacity"
            style={{ color: 'var(--color-text-secondary)' }}
            title="关闭面板"
            aria-label="关闭面板"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </motion.button>
        )}
      </div>
    </div>
  )
}
