/**
 * ChatPanel Component
 *
 * Main chat panel container that integrates all chat sub-components.
 */

import { memo, useCallback } from 'react';
import { useChat } from '../../hooks/useChat';
import { useStreamListener } from '../../hooks/useStreamListener';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { StreamIndicator } from './StreamIndicator';

export interface ChatPanelProps {
  /** Panel ID (for GridContainer integration) */
  panelId?: string;
  /** Custom class name */
  className?: string;
}

export const ChatPanel = memo(function ChatPanel({
  panelId: _panelId,
  className = '',
}: ChatPanelProps) {
  const {
    messages,
    isStreaming,
    send,
    stop,
    model,
  } = useChat();

  // Set up stream listeners
  useStreamListener({
    enabled: true,
  });

  const handleSend = useCallback(
    async (content: string) => {
      await send(content);
    },
    [send]
  );

  const handleStop = useCallback(async () => {
    await stop();
  }, [stop]);

  return (
    <div
      className={`
        flex flex-col h-full
        bg-white dark:bg-gray-900
        ${className}
      `}
      role="main"
      aria-label="Chat panel"
    >
      {/* Message list */}
      <MessageList
        messages={messages}
        isStreaming={isStreaming}
      />

      {/* Stream indicator */}
      <StreamIndicator
        isStreaming={isStreaming}
        model={model}
        onStop={handleStop}
      />

      {/* Input area */}
      <ChatInput
        onSend={handleSend}
        isStreaming={isStreaming}
        placeholder={isStreaming ? 'AI is responding...' : 'Type a message...'}
      />
    </div>
  );
});
