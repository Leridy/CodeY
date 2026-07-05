/**
 * useStreamListener Hook
 *
 * Listens for Tauri events from the Rust backend and dispatches
 * stream chunks to the chat store.
 */

import { useEffect, useCallback } from 'react';
import type { ToolCallState, TokenUsage } from '../types/chat';
import { useChatStore, useSessionStore } from '../stores/chatStore';

export interface StreamChunkEvent {
  type: 'text' | 'tool_call' | 'tool_result';
  id: string;
  messageId: string;
  content?: string;
  toolCall?: {
    id: string;
    name: string;
    arguments: string;
  };
  toolResult?: {
    id: string;
    result?: string;
    error?: string;
  };
}

export interface StreamStartEvent {
  messageId: string;
  model: string;
  provider: string;
}

export interface StreamEndEvent {
  messageId: string;
  usage: TokenUsage;
  finishReason: 'stop' | 'length' | 'error';
}

export interface StreamErrorEvent {
  messageId: string;
  code: string;
  message: string;
  retryable: boolean;
}

export interface ToolProgressEvent {
  messageId: string;
  toolCallId: string;
  name: string;
  status: ToolCallState['status'];
  progress?: {
    current: number;
    total: number;
    description?: string;
  };
}

export interface UseStreamListenerOptions {
  /** Whether to enable listening */
  enabled?: boolean;
  /** Text chunk callback */
  onText?: (messageId: string, content: string) => void;
  /** Tool call callback */
  onToolCall?: (messageId: string, toolCall: Partial<ToolCallState>) => void;
  /** Tool result callback */
  onToolResult?: (messageId: string, result: { id: string; result?: string; error?: string }) => void;
  /** Stream start callback */
  onStart?: (messageId: string) => void;
  /** Stream end callback */
  onEnd?: (messageId: string, usage?: TokenUsage) => void;
  /** Error callback */
  onError?: (messageId: string, error: string) => void;
}

export function useStreamListener(options: UseStreamListenerOptions = {}): void {
  const {
    enabled = true,
    onText,
    onToolCall,
    onToolResult,
    onStart,
    onEnd,
    onError,
  } = options;

  // Message operations from session store (owns all message data)
  const appendStreamContent = useSessionStore((s) => s.appendStreamContent);
  const addToolCall = useSessionStore((s) => s.addToolCall);
  const updateToolCall = useSessionStore((s) => s.updateToolCall);
  const finalizeMessage = useSessionStore((s) => s.finalizeMessage);
  const setMessageError = useSessionStore((s) => s.setMessageError);

  // Streaming state from chat store
  const activeSessionId = useChatStore((s) => s.activeSessionId);
  const finalizeStreaming = useChatStore((s) => s.finalizeStreaming);
  const streamError = useChatStore((s) => s.streamError);

  const handleStreamChunk = useCallback(
    (event: { payload: StreamChunkEvent }) => {
      const { type, messageId, content, toolCall, toolResult } = event.payload;
      const sessionId = activeSessionId;
      if (!sessionId) return;

      switch (type) {
        case 'text':
          if (content) {
            appendStreamContent(sessionId, messageId, content);
            onText?.(messageId, content);
          }
          break;

        case 'tool_call':
          if (toolCall) {
            addToolCall(sessionId, messageId, toolCall);
            onToolCall?.(messageId, toolCall);
          }
          break;

        case 'tool_result':
          if (toolResult) {
            updateToolCall(sessionId, messageId, toolResult.id, {
              status: toolResult.error ? 'error' : 'completed',
              result: toolResult.result,
              error: toolResult.error,
              endTime: Date.now(),
            });
            onToolResult?.(messageId, toolResult);
          }
          break;
      }
    },
    [activeSessionId, appendStreamContent, addToolCall, updateToolCall, onText, onToolCall, onToolResult]
  );

  const handleStreamStart = useCallback(
    (event: { payload: StreamStartEvent }) => {
      onStart?.(event.payload.messageId);
    },
    [onStart]
  );

  const handleStreamEnd = useCallback(
    (event: { payload: StreamEndEvent }) => {
      const { messageId, usage } = event.payload;
      const sessionId = activeSessionId;
      if (sessionId) {
        finalizeMessage(sessionId, messageId, usage);
      }
      finalizeStreaming();
      onEnd?.(messageId, usage);
    },
    [activeSessionId, finalizeMessage, finalizeStreaming, onEnd]
  );

  const handleStreamError = useCallback(
    (event: { payload: StreamErrorEvent }) => {
      const { messageId, message } = event.payload;
      const sessionId = activeSessionId;
      if (sessionId) {
        setMessageError(sessionId, messageId, message);
      }
      streamError();
      onError?.(messageId, message);
    },
    [activeSessionId, setMessageError, streamError, onError]
  );

  const handleToolProgress = useCallback(
    (event: { payload: ToolProgressEvent }) => {
      const { messageId, toolCallId, status } = event.payload;
      const sessionId = activeSessionId;
      if (sessionId) {
        updateToolCall(sessionId, messageId, toolCallId, { status });
      }
    },
    [activeSessionId, updateToolCall]
  );

  useEffect(() => {
    if (!enabled) return;

    let unlisteners: (() => void)[] = [];

    const setupListeners = async () => {
      try {
        const { listen } = await import('@tauri-apps/api/event');

        const unlistenChunk = await listen<StreamChunkEvent>('chat:stream:chunk', handleStreamChunk);
        const unlistenStart = await listen<StreamStartEvent>('chat:stream:start', handleStreamStart);
        const unlistenEnd = await listen<StreamEndEvent>('chat:stream:end', handleStreamEnd);
        const unlistenError = await listen<StreamErrorEvent>('chat:stream:error', handleStreamError);
        const unlistenProgress = await listen<ToolProgressEvent>('chat:tool:progress', handleToolProgress);

        unlisteners = [unlistenChunk, unlistenStart, unlistenEnd, unlistenError, unlistenProgress];
      } catch {
        console.warn('Tauri event listeners not available (web mode)');
      }
    };

    setupListeners();

    return () => {
      unlisteners.forEach((unlisten) => unlisten());
    };
  }, [
    enabled,
    handleStreamChunk,
    handleStreamStart,
    handleStreamEnd,
    handleStreamError,
    handleToolProgress,
  ]);
}
