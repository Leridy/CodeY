/**
 * DetailsPanel Component
 *
 * Context-sensitive details panel showing information about the currently
 * selected item (file, tool, search result, etc.).
 */

import React from 'react'

interface DetailsPanelProps {
  /** Type of the currently selected item */
  type: 'file' | 'tool' | 'search' | null
  /** Associated data */
  data?: unknown
  /** Whether displayed as a floating panel (tablet mode) */
  floating?: boolean
}

export function DetailsPanel({ type, data }: DetailsPanelProps) {
  if (!type) {
    return (
      <div
        className="flex items-center justify-center h-full text-sm"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        Select an item to view details
      </div>
    )
  }

  return (
    <div
      className="flex flex-col h-full overflow-y-auto"
      style={{ background: 'var(--color-surface)' }}
    >
      {/* Header */}
      <div
        className="px-3 py-2 border-b text-xs font-semibold uppercase tracking-wider"
        style={{
          borderColor: 'var(--color-border)',
          color: 'var(--color-text-secondary)',
        }}
      >
        {type === 'file' && 'File Details'}
        {type === 'tool' && 'Tool Details'}
        {type === 'search' && 'Search Results'}
      </div>

      {/* Content */}
      <div className="flex-1 p-3 overflow-y-auto">
        {data !== undefined ? (
          <pre
            className="text-xs font-mono whitespace-pre-wrap"
            style={{ color: 'var(--color-text)' }}
          >
            {JSON.stringify(data, null, 2)}
          </pre>
        ) : (
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            No details available
          </p>
        )}
      </div>
    </div>
  )
}
