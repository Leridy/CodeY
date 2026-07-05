/**
 * StreamIndicator Component
 *
 * Shows streaming status with animation and stop button.
 */

import { memo } from 'react';

export interface StreamIndicatorProps {
  /** Whether currently streaming */
  isStreaming: boolean;
  /** Model name */
  model?: string;
  /** Stop callback */
  onStop?: () => void;
  /** Custom class name */
  className?: string;
}

export const StreamIndicator = memo(function StreamIndicator({
  isStreaming,
  model,
  onStop,
  className = '',
}: StreamIndicatorProps) {
  if (!isStreaming) {
    return null;
  }

  return (
    <div
      className={`
        flex items-center gap-2 px-4 py-2
        bg-blue-50 dark:bg-blue-900/20
        border-t border-blue-200 dark:border-blue-800
        ${className}
      `}
    >
      {/* Animated dots */}
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
        <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
        <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
      </div>

      {/* Status text */}
      <span className="text-sm text-blue-600 dark:text-blue-400">
        {model ? `Generating with ${model}...` : 'Generating...'}
      </span>

      {/* Stop button */}
      {onStop && (
        <button
          onClick={onStop}
          className="ml-auto px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
        >
          Stop
        </button>
      )}
    </div>
  );
});
