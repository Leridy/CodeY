/**
 * EditorPanel Component
 *
 * Code editor panel with file path, language detection, and change callbacks.
 */

import React from 'react'

interface EditorPanelProps {
  /** Currently open file path */
  filePath?: string
  /** File content */
  content?: string
  /** Programming language */
  language?: string
  /** Content change callback */
  onChange?: (content: string) => void
  /** Save callback */
  onSave?: (content: string) => void
}

export function EditorPanel({
  filePath,
  content = '',
  language,
  onChange,
  onSave,
}: EditorPanelProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault()
      onSave?.(content)
    }
  }

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--color-bg)' }}>
      {/* Tab bar */}
      {filePath && (
        <div
          className="flex items-center gap-2 px-3 py-1.5 text-xs border-b"
          style={{
            borderColor: 'var(--color-border)',
            background: 'var(--color-surface)',
          }}
        >
          <span className="font-mono" style={{ color: 'var(--color-text)' }}>
            {filePath.split('/').pop()}
          </span>
          {language && (
            <span
              className="px-1.5 py-0.5 rounded text-xs"
              style={{
                background: 'var(--color-bg)',
                color: 'var(--color-text-secondary)',
              }}
            >
              {language}
            </span>
          )}
        </div>
      )}

      {/* Editor area */}
      <textarea
        value={content}
        onChange={(e) => onChange?.(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-1 w-full resize-none p-4 font-mono text-sm focus:outline-none"
        style={{
          background: 'var(--color-bg)',
          color: 'var(--color-text)',
          tabSize: 2,
        }}
        spellCheck={false}
        placeholder="Open a file to start editing..."
      />

      {/* Status bar */}
      <div
        className="flex items-center justify-between px-3 py-1 text-xs border-t"
        style={{
          borderColor: 'var(--color-border)',
          background: 'var(--color-surface)',
          color: 'var(--color-text-secondary)',
        }}
      >
        <span>{language ?? 'Plain Text'}</span>
        <span>UTF-8</span>
      </div>
    </div>
  )
}
