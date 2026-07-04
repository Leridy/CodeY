/**
 * CodeY Tool Type Definitions
 *
 * Defines types for the various tool rendering components.
 */

import type { ToolCall, ToolResult } from './message'

export type { ToolCall, ToolResult }

export interface SearchResult {
  filePath: string
  lineNumber: number
  /** Matching line content */
  line: string
  /** Surrounding context lines */
  context?: { before: string[]; after: string[] }
}

export interface TerminalLine {
  id: string
  type: 'input' | 'output' | 'error' | 'system'
  content: string
  timestamp: number
}

/** Mapping of tool types to their display colors */
export const TOOL_COLORS = {
  bash: 'var(--color-tool-bash)',
  edit: 'var(--color-tool-edit)',
  git: 'var(--color-tool-git)',
  file: 'var(--color-tool-file)',
  search: 'var(--color-tool-search)',
  other: 'var(--color-text-secondary)',
} as const
