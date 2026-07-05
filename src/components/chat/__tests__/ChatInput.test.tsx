/**
 * ChatInput Tests
 *
 * Tests input handling, keyboard shortcuts, and send behavior.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ChatInput } from '../ChatInput';

describe('ChatInput', () => {
  it('should render input field', () => {
    render(<ChatInput onSend={vi.fn()} />);
    expect(screen.getByRole('textbox')).toBeDefined();
  });

  it('should render send button', () => {
    render(<ChatInput onSend={vi.fn()} />);
    expect(screen.getByRole('button', { name: /send/i })).toBeDefined();
  });

  it('should call onSend when clicking send button', () => {
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Hello' } });

    const sendButton = screen.getByRole('button', { name: /send/i });
    fireEvent.click(sendButton);

    expect(onSend).toHaveBeenCalledWith('Hello');
  });

  it('should call onSend when pressing Enter', () => {
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });

    expect(onSend).toHaveBeenCalledWith('Hello');
  });

  it('should not call onSend when pressing Shift+Enter', () => {
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });

    expect(onSend).not.toHaveBeenCalled();
  });

  it('should not call onSend with empty message', () => {
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} />);

    const sendButton = screen.getByRole('button', { name: /send/i });
    fireEvent.click(sendButton);

    expect(onSend).not.toHaveBeenCalled();
  });

  it('should disable input when streaming', () => {
    render(<ChatInput onSend={vi.fn()} isStreaming={true} />);

    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('should disable input when disabled prop is true', () => {
    render(<ChatInput onSend={vi.fn()} disabled={true} />);

    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('should show placeholder text', () => {
    render(<ChatInput onSend={vi.fn()} placeholder="Type here..." />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('placeholder', 'Type here...');
  });

  it('should clear input after send', () => {
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Hello' } });

    const sendButton = screen.getByRole('button', { name: /send/i });
    fireEvent.click(sendButton);

    expect(input).toHaveValue('');
  });
});
