/**
 * BashTool Component
 *
 * Renders command-line execution results with syntax highlighting.
 */

import React from 'react'

interface BashToolProps {
  command: string
  output: string
  exitCode: number
  /** Whether output was truncated */
  truncated?: boolean
  /** Show full output callback */
  onShowFull?: () => void
}

export function BashTool({ command, output, exitCode, truncated, onShowFull }: BashToolProps) {
  const isError = exitCode !== 0

  return (
    <div className="text-xs font-mono">
      {/* Command */}
      <div
        className="px-2 py-1 rounded-t"
        style={{
          background: 'var(--color-bg)',
          color: 'var(--color-tool-bash)',
        }}
      >
        <span style={{ color: 'var(--color-accent)' }}>$</span> {command}
      </div>

      {/* Output */}
      <pre
        className="px-2 py-2 overflow-x-auto whitespace-pre-wrap"
        style={{
          color: isError ? 'var(--color-status-error)' : 'var(--color-text-secondary)',
          background: 'var(--color-bg)',
          maxHeight: 300,
          overflowY: 'auto',
        }}
      >
        {output}
        {truncated && (
          <>
            {'\n'}
            <button
              onClick={onShowFull}
              className="underline"
              style={{ color: 'var(--color-accent)' }}
            >
              Show full output...
            </button>
          </>
        )}
      </pre>

      {/* Exit code */}
      <div
        className="px-2 py-1 rounded-b text-right"
        style={{
          background: 'var(--color-bg)',
          color: isError ? 'var(--color-status-error)' : 'var(--color-status-success)',
        }}
      >
        exit {exitCode}
      </div>
    </div>
  )
}
