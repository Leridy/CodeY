/**
 * Built-in Presets Tests
 *
 * Validates preset structure, IDs, and built-in flag consistency.
 */

import { describe, it, expect } from 'vitest'
import {
  DEFAULT_PRESET,
  FOCUS_PRESET,
  WIDE_PRESET,
  BUILTIN_PRESETS,
} from '../presets'

describe('presets', () => {
  describe('DEFAULT_PRESET', () => {
    it('should have id "default" and builtin flag true', () => {
      expect(DEFAULT_PRESET.id).toBe('default')
      expect(DEFAULT_PRESET.builtin).toBe(true)
    })

    it('should define all four panel states', () => {
      const panelIds = Object.keys(DEFAULT_PRESET.panelStates)
      expect(panelIds).toEqual(
        expect.arrayContaining(['explorer', 'content', 'details', 'terminal'])
      )
      expect(panelIds).toHaveLength(4)
    })

    it('should have all panels visible and not collapsed', () => {
      for (const panel of Object.values(DEFAULT_PRESET.panelStates)) {
        expect(panel.visible).toBe(true)
        expect(panel.collapsed).toBe(false)
      }
    })

    it('should have 3 columns and 2 rows in gridConfig', () => {
      expect(DEFAULT_PRESET.gridConfig.columns).toHaveLength(3)
      expect(DEFAULT_PRESET.gridConfig.rows).toHaveLength(2)
    })

    it('should have 4 area definitions', () => {
      expect(DEFAULT_PRESET.gridConfig.areas).toHaveLength(4)
    })
  })

  describe('FOCUS_PRESET', () => {
    it('should have id "focus" and builtin flag true', () => {
      expect(FOCUS_PRESET.id).toBe('focus')
      expect(FOCUS_PRESET.builtin).toBe(true)
    })

    it('should hide details and terminal panels', () => {
      expect(FOCUS_PRESET.panelStates.details.visible).toBe(false)
      expect(FOCUS_PRESET.panelStates.terminal.visible).toBe(false)
    })

    it('should collapse explorer panel', () => {
      expect(FOCUS_PRESET.panelStates.explorer.collapsed).toBe(true)
    })

    it('should keep content panel visible and expanded', () => {
      expect(FOCUS_PRESET.panelStates.content.visible).toBe(true)
      expect(FOCUS_PRESET.panelStates.content.collapsed).toBe(false)
    })
  })

  describe('WIDE_PRESET', () => {
    it('should have id "wide" and builtin flag true', () => {
      expect(WIDE_PRESET.id).toBe('wide')
      expect(WIDE_PRESET.builtin).toBe(true)
    })

    it('should have 3 columns (explorer + 2 content)', () => {
      expect(WIDE_PRESET.gridConfig.columns).toHaveLength(3)
    })

    it('should have all panels visible', () => {
      for (const panel of Object.values(WIDE_PRESET.panelStates)) {
        expect(panel.visible).toBe(true)
      }
    })
  })

  describe('BUILTIN_PRESETS', () => {
    it('should contain exactly 3 presets', () => {
      expect(BUILTIN_PRESETS).toHaveLength(3)
    })

    it('should include all three preset objects', () => {
      const ids = BUILTIN_PRESETS.map((p) => p.id)
      expect(ids).toEqual(['default', 'focus', 'wide'])
    })

    it('should all have builtin flag set to true', () => {
      for (const preset of BUILTIN_PRESETS) {
        expect(preset.builtin).toBe(true)
      }
    })

    it('should have unique IDs', () => {
      const ids = BUILTIN_PRESETS.map((p) => p.id)
      expect(new Set(ids).size).toBe(ids.length)
    })
  })
})
