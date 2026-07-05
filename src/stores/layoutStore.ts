/**
 * Layout Store
 *
 * Zustand store managing grid configuration, panel states,
 * drag operations, and layout presets with localStorage persistence.
 */

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

import type { GridState, PanelState, LayoutPreset, DragState } from '../types/grid'
import { DEFAULT_PRESET, BUILTIN_PRESETS } from './presets'

/** Persisted layout data */
interface LayoutPersistData {
  version: number
  gridConfig: GridState
  panelStates: Record<string, PanelState>
  activePresetId: string | null
  customPresets: LayoutPreset[]
}

/** Layout store state and actions */
export interface LayoutStore {
  // --- State ---
  gridConfig: GridState
  panelStates: Record<string, PanelState>
  activePresetId: string | null
  customPresets: LayoutPreset[]
  dragState: DragState

  // --- Grid actions ---
  updateGridConfig: (config: Partial<GridState>) => void

  // --- Panel actions ---
  resizePanel: (panelId: string, size: number) => void
  collapsePanel: (panelId: string) => void
  expandPanel: (panelId: string) => void
  togglePanelCollapse: (panelId: string) => void
  showPanel: (panelId: string) => void
  hidePanel: (panelId: string) => void
  togglePanelVisibility: (panelId: string) => void

  // --- Preset actions ---
  applyPreset: (presetId: string) => void
  saveAsPreset: (name: string) => void
  deletePreset: (presetId: string) => void
  resetLayout: () => void

  // --- Drag actions ---
  startDrag: (
    panelId: string,
    dragType: DragState['dragType'],
    direction: DragState['direction']
  ) => void
  updateDrag: (pos: { x: number; y: number }) => void
  endDrag: () => void
}

const INITIAL_DRAG_STATE: DragState = {
  isDragging: false,
  dragType: null,
  targetPanelId: null,
  direction: null,
  startPos: { x: 0, y: 0 },
  currentPos: { x: 0, y: 0 },
}

export const useLayoutStore = create<LayoutStore>()(
  devtools(
    persist(
      (set, get) => ({
        // --- Initial state from default preset ---
        gridConfig: DEFAULT_PRESET.gridConfig,
        panelStates: DEFAULT_PRESET.panelStates,
        activePresetId: DEFAULT_PRESET.id,
        customPresets: [],
        dragState: INITIAL_DRAG_STATE,

        // --- Grid actions ---
        updateGridConfig: (config) =>
          set((state) => ({
            gridConfig: {
              ...state.gridConfig,
              ...config,
              columns: config.columns ?? state.gridConfig.columns,
              rows: config.rows ?? state.gridConfig.rows,
              areas: config.areas ?? state.gridConfig.areas,
            },
          })),

        // --- Panel actions ---
        resizePanel: (panelId, size) =>
          set((state) => {
            const panel = state.panelStates[panelId]
            if (!panel) return state

            const isHorizontal = state.dragState.direction === 'horizontal'
            return {
              panelStates: {
                ...state.panelStates,
                [panelId]: {
                  ...panel,
                  size: {
                    width: isHorizontal ? size : panel.size.width,
                    height: !isHorizontal ? size : panel.size.height,
                  },
                },
              },
            }
          }),

        collapsePanel: (panelId) =>
          set((state) => {
            const panel = state.panelStates[panelId]
            if (!panel) return state
            return {
              panelStates: {
                ...state.panelStates,
                [panelId]: { ...panel, collapsed: true },
              },
            }
          }),

        expandPanel: (panelId) =>
          set((state) => {
            const panel = state.panelStates[panelId]
            if (!panel) return state
            return {
              panelStates: {
                ...state.panelStates,
                [panelId]: { ...panel, collapsed: false },
              },
            }
          }),

        togglePanelCollapse: (panelId) =>
          set((state) => {
            const panel = state.panelStates[panelId]
            if (!panel) return state
            return {
              panelStates: {
                ...state.panelStates,
                [panelId]: { ...panel, collapsed: !panel.collapsed },
              },
            }
          }),

        showPanel: (panelId) =>
          set((state) => {
            const panel = state.panelStates[panelId]
            if (!panel) return state
            return {
              panelStates: {
                ...state.panelStates,
                [panelId]: { ...panel, visible: true },
              },
            }
          }),

        hidePanel: (panelId) =>
          set((state) => {
            const panel = state.panelStates[panelId]
            if (!panel) return state
            return {
              panelStates: {
                ...state.panelStates,
                [panelId]: { ...panel, visible: false },
              },
            }
          }),

        togglePanelVisibility: (panelId) =>
          set((state) => {
            const panel = state.panelStates[panelId]
            if (!panel) return state
            return {
              panelStates: {
                ...state.panelStates,
                [panelId]: { ...panel, visible: !panel.visible },
              },
            }
          }),

        // --- Preset actions ---
        applyPreset: (presetId) => {
          const allPresets = [...BUILTIN_PRESETS, ...get().customPresets]
          const preset = allPresets.find((p) => p.id === presetId)
          if (!preset) return

          set({
            gridConfig: preset.gridConfig,
            panelStates: preset.panelStates,
            activePresetId: preset.id,
          })
        },

        saveAsPreset: (name) => {
          const state = get()
          const newPreset: LayoutPreset = {
            id: `custom-${Date.now()}`,
            name,
            builtin: false,
            gridConfig: state.gridConfig,
            panelStates: state.panelStates,
          }
          set((prev) => ({
            customPresets: [...prev.customPresets, newPreset],
            activePresetId: newPreset.id,
          }))
        },

        deletePreset: (presetId) => {
          const state = get()
          // Cannot delete built-in presets
          if (BUILTIN_PRESETS.some((p) => p.id === presetId)) return

          const newCustomPresets = state.customPresets.filter(
            (p) => p.id !== presetId
          )
          set({
            customPresets: newCustomPresets,
            activePresetId:
              state.activePresetId === presetId
                ? DEFAULT_PRESET.id
                : state.activePresetId,
          })
        },

        resetLayout: () =>
          set({
            gridConfig: DEFAULT_PRESET.gridConfig,
            panelStates: DEFAULT_PRESET.panelStates,
            activePresetId: DEFAULT_PRESET.id,
          }),

        // --- Drag actions ---
        startDrag: (panelId, dragType, direction) =>
          set({
            dragState: {
              isDragging: true,
              dragType,
              targetPanelId: panelId,
              direction,
              startPos: { x: 0, y: 0 },
              currentPos: { x: 0, y: 0 },
            },
          }),

        updateDrag: (pos) =>
          set((state) => ({
            dragState: { ...state.dragState, currentPos: pos },
          })),

        endDrag: () => set({ dragState: INITIAL_DRAG_STATE }),
      }),
      {
        name: 'codey-layout-config',
        partialize: (state): LayoutPersistData => ({
          version: 1,
          gridConfig: state.gridConfig,
          panelStates: state.panelStates,
          activePresetId: state.activePresetId,
          customPresets: state.customPresets,
        }),
      }
    )
  )
)
