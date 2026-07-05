/**
 * Layout Type Definitions
 *
 * Types for the IDE-style layout system (copied from skill reference).
 */

export interface PanelConfig {
  /** Explorer sidebar width */
  explorerWidth: { min: number; default: number; max: number }
  /** Details panel width */
  detailsWidth: { min: number; default: number; max: number }
  /** Terminal panel height */
  terminalHeight: { min: number; default: number; max: number }
  /** Whether panels can be collapsed */
  collapsible: boolean
}

export const DEFAULT_PANEL_CONFIG: PanelConfig = {
  explorerWidth: { min: 200, default: 260, max: 400 },
  detailsWidth: { min: 240, default: 320, max: 480 },
  terminalHeight: { min: 120, default: 240, max: 480 },
  collapsible: true,
}

export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1280,
  desktop: 1280,
} as const

export type LayoutMode = 'desktop' | 'tablet' | 'mobile'

export type ContentMode = 'chat' | 'editor' | 'split'

export interface ContentPanelState {
  mode: ContentMode
  /** Chat-to-Editor ratio in split mode (0.0 - 1.0, default 0.5) */
  splitRatio: number
}

export interface FileNode {
  name: string
  path: string
  type: 'file' | 'directory'
  children?: FileNode[]
  /** Whether the file has unsaved changes */
  modified?: boolean
}

export interface PanelVisibility {
  explorer: { visible: boolean; mode: 'sidebar' | 'icon' | 'drawer' }
  details: { visible: boolean; mode: 'panel' | 'floating' | 'drawer' }
  terminal: { visible: boolean; mode: 'panel' | 'drawer' }
}
