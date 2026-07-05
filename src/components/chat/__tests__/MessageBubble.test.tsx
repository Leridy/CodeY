/**
 * MessageBubble Tests
 *
 * Tests message rendering with different roles and states.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageBubble } from '../MessageBubble';
import type { ChatMessage } from '../../../types/chat';

const createMessage = (overrides: Partial<ChatMessage> = {}): ChatMessage => ({
  id: 'msg-1',
  role: 'user',
  content: 'Hello',
  timestamp: Date.now(),
  toolCalls: [],
  parentId: null,
  branchIndex: 0,
  status: 'completed',
  ...overrides,
});

describe('MessageBubble', () => {
  it('should render user message', () => {
    const message = createMessage({ role: 'user', content: 'Hello' });
    render(<MessageBubble message={message} />);
    expect(screen.getByText('Hello')).toBeDefined();
  });

  it('should render assistant message', () => {
    const message = createMessage({ role: 'assistant', content: 'Hi there' });
    render(<MessageBubble message={message} />);
    expect(screen.getByText('Hi there')).toBeDefined();
  });

  it('should render system message centered', () => {
    const message = createMessage({ role: 'system', content: 'System message' });
    render(<MessageBubble message={message} />);
    expect(screen.getByText('System message')).toBeDefined();
  });

  it('should show timestamp when enabled', () => {
    const message = createMessage({ timestamp: new Date('2026-07-05T12:00:00').getTime() });
    render(<MessageBubble message={message} showTimestamp={true} />);
    // Timestamp should be rendered
    expect(screen.getByText(/:/)).toBeDefined();
  });

  it('should hide timestamp when disabled', () => {
    const message = createMessage({ timestamp: new Date('2026-07-05T12:00:00').getTime() });
    const { container } = render(<MessageBubble message={message} showTimestamp={false} />);
    // Should not have timestamp element
    const timestamp = container.querySelector('.text-xs.text-gray-400');
    expect(timestamp).toBeNull();
  });

  it('should show avatar when enabled', () => {
    const message = createMessage({ role: 'user' });
    render(<MessageBubble message={message} showAvatar={true} />);
    expect(screen.getByText('U')).toBeDefined();
  });

  it('should hide avatar when disabled', () => {
    const message = createMessage({ role: 'user' });
    const { container } = render(<MessageBubble message={message} showAvatar={false} />);
    const avatar = container.querySelector('.rounded-full');
    expect(avatar).toBeNull();
  });

  it('should show assistant avatar', () => {
    const message = createMessage({ role: 'assistant' });
    render(<MessageBubble message={message} showAvatar={true} />);
    expect(screen.getByText('A')).toBeDefined();
  });

  it('should apply error styling for error status', () => {
    const message = createMessage({ status: 'error' });
    const { container } = render(<MessageBubble message={message} />);
    const bubble = container.querySelector('.ring-2.ring-red-500');
    expect(bubble).toBeDefined();
  });

  it('should show streaming cursor when streaming', () => {
    const message = createMessage({ status: 'streaming', content: 'Typing' });
    const { container } = render(<MessageBubble message={message} isStreaming={true} />);
    const cursor = container.querySelector('.animate-pulse');
    expect(cursor).toBeDefined();
  });
});
