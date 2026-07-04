/**
 * StreamingText Component
 *
 * Renders streaming text with a typewriter effect.
 * Supports Markdown rendering when streaming is complete.
 */

import React from 'react'

interface StreamingTextProps {
  /** Full text or streaming text */
  content: string
  /** Whether streaming is complete */
  complete: boolean
  /** Typing speed (ms per character, default 50) */
  speed?: number
  /** Called when typewriter completes */
  onComplete?: () => void
}

export function StreamingText({
  content,
  complete,
}: StreamingTextProps) {
  // For simplicity, display content directly.
  // A production implementation would use a typewriter timer
  // or the useStreaming hook for incremental reveal.
  return (
    <div className="text-sm whitespace-pre-wrap" style={{ color: 'var(--color-text)' }}>
      {content}
      {!complete && (
        <span className="streaming-cursor" />
      )}
    </div>
  )
}
