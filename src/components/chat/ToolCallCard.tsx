/**
 * ToolCallCard Component
 *
 * Displays tool call information with expand/collapse functionality.
 * Shows tool name, parameters, result, and execution status.
 */

import { memo, useState, useCallback, useMemo } from 'react';
import type { ToolCallState } from '../../types/chat';

export interface ToolCallCardProps {
  /** Tool call state data */
  toolCall: ToolCallState;
  /** Whether expanded by default */
  defaultExpanded?: boolean;
  /** Custom class name */
  className?: string;
}

/** Status configuration */
const STATUS_CONFIG: Record<string, { label: string; icon: string; colorClass: string }> = {
  pending: { label: 'Pending', icon: '\u25CB', colorClass: 'text-gray-400' },
  running: { label: 'Running', icon: '\u25D0', colorClass: 'text-blue-500 animate-pulse' },
  completed: { label: 'Completed', icon: '\u25CF', colorClass: 'text-green-500' },
  error: { label: 'Error', icon: '\u2715', colorClass: 'text-red-500' },
};

function formatDuration(startTime?: number, endTime?: number): string | null {
  if (!startTime) return null;
  const end = endTime || Date.now();
  const duration = end - startTime;
  if (duration < 1000) return `${duration}ms`;
  return `${(duration / 1000).toFixed(1)}s`;
}

function formatJson(jsonStr: string): string {
  try { return JSON.stringify(JSON.parse(jsonStr), null, 2); } catch { return jsonStr; }
}

function truncateText(text: string, maxLength: number): string {
  return text.length <= maxLength ? text : text.slice(0, maxLength) + '...';
}

export const ToolCallCard = memo(function ToolCallCard({
  toolCall,
  defaultExpanded = false,
  className = '',
}: ToolCallCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const handleToggle = useCallback(() => setIsExpanded(p => !p), []);
  const statusConfig = STATUS_CONFIG[toolCall.status] || STATUS_CONFIG.pending;
  const duration = useMemo(() => formatDuration(toolCall.startTime, toolCall.endTime), [toolCall.startTime, toolCall.endTime]);
  const formattedArgs = useMemo(() => formatJson(toolCall.arguments), [toolCall.arguments]);
  const argsSummary = useMemo(() => truncateText(toolCall.arguments, 100), [toolCall.arguments]);

  return (
    <div className={`border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 ${className}`} data-testid="tool-call-card">
      <button type="button" onClick={handleToggle} className="w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150 text-left" aria-expanded={isExpanded} data-testid="tool-call-toggle">
        <span data-testid="tool-call-status">{statusConfig.icon}</span>
        <span data-testid="tool-call-name">{toolCall.name}</span>
        {!isExpanded && <span data-testid="tool-call-args-summary">{argsSummary}</span>}
        {duration && <span data-testid="tool-call-duration">{duration}</span>}
      </button>
      {isExpanded && (
        <div data-testid="tool-call-details">
          <div className="px-3 py-2">
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Arguments</h4>
            <pre className="text-xs font-mono bg-gray-100 dark:bg-gray-800 rounded p-2 overflow-x-auto max-h-48 overflow-y-auto" data-testid="tool-call-args"><code>{formattedArgs}</code></pre>
          </div>
          {toolCall.result && (
            <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Result</h4>
              <pre className="text-xs font-mono bg-gray-100 dark:bg-gray-800 rounded p-2 overflow-x-auto max-h-48 overflow-y-auto" data-testid="tool-call-result"><code>{formatJson(toolCall.result)}</code></pre>
            </div>
          )}
          {toolCall.error && (
            <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-1">Error</h4>
              <pre className="text-xs font-mono bg-red-50 dark:bg-red-900/20 rounded p-2 text-red-700 dark:text-red-300 overflow-x-auto max-h-48 overflow-y-auto" data-testid="tool-call-error"><code>{toolCall.error}</code></pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
});
