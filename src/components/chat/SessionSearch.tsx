/**
 * SessionSearch Component
 *
 * Search input for filtering chat sessions by title.
 */

import { useState, useCallback, memo } from 'react';

export interface SessionSearchProps {
  /** Search value change callback */
  onSearch: (query: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Custom class name */
  className?: string;
}

export const SessionSearch = memo(function SessionSearch({
  onSearch,
  placeholder = 'Search sessions...',
  className = '',
}: SessionSearchProps) {
  const [value, setValue] = useState('');

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setValue(newValue);
      onSearch(newValue);
    },
    [onSearch]
  );

  const handleClear = useCallback(() => {
    setValue('');
    onSearch('');
  }, [onSearch]);

  return (
    <div
      className={`
        relative px-3 py-2
        ${className}
      `}
    >
      {/* Search icon */}
      <svg
        className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>

      {/* Input */}
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={`
          w-full pl-8 pr-8 py-2
          bg-gray-100 dark:bg-gray-800
          border border-transparent
          rounded-lg
          text-sm
          placeholder-gray-400 dark:placeholder-gray-500
          focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent
          transition-colors
        `}
        aria-label="Search sessions"
      />

      {/* Clear button */}
      {value.length > 0 && (
        <button
          onClick={handleClear}
          className="absolute right-5 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          aria-label="Clear search"
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
});
