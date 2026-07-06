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
    branchSelections: {},
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

describe('ChatStore branch operations', () => {
  let sessionId: string;

  beforeEach(() => {
    useChatStore.setState({
      activeSessionId: null,
      isStreaming: false,
      streamingMessageId: null,
      branchSelections: {},
    });
    useSessionStore.setState({
      sessions: {},
      sessionList: [],
    });
    const session = useSessionStore.getState().createSession({ title: 'Branch Test' });
    sessionId = session.id;
    useChatStore.getState().setActiveSession(session.id);
  });

  describe('switchBranch', () => {
    it('should update branch selections', () => {
      useChatStore.getState().switchBranch(sessionId, 'msg-1', 1);
      const selections = useChatStore.getState().branchSelections[sessionId];
      expect(selections?.['msg-1']).toBe(1);
    });

    it('should support multiple branch selections', () => {
      useChatStore.getState().switchBranch(sessionId, 'msg-1', 1);
      useChatStore.getState().switchBranch(sessionId, 'msg-2', 2);
      const selections = useChatStore.getState().branchSelections[sessionId];
      expect(selections?.['msg-1']).toBe(1);
      expect(selections?.['msg-2']).toBe(2);
    });

    it('should allow switching back to branch 0', () => {
      useChatStore.getState().switchBranch(sessionId, 'msg-1', 1);
      useChatStore.getState().switchBranch(sessionId, 'msg-1', 0);
      const selections = useChatStore.getState().branchSelections[sessionId];
      expect(selections?.['msg-1']).toBe(0);
    });
  });

  describe('createBranch', () => {
    it('should create a branch message with correct parentId', () => {
      // Add a trunk message first
      const trunkMsg = useSessionStore.getState().addUserMessage(sessionId, 'Trunk message');
      
      const branchMsg = useChatStore.getState().createBranch(sessionId, trunkMsg.id, 'Branch message');
      expect(branchMsg.parentId).toBe(trunkMsg.id);
      expect(branchMsg.content).toBe('Branch message');
      expect(branchMsg.role).toBe('user');
      expect(branchMsg.status).toBe('completed');
    });

    it('should set branchIndex to 1 for first branch', () => {
      const trunkMsg = useSessionStore.getState().addUserMessage(sessionId, 'Trunk');
      const branchMsg = useChatStore.getState().createBranch(sessionId, trunkMsg.id, 'Branch');
      expect(branchMsg.branchIndex).toBe(1);
    });

    it('should increment branchIndex for subsequent branches', () => {
      const trunkMsg = useSessionStore.getState().addUserMessage(sessionId, 'Trunk');
      const branch1 = useChatStore.getState().createBranch(sessionId, trunkMsg.id, 'Branch 1');
      const branch2 = useChatStore.getState().createBranch(sessionId, trunkMsg.id, 'Branch 2');
      expect(branch1.branchIndex).toBe(1);
      expect(branch2.branchIndex).toBe(2);
    });

    it('should add branch message to session', () => {
      const trunkMsg = useSessionStore.getState().addUserMessage(sessionId, 'Trunk');
      useChatStore.getState().createBranch(sessionId, trunkMsg.id, 'Branch');
      
      const session = useSessionStore.getState().sessions[sessionId];
      const branchMsg = session.messages.find((m) => m.parentId === trunkMsg.id);
      expect(branchMsg).toBeDefined();
      expect(branchMsg?.content).toBe('Branch');
    });

    it('should update branch selections after creating branch', () => {
      const trunkMsg = useSessionStore.getState().addUserMessage(sessionId, 'Trunk');
      useChatStore.getState().createBranch(sessionId, trunkMsg.id, 'Branch');
      
      const selections = useChatStore.getState().branchSelections[sessionId];
      expect(selections?.[trunkMsg.id]).toBe(1);
    });
  });

  describe('getMessages with branches', () => {
    it('should return trunk messages when no branches exist', () => {
      useSessionStore.getState().addUserMessage(sessionId, 'Msg 1');
      useSessionStore.getState().addUserMessage(sessionId, 'Msg 2');
      const messages = useChatStore.getState().getMessages(sessionId);
      expect(messages).toHaveLength(2);
    });

    it('should show all trunk and active branch messages', () => {
      const trunk1 = useSessionStore.getState().addUserMessage(sessionId, 'Trunk 1');
      useSessionStore.getState().addUserMessage(sessionId, 'Trunk 2');
      
      // Create a branch from trunk1 (auto-selects the new branch)
      useChatStore.getState().createBranch(sessionId, trunk1.id, 'Branch from trunk1');
      
      // getMessages shows: trunk1, trunk2, and the active branch message
      const messages = useChatStore.getState().getMessages(sessionId);
      expect(messages).toHaveLength(3);
      expect(messages[0].content).toBe('Trunk 1');
      expect(messages[1].content).toBe('Trunk 2');
      expect(messages[2].content).toBe('Branch from trunk1');
    });

    it('should show only trunk when branch is deselected', () => {
      const trunk1 = useSessionStore.getState().addUserMessage(sessionId, 'Trunk 1');
      useSessionStore.getState().addUserMessage(sessionId, 'Trunk 2');
      
      // Create a branch from trunk1 (auto-selects branch 1)
      useChatStore.getState().createBranch(sessionId, trunk1.id, 'Branch from trunk1');
      
      // Switch back to trunk (branch 0)
      useChatStore.getState().switchBranch(sessionId, trunk1.id, 0);
      
      const messages = useChatStore.getState().getMessages(sessionId);
      expect(messages).toHaveLength(2);
      expect(messages[0].content).toBe('Trunk 1');
      expect(messages[1].content).toBe('Trunk 2');
    });

    it('should show branch messages when branch is selected', () => {
      const trunk1 = useSessionStore.getState().addUserMessage(sessionId, 'Trunk 1');
      
      // Create a branch from trunk1 (auto-selects branch 1)
      useChatStore.getState().createBranch(sessionId, trunk1.id, 'Branch 1');
      
      const messages = useChatStore.getState().getMessages(sessionId);
      // Should include trunk1 and Branch 1 (branch auto-selected)
      expect(messages).toHaveLength(2);
      expect(messages[0].content).toBe('Trunk 1');
      expect(messages[1].content).toBe('Branch 1');
    });

    it('should return empty for non-existent session', () => {
      const messages = useChatStore.getState().getMessages('non-existent');
      expect(messages).toEqual([]);
    });
  });
});
