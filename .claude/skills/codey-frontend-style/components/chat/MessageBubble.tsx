/**
 * MessageBubble Component
 *
 * Renders a single message bubble, differentiating user and assistant roles.
 */

import React from 'react'
import { motion } from 'framer-motion'
import { ANIMATION } from '../layout/IDELayout'
import type { Message } from '../../types/message'
import { ToolCallCard } from './ToolCallCard'

interface MessageBubbleProps {
  message: Message
  /** Whether the message is currently streaming */
  streaming?: boolean
}

export function MessageBubble({ message, streaming }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'

  return (
    <motion.div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}
      initial={ANIMATION.messageEnter.initial}
      animate={ANIMATION.messageEnter.animate}
      transition={ANIMATION.messageEnter.transition}
    >
      <div
        className={`
          max-w-[80%] rounded-2xl px-4 py-2 text-sm
          ${isSystem ? 'opacity-60 italic' : ''}
        `}
        style={{
          background: isUser ? 'var(--color-primary)' : 'var(--color-surface)',
          color: isUser ? 'var(--color-text-inverse)' : 'var(--color-text)',
          border: isUser ? 'none' : '1px solid var(--color-border)',
        }}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>

        {/* Tool calls */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mt-2 space-y-1">
            {message.toolCalls.map((tc) => (
              <ToolCallCard key={tc.id} toolCall={tc} />
            ))}
          </div>
        )}

        {/* Streaming indicator */}
        {streaming && (
          <span
            className="inline-block w-1.5 h-4 ml-1 animate-pulse"
            style={{ background: 'var(--color-accent)' }}
          />
        )}
      </div>
    </motion.div>
  )
}
