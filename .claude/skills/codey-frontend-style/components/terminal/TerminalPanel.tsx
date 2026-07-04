/**
 * TerminalPanel Component
 *
 * Terminal output panel with collapsible height and command execution.
 */

import React, { useRef, useEffect } from 'react'
import type { TerminalLine } from '../../types/tool'

interface TerminalPanelProps {
  /** Terminal output lines */
  lines: TerminalLine[]
  /** Panel height (resizable via drag) */
  height?: number
  /** Whether the panel is collapsed */
  collapsed?: boolean
  /** Execute command callback */
  onExecute?: (command: string) => void
}

export function TerminalPanel({
  lines,
  height,
  collapsed,
  onExecute,
}: TerminalPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [lines])

  const colorMap: Record<TerminalLine['type'], string> = {
    input: 'var(--color-text)',
    output: 'var(--color-text-secondary)',
    error: 'var(--color-status-error)',
    system: 'var(--color-status-info)',
  }

  if (collapsed) {
    return (
      <div
        className="flex items-center px-3 py-1 text-xs cursor-pointer hover:opacity-80"
        style={{
          background: 'var(--color-surface)',
          color: 'var(--color-text-secondary)',
          height: 32,
        }}
      >
        Terminal ({lines.length} lines)
      </div>
    )
  }

  return (
    <div
      className="flex flex-col"
      style={{ height, background: 'var(--color-bg)' }}
    >
      {/* Header */}
      <div
        className="flex items-center px-3 py-1 text-xs font-semibold border-b"
        style={{
          borderColor: 'var(--color-border)',
          background: 'var(--color-surface)',
          color: 'var(--color-text-secondary)',
        }}
      >
        Terminal
      </div>

      {/* Output */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-2 font-mono text-xs"
      >
        {lines.map((line) => (
          <div
            key={line.id}
            className="whitespace-pre-wrap"
            style={{ color: colorMap[line.type] }}
          >
            {line.type === 'input' && (
              <span style={{ color: 'var(--color-accent)' }}>$ </span>
            )}
            {line.content}
          </div>
        ))}
      </div>

      {/* Input */}
      {onExecute && (
        <div
          className="flex items-center px-3 py-1 border-t"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <span className="text-xs font-mono mr-2" style={{ color: 'var(--color-accent)' }}>
            $
          </span>
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent text-xs font-mono focus:outline-none"
            style={{ color: 'var(--color-text)' }}
            placeholder="Enter command..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const value = e.currentTarget.value.trim()
                if (value) {
                  onExecute(value)
                  e.currentTarget.value = ''
                }
              }
            }}
          />
        </div>
      )}
    </div>
  )
}
