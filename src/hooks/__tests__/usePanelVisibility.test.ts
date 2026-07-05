/**
 * usePanelVisibility Tests
 *
 * Validates panel visibility and display mode derivation from layout mode.
 */

import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { usePanelVisibility } from '../usePanelVisibility'

describe('usePanelVisibility', () => {
  describe('desktop mode', () => {
    it('should show explorer as sidebar', () => {
      const { result } = renderHook(() => usePanelVisibility('desktop'))
      expect(result.current.explorer).toEqual({
        visible: true,
        mode: 'sidebar',
      })
    })

    it('should show details as panel', () => {
      const { result } = renderHook(() => usePanelVisibility('desktop'))
      expect(result.current.details).toEqual({
        visible: true,
        mode: 'panel',
      })
    })

    it('should show terminal as panel', () => {
      const { result } = renderHook(() => usePanelVisibility('desktop'))
      expect(result.current.terminal).toEqual({
        visible: true,
        mode: 'panel',
      })
    })
  })

  describe('tablet mode', () => {
    it('should show explorer as icon', () => {
      const { result } = renderHook(() => usePanelVisibility('tablet'))
      expect(result.current.explorer).toEqual({
        visible: true,
        mode: 'icon',
      })
    })

    it('should show details as floating', () => {
      const { result } = renderHook(() => usePanelVisibility('tablet'))
      expect(result.current.details).toEqual({
        visible: true,
        mode: 'floating',
      })
    })

    it('should show terminal as panel', () => {
      const { result } = renderHook(() => usePanelVisibility('tablet'))
      expect(result.current.terminal).toEqual({
        visible: true,
        mode: 'panel',
      })
    })
  })

  describe('mobile mode', () => {
    it('should show explorer as drawer', () => {
      const { result } = renderHook(() => usePanelVisibility('mobile'))
      expect(result.current.explorer).toEqual({
        visible: true,
        mode: 'drawer',
      })
    })

    it('should show details as drawer', () => {
      const { result } = renderHook(() => usePanelVisibility('mobile'))
      expect(result.current.details).toEqual({
        visible: true,
        mode: 'drawer',
      })
    })

    it('should show terminal as drawer', () => {
      const { result } = renderHook(() => usePanelVisibility('mobile'))
      expect(result.current.terminal).toEqual({
        visible: true,
        mode: 'drawer',
      })
    })
  })

  describe('all modes', () => {
    it('should keep all panels visible in all modes', () => {
      const modes = ['desktop', 'tablet', 'mobile'] as const
      for (const mode of modes) {
        const { result } = renderHook(() => usePanelVisibility(mode))
        expect(result.current.explorer.visible).toBe(true)
        expect(result.current.details.visible).toBe(true)
        expect(result.current.terminal.visible).toBe(true)
      }
    })
  })
})
