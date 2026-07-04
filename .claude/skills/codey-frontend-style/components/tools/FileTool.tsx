/**
 * FileTool Component
 *
 * Renders file read/write/create/delete operation results.
 */

import React from 'react'

interface FileToolProps {
  /** Operation type */
  action: 'read' | 'write' | 'create' | 'delete' | 'rename'
  filePath: string
  /** File content preview */
  preview?: string
  /** File language for syntax highlighting */
  language?: string
}

const ACTION_LABELS: Record<FileToolProps['action'], string> = {
  read: 'Read',
  write: 'Write',
  create: 'Create',
  delete: 'Delete',
  rename: 'Rename',
}

export function FileTool({ action, filePath, preview }: FileToolProps) {
  return (
    <div className="text-xs font-mono">
      {/* Header */}
      <div
        className="px-2 py-1 rounded-t font-semibold"
        style={{
          background: 'var(--color-bg)',
          color: 'var(--color-tool-file)',
        }}
      >
        {ACTION_LABELS[action]}: {filePath}
      </div>

      {/* Preview */}
      {preview && (
        <pre
          className="px-2 py-2 overflow-x-auto whitespace-pre-wrap"
          style={{
            background: 'var(--color-bg)',
            color: 'var(--color-text-secondary)',
            maxHeight: 200,
            overflowY: 'auto',
          }}
        >
          {preview}
        </pre>
      )}
    </div>
  )
}
