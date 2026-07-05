/**
 * useLayoutPreset Hook
 *
 * Provides access to layout preset management.
 */

import { useMemo } from 'react';
import { useLayoutStore } from '../stores/layoutStore';
import { BUILTIN_PRESETS } from '../stores/presets';
import type { LayoutPreset } from '../types/grid';

export function useLayoutPreset(): {
  activePresetId: string | null;
  presets: LayoutPreset[];
  apply: (presetId: string) => void;
  save: (name: string) => void;
  remove: (presetId: string) => void;
  reset: () => void;
} {
  const activePresetId = useLayoutStore((s) => s.activePresetId);
  const customPresets = useLayoutStore((s) => s.customPresets);
  const applyPreset = useLayoutStore((s) => s.applyPreset);
  const saveAsPreset = useLayoutStore((s) => s.saveAsPreset);
  const deletePreset = useLayoutStore((s) => s.deletePreset);
  const resetLayout = useLayoutStore((s) => s.resetLayout);

  const presets = useMemo(() => [...BUILTIN_PRESETS, ...customPresets], [customPresets]);

  return {
    activePresetId,
    presets,
    apply: applyPreset,
    save: saveAsPreset,
    remove: deletePreset,
    reset: resetLayout,
  };
}
