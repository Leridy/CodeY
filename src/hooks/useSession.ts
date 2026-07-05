/**
 * useSession Hook
 *
 * Session management hook providing high-level session operations.
 * Integrates useChatStore and useSessionStore for session lifecycle.
 */

import { useCallback, useMemo } from 'react';
import { useChatStore, useSessionStore } from '../stores/chatStore';
import type { ChatSession, CreateSessionOptions } from '../types/chat';

export interface UseSessionReturn {
  /** Current active session */
  activeSession: ChatSession | null;
  /** All sessions sorted by update time */
  sessions: ChatSession[];
  /** Create a new session and set it as active */
  create: (options?: CreateSessionOptions) => ChatSession;
  /** Switch to a session */
  switchTo: (sessionId: string) => void;
  /** Delete a session and switch to the next one if needed */
  remove: (sessionId: string) => void;
  /** Rename a session */
  rename: (sessionId: string, title: string) => void;
}

export function useSession(): UseSessionReturn {
  const activeSessionId = useChatStore((s) => s.activeSessionId);
  const setActiveSession = useChatStore((s) => s.setActiveSession);
  const sessionList = useSessionStore((s) => s.sessionList);
  const sessions = useSessionStore((s) => s.sessions);
  const createSession = useSessionStore((s) => s.createSession);
  const deleteSession = useSessionStore((s) => s.deleteSession);
  const renameSession = useSessionStore((s) => s.renameSession);

  const activeSession = useMemo(
    () => (activeSessionId ? sessions[activeSessionId] ?? null : null),
    [activeSessionId, sessions]
  );

  const create = useCallback(
    (options?: CreateSessionOptions): ChatSession => {
      const session = createSession(options);
      setActiveSession(session.id);
      return session;
    },
    [createSession, setActiveSession]
  );

  const switchTo = useCallback(
    (sessionId: string): void => {
      setActiveSession(sessionId);
    },
    [setActiveSession]
  );

  const remove = useCallback(
    (sessionId: string): void => {
      const result = deleteSession(sessionId);
      if (result.shouldUpdateActive) {
        setActiveSession(result.nextActiveSessionId);
      }
    },
    [deleteSession, setActiveSession]
  );

  const rename = useCallback(
    (sessionId: string, title: string): void => {
      renameSession(sessionId, title);
    },
    [renameSession]
  );

  return {
    activeSession,
    sessions: sessionList,
    create,
    switchTo,
    remove,
    rename,
  };
}
