/**
 * Chat Store Tests
 *
 * Tests Zustand store actions: session management, message operations,
 * and streaming state transitions.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useChatStore, useSessionStore } from '../chatStore';

/** Reset stores to initial state before each test */
function resetStores() {
  useChatStore.setState({
    activeSessionId: null,
    isStreaming: false,
    streamingMessageId: null,
  });

  useSessionStore.setState({
    sessions: {},
    sessionList: [],
  });
}

describe('useChatStore', () => {
  beforeEach(() => {
    resetStores();
  });

  describe('initial state', () => {
    it('should have null active session', () => {
      const state = useChatStore.getState();
      expect(state.activeSessionId).toBeNull();
    });

    it('should not be streaming', () => {
      const state = useChatStore.getState();
      expect(state.isStreaming).toBe(false);
      expect(state.streamingMessageId).toBeNull();
    });
  });

  describe('setActiveSession', () => {
    it('should set active session ID', () => {
      useChatStore.getState().setActiveSession('session-1');
      expect(useChatStore.getState().activeSessionId).toBe('session-1');
    });

    it('should clear active session with null', () => {
      useChatStore.getState().setActiveSession('session-1');
      useChatStore.getState().setActiveSession(null);
      expect(useChatStore.getState().activeSessionId).toBeNull();
    });
  });

  describe('streaming actions', () => {
    it('should start streaming', () => {
      useChatStore.getState().startStreaming('msg-1');
      const state = useChatStore.getState();
      expect(state.isStreaming).toBe(true);
      expect(state.streamingMessageId).toBe('msg-1');
    });

    it('should finalize streaming', () => {
      // Create session and message first
      const session = useSessionStore.getState().createSession();
      useChatStore.getState().setActiveSession(session.id);
      const { message: msg } = useSessionStore.getState().addAssistantMessage(session.id);
      useChatStore.getState().startStreaming(msg.id);

      // Finalize message in session store, then streaming state in chat store
      useSessionStore.getState().finalizeMessage(session.id, msg.id);
      useChatStore.getState().finalizeStreaming();

      const state = useChatStore.getState();
      expect(state.isStreaming).toBe(false);
      expect(state.streamingMessageId).toBeNull();
    });

    it('should finalize streaming with usage', () => {
      // Create session and message first
      const session = useSessionStore.getState().createSession();
      useChatStore.getState().setActiveSession(session.id);
      const { message: msg } = useSessionStore.getState().addAssistantMessage(session.id);
      useChatStore.getState().startStreaming(msg.id);

      useSessionStore.getState().finalizeMessage(session.id, msg.id, {
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
      });
      useChatStore.getState().finalizeStreaming();

      const state = useChatStore.getState();
      expect(state.isStreaming).toBe(false);
    });

    it('should handle stream error', () => {
      // First create a session and message for the error to update
      const session = useSessionStore.getState().createSession();
      useChatStore.getState().setActiveSession(session.id);
      const { message: msg } = useSessionStore.getState().addAssistantMessage(session.id);
      useChatStore.getState().startStreaming(msg.id);

      useSessionStore.getState().setMessageError(session.id, msg.id, 'Connection failed');
      useChatStore.getState().streamError();

      const state = useChatStore.getState();
      expect(state.isStreaming).toBe(false);
      expect(state.streamingMessageId).toBeNull();
    });
  });
});

describe('useSessionStore', () => {
  beforeEach(() => {
    resetStores();
  });

  describe('createSession', () => {
    it('should create a session with default values', () => {
      const session = useSessionStore.getState().createSession();
      expect(session.id).toBeDefined();
      expect(session.title).toBe('New Chat');
      expect(session.messages).toEqual([]);
      expect(session.model).toBe('claude-sonnet-4-20250514');
      expect(session.provider).toBe('anthropic');
    });

    it('should create a session with custom options', () => {
      const session = useSessionStore.getState().createSession({
        title: 'Test Chat',
        model: 'gpt-4',
        provider: 'openai',
      });
      expect(session.title).toBe('Test Chat');
      expect(session.model).toBe('gpt-4');
      expect(session.provider).toBe('openai');
    });

    it('should add system prompt as first message', () => {
      const session = useSessionStore.getState().createSession({
        systemPrompt: 'You are a helpful assistant.',
      });
      expect(session.messages).toHaveLength(1);
      expect(session.messages[0].role).toBe('system');
      expect(session.messages[0].content).toBe('You are a helpful assistant.');
    });

    it('should add to session list', () => {
      useSessionStore.getState().createSession({ title: 'Chat 1' });
      useSessionStore.getState().createSession({ title: 'Chat 2' });
      expect(useSessionStore.getState().sessionList).toHaveLength(2);
    });
  });

  describe('deleteSession', () => {
    it('should delete a session', () => {
      const session = useSessionStore.getState().createSession();
      useSessionStore.getState().deleteSession(session.id);
      expect(useSessionStore.getState().sessions[session.id]).toBeUndefined();
      expect(useSessionStore.getState().sessionList).toHaveLength(0);
    });

    it('should return next active session info when deleting active', () => {
      const session1 = useSessionStore.getState().createSession({ title: 'Chat 1' });
      const session2 = useSessionStore.getState().createSession({ title: 'Chat 2' });
      useChatStore.getState().setActiveSession(session2.id);

      const result = useSessionStore.getState().deleteSession(session2.id);
      expect(result.shouldUpdateActive).toBe(true);
      expect(result.nextActiveSessionId).toBe(session1.id);

      // Caller should update active session
      useChatStore.getState().setActiveSession(result.nextActiveSessionId);
      expect(useChatStore.getState().activeSessionId).toBe(session1.id);
    });

    it('should return null next session when deleting last session', () => {
      const session = useSessionStore.getState().createSession();
      useChatStore.getState().setActiveSession(session.id);

      const result = useSessionStore.getState().deleteSession(session.id);
      expect(result.shouldUpdateActive).toBe(true);
      expect(result.nextActiveSessionId).toBeNull();

      useChatStore.getState().setActiveSession(result.nextActiveSessionId);
      expect(useChatStore.getState().activeSessionId).toBeNull();
    });
  });

  describe('renameSession', () => {
    it('should rename a session', () => {
      const session = useSessionStore.getState().createSession({ title: 'Old Name' });
      useSessionStore.getState().renameSession(session.id, 'New Name');
      expect(useSessionStore.getState().sessions[session.id].title).toBe('New Name');
    });

    it('should update session list', () => {
      const session = useSessionStore.getState().createSession({ title: 'Old Name' });
      useSessionStore.getState().renameSession(session.id, 'New Name');
      const sessionInList = useSessionStore.getState().sessionList.find(
        (s) => s.id === session.id
      );
      expect(sessionInList?.title).toBe('New Name');
    });
  });

  describe('getSession', () => {
    it('should get a session by ID', () => {
      const session = useSessionStore.getState().createSession();
      const retrieved = useSessionStore.getState().getSession(session.id);
      expect(retrieved).toEqual(session);
    });

    it('should return undefined for non-existent session', () => {
      const retrieved = useSessionStore.getState().getSession('non-existent');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('updateSession', () => {
    it('should update session fields', () => {
      const session = useSessionStore.getState().createSession();
      useSessionStore.getState().updateSession(session.id, { model: 'gpt-4' });
      expect(useSessionStore.getState().sessions[session.id].model).toBe('gpt-4');
    });

    it('should update updatedAt timestamp', () => {
      const session = useSessionStore.getState().createSession();
      const originalUpdatedAt = session.updatedAt;
      useSessionStore.getState().updateSession(session.id, { title: 'New Title' });
      expect(useSessionStore.getState().sessions[session.id].updatedAt).toBeGreaterThanOrEqual(
        originalUpdatedAt
      );
    });
  });

  describe('clearAll', () => {
    it('should clear all sessions', () => {
      useSessionStore.getState().createSession({ title: 'Chat 1' });
      useSessionStore.getState().createSession({ title: 'Chat 2' });
      useSessionStore.getState().clearAll();
      // Caller should also clear active session
      useChatStore.getState().setActiveSession(null);
      expect(useSessionStore.getState().sessions).toEqual({});
      expect(useSessionStore.getState().sessionList).toEqual([]);
      expect(useChatStore.getState().activeSessionId).toBeNull();
    });
  });
});

describe('ChatStore message operations', () => {
  let sessionId: string;

  beforeEach(() => {
    resetStores();
    const session = useSessionStore.getState().createSession({ title: 'Test' });
    sessionId = session.id;
    useChatStore.getState().setActiveSession(session.id);
  });

  describe('addUserMessage', () => {
    it('should add user message to session', () => {
      const message = useSessionStore.getState().addUserMessage(sessionId, 'Hello');
      expect(message.role).toBe('user');
      expect(message.content).toBe('Hello');
      expect(message.status).toBe('completed');
    });

    it('should update session messages', () => {
      useSessionStore.getState().addUserMessage(sessionId, 'Hello');
      const session = useSessionStore.getState().sessions[sessionId];
      expect(session.messages).toHaveLength(1);
      expect(session.messages[0].content).toBe('Hello');
    });
  });

  describe('addAssistantMessage', () => {
    it('should add assistant message with streaming status', () => {
      const { message } = useSessionStore.getState().addAssistantMessage(sessionId);
      expect(message.role).toBe('assistant');
      expect(message.content).toBe('');
      expect(message.status).toBe('streaming');
    });

    it('should return shouldStartStreaming flag', () => {
      const result = useSessionStore.getState().addAssistantMessage(sessionId);
      expect(result.shouldStartStreaming).toBe(true);
    });
  });

  describe('updateMessage', () => {
    it('should update message content', () => {
      const message = useSessionStore.getState().addUserMessage(sessionId, 'Hello');
      useSessionStore.getState().updateMessage(sessionId, message.id, 'Updated');
      const session = useSessionStore.getState().sessions[sessionId];
      expect(session.messages[0].content).toBe('Updated');
    });
  });

  describe('deleteMessage', () => {
    it('should delete message from session', () => {
      const message = useSessionStore.getState().addUserMessage(sessionId, 'Hello');
      useSessionStore.getState().deleteMessage(sessionId, message.id);
      const session = useSessionStore.getState().sessions[sessionId];
      expect(session.messages).toHaveLength(0);
    });
  });

  describe('getMessages', () => {
    it('should return messages for session', () => {
      useSessionStore.getState().addUserMessage(sessionId, 'Hello');
      useSessionStore.getState().addUserMessage(sessionId, 'World');
      const messages = useChatStore.getState().getMessages(sessionId);
      expect(messages).toHaveLength(2);
    });

    it('should return empty array for non-existent session', () => {
      const messages = useChatStore.getState().getMessages('non-existent');
      expect(messages).toEqual([]);
    });
  });
});
