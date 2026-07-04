/**
 * EditTool Component
 *
 * Displays file edit diffs in unified or side-by-side view.
 */

import React from 'react'

interface EditToolProps {
  filePath: string
  /** Original content */
  oldContent: string
  /** New content */
  newContent: string
  /** Diff view mode */
  viewMode?: 'unified' | 'split'
}

export function EditTool({ filePath, oldContent, newContent, viewMode = 'unified' }: EditToolProps) {
  const oldLines = oldContent.split('\n')
  const newLines = newContent.split('\n')

  return (
    <div className="text-xs font-mono">
      {/* File path */}
      <div
        className="px-2 py-1 rounded-t font-semibold"
        style={{
          background: 'var(--color-bg)',
          color: 'var(--color-tool-edit)',
        }}
      >
        {filePath}
      </div>

      {viewMode === 'unified' ? (
        <pre
          className="px-2 py-2 overflow-x-auto"
          style={{
            background: 'var(--color-bg)',
            color: 'var(--color-text-secondary)',
            maxHeight: 300,
            overflowY: 'auto',
          }}
        >
          {oldLines.map((line, i) => (
            <div key={`old-${i}`} style={{ color: 'var(--color-status-error)' }}>
              - {line}
            </div>
          ))}
          {newLines.map((line, i) => (
            <div key={`new-${i}`} style={{ color: 'var(--color-status-success)' }}>
              + {line}
            </div>
          ))}
        </pre>
      ) : (
        <div
          className="flex divide-x overflow-auto"
          style={{
            background: 'var(--color-bg)',
            borderColor: 'var(--color-border)',
            maxHeight: 300,
          }}
        >
          <pre className="flex-1 px-2 py-2" style={{ color: 'var(--color-status-error)' }}>
            {oldLines.join('\n')}
          </pre>
          <pre className="flex-1 px-2 py-2" style={{ color: 'var(--color-status-success)' }}>
            {newLines.join('\n')}
          </pre>
        </div>
      )}
    </div>
  )
}
