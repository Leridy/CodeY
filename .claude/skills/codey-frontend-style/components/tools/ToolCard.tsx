/**
 * ToolCard Component
 *
 * Generic tool card shell that delegates to specialized tool components
 * based on the tool type.
 */

import React from 'react'
import type { ToolCall } from '../../types/message'

interface ToolCardProps {
  /** Tool call data, determines which specialized component to use */
  toolCall: ToolCall
  expanded: boolean
  onToggleExpand: () => void
  children?: React.ReactNode
}

export function ToolCard({ toolCall, expanded, onToggleExpand, children }: ToolCardProps) {
  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{
        borderColor: 'var(--color-border)',
        background: 'var(--color-surface)',
      }}
    >
      <button
        onClick={onToggleExpand}
        className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:opacity-80 transition-opacity"
        style={{ color: 'var(--color-text)' }}
      >
        <span className="font-mono font-semibold">{toolCall.name}</span>
        <span
          className="text-xs px-2 py-0.5 rounded"
          style={{
            background: 'var(--color-bg)',
            color: 'var(--color-text-secondary)',
          }}
        >
          {toolCall.type}
        </span>
      </button>
      {children && expanded && (
        <div className="border-t px-3 py-2" style={{ borderColor: 'var(--color-border)' }}>
          {children}
        </div>
      )}
    </div>
  )
}
