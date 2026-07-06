/**
 * BranchNavigator Component
 *
 * Navigation controls for switching between message branches.
 * Shows Previous/Next buttons, branch indicator, and optional create branch button.
 */

import { memo, useCallback } from 'react';
import { BranchIndicator } from './BranchIndicator';

export interface BranchNavigatorProps {
  /** Current branch index (0-based) */
  currentIndex: number;
  /** Total number of branches */
  totalBranches: number;
  /** Callback when switching to a different branch */
  onSwitch: (index: number) => void;
  /** Callback when creating a new branch */
  onCreateBranch?: () => void;
  /** Custom class name */
  className?: string;
}

export const BranchNavigator = memo(function BranchNavigator({
  currentIndex,
  totalBranches,
  onSwitch,
  onCreateBranch,
  className = '',
}: BranchNavigatorProps) {
  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < totalBranches - 1;

  const handlePrevious = useCallback(() => {
    if (canGoPrevious) {
      onSwitch(currentIndex - 1);
    }
  }, [currentIndex, canGoPrevious, onSwitch]);

  const handleNext = useCallback(() => {
    if (canGoNext) {
      onSwitch(currentIndex + 1);
    }
  }, [currentIndex, canGoNext, onSwitch]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && canGoPrevious) {
        e.preventDefault();
        onSwitch(currentIndex - 1);
      } else if (e.key === 'ArrowRight' && canGoNext) {
        e.preventDefault();
        onSwitch(currentIndex + 1);
      }
    },
    [currentIndex, canGoPrevious, canGoNext, onSwitch]
  );

  if (totalBranches <= 1 && !onCreateBranch) {
    return null;
  }

  return (
    <div
      className={`
        inline-flex items-center gap-1
        ${className}
      `}
      data-testid="branch-navigator"
      role="navigation"
      aria-label="Branch navigation"
      onKeyDown={handleKeyDown}
    >
      {/* Previous button */}
      <button
        type="button"
        onClick={handlePrevious}
        disabled={!canGoPrevious}
        className={`
          p-1 rounded transition-colors
          ${canGoPrevious
            ? 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
          }
        `}
        aria-label="Previous branch"
        data-testid="branch-prev"
      >
        <svg
          className="w-3.5 h-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {/* Branch indicator */}
      <BranchIndicator
        currentIndex={currentIndex}
        totalBranches={totalBranches}
      />

      {/* Next button */}
      <button
        type="button"
        onClick={handleNext}
        disabled={!canGoNext}
        className={`
          p-1 rounded transition-colors
          ${canGoNext
            ? 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
          }
        `}
        aria-label="Next branch"
        data-testid="branch-next"
      >
        <svg
          className="w-3.5 h-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {/* Create branch button (optional) */}
      {onCreateBranch && (
        <button
          type="button"
          onClick={onCreateBranch}
          className={`
            p-1 rounded transition-colors
            text-gray-500 dark:text-gray-400
            hover:bg-gray-200 dark:hover:bg-gray-700
            hover:text-gray-700 dark:hover:text-gray-200
          `}
          aria-label="Create branch"
          title="Create new branch from this message"
          data-testid="branch-create"
        >
          <svg
            className="w-3.5 h-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      )}
    </div>
  );
});
