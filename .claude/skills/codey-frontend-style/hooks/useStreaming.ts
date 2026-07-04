/**
 * useStreaming Hook
 *
 * Manages streaming text state for the StreamingText component.
 * Accumulates incoming chunks and tracks completion.
 */

import { useState, useCallback, useRef } from 'react'

interface UseStreamingOptions {
  /** Milliseconds per character for typewriter effect (default 50) */
  speed?: number
  /** Called when the full text has been revealed */
  onComplete?: () => void
}

interface UseStreamingReturn {
  /** The text revealed so far */
  displayedText: string
  /** Whether the full content has been revealed */
  isComplete: boolean
  /** Feed a new chunk of text */
  append: (chunk: string) => void
  /** Set the full text at once (skip typewriter) */
  setFull: (text: string) => void
  /** Reset to initial state */
  reset: () => void
}

export function useStreaming(options: UseStreamingOptions = {}): UseStreamingReturn {
  const { onComplete } = options

  const fullTextRef = useRef('')
  const [displayedText, setDisplayedText] = useState('')
  const [isComplete, setIsComplete] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const append = useCallback(
    (chunk: string) => {
      fullTextRef.current += chunk
      const target = fullTextRef.current

      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }

      let index = displayedText.length

      function tick() {
        if (index < target.length) {
          index += 1
          setDisplayedText(target.slice(0, index))
          timerRef.current = setTimeout(tick, options.speed ?? 50)
        } else {
          setIsComplete(true)
          onComplete?.()
        }
      }

      tick()
    },
    [displayedText.length, onComplete, options.speed]
  )

  const setFull = useCallback(
    (text: string) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
      fullTextRef.current = text
      setDisplayedText(text)
      setIsComplete(true)
      onComplete?.()
    },
    [onComplete]
  )

  const reset = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    fullTextRef.current = ''
    setDisplayedText('')
    setIsComplete(false)
  }, [])

  return { displayedText, isComplete, append, setFull, reset }
}
