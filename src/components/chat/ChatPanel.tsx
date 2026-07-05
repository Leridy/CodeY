/**
 * ChatPanel Component
 *
 * Main chat panel container that integrates all chat sub-components.
 * Now includes session sidebar for session management.
 */

import { memo, useCallback, useState } from "react";
import { useChat } from "../../hooks/useChat";
import { useSession } from "../../hooks/useSession";
import { useStreamListener } from "../../hooks/useStreamListener";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { StreamIndicator } from "./StreamIndicator";
import { EmptyState } from "./EmptyState";
import { SessionSidebar } from "./SessionSidebar";

export interface ChatPanelProps {
  panelId?: string;
  className?: string;
}

export const ChatPanel = memo(function ChatPanel({
  panelId: _panelId,
  className = "",
}: ChatPanelProps) {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const { messages, isStreaming, send, stop, model } = useChat();
  const { activeSession, sessions, create, switchTo, remove, rename } = useSession();

  useStreamListener({ enabled: true });

  const handleSend = useCallback(
    async (content: string) => {
      // Create session first if none exists, then send message.
      // Both create() and send() now read sessionId directly from store,
      // so send() will use the newly created session's ID.
      if (!activeSession) {
        create();
      }
      await send(content);
    },
    [send, activeSession, create]
  );

  const handleStop = useCallback(async () => {
    await stop();
  }, [stop]);

  const handleNewSession = useCallback(() => {
    create();
  }, [create]);

  const handleToggleSidebar = useCallback(() => {
    setSidebarVisible((prev) => !prev);
  }, []);

  const handleCloseSidebar = useCallback(() => {
    setSidebarVisible(false);
  }, []);

  const hasMessages = messages.length > 0;

  return (
    <div
      className={`flex h-full bg-white dark:bg-gray-900 ${className}`}
      role="main"
      aria-label="Chat panel"
    >
      <SessionSidebar
        visible={sidebarVisible}
        activeSessionId={activeSession?.id ?? null}
        sessions={sessions}
        onSelect={switchTo}
        onNewSession={handleNewSession}
        onDelete={remove}
        onRename={rename}
        onClose={handleCloseSidebar}
      />
      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={handleToggleSidebar}
            className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
            aria-label="Toggle sessions"
            title="Sessions"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          {activeSession && (
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
              {activeSession.title}
            </span>
          )}
          <div className="ml-auto">
            <button
              onClick={handleNewSession}
              className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
              aria-label="New session"
              title="New session"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
        </div>
        {hasMessages ? (
          <MessageList messages={messages} isStreaming={isStreaming} />
        ) : (
          <EmptyState />
        )}
        <StreamIndicator isStreaming={isStreaming} model={model} onStop={handleStop} />
        <ChatInput
          onSend={handleSend}
          isStreaming={isStreaming}
          placeholder={isStreaming ? "AI is responding..." : "Type a message..."}
        />
      </div>
    </div>
  );
});
