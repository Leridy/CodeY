/**
 * useChat Hook
 *
 * Core chat hook that integrates message sending and streaming.
 * Provides a high-level API for chat interactions.
 */

import { useCallback, useMemo, useRef, useEffect } from 'react';
import { useChatStore, useSessionStore } from '../stores/chatStore';
import type { ChatMessage } from '../types/chat';

/**
 * Get the current active session ID directly from the store.
 * This avoids stale closure issues when sessionId changes between render and call.
 */
function getActiveSessionId(): string | null {
  return useChatStore.getState().activeSessionId;
}

export interface UseChatOptions {
  /** Session ID (optional, defaults to activeSessionId) */
  sessionId?: string;
  /** Send complete callback */
  onSendComplete?: (message: ChatMessage) => void;
  /** Stream complete callback */
  onStreamComplete?: (message: ChatMessage) => void;
  /** Error callback */
  onError?: (error: Error) => void;
}

export interface UseChatReturn {
  /** Current session messages */
  messages: ChatMessage[];
  /** Whether currently streaming */
  isStreaming: boolean;
  /** Send message */
  send: (content: string) => Promise<void>;
  /** Stop generation */
  stop: () => Promise<void>;
  /** Current model */
  model: string;
  /** Switch model */
  setModel: (model: string) => void;
}

export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const {
    sessionId: explicitSessionId,
    onSendComplete,
    onStreamComplete,
    onError,
  } = options;

  const activeSessionId = useChatStore((s) => s.activeSessionId);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const streamingMessageId = useChatStore((s) => s.streamingMessageId);
  const startStreaming = useChatStore((s) => s.startStreaming);
  const finalizeStreaming = useChatStore((s) => s.finalizeStreaming);

  // Message operations are now on useSessionStore
  const addUserMessage = useSessionStore((s) => s.addUserMessage);
  const addAssistantMessage = useSessionStore((s) => s.addAssistantMessage);
  const appendStreamContent = useSessionStore((s) => s.appendStreamContent);
  const finalizeMessage = useSessionStore((s) => s.finalizeMessage);
  const sessions = useSessionStore((s) => s.sessions);
  const updateSession = useSessionStore((s) => s.updateSession);

  const sessionId = explicitSessionId ?? activeSessionId;

  // Track mock timeout for cleanup on unmount
  const mockTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (mockTimeoutRef.current !== null) {
        clearTimeout(mockTimeoutRef.current);
        mockTimeoutRef.current = null;
      }
    };
  }, []);

  const session = useMemo(
    () => (sessionId ? sessions[sessionId] : undefined),
    [sessionId, sessions]
  );

  const messages = useMemo(() => session?.messages ?? [], [session]);

  const model = useMemo(() => session?.model ?? 'claude-sonnet-4-20250514', [session]);

  const setModel = useCallback(
    (newModel: string) => {
      if (sessionId) {
        updateSession(sessionId, { model: newModel });
      }
    },
    [sessionId, updateSession]
  );

  const send = useCallback(
    async (content: string) => {
      // Read sessionId directly from store to avoid stale closure
      const currentSessionId = explicitSessionId ?? getActiveSessionId();

      if (!currentSessionId) {
        onError?.(new Error('No active session'));
        return;
      }

      if (isStreaming) {
        onError?.(new Error('Already streaming'));
        return;
      }

      if (!content.trim()) {
        onError?.(new Error('Empty message'));
        return;
      }

      try {
        // Add user message (now via useSessionStore)
        const userMessage = addUserMessage(currentSessionId, content);
        onSendComplete?.(userMessage);

        // Add assistant message placeholder (returns { message, shouldStartStreaming })
        const { message: assistantMessage } = addAssistantMessage(currentSessionId);
        startStreaming(assistantMessage.id);

        // Invoke Tauri command to start agent
        try {
          const { invoke } = await import('@tauri-apps/api/core');
          await invoke('chat:send_message', {
            sessionId: currentSessionId,
            content,
            model: session?.model,
            provider: session?.provider,
          });
        } catch (tauriError) {
          // If Tauri is not available (web mode), simulate response
          console.warn('Tauri not available, using mock response:', tauriError);

          // Mock streaming response (track timeout for cleanup)
          mockTimeoutRef.current = setTimeout(() => {
            mockTimeoutRef.current = null;
            const mockResponse = `I received your message: "${content}"\n\nThis is a mock response. In production, this would come from the AI agent.`;
            appendStreamContent(currentSessionId, assistantMessage.id, mockResponse);
            finalizeMessage(currentSessionId, assistantMessage.id);
            finalizeStreaming();
            onStreamComplete?.({
              ...assistantMessage,
              content: mockResponse,
              status: 'completed',
            });
          }, 1000);
        }
      } catch (error) {
        onError?.(error as Error);
      }
    },
    [
      explicitSessionId,
      isStreaming,
      session,
      addUserMessage,
      addAssistantMessage,
      appendStreamContent,
      finalizeMessage,
      startStreaming,
      finalizeStreaming,
      onSendComplete,
      onStreamComplete,
      onError,
    ]
  );

  const stop = useCallback(async () => {
    // Clear any pending mock timeout
    if (mockTimeoutRef.current !== null) {
      clearTimeout(mockTimeoutRef.current);
      mockTimeoutRef.current = null;
    }

    if (!streamingMessageId) return;

    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('chat:stop_generation', {
        messageId: streamingMessageId,
      });
    } catch {
      // If Tauri is not available, just finalize locally
      console.warn('Tauri not available, stopping locally');
    }

    finalizeStreaming();
  }, [streamingMessageId, finalizeStreaming]);

  return {
    messages,
    isStreaming,
    send,
    stop,
    model,
    setModel,
  };
}
