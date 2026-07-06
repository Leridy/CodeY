/**
 * BranchIndicator Component
 *
 * Displays the current branch position as "currentIndex/totalBranches".
 * Used inside MessageBubble to show which branch the message belongs to.
 */

import { memo } from 'react';

export interface BranchIndicatorProps {
  /** Current branch index (0-based) */
  currentIndex: number;
  /** Total number of branches */
  totalBranches: number;
  /** Custom class name */
  className?: string;
}

export const BranchIndicator = memo(function BranchIndicator({
  currentIndex,
  totalBranches,
  className = '',
}: BranchIndicatorProps) {
  if (totalBranches <= 1) {
    return null;
  }

  return (
    <span
      className={`
        inline-flex items-center gap-1 px-1.5 py-0.5
        text-xs font-medium
        text-gray-500 dark:text-gray-400
        bg-gray-100 dark:bg-gray-800
        rounded
        select-none
        ${className}
      `}
      data-testid="branch-indicator"
      aria-label={`Branch ${currentIndex + 1} of ${totalBranches}`}
    >
      <svg
        className="w-3 h-3"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="6" y1="3" x2="6" y2="15" />
        <circle cx="18" cy="6" r="3" />
        <circle cx="6" cy="18" r="3" />
        <path d="M18 9a9 9 0 0 1-9 9" />
      </svg>
      <span data-testid="branch-indicator-text">
        {currentIndex + 1}/{totalBranches}
      </span>
    </span>
  );
});
