/**
 * EmptyState Component
 *
 * Displays when no messages exist in the chat.
 */

import { memo } from 'react';

export interface EmptyStateProps {
  /** Custom title */
  title?: string;
  /** Custom description */
  description?: string;
  /** Custom class name */
  className?: string;
}

export const EmptyState = memo(function EmptyState({
  title = 'Start a conversation',
  description = 'Send a message to begin chatting with CodeY.',
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`
        flex flex-col items-center justify-center h-full p-8
        text-center
        ${className}
      `}
    >
      {/* Icon */}
      <div className="w-16 h-16 mb-4 text-gray-300 dark:text-gray-600">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          <line x1="9" y1="10" x2="15" y2="10" />
        </svg>
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
        {title}
      </h3>

      {/* Description */}
      <p className="text-sm text-gray-500 dark:text-gray-500 max-w-sm">
        {description}
      </p>
    </div>
  );
});
