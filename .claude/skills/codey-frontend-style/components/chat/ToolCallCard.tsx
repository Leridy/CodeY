/**
 * ToolCallCard Component
 *
 * Displays a compact tool call summary that can be expanded to show details.
 */

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ANIMATION } from '../layout/IDELayout'
import type { ToolCall } from '../../types/message'
import { TOOL_COLORS } from '../../types/tool'

interface ToolCallCardProps {
  toolCall: ToolCall
  /** Whether details are expanded */
  expanded?: boolean
  /** Toggle expand callback */
  onToggleExpand?: () => void
}

function StatusBadge({ status }: { status: ToolCall['status'] }) {
  const colorMap: Record<ToolCall['status'], string> = {
    pending: 'var(--color-text-secondary)',
    running: 'var(--color-status-info)',
    completed: 'var(--color-status-success)',
    failed: 'var(--color-status-error)',
    awaiting_approval: 'var(--color-status-warning)',
  }

  return (
    <span
      className="inline-block w-2 h-2 rounded-full"
      style={{ background: colorMap[status] }}
      title={status}
    />
  )
}

export function ToolCallCard({
  toolCall,
  expanded: expandedProp,
  onToggleExpand,
}: ToolCallCardProps) {
  const [internalExpanded, setInternalExpanded] = useState(false)
  const expanded = expandedProp ?? internalExpanded

  const toggle = () => {
    onToggleExpand?.()
    if (expandedProp === undefined) {
      setInternalExpanded((prev) => !prev)
    }
  }

  return (
    <motion.div
      layout
      transition={ANIMATION.toolCardExpand.transition}
      className="rounded-lg border overflow-hidden"
      style={{
        borderColor: 'var(--color-border)',
        background: 'var(--color-bg)',
      }}
    >
      {/* Header */}
      <button
        onClick={toggle}
        className="flex items-center gap-2 w-full px-3 py-1.5 text-xs font-mono hover:opacity-80 transition-opacity"
      >
        <StatusBadge status={toolCall.status} />
        <span
          className="font-semibold"
          style={{ color: TOOL_COLORS[toolCall.type] }}
        >
          {toolCall.name}
        </span>
        <span className="truncate" style={{ color: 'var(--color-text-secondary)' }}>
          {JSON.stringify(toolCall.input).slice(0, 60)}
        </span>
      </button>

      {/* Expandable details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={ANIMATION.toolCardExpand.transition}
            className="overflow-hidden"
          >
            <div
              className="px-3 py-2 border-t text-xs font-mono whitespace-pre-wrap"
              style={{
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-secondary)',
              }}
            >
              <div className="mb-1">
                <strong>Input:</strong> {JSON.stringify(toolCall.input, null, 2)}
              </div>
              {toolCall.result && (
                <div>
                  <strong>Output:</strong>{' '}
                  {toolCall.result.truncated
                    ? toolCall.result.output + '...(truncated)'
                    : toolCall.result.output}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
