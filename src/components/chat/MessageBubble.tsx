/**
 * MessageBubble Component
 *
 * Single message container with role-based styling.
 * Integrates BranchNavigator for messages that belong to branches.
 */

import { memo, useMemo } from 'react';
import type { ChatMessage } from '../../types/chat';
import { MessageContent } from './MessageContent';
import { ToolCallList } from './ToolCallList';
import { BranchNavigator } from './BranchNavigator';

export interface MessageBubbleProps {
  message: ChatMessage;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  isStreaming?: boolean;
  /** All messages in the session (used to compute branch info) */
  allMessages?: ChatMessage[];
  /** Callback when switching branches */
  onBranchSwitch?: (messageId: string, branchIndex: number) => void;
  /** Callback when creating a new branch */
  onCreateBranch?: (messageId: string) => void;
  className?: string;
}

export const MessageBubble = memo(function MessageBubble({
  message,
  showAvatar = true,
  showTimestamp = true,
  isStreaming = false,
  allMessages,
  onBranchSwitch,
  onCreateBranch,
  className = '',
}: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  const isSystem = message.role === 'system';

  const formattedTime = useMemo(() => {
    if (!showTimestamp) return null;
    return new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, [message.timestamp, showTimestamp]);

  const avatar = useMemo(() => {
    if (!showAvatar) return null;
    if (isUser) return <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">U</div>;
    if (isAssistant) return <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-medium">A</div>;
    return <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white text-sm font-medium">S</div>;
  }, [showAvatar, isUser, isAssistant]);

  // Compute branch info: find sibling messages with the same parentId
  const branchInfo = useMemo(() => {
    if (!allMessages || message.parentId === null) return null;

    const siblings = allMessages.filter((m) => m.parentId === message.parentId);
    if (siblings.length <= 1) return null;

    // Sort siblings by branchIndex for consistent ordering
    const sorted = [...siblings].sort((a, b) => a.branchIndex - b.branchIndex);
    const currentIndex = sorted.findIndex((m) => m.id === message.id);

    return {
      currentIndex: currentIndex >= 0 ? currentIndex : 0,
      totalBranches: sorted.length,
    };
  }, [allMessages, message.parentId, message.id]);

  const handleBranchSwitch = useMemo(() => {
    if (!onBranchSwitch || message.parentId === null) return undefined;
    return (index: number) => {
      // Find the sibling at the given sorted index
      if (!allMessages) return;
      const siblings = allMessages
        .filter((m) => m.parentId === message.parentId)
        .sort((a, b) => a.branchIndex - b.branchIndex);
      const target = siblings[index];
      if (target) {
        onBranchSwitch(message.parentId!, target.branchIndex);
      }
    };
  }, [onBranchSwitch, allMessages, message.parentId]);

  const handleCreateBranch = useMemo(() => {
    if (!onCreateBranch || message.parentId === null) return undefined;
    return () => {
      onCreateBranch(message.parentId!);
    };
  }, [onCreateBranch, message.parentId]);

  if (isSystem) {
    return (
      <div className={`flex justify-center my-4 ${className}`}>
        <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-full">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-3 my-4 ${isUser ? "flex-row-reverse" : "flex-row"} ${className}`}>
      {avatar}
      <div className={`flex flex-col max-w-[80%] ${isUser ? "items-end" : "items-start"}`}>
        <div className={`px-4 py-2 rounded-2xl ${isUser ? "bg-blue-500 text-white rounded-tr-md" : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-md"} ${message.status === "error" ? "ring-2 ring-red-500" : ""}`}>
          <MessageContent content={message.content} isStreaming={isStreaming && message.status === "streaming"} className={isUser ? "prose-invert" : ""} />
        </div>
        {message.toolCalls.length > 0 && <ToolCallList toolCalls={message.toolCalls} className="mt-2" />}
        {/* Branch navigator for branch messages */}
        {branchInfo && (
          <BranchNavigator
            currentIndex={branchInfo.currentIndex}
            totalBranches={branchInfo.totalBranches}
            onSwitch={handleBranchSwitch ?? (() => {})}
            onCreateBranch={handleCreateBranch}
            className="mt-1"
          />
        )}
        {formattedTime && <span className="text-xs text-gray-400 dark:text-gray-500 mt-1 px-1">{formattedTime}</span>}
      </div>
    </div>
  );
});
