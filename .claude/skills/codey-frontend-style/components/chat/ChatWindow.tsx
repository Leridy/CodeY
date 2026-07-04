/**
 * ChatWindow Component
 *
 * Chat window container combining MessageList and input box.
 */

import React, { useState } from 'react'
import type { Message } from '../../types/message'
import { MessageList } from './MessageList'

interface ChatWindowProps {
  messages: Message[]
  isStreaming: boolean
  onSend: (content: string) => void
  onStop?: () => void
  /** Input placeholder text */
  placeholder?: string
}

export function ChatWindow({
  messages,
  isStreaming,
  onSend,
  onStop,
  placeholder = 'Type a message...',
}: ChatWindowProps) {
  const [input, setInput] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || isStreaming) return
    onSend(trimmed)
    setInput('')
  }

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: 'var(--color-bg)' }}
    >
      {/* Message list */}
      <div className="flex-1 overflow-hidden">
        <MessageList messages={messages} autoScroll />
      </div>

      {/* Input area */}
      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-2 p-3 border-t"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          rows={1}
          className="flex-1 resize-none rounded-lg px-3 py-2 text-sm focus:outline-none"
          style={{
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            borderColor: 'var(--color-border)',
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSubmit(e)
            }
          }}
        />
        {isStreaming ? (
          <button
            type="button"
            onClick={onStop}
            className="px-3 py-2 rounded-lg text-sm font-medium"
            style={{
              background: 'var(--color-status-error)',
              color: 'var(--color-text-inverse)',
            }}
          >
            Stop
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            className="px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            style={{
              background: 'var(--color-primary)',
              color: 'var(--color-text-inverse)',
            }}
          >
            Send
          </button>
        )}
      </form>
    </div>
  )
}
