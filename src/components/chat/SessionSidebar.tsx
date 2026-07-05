/**
 * SessionSidebar Component
 *
 * Sidebar panel displaying the list of chat sessions.
 * Supports session creation, selection, search, and deletion.
 */

import { useState, useCallback, useMemo, memo } from 'react';
import type { ChatSession } from '../../types/chat';
import { SessionSearch } from './SessionSearch';
import { SessionItem } from './SessionItem';

export interface SessionSidebarProps {
  /** Whether sidebar is visible */
  visible: boolean;
  /** Current active session ID */
  activeSessionId: string | null;
  /** All sessions */
  sessions: ChatSession[];
  /** Select session callback */
  onSelect: (sessionId: string) => void;
  /** New session callback */
  onNewSession: () => void;
  /** Delete session callback */
  onDelete: (sessionId: string) => void;
  /** Rename session callback */
  onRename: (sessionId: string, title: string) => void;
  /** Close sidebar callback */
  onClose: () => void;
  /** Custom class name */
  className?: string;
}

export const SessionSidebar = memo(function SessionSidebar({
  visible,
  activeSessionId,
  sessions,
  onSelect,
  onNewSession,
  onDelete,
  onRename,
  onClose,
  className = '',
}: SessionSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions;
    const query = searchQuery.toLowerCase();
    return sessions.filter((s) => s.title.toLowerCase().includes(query));
  }, [sessions, searchQuery]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`
        flex flex-col h-full
        bg-gray-50 dark:bg-gray-950
        border-r border-gray-200 dark:border-gray-700
        ${className}
      `}
      role="complementary"
      aria-label="Session sidebar"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Sessions
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={onNewSession}
            className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-md transition-colors"
            aria-label="New session"
            title="New session"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-md transition-colors"
            aria-label="Close sidebar"
            title="Close"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Search */}
      <SessionSearch onSearch={handleSearch} />

      {/* Session list */}
      <div className="flex-1 overflow-y-auto py-1">
        {filteredSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <svg
              className="w-10 h-10 mb-3 text-gray-300 dark:text-gray-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              {searchQuery ? 'No matching sessions' : 'No sessions yet'}
            </p>
            {!searchQuery && (
              <button
                onClick={onNewSession}
                className="mt-2 text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
              >
                Start a new chat
              </button>
            )}
          </div>
        ) : (
          filteredSessions.map((session) => (
            <SessionItem
              key={session.id}
              session={session}
              isActive={session.id === activeSessionId}
              onSelect={onSelect}
              onDelete={onDelete}
              onRename={onRename}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
          {sessions.length} {sessions.length === 1 ? 'session' : 'sessions'}
        </p>
      </div>
    </div>
  );
});
