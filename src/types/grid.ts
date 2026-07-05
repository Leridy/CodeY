/**
 * Grid Layout Type Definitions
 *
 * Types for the Phase 3.1 configurable layout system.
 */

/** CSS Grid track definition */
export interface GridTrack {
  /** Current size (px or fr) */
  size: number
  /** Minimum size (px) */
  min: number
  /** Maximum size (px) */
  max: number
  /** Size unit */
  unit: 'px' | 'fr'
}

/** Grid area mapping for a panel */
export interface GridArea {
  /** Panel ID */
  panelId: string
  /** Start column (1-based) */
  columnStart: number
  /** End column (1-based) */
  columnEnd: number
  /** Start row (1-based) */
  rowStart: number
  /** End row (1-based) */
  rowEnd: number
}

/** CSS Grid state */
export interface GridState {
  /** Column track definitions */
  columns: GridTrack[]
  /** Row track definitions */
  rows: GridTrack[]
  /** Panel area mappings */
  areas: GridArea[]
}

/** Single panel state */
export interface PanelState {
  /** Whether the panel is visible */
  visible: boolean
  /** Whether the panel is collapsed */
  collapsed: boolean
  /** Panel position in the grid */
  position: GridArea
  /** Panel dimensions */
  size: { width: number; height: number }
}

/** Layout preset */
export interface LayoutPreset {
  /** Unique preset ID */
  id: string
  /** Display name */
  name: string
  /** Description */
  description?: string
  /** Whether this is a built-in preset */
  builtin: boolean
  /** Grid configuration */
  gridConfig: GridState
  /** Panel states for this preset */
  panelStates: Record<string, PanelState>
}

/** Drag operation state */
export interface DragState {
  /** Whether a drag is in progress */
  isDragging: boolean
  /** Type of drag operation */
  dragType: 'resize' | 'reorder' | null
  /** Target panel ID */
  targetPanelId: string | null
  /** Drag direction */
  direction: 'horizontal' | 'vertical' | null
  /** Starting position */
  startPos: { x: number; y: number }
  /** Current position */
  currentPos: { x: number; y: number }
}

/** Snap guide line */
export interface SnapGuide {
  /** Guide position (px) */
  position: number
  /** Guide direction */
  direction: 'horizontal' | 'vertical'
  /** Snap threshold (px) */
  threshold: number
}
