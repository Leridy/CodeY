/**
 * useLayoutPreset Tests
 *
 * Validates preset listing, application, saving, deletion, and reset.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLayoutPreset } from '../useLayoutPreset'
import { useLayoutStore } from '../../stores/layoutStore'
import { DEFAULT_PRESET, BUILTIN_PRESETS } from '../../stores/presets'

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

describe('useLayoutPreset', () => {
  beforeEach(() => {
    resetStore()
  })

  describe('presets list', () => {
    it('should include built-in presets by default', () => {
      const { result } = renderHook(() => useLayoutPreset())
      expect(result.current.presets).toHaveLength(BUILTIN_PRESETS.length)
    })

    it('should include custom presets when added', () => {
      const { result } = renderHook(() => useLayoutPreset())
      act(() => {
        result.current.save('Custom Layout')
      })
      expect(result.current.presets).toHaveLength(BUILTIN_PRESETS.length + 1)
    })
  })

  describe('activePresetId', () => {
    it('should start with default preset id', () => {
      const { result } = renderHook(() => useLayoutPreset())
      expect(result.current.activePresetId).toBe('default')
    })

    it('should update when preset is applied', () => {
      const { result } = renderHook(() => useLayoutPreset())
      act(() => {
        result.current.apply('focus')
      })
      expect(result.current.activePresetId).toBe('focus')
    })
  })

  describe('apply', () => {
    it('should switch to focus preset', () => {
      const { result } = renderHook(() => useLayoutPreset())
      act(() => {
        result.current.apply('focus')
      })
      expect(result.current.activePresetId).toBe('focus')
    })

    it('should switch to wide preset', () => {
      const { result } = renderHook(() => useLayoutPreset())
      act(() => {
        result.current.apply('wide')
      })
      expect(result.current.activePresetId).toBe('wide')
    })

    it('should not crash for non-existent preset', () => {
      const { result } = renderHook(() => useLayoutPreset())
      act(() => {
        result.current.apply('nonexistent')
      })
      expect(result.current.activePresetId).toBe('default')
    })
  })

  describe('save', () => {
    it('should save a custom preset', () => {
      const { result } = renderHook(() => useLayoutPreset())
      act(() => {
        result.current.save('My Preset')
      })
      const customPresets = result.current.presets.filter((p) => !p.builtin)
      expect(customPresets).toHaveLength(1)
      expect(customPresets[0].name).toBe('My Preset')
    })

    it('should set activePresetId to the new custom preset', () => {
      const { result } = renderHook(() => useLayoutPreset())
      act(() => {
        result.current.save('Active Custom')
      })
      expect(result.current.activePresetId).toMatch(/^custom-/)
    })
  })

  describe('remove', () => {
    it('should delete a custom preset', () => {
      const { result } = renderHook(() => useLayoutPreset())
      act(() => {
        result.current.save('To Delete')
      })
      const customId = result.current.presets.find((p) => !p.builtin)?.id
      expect(customId).toBeDefined()
      act(() => {
        result.current.remove(customId!)
      })
      expect(result.current.presets.filter((p) => !p.builtin)).toHaveLength(0)
    })

    it('should not delete built-in presets', () => {
      const { result } = renderHook(() => useLayoutPreset())
      act(() => {
        result.current.remove('default')
      })
      expect(result.current.presets).toHaveLength(BUILTIN_PRESETS.length)
    })
  })

  describe('reset', () => {
    it('should reset to default preset', () => {
      const { result } = renderHook(() => useLayoutPreset())
      act(() => {
        result.current.apply('focus')
      })
      expect(result.current.activePresetId).toBe('focus')
      act(() => {
        result.current.reset()
      })
      expect(result.current.activePresetId).toBe('default')
    })
  })
})
