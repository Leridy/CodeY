/**
 * MessageList Component
 *
 * Virtualized message list using react-virtuoso.
 * Supports auto-scrolling and dynamic height messages.
 */

import { memo, useCallback, useMemo } from 'react';
import { Virtuoso } from 'react-virtuoso';
import type { ChatMessage } from '../../types/chat';
import { MessageBubble } from './MessageBubble';
import { EmptyState } from './EmptyState';

export interface MessageListProps {
  /** Message list */
  messages: ChatMessage[];
  /** Whether currently streaming */
  isStreaming?: boolean;
  /** Custom class name */
  className?: string;
}

const ITEM_HEIGHT_ESTIMATE = 100;

const EmptyPlaceholder = memo(function EmptyPlaceholder() {
  return <EmptyState />;
});

export const MessageList = memo(function MessageList({
  messages,
  isStreaming = false,
  className = '',
}: MessageListProps) {
  const itemContent = useCallback(
    (_index: number, message: ChatMessage) => {
      return (
        <MessageBubble
          message={message}
          isStreaming={isStreaming && message.status === 'streaming'}
          showTimestamp
          showAvatar
        />
      );
    },
    [isStreaming]
  );

  const computeItemKey = useCallback(
    (_index: number, message: ChatMessage) => message.id,
    []
  );

  const followOutput = useCallback(
    (isAtBottom: boolean) => {
      if (isStreaming && isAtBottom) {
        return 'smooth';
      }
      return false;
    },
    [isStreaming]
  );

  const totalCount = useMemo(() => messages.length, [messages]);

  if (totalCount === 0) {
    return (
      <div className={`flex-1 ${className}`}>
        <EmptyPlaceholder />
      </div>
    );
  }

  return (
    <div className={`flex-1 ${className}`}>
      <Virtuoso
        data={messages}
        itemContent={itemContent}
        computeItemKey={computeItemKey}
        followOutput={followOutput}
        initialTopMostItemIndex={totalCount - 1}
        overscan={200}
        defaultItemHeight={ITEM_HEIGHT_ESTIMATE}
        style={{ height: '100%' }}
        components={{
          Footer: () => <div className="h-4" />,
        }}
      />
    </div>
  );
});
