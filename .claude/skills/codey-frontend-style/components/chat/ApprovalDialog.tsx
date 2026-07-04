/**
 * ApprovalDialog Component
 *
 * Modal dialog for approving or rejecting dangerous tool calls.
 */

import React from 'react'
import type { ToolCall } from '../../types/message'

interface ApprovalDialogProps {
  toolCall: ToolCall
  /** Reason why approval is needed */
  reason?: string
  onApprove: () => void
  onReject: () => void
}

export function ApprovalDialog({
  toolCall,
  reason,
  onApprove,
  onReject,
}: ApprovalDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onReject} />

      {/* Dialog */}
      <div
        className="relative z-10 w-full max-w-md rounded-xl p-6 shadow-2xl"
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
        }}
      >
        <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
          Approval Required
        </h2>

        {reason && (
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
            {reason}
          </p>
        )}

        <div
          className="rounded-lg p-3 mb-4 text-xs font-mono"
          style={{
            background: 'var(--color-bg)',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div className="font-semibold mb-1">{toolCall.name}</div>
          <pre className="whitespace-pre-wrap overflow-auto max-h-40">
            {JSON.stringify(toolCall.input, null, 2)}
          </pre>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onReject}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{
              background: 'var(--color-bg)',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
            }}
          >
            Reject
          </button>
          <button
            onClick={onApprove}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{
              background: 'var(--color-status-warning)',
              color: 'var(--color-text-inverse)',
            }}
          >
            Approve
          </button>
        </div>
      </div>
    </div>
  )
}
