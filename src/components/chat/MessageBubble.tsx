/**
 * MessageBubble Component
 * Single message container with role-based styling.
 */

import { memo, useMemo } from 'react';
import type { ChatMessage } from '../../types/chat';
import { MessageContent } from './MessageContent';
import { ToolCallList } from './ToolCallList';

export interface MessageBubbleProps {
  message: ChatMessage;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  isStreaming?: boolean;
  className?: string;
}

export const MessageBubble = memo(function MessageBubble({
  message,
  showAvatar = true,
  showTimestamp = true,
  isStreaming = false,
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
        {formattedTime && <span className="text-xs text-gray-400 dark:text-gray-500 mt-1 px-1">{formattedTime}</span>}
      </div>
    </div>
  );
});
