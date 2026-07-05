/**
 * Chat Store
 *
 * Zustand store managing chat sessions, messages, and streaming state.
 * Provides session CRUD, message management, and streaming operations.
 *
 * Architecture:
 * - useChatStore: Streaming state only (activeSessionId, isStreaming, etc.)
 * - useSessionStore: Session data + message operations (owns all message data)
 * - No cross-store dependencies to avoid circular coupling
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

import type {
  ChatMessage,
  ChatSession,
  CreateSessionOptions,
  TokenUsage,
  ToolCallState,
  ChatSessionsPersistData,
} from '../types/chat';

/** Generate UUID v4 */
function generateId(): string {
  return crypto.randomUUID();
}

/** Result from addAssistantMessage - includes streaming state update info */
interface AddAssistantMessageResult {
  message: ChatMessage;
  shouldStartStreaming: boolean;
}

/** Result from finalizeMessage - includes streaming state update info */
interface FinalizeMessageResult {
  shouldStopStreaming: boolean;
}

/** Result from deleteSession - includes next active session info */
interface DeleteSessionResult {
  nextActiveSessionId: string | null;
  shouldUpdateActive: boolean;
}

/** Chat store state and actions - streaming state only */
export interface ChatStore {
  // --- State ---
  /** Active session ID */
  activeSessionId: string | null;
  /** Whether currently streaming */
  isStreaming: boolean;
  /** Current streaming message ID */
  streamingMessageId: string | null;

  // --- Streaming actions ---
  /** Start streaming */
  startStreaming: (messageId: string) => void;
  /** Finalize streaming */
  finalizeStreaming: () => void;
  /** Stream error */
  streamError: () => void;

  // --- Branch actions ---
  /** Switch branch */
  switchBranch: (sessionId: string, messageId: string, branchIndex: number) => void;
  /** Create branch */
  createBranch: (sessionId: string, messageId: string, content: string) => ChatMessage;

  // --- Session actions ---
  /** Set active session */
  setActiveSession: (sessionId: string | null) => void;
  /** Get messages for session */
  getMessages: (sessionId: string) => ChatMessage[];
}

export const useChatStore = create<ChatStore>()(
  devtools(
    persist(
      (set, get) => ({
        // --- Initial state ---
        activeSessionId: null,
        isStreaming: false,
        streamingMessageId: null,

        // --- Streaming actions ---
        startStreaming: (messageId) => {
          set({
            isStreaming: true,
            streamingMessageId: messageId,
          });
        },

        finalizeStreaming: () => {
          set({
            isStreaming: false,
            streamingMessageId: null,
          });
        },

        streamError: () => {
          set({
            isStreaming: false,
            streamingMessageId: null,
          });
        },

        // --- Branch actions ---
        switchBranch: (_sessionId, _messageId, _branchIndex) => {
          // Branch switching logic will be implemented in Phase 3.2.4
          void _sessionId;
          void _messageId;
          void _branchIndex;
        },

        createBranch: (_sessionId, messageId, content) => {
          // Branch creation logic will be implemented in Phase 3.2.4
          void _sessionId;
          const message: ChatMessage = {
            id: generateId(),
            role: 'user',
            content,
            timestamp: Date.now(),
            toolCalls: [],
            parentId: messageId,
            branchIndex: 1,
            status: 'completed',
          };

          return message;
        },

        // --- Session actions ---
        setActiveSession: (sessionId) => {
          set({ activeSessionId: sessionId });
        },

        getMessages: (sessionId) => {
          const sessions = useSessionStore.getState().sessions;
          const session = sessions[sessionId];
          return session?.messages ?? [];
        },
      }),
      {
        name: 'codey-chat-store',
        partialize: (state) => ({
          activeSessionId: state.activeSessionId,
        }),
      }
    )
  )
);

/** Session store for managing chat sessions and messages */
export interface SessionStore {
  // --- State ---
  /** All sessions */
  sessions: Record<string, ChatSession>;
  /** Session list sorted by update time */
  sessionList: ChatSession[];

  // --- CRUD actions ---
  /** Create session - returns session, caller should setActiveSession */
  createSession: (options?: CreateSessionOptions) => ChatSession;
  /** Delete session - returns info about next active session */
  deleteSession: (sessionId: string) => DeleteSessionResult;
  /** Rename session */
  renameSession: (sessionId: string, title: string) => void;
  /** Get session */
  getSession: (sessionId: string) => ChatSession | undefined;
  /** Update session */
  updateSession: (sessionId: string, update: Partial<ChatSession>) => void;

  // --- Message actions ---
  /** Add user message */
  addUserMessage: (sessionId: string, content: string) => ChatMessage;
  /** Add assistant message (initial) - returns result with streaming info */
  addAssistantMessage: (sessionId: string) => AddAssistantMessageResult;
  /** Append stream content to a message */
  appendStreamContent: (sessionId: string, messageId: string, content: string) => void;
  /** Update message content */
  updateMessage: (sessionId: string, messageId: string, content: string) => void;
  /** Delete message */
  deleteMessage: (sessionId: string, messageId: string) => void;

  // --- Tool call actions ---
  /** Add tool call to message */
  addToolCall: (sessionId: string, messageId: string, toolCall: Partial<ToolCallState>) => void;
  /** Update tool call */
  updateToolCall: (sessionId: string, messageId: string, toolCallId: string, update: Partial<ToolCallState>) => void;

  // --- Streaming finalization ---
  /** Finalize message streaming - returns result with streaming state info */
  finalizeMessage: (sessionId: string, messageId: string, usage?: TokenUsage) => FinalizeMessageResult;
  /** Set message error - returns result with streaming state info */
  setMessageError: (sessionId: string, messageId: string, error: string) => FinalizeMessageResult;

  // --- Persistence actions ---
  /** Save to localStorage */
  saveToStorage: () => void;
  /** Load from localStorage */
  loadFromStorage: () => void;
  /** Clear all data - caller should setActiveSession(null) */
  clearAll: () => void;
}

export const useSessionStore = create<SessionStore>()(
  devtools(
    persist(
      (set, get) => ({
        // --- Initial state ---
        sessions: {},
        sessionList: [],

        // --- CRUD actions ---
        createSession: (options = {}) => {
          const session: ChatSession = {
            id: generateId(),
            title: options.title ?? 'New Chat',
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            model: options.model ?? 'claude-sonnet-4-20250514',
            provider: options.provider ?? 'anthropic',
          };

          // Add system prompt if provided
          if (options.systemPrompt) {
            const systemMessage: ChatMessage = {
              id: generateId(),
              role: 'system',
              content: options.systemPrompt,
              timestamp: Date.now(),
              toolCalls: [],
              parentId: null,
              branchIndex: 0,
              status: 'completed',
            };
            session.messages = [systemMessage];
          }

          set((state) => {
            const newSessions = { ...state.sessions, [session.id]: session };
            const newSessionList = [session, ...state.sessionList];
            return { sessions: newSessions, sessionList: newSessionList };
          });

          return session;
        },

        deleteSession: (sessionId) => {
          const currentActiveId = useChatStore.getState().activeSessionId;
          let nextActiveSessionId: string | null = null;

          set((state) => {
            const { [sessionId]: _, ...remainingSessions } = state.sessions;
            const newSessionList = state.sessionList.filter((s) => s.id !== sessionId);

            // Determine next active session if deleting the active one
            if (currentActiveId === sessionId) {
              nextActiveSessionId = newSessionList[0]?.id ?? null;
            }

            return { sessions: remainingSessions, sessionList: newSessionList };
          });

          return {
            nextActiveSessionId,
            shouldUpdateActive: currentActiveId === sessionId,
          };
        },

        renameSession: (sessionId, title) => {
          set((state) => {
            const session = state.sessions[sessionId];
            if (!session) return state;

            const updatedSession = { ...session, title, updatedAt: Date.now() };
            const newSessions = { ...state.sessions, [sessionId]: updatedSession };
            const newSessionList = state.sessionList.map((s) =>
              s.id === sessionId ? updatedSession : s
            );

            return { sessions: newSessions, sessionList: newSessionList };
          });
        },

        getSession: (sessionId) => {
          return get().sessions[sessionId];
        },

        updateSession: (sessionId, update) => {
          set((state) => {
            const session = state.sessions[sessionId];
            if (!session) return state;

            const updatedSession = { ...session, ...update, updatedAt: Date.now() };
            const newSessions = { ...state.sessions, [sessionId]: updatedSession };
            const newSessionList = state.sessionList.map((s) =>
              s.id === sessionId ? updatedSession : s
            );

            return { sessions: newSessions, sessionList: newSessionList };
          });
        },

        // --- Message actions ---
        addUserMessage: (sessionId, content) => {
          const message: ChatMessage = {
            id: generateId(),
            role: 'user',
            content,
            timestamp: Date.now(),
            toolCalls: [],
            parentId: null,
            branchIndex: 0,
            status: 'completed',
          };

          set((state) => {
            const session = state.sessions[sessionId];
            if (!session) return state;

            const updatedSession = {
              ...session,
              messages: [...session.messages, message],
              updatedAt: Date.now(),
            };
            const newSessions = { ...state.sessions, [sessionId]: updatedSession };
            const newSessionList = state.sessionList.map((s) =>
              s.id === sessionId ? updatedSession : s
            );

            return { sessions: newSessions, sessionList: newSessionList };
          });

          return message;
        },

        addAssistantMessage: (sessionId) => {
          const message: ChatMessage = {
            id: generateId(),
            role: 'assistant',
            content: '',
            timestamp: Date.now(),
            toolCalls: [],
            parentId: null,
            branchIndex: 0,
            status: 'streaming',
          };

          set((state) => {
            const session = state.sessions[sessionId];
            if (!session) return state;

            const updatedSession = {
              ...session,
              messages: [...session.messages, message],
              updatedAt: Date.now(),
            };
            const newSessions = { ...state.sessions, [sessionId]: updatedSession };
            const newSessionList = state.sessionList.map((s) =>
              s.id === sessionId ? updatedSession : s
            );

            return { sessions: newSessions, sessionList: newSessionList };
          });

          return { message, shouldStartStreaming: true };
        },

        appendStreamContent: (sessionId, messageId, content) => {
          set((state) => {
            const session = state.sessions[sessionId];
            if (!session) return state;

            const updatedMessages = session.messages.map((msg) =>
              msg.id === messageId ? { ...msg, content: msg.content + content } : msg
            );

            const updatedSession = { ...session, messages: updatedMessages, updatedAt: Date.now() };
            const newSessions = { ...state.sessions, [sessionId]: updatedSession };
            const newSessionList = state.sessionList.map((s) =>
              s.id === sessionId ? updatedSession : s
            );

            return { sessions: newSessions, sessionList: newSessionList };
          });
        },

        updateMessage: (sessionId, messageId, content) => {
          set((state) => {
            const session = state.sessions[sessionId];
            if (!session) return state;

            const updatedMessages = session.messages.map((msg) =>
              msg.id === messageId ? { ...msg, content } : msg
            );

            const updatedSession = { ...session, messages: updatedMessages, updatedAt: Date.now() };
            const newSessions = { ...state.sessions, [sessionId]: updatedSession };
            const newSessionList = state.sessionList.map((s) =>
              s.id === sessionId ? updatedSession : s
            );

            return { sessions: newSessions, sessionList: newSessionList };
          });
        },

        deleteMessage: (sessionId, messageId) => {
          set((state) => {
            const session = state.sessions[sessionId];
            if (!session) return state;

            const updatedMessages = session.messages.filter((msg) => msg.id !== messageId);

            const updatedSession = { ...session, messages: updatedMessages, updatedAt: Date.now() };
            const newSessions = { ...state.sessions, [sessionId]: updatedSession };
            const newSessionList = state.sessionList.map((s) =>
              s.id === sessionId ? updatedSession : s
            );

            return { sessions: newSessions, sessionList: newSessionList };
          });
        },

        // --- Tool call actions ---
        addToolCall: (sessionId, messageId, toolCall) => {
          set((state) => {
            const session = state.sessions[sessionId];
            if (!session) return state;

            const updatedMessages = session.messages.map((msg) => {
              if (msg.id !== messageId) return msg;

              const newToolCall: ToolCallState = {
                id: toolCall.id ?? generateId(),
                name: toolCall.name ?? '',
                arguments: toolCall.arguments ?? '',
                status: toolCall.status ?? 'pending',
                result: toolCall.result,
                error: toolCall.error,
                startTime: toolCall.startTime ?? Date.now(),
                endTime: toolCall.endTime,
              };

              return {
                ...msg,
                toolCalls: [...msg.toolCalls, newToolCall],
              };
            });

            const updatedSession = { ...session, messages: updatedMessages, updatedAt: Date.now() };
            const newSessions = { ...state.sessions, [sessionId]: updatedSession };
            const newSessionList = state.sessionList.map((s) =>
              s.id === sessionId ? updatedSession : s
            );

            return { sessions: newSessions, sessionList: newSessionList };
          });
        },

        updateToolCall: (sessionId, messageId, toolCallId, update) => {
          set((state) => {
            const session = state.sessions[sessionId];
            if (!session) return state;

            const updatedMessages = session.messages.map((msg) => {
              if (msg.id !== messageId) return msg;

              const updatedToolCalls = msg.toolCalls.map((tc) =>
                tc.id === toolCallId ? { ...tc, ...update } : tc
              );

              return { ...msg, toolCalls: updatedToolCalls };
            });

            const updatedSession = { ...session, messages: updatedMessages, updatedAt: Date.now() };
            const newSessions = { ...state.sessions, [sessionId]: updatedSession };
            const newSessionList = state.sessionList.map((s) =>
              s.id === sessionId ? updatedSession : s
            );

            return { sessions: newSessions, sessionList: newSessionList };
          });
        },

        // --- Streaming finalization ---
        finalizeMessage: (sessionId, messageId, usage) => {
          set((state) => {
            const session = state.sessions[sessionId];
            if (!session) return state;

            const updatedMessages = session.messages.map((msg) =>
              msg.id === messageId
                ? { ...msg, status: 'completed' as const, usage }
                : msg
            );

            const updatedSession = { ...session, messages: updatedMessages, updatedAt: Date.now() };
            const newSessions = { ...state.sessions, [sessionId]: updatedSession };
            const newSessionList = state.sessionList.map((s) =>
              s.id === sessionId ? updatedSession : s
            );

            return { sessions: newSessions, sessionList: newSessionList };
          });

          return { shouldStopStreaming: true };
        },

        setMessageError: (sessionId, messageId, error) => {
          set((state) => {
            const session = state.sessions[sessionId];
            if (!session) return state;

            const updatedMessages = session.messages.map((msg) =>
              msg.id === messageId
                ? { ...msg, status: 'error' as const, content: msg.content + `\n\nError: ${error}` }
                : msg
            );

            const updatedSession = { ...session, messages: updatedMessages, updatedAt: Date.now() };
            const newSessions = { ...state.sessions, [sessionId]: updatedSession };
            const newSessionList = state.sessionList.map((s) =>
              s.id === sessionId ? updatedSession : s
            );

            return { sessions: newSessions, sessionList: newSessionList };
          });

          return { shouldStopStreaming: true };
        },

        // --- Persistence actions ---
        saveToStorage: () => {
          // Handled by zustand persist middleware
        },

        loadFromStorage: () => {
          // Handled by zustand persist middleware
        },

        clearAll: () => {
          set({ sessions: {}, sessionList: [] });
        },
      }),
      {
        name: 'codey-chat-sessions',
        partialize: (state): ChatSessionsPersistData => ({
          version: 1,
          sessions: state.sessions,
          activeSessionId: useChatStore.getState().activeSessionId,
        }),
      }
    )
  )
);
