/**
 * Chat Type Definitions
 *
 * Types for the Phase 3.2 conversation UI system.
 * Defines message structures, streaming data, and session management.
 */

/** Message role in conversation */
export type MessageRole = 'user' | 'assistant' | 'system';

/** Message lifecycle status */
export type MessageStatus = 'sending' | 'streaming' | 'completed' | 'error';

/** Token usage statistics */
export interface TokenUsage {
  /** Input token count */
  promptTokens: number;
  /** Output token count */
  completionTokens: number;
  /** Total token count */
  totalTokens: number;
}

/** Tool call execution status */
export type ToolCallStatus = 'pending' | 'running' | 'completed' | 'error';

/** Tool call state tracking */
export interface ToolCallState {
  /** Unique call ID */
  id: string;
  /** Tool name (e.g., "file/read", "shell/execute") */
  name: string;
  /** Call arguments (JSON string) */
  arguments: string;
  /** Execution status */
  status: ToolCallStatus;
  /** Execution result */
  result?: string;
  /** Error message */
  error?: string;
  /** Start timestamp (Unix ms) */
  startTime?: number;
  /** End timestamp (Unix ms) */
  endTime?: number;
}

/** Chat message */
export interface ChatMessage {
  /** Unique message ID (UUID v4) */
  id: string;
  /** Message role */
  role: MessageRole;
  /** Message content (Markdown format) */
  content: string;
  /** Creation timestamp (Unix ms) */
  timestamp: number;
  /** Tool call list */
  toolCalls: ToolCallState[];
  /** Parent message ID (for branching, null = trunk) */
  parentId: string | null;
  /** Branch index (0 = trunk, 1+ = branches) */
  branchIndex: number;
  /** Message status */
  status: MessageStatus;
  /** Token usage (assistant messages only) */
  usage?: TokenUsage;
}

/** Stream chunk type */
export type StreamChunkType = 'text' | 'tool_call' | 'tool_result' | 'error' | 'done';

/** Stream chunk (mirrors backend AgentStreamChunk) */
export interface StreamChunk {
  /** Chunk type */
  type: StreamChunkType;
  /** Chunk ID */
  id: string;
  /** Associated message ID */
  messageId: string;
  /** Text content (type=text) */
  content?: string;
  /** Tool call info (type=tool_call) */
  toolCall?: Partial<ToolCallState>;
  /** Tool result (type=tool_result) */
  toolResult?: {
    id: string;
    result?: string;
    error?: string;
  };
  /** Error message (type=error) */
  error?: string;
  /** Token usage (type=done) */
  usage?: TokenUsage;
}

/** Chat session */
export interface ChatSession {
  /** Session unique ID (UUID v4) */
  id: string;
  /** Session title (auto-generated or user-set) */
  title: string;
  /** Message list */
  messages: ChatMessage[];
  /** Creation timestamp (Unix ms) */
  createdAt: number;
  /** Last update timestamp (Unix ms) */
  updatedAt: number;
  /** Model name */
  model: string;
  /** Provider name */
  provider: string;
  /** Session tags */
  tags?: string[];
}

/** Create session options */
export interface CreateSessionOptions {
  /** Session title */
  title?: string;
  /** Model name */
  model?: string;
  /** Provider name */
  provider?: string;
  /** Initial system prompt */
  systemPrompt?: string;
}

/** Persisted chat sessions data */
export interface ChatSessionsPersistData {
  /** Version number for migration */
  version: number;
  /** All sessions */
  sessions: Record<string, ChatSession>;
  /** Active session ID */
  activeSessionId: string | null;
}

/** Chat settings */
export interface ChatSettingsPersistData {
  /** Version number */
  version: number;
  /** Default model */
  defaultModel: string;
  /** Default provider */
  defaultProvider: string;
  /** System prompt */
  systemPrompt?: string;
  /** Send shortcut */
  sendShortcut: 'enter' | 'ctrl+enter';
  /** Code theme */
  codeTheme: string;
  /** Font size */
  fontSize: number;
}
