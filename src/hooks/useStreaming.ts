/**
 * useStreaming Hook
 *
 * Manages streaming text rendering state with per-character animation.
 */

import { useState, useCallback, useRef, useEffect } from 'react'

interface UseStreamingOptions {
  /** Per-character delay in ms (default: 50) */
  speed?: number
  /** Callback when streaming completes */
  onComplete?: () => void
}

export function useStreaming(options: UseStreamingOptions = {}) {
  const { speed = 50, onComplete } = options
  const [displayedText, setDisplayedText] = useState('')
  const [isComplete, setIsComplete] = useState(false)
  const fullTextRef = useRef('')
  const indexRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const append = useCallback(
    (text: string) => {
      fullTextRef.current += text
      if (!timerRef.current) {
        timerRef.current = setTimeout(() => {
          const next = fullTextRef.current[indexRef.current]
          if (next) {
            indexRef.current++
            setDisplayedText(fullTextRef.current.slice(0, indexRef.current))
          }
          timerRef.current = undefined
        }, speed)
      }
    },
    [speed]
  )

  const setFull = useCallback((text: string) => {
    fullTextRef.current = text
    indexRef.current = text.length
    setDisplayedText(text)
    setIsComplete(true)
    onComplete?.()
  }, [onComplete])

  const reset = useCallback(() => {
    fullTextRef.current = ''
    indexRef.current = 0
    setDisplayedText('')
    setIsComplete(false)
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = undefined
    }
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  return { displayedText, isComplete, append, setFull, reset }
}
