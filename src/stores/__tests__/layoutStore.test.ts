/**
 * Layout Store Tests
 *
 * Tests Zustand store actions: grid config, panel operations,
 * preset management, and drag state transitions.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { useLayoutStore } from '../layoutStore'
import { DEFAULT_PRESET, FOCUS_PRESET, WIDE_PRESET } from '../presets'

/** Reset store to initial state before each test */
function resetStore() {
  useLayoutStore.setState({
    gridConfig: DEFAULT_PRESET.gridConfig,
    panelStates: DEFAULT_PRESET.panelStates,
    activePresetId: DEFAULT_PRESET.id,
    customPresets: [],
    dragState: {
      isDragging: false,
      dragType: null,
      targetPanelId: null,
      direction: null,
      startPos: { x: 0, y: 0 },
      currentPos: { x: 0, y: 0 },
    },
  })
}

describe('layoutStore', () => {
  beforeEach(() => {
    resetStore()
  })

  describe('initial state', () => {
    it('should initialize with default preset config', () => {
      const state = useLayoutStore.getState()
      expect(state.activePresetId).toBe('default')
      expect(state.gridConfig).toEqual(DEFAULT_PRESET.gridConfig)
      expect(state.panelStates).toEqual(DEFAULT_PRESET.panelStates)
    })

    it('should have empty custom presets', () => {
      const state = useLayoutStore.getState()
      expect(state.customPresets).toEqual([])
    })

    it('should have initial drag state', () => {
      const state = useLayoutStore.getState()
      expect(state.dragState.isDragging).toBe(false)
      expect(state.dragState.dragType).toBeNull()
      expect(state.dragState.targetPanelId).toBeNull()
    })
  })

  describe('updateGridConfig', () => {
    it('should merge partial grid config', () => {
      const { updateGridConfig } = useLayoutStore.getState()
      updateGridConfig({
        columns: [
          { size: 300, min: 200, max: 500, unit: 'px' },
          { size: 1, min: 0.3, max: 0.7, unit: 'fr' },
          { size: 320, min: 240, max: 480, unit: 'px' },
        ],
      })
      const state = useLayoutStore.getState()
      expect(state.gridConfig.columns[0].size).toBe(300)
      // Rows should remain unchanged
      expect(state.gridConfig.rows).toEqual(DEFAULT_PRESET.gridConfig.rows)
    })
  })

  describe('panel collapse/expand', () => {
    it('should collapse a panel', () => {
      const { collapsePanel } = useLayoutStore.getState()
      collapsePanel('explorer')
      expect(useLayoutStore.getState().panelStates.explorer.collapsed).toBe(true)
    })

    it('should expand a collapsed panel', () => {
      const { collapsePanel, expandPanel } = useLayoutStore.getState()
      collapsePanel('explorer')
      expect(useLayoutStore.getState().panelStates.explorer.collapsed).toBe(true)
      expandPanel('explorer')
      expect(useLayoutStore.getState().panelStates.explorer.collapsed).toBe(false)
    })

    it('should toggle panel collapse state', () => {
      const { togglePanelCollapse } = useLayoutStore.getState()
      expect(useLayoutStore.getState().panelStates.explorer.collapsed).toBe(false)
      togglePanelCollapse('explorer')
      expect(useLayoutStore.getState().panelStates.explorer.collapsed).toBe(true)
      togglePanelCollapse('explorer')
      expect(useLayoutStore.getState().panelStates.explorer.collapsed).toBe(false)
    })

    it('should not crash when collapsing non-existent panel', () => {
      const { collapsePanel } = useLayoutStore.getState()
      collapsePanel('nonexistent')
      expect(useLayoutStore.getState().panelStates).toEqual(
        DEFAULT_PRESET.panelStates
      )
    })

    it('should not crash when expanding non-existent panel', () => {
      const { expandPanel } = useLayoutStore.getState()
      expandPanel('nonexistent')
      expect(useLayoutStore.getState().panelStates).toEqual(
        DEFAULT_PRESET.panelStates
      )
    })

    it('should not crash when toggling non-existent panel', () => {
      const { togglePanelCollapse } = useLayoutStore.getState()
      togglePanelCollapse('nonexistent')
      expect(useLayoutStore.getState().panelStates).toEqual(
        DEFAULT_PRESET.panelStates
      )
    })
  })

  describe('panel visibility', () => {
    it('should show a panel', () => {
      const { hidePanel, showPanel } = useLayoutStore.getState()
      hidePanel('explorer')
      expect(useLayoutStore.getState().panelStates.explorer.visible).toBe(false)
      showPanel('explorer')
      expect(useLayoutStore.getState().panelStates.explorer.visible).toBe(true)
    })

    it('should hide a panel', () => {
      const { hidePanel } = useLayoutStore.getState()
      hidePanel('content')
      expect(useLayoutStore.getState().panelStates.content.visible).toBe(false)
    })

    it('should toggle panel visibility', () => {
      const { togglePanelVisibility } = useLayoutStore.getState()
      expect(useLayoutStore.getState().panelStates.content.visible).toBe(true)
      togglePanelVisibility('content')
      expect(useLayoutStore.getState().panelStates.content.visible).toBe(false)
      togglePanelVisibility('content')
      expect(useLayoutStore.getState().panelStates.content.visible).toBe(true)
    })

    it('should not crash when showing non-existent panel', () => {
      const { showPanel } = useLayoutStore.getState()
      showPanel('nonexistent')
      expect(useLayoutStore.getState().panelStates).toEqual(
        DEFAULT_PRESET.panelStates
      )
    })

    it('should not crash when hiding non-existent panel', () => {
      const { hidePanel } = useLayoutStore.getState()
      hidePanel('nonexistent')
      expect(useLayoutStore.getState().panelStates).toEqual(
        DEFAULT_PRESET.panelStates
      )
    })

    it('should not crash when toggling visibility of non-existent panel', () => {
      const { togglePanelVisibility } = useLayoutStore.getState()
      togglePanelVisibility('nonexistent')
      expect(useLayoutStore.getState().panelStates).toEqual(
        DEFAULT_PRESET.panelStates
      )
    })
  })

  describe('resizePanel', () => {
    it('should resize width when drag direction is horizontal', () => {
      const { startDrag, resizePanel } = useLayoutStore.getState()
      startDrag('explorer', 'resize', 'horizontal')
      resizePanel('explorer', 350)
      expect(useLayoutStore.getState().panelStates.explorer.size.width).toBe(350)
      expect(useLayoutStore.getState().panelStates.explorer.size.height).toBe(
        DEFAULT_PRESET.panelStates.explorer.size.height
      )
    })

    it('should resize height when drag direction is vertical', () => {
      const { startDrag, resizePanel } = useLayoutStore.getState()
      startDrag('terminal', 'resize', 'vertical')
      resizePanel('terminal', 300)
      expect(useLayoutStore.getState().panelStates.terminal.size.height).toBe(300)
      expect(useLayoutStore.getState().panelStates.terminal.size.width).toBe(
        DEFAULT_PRESET.panelStates.terminal.size.width
      )
    })

    it('should not crash when resizing non-existent panel', () => {
      const { resizePanel } = useLayoutStore.getState()
      resizePanel('nonexistent', 100)
      expect(useLayoutStore.getState().panelStates).toEqual(
        DEFAULT_PRESET.panelStates
      )
    })
  })

  describe('preset management', () => {
    it('should apply a built-in preset', () => {
      const { applyPreset } = useLayoutStore.getState()
      applyPreset('focus')
      const state = useLayoutStore.getState()
      expect(state.activePresetId).toBe('focus')
      expect(state.gridConfig).toEqual(FOCUS_PRESET.gridConfig)
      expect(state.panelStates).toEqual(FOCUS_PRESET.panelStates)
    })

    it('should apply wide preset', () => {
      const { applyPreset } = useLayoutStore.getState()
      applyPreset('wide')
      const state = useLayoutStore.getState()
      expect(state.activePresetId).toBe('wide')
      expect(state.gridConfig).toEqual(WIDE_PRESET.gridConfig)
    })

    it('should not change state for non-existent preset', () => {
      const { applyPreset } = useLayoutStore.getState()
      applyPreset('nonexistent')
      expect(useLayoutStore.getState().activePresetId).toBe('default')
    })

    it('should save current layout as custom preset', () => {
      const { saveAsPreset } = useLayoutStore.getState()
      saveAsPreset('My Layout')
      const state = useLayoutStore.getState()
      expect(state.customPresets).toHaveLength(1)
      expect(state.customPresets[0].name).toBe('My Layout')
      expect(state.customPresets[0].builtin).toBe(false)
      expect(state.customPresets[0].id).toMatch(/^custom-/)
      expect(state.activePresetId).toBe(state.customPresets[0].id)
    })

    it('should save gridConfig and panelStates into custom preset', () => {
      const { saveAsPreset } = useLayoutStore.getState()
      saveAsPreset('Snapshot')
      const state = useLayoutStore.getState()
      const preset = state.customPresets[0]
      expect(preset.gridConfig).toEqual(DEFAULT_PRESET.gridConfig)
      expect(preset.panelStates).toEqual(DEFAULT_PRESET.panelStates)
    })

    it('should delete a custom preset', () => {
      const { saveAsPreset, deletePreset } = useLayoutStore.getState()
      saveAsPreset('To Delete')
      const customId = useLayoutStore.getState().customPresets[0].id
      deletePreset(customId)
      expect(useLayoutStore.getState().customPresets).toHaveLength(0)
    })

    it('should reset activePresetId to default when deleting active custom preset', () => {
      const { saveAsPreset, deletePreset } = useLayoutStore.getState()
      saveAsPreset('Active Custom')
      const customId = useLayoutStore.getState().customPresets[0].id
      expect(useLayoutStore.getState().activePresetId).toBe(customId)
      deletePreset(customId)
      expect(useLayoutStore.getState().activePresetId).toBe('default')
    })

    it('should keep activePresetId when deleting non-active custom preset', () => {
      const { saveAsPreset, applyPreset, deletePreset } =
        useLayoutStore.getState()
      saveAsPreset('First')
      const firstId = useLayoutStore.getState().customPresets[0].id
      saveAsPreset('Second')
      applyPreset('wide')
      deletePreset(firstId)
      expect(useLayoutStore.getState().activePresetId).toBe('wide')
    })

    it('should not delete built-in presets', () => {
      const { deletePreset } = useLayoutStore.getState()
      deletePreset('default')
      expect(useLayoutStore.getState().activePresetId).toBe('default')
      expect(useLayoutStore.getState().customPresets).toEqual([])
    })

    it('should apply custom preset after saving', () => {
      const { saveAsPreset, applyPreset } = useLayoutStore.getState()
      saveAsPreset('Custom One')
      const customId = useLayoutStore.getState().customPresets[0].id
      applyPreset('focus')
      expect(useLayoutStore.getState().activePresetId).toBe('focus')
      applyPreset(customId)
      expect(useLayoutStore.getState().activePresetId).toBe(customId)
    })

    it('should reset layout to default preset', () => {
      const { applyPreset, resetLayout } = useLayoutStore.getState()
      applyPreset('focus')
      expect(useLayoutStore.getState().activePresetId).toBe('focus')
      resetLayout()
      const state = useLayoutStore.getState()
      expect(state.activePresetId).toBe('default')
      expect(state.gridConfig).toEqual(DEFAULT_PRESET.gridConfig)
      expect(state.panelStates).toEqual(DEFAULT_PRESET.panelStates)
    })
  })

  describe('drag state', () => {
    it('should start drag operation', () => {
      const { startDrag } = useLayoutStore.getState()
      startDrag('explorer', 'resize', 'horizontal')
      const { dragState } = useLayoutStore.getState()
      expect(dragState.isDragging).toBe(true)
      expect(dragState.dragType).toBe('resize')
      expect(dragState.targetPanelId).toBe('explorer')
      expect(dragState.direction).toBe('horizontal')
    })

    it('should update drag position', () => {
      const { startDrag, updateDrag } = useLayoutStore.getState()
      startDrag('content', 'resize', 'vertical')
      updateDrag({ x: 100, y: 200 })
      expect(useLayoutStore.getState().dragState.currentPos).toEqual({
        x: 100,
        y: 200,
      })
    })

    it('should end drag and reset to initial state', () => {
      const { startDrag, endDrag } = useLayoutStore.getState()
      startDrag('terminal', 'resize', 'vertical')
      expect(useLayoutStore.getState().dragState.isDragging).toBe(true)
      endDrag()
      const { dragState } = useLayoutStore.getState()
      expect(dragState.isDragging).toBe(false)
      expect(dragState.dragType).toBeNull()
      expect(dragState.targetPanelId).toBeNull()
    })

    it('should support reorder drag type', () => {
      const { startDrag } = useLayoutStore.getState()
      startDrag('content', 'reorder', 'horizontal')
      expect(useLayoutStore.getState().dragState.dragType).toBe('reorder')
    })
  })

  describe('state immutability', () => {
    it('should not mutate previous state on collapsePanel', () => {
      const prevStates = useLayoutStore.getState().panelStates
      const { collapsePanel } = useLayoutStore.getState()
      collapsePanel('explorer')
      expect(prevStates.explorer.collapsed).toBe(false)
      expect(useLayoutStore.getState().panelStates.explorer.collapsed).toBe(true)
    })

    it('should not mutate previous state on hidePanel', () => {
      const prevStates = useLayoutStore.getState().panelStates
      const { hidePanel } = useLayoutStore.getState()
      hidePanel('content')
      expect(prevStates.content.visible).toBe(true)
      expect(useLayoutStore.getState().panelStates.content.visible).toBe(false)
    })
  })
})
