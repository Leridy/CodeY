/**
 * usePanelState Tests
 *
 * Validates reactive panel state access and operation callbacks
 * via the Zustand layout store.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePanelState } from '../usePanelState'
import { useLayoutStore } from '../../stores/layoutStore'
import { DEFAULT_PRESET } from '../../stores/presets'

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

describe('usePanelState', () => {
  beforeEach(() => {
    resetStore()
  })

  describe('initial state', () => {
    it('should return visible true for explorer panel', () => {
      const { result } = renderHook(() => usePanelState('explorer'))
      expect(result.current.visible).toBe(true)
    })

    it('should return collapsed false for explorer panel', () => {
      const { result } = renderHook(() => usePanelState('explorer'))
      expect(result.current.collapsed).toBe(false)
    })

    it('should return correct size for explorer panel', () => {
      const { result } = renderHook(() => usePanelState('explorer'))
      expect(result.current.size).toEqual({ width: 260, height: 600 })
    })
  })

  describe('non-existent panel', () => {
    it('should return visible false for unknown panel', () => {
      const { result } = renderHook(() => usePanelState('nonexistent'))
      expect(result.current.visible).toBe(false)
    })

    it('should return collapsed false for unknown panel', () => {
      const { result } = renderHook(() => usePanelState('nonexistent'))
      expect(result.current.collapsed).toBe(false)
    })

    it('should return zero size for unknown panel', () => {
      const { result } = renderHook(() => usePanelState('nonexistent'))
      expect(result.current.size).toEqual({ width: 0, height: 0 })
    })
  })

  describe('collapse/expand operations', () => {
    it('should collapse the panel', () => {
      const { result } = renderHook(() => usePanelState('explorer'))
      expect(result.current.collapsed).toBe(false)
      act(() => {
        result.current.collapse()
      })
      expect(result.current.collapsed).toBe(true)
    })

    it('should expand the panel', () => {
      const { result } = renderHook(() => usePanelState('explorer'))
      act(() => {
        result.current.collapse()
      })
      expect(result.current.collapsed).toBe(true)
      act(() => {
        result.current.expand()
      })
      expect(result.current.collapsed).toBe(false)
    })

    it('should toggle collapse', () => {
      const { result } = renderHook(() => usePanelState('explorer'))
      act(() => {
        result.current.toggleCollapse()
      })
      expect(result.current.collapsed).toBe(true)
      act(() => {
        result.current.toggleCollapse()
      })
      expect(result.current.collapsed).toBe(false)
    })
  })

  describe('visibility operations', () => {
    it('should hide the panel', () => {
      const { result } = renderHook(() => usePanelState('explorer'))
      expect(result.current.visible).toBe(true)
      act(() => {
        result.current.hide()
      })
      expect(result.current.visible).toBe(false)
    })

    it('should show the panel', () => {
      const { result } = renderHook(() => usePanelState('explorer'))
      act(() => {
        result.current.hide()
      })
      expect(result.current.visible).toBe(false)
      act(() => {
        result.current.show()
      })
      expect(result.current.visible).toBe(true)
    })
  })

  describe('multiple panels', () => {
    it('should manage content panel independently', () => {
      const { result: explorer } = renderHook(() =>
        usePanelState('explorer')
      )
      const { result: content } = renderHook(() => usePanelState('content'))

      act(() => {
        explorer.current.collapse()
      })

      expect(explorer.current.collapsed).toBe(true)
      expect(content.current.collapsed).toBe(false)
    })
  })
})
