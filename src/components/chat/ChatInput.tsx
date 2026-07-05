/**
 * ChatInput Component
 *
 * Message input area with send button and keyboard shortcuts.
 */

import { useState, useCallback, useRef, memo } from 'react';
import TextareaAutosize from 'react-textarea-autosize';

export interface ChatInputProps {
  /** Send callback */
  onSend: (content: string) => void;
  /** Whether currently streaming */
  isStreaming?: boolean;
  /** Whether input is disabled */
  disabled?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Custom class name */
  className?: string;
}

export const ChatInput = memo(function ChatInput({
  onSend,
  isStreaming = false,
  disabled = false,
  placeholder = 'Type a message...',
  className = '',
}: ChatInputProps) {
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canSend = content.trim().length > 0 && !isStreaming && !disabled;

  const handleSend = useCallback(() => {
    if (!canSend) return;

    const trimmed = content.trim();
    onSend(trimmed);
    setContent('');

    // Focus textarea after send
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
  }, [content, canSend, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Enter to send (without Shift)
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setContent(e.target.value);
    },
    []
  );

  return (
    <div
      className={`
        flex items-end gap-2 p-4
        border-t border-gray-200 dark:border-gray-700
        bg-white dark:bg-gray-900
        ${className}
      `}
    >
      {/* Textarea */}
      <div className="flex-1 relative">
        <TextareaAutosize
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isStreaming}
          minRows={1}
          maxRows={8}
          className={`
            w-full px-4 py-3
            bg-gray-100 dark:bg-gray-800
            border border-gray-200 dark:border-gray-700
            rounded-xl
            resize-none
            text-sm
            placeholder-gray-400 dark:placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
          `}
          aria-label="Message input"
        />
      </div>

      {/* Send button */}
      <button
        onClick={handleSend}
        disabled={!canSend}
        className={`
          flex-shrink-0 p-3 rounded-xl
          transition-colors
          ${canSend
            ? 'bg-blue-500 hover:bg-blue-600 text-white'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
          }
        `}
        aria-label="Send message"
        title="Send message (Enter)"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </button>
    </div>
  );
});
