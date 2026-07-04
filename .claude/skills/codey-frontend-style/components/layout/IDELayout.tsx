/**
 * IDELayout Component
 *
 * Top-level layout container managing the four-panel IDE arrangement.
 * Handles responsive switching between desktop, tablet, and mobile modes.
 */

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLayoutMode } from '../../hooks/useLayoutMode'
import { usePanelVisibility } from '../../hooks/usePanelVisibility'
import { DEFAULT_PANEL_CONFIG } from '../../types/layout'
import type { PanelConfig } from '../../types/layout'

// --- Animation constants ---

export const ANIMATION = {
  /** Message enter: fade in + slide up */
  messageEnter: {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, ease: 'easeOut' },
  },

  /** Tool card expand: height animation */
  toolCardExpand: {
    transition: { duration: 0.2, ease: 'easeInOut' },
    layout: true,
  },

  /** Panel switch: fade + slide */
  panelSwitch: {
    initial: { opacity: 0, x: 8 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -8 },
    transition: { duration: 0.2, ease: 'easeInOut' },
  },

  /** Typewriter effect */
  typewriter: {
    /** Per-character delay in seconds */
    charDelay: 0.05,
  },

  /** Panel collapse */
  panelCollapse: {
    transition: { duration: 0.25, ease: 'easeInOut' },
    layout: true,
  },
} as const

// --- Props ---

interface IDELayoutProps {
  /** Current responsive mode (auto-detected if omitted) */
  mode?: 'desktop' | 'tablet' | 'mobile'
  /** Explorer panel content */
  explorer: React.ReactNode
  /** Main content area */
  content: React.ReactNode
  /** Details panel content */
  details?: React.ReactNode
  /** Terminal panel content */
  terminal?: React.ReactNode
  /** Panel config overrides */
  panelConfig?: Partial<PanelConfig>
}

// --- Component ---

export function IDELayout({
  mode: modeProp,
  explorer,
  content,
  details,
  terminal,
  panelConfig: panelConfigOverrides,
}: IDELayoutProps) {
  const autoMode = useLayoutMode()
  const mode = modeProp ?? autoMode
  const visibility = usePanelVisibility(mode)
  const config = { ...DEFAULT_PANEL_CONFIG, ...panelConfigOverrides }

  return (
    <div
      className="flex h-screen w-screen overflow-hidden"
      style={{ background: 'var(--color-bg)' }}
    >
      {/* Explorer / Sidebar */}
      {visibility.explorer.visible && visibility.explorer.mode === 'sidebar' && (
        <aside
          className="flex-shrink-0 border-r overflow-y-auto"
          style={{
            width: config.explorerWidth.default,
            borderColor: 'var(--color-border)',
            background: 'var(--color-surface)',
          }}
        >
          {explorer}
        </aside>
      )}

      {/* Main content + details */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main content area */}
        <main className="flex-1 overflow-hidden">{content}</main>

        {/* Details panel (desktop only) */}
        {visibility.details.visible && visibility.details.mode === 'panel' && details && (
          <aside
            className="flex-shrink-0 border-l overflow-y-auto"
            style={{
              width: config.detailsWidth.default,
              borderColor: 'var(--color-border)',
              background: 'var(--color-surface)',
            }}
          >
            {details}
          </aside>
        )}
      </div>

      {/* Terminal panel */}
      {visibility.terminal.visible && visibility.terminal.mode === 'panel' && terminal && (
        <div
          className="border-t overflow-y-auto"
          style={{
            height: config.terminalHeight.default,
            borderColor: 'var(--color-border)',
            background: 'var(--color-surface)',
          }}
        >
          {terminal}
        </div>
      )}

      {/* Floating details (tablet) */}
      <AnimatePresence>
        {visibility.details.visible && visibility.details.mode === 'floating' && details && (
          <motion.div
            className="absolute right-0 top-0 bottom-0 z-20 shadow-xl border-l"
            style={{
              width: config.detailsWidth.default,
              borderColor: 'var(--color-border)',
              background: 'var(--color-surface)',
            }}
            initial={{ x: config.detailsWidth.default }}
            animate={{ x: 0 }}
            exit={{ x: config.detailsWidth.default }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            {details}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
