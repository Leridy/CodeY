import { useState, useCallback, useRef, useEffect, memo } from "react";
import type { ChatSession } from "../../types/chat";

export interface SessionItemProps {
  session: ChatSession;
  isActive: boolean;
  onSelect: (sessionId: string) => void;
  onDelete: (sessionId: string) => void;
  onRename: (sessionId: string, title: string) => void;
  className?: string;
}

/**
 * Format timestamp as relative time string (e.g., "5m ago", "2h ago").
 * Extracted to module level to avoid recreating on every render.
 */
function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days > 0) return `${days}d ago`;
  if (hrs > 0) return `${hrs}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return "now";
}

export const SessionItem = memo(function SessionItem({
  session, isActive, onSelect, onDelete, onRename, className = "",
}: SessionItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(session.title);
  const [showActions, setShowActions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) { inputRef.current.focus(); inputRef.current.select(); }
  }, [isEditing]);

  const handleClick = useCallback(() => {
    if (!isEditing) onSelect(session.id);
  }, [session.id, isEditing, onSelect]);

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
    setEditValue(session.title);
  }, [session.title]);

  const handleRenameSubmit = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== session.title) onRename(session.id, trimmed);
    setIsEditing(false);
  }, [session.id, session.title, editValue, onRename]);

  const handleRenameKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); handleRenameSubmit(); }
    else if (e.key === "Escape") { setIsEditing(false); setEditValue(session.title); }
  }, [session.title, handleRenameSubmit]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(session.id);
  }, [session.id, onDelete]);

  const msgCount = session.messages.length === 1
    ? "1 message"
    : `${session.messages.length} messages`;

  return (
    <div
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleClick(); }
      }}
      className={`group flex items-start gap-3 px-3 py-2.5 mx-2 rounded-lg cursor-pointer transition-colors select-none ${isActive ? "bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700" : "hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent"} ${className}`}
      aria-current={isActive ? "true" : undefined}
      aria-label={`Session: ${session.title}`}
    >
      <div className="flex-shrink-0 mt-0.5">
        <svg className={`w-4 h-4 ${isActive ? "text-blue-500" : "text-gray-400"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input ref={inputRef} type="text" value={editValue} onChange={(e) => setEditValue(e.target.value)} onBlur={handleRenameSubmit} onKeyDown={handleRenameKeyDown} className="w-full px-1 py-0 text-sm bg-white dark:bg-gray-700 border border-blue-400 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" aria-label="Session title" />
        ) : (
          <div className={`text-sm font-medium truncate ${isActive ? "text-blue-700" : "text-gray-700"}`}>{session.title}</div>
        )}
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-xs text-gray-400">{msgCount}</span>
          <span className="text-xs text-gray-300">|</span>
          <span className="text-xs text-gray-400">{formatRelativeTime(session.updatedAt)}</span>
        </div>
      </div>
      {showActions && !isEditing && (<div className="flex-shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={(e) => { e.stopPropagation(); handleDoubleClick(); }} className="p-1 text-gray-400 hover:text-gray-600 rounded" aria-label="Rename"><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg></button><button onClick={handleDelete} className="p-1 text-gray-400 hover:text-red-500 rounded" aria-label="Delete"><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg></button></div>)}
    </div>
  );
});
