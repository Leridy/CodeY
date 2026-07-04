/**
 * MessageList Component
 *
 * Renders a scrollable list of messages with auto-scroll-to-bottom behavior.
 */

import React, { useEffect, useRef } from 'react'
import type { Message } from '../../types/message'
import { MessageBubble } from './MessageBubble'

interface MessageListProps {
  messages: Message[]
  /** Whether to auto-scroll to the bottom */
  autoScroll?: boolean
  /** Custom message renderer */
  renderMessage?: (message: Message) => React.ReactNode
}

export function MessageList({
  messages,
  autoScroll = true,
  renderMessage,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, autoScroll])

  return (
    <div className="h-full overflow-y-auto px-4 py-3">
      {messages.length === 0 && (
        <div
          className="flex items-center justify-center h-full text-sm"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Start a conversation...
        </div>
      )}
      {messages.map((message) =>
        renderMessage ? (
          <React.Fragment key={message.id}>{renderMessage(message)}</React.Fragment>
        ) : (
          <MessageBubble key={message.id} message={message} />
        )
      )}
      <div ref={bottomRef} />
    </div>
  )
}
