/**
 * CodeY Message Type Definitions
 *
 * Defines types for the chat message system.
 */

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  /** Tool calls associated with this message */
  toolCalls?: ToolCall[]
  /** Whether the message is currently being generated */
  streaming?: boolean
}

export interface ToolCall {
  id: string
  name: string
  /** Tool category */
  type: 'bash' | 'edit' | 'git' | 'file' | 'search' | 'other'
  /** Input parameters */
  input: Record<string, unknown>
  /** Execution result */
  result?: ToolResult
  /** Execution status */
  status: 'pending' | 'running' | 'completed' | 'failed' | 'awaiting_approval'
}

export interface ToolResult {
  output: string
  exitCode?: number
  duration?: number
  /** Whether the output was truncated */
  truncated?: boolean
}

export interface OpenFile {
  path: string
  content: string
  language: string
  modified: boolean
}
