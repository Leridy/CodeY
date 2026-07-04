/**
 * SearchTool Component
 *
 * Renders search results with file path, line number, and context.
 */

import React from 'react'
import type { SearchResult } from '../../types/tool'

interface SearchToolProps {
  /** Search query */
  query: string
  /** Search results */
  results: SearchResult[]
  /** Total result count */
  total: number
}

export function SearchTool({ query, results, total }: SearchToolProps) {
  return (
    <div className="text-xs font-mono">
      {/* Header */}
      <div
        className="px-2 py-1 rounded-t font-semibold"
        style={{
          background: 'var(--color-bg)',
          color: 'var(--color-tool-search)',
        }}
      >
        Search: &quot;{query}&quot; ({total} results)
      </div>

      {/* Results */}
      <div
        className="overflow-y-auto"
        style={{
          background: 'var(--color-bg)',
          maxHeight: 300,
        }}
      >
        {results.map((result, i) => (
          <div
            key={`${result.filePath}:${result.lineNumber}:${i}`}
            className="px-2 py-1 border-b hover:opacity-80"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <span style={{ color: 'var(--color-text-secondary)' }}>
              {result.filePath}:{result.lineNumber}
            </span>
            <span className="ml-2" style={{ color: 'var(--color-text)' }}>
              {result.line}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
