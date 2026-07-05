/**
 * ToolCallList Component
 *
 * Renders a list of ToolCallCard components.
 */

import { memo } from 'react';
import type { ToolCallState } from '../../types/chat';
import { ToolCallCard } from './ToolCallCard';

export interface ToolCallListProps {
  /** List of tool calls */
  toolCalls: ToolCallState[];
  /** Default expand state for all cards */
  defaultExpanded?: boolean;
  /** Custom class name */
  className?: string;
}

export const ToolCallList = memo(function ToolCallList({
  toolCalls,
  defaultExpanded = false,
  className = '',
}: ToolCallListProps) {
  if (toolCalls.length === 0) return null;
  return (
    <div className={`flex flex-col gap-2 ${className}`} data-testid="tool-call-list">
      {toolCalls.map(tc => (
        <ToolCallCard key={tc.id} toolCall={tc} defaultExpanded={defaultExpanded} />
      ))}
    </div>
  );
});
