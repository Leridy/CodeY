/**
 * usePanelState Hook
 *
 * Provides reactive access to a single panel's state and operations.
 */

import { useLayoutStore } from '../stores/layoutStore'

export function usePanelState(panelId: string): {
  visible: boolean
  collapsed: boolean
  size: { width: number; height: number }
  collapse: () => void
  expand: () => void
  toggleCollapse: () => void
  show: () => void
  hide: () => void
} {
  const panel = useLayoutStore((s) => s.panelStates[panelId])
  const collapsePanel = useLayoutStore((s) => s.collapsePanel)
  const expandPanel = useLayoutStore((s) => s.expandPanel)
  const togglePanelCollapse = useLayoutStore((s) => s.togglePanelCollapse)
  const showPanel = useLayoutStore((s) => s.showPanel)
  const hidePanel = useLayoutStore((s) => s.hidePanel)

  return {
    visible: panel?.visible ?? false,
    collapsed: panel?.collapsed ?? false,
    size: panel?.size ?? { width: 0, height: 0 },
    collapse: () => collapsePanel(panelId),
    expand: () => expandPanel(panelId),
    toggleCollapse: () => togglePanelCollapse(panelId),
    show: () => showPanel(panelId),
    hide: () => hidePanel(panelId),
  }
}
