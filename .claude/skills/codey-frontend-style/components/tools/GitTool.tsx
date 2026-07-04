/**
 * GitTool Component
 *
 * Renders Git operation results with appropriate formatting.
 */

import React from 'react'

interface GitToolProps {
  /** Git subcommand */
  subcommand: 'status' | 'diff' | 'log' | 'commit' | 'push' | 'branch' | string
  /** Command output */
  output: string
}

export function GitTool({ subcommand, output }: GitToolProps) {
  return (
    <div className="text-xs font-mono">
      {/* Command header */}
      <div
        className="px-2 py-1 rounded-t font-semibold"
        style={{
          background: 'var(--color-bg)',
          color: 'var(--color-tool-git)',
        }}
      >
        git {subcommand}
      </div>

      {/* Output */}
      <pre
        className="px-2 py-2 overflow-x-auto whitespace-pre-wrap"
        style={{
          background: 'var(--color-bg)',
          color: 'var(--color-text-secondary)',
          maxHeight: 300,
          overflowY: 'auto',
        }}
      >
        {output}
      </pre>
    </div>
  )
}
