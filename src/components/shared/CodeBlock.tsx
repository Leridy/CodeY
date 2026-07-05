/**
 * CodeBlock Component
 *
 * Syntax-highlighted code block with copy functionality.
 * Uses react-syntax-highlighter for highlighting.
 */

import { memo, useMemo } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { CopyButton } from './CopyButton';

export interface CodeBlockProps {
  /** Code content */
  code: string;
  /** Programming language */
  language?: string;
  /** Whether to show line numbers */
  showLineNumbers?: boolean;
  /** Whether to show copy button */
  showCopyButton?: boolean;
  /** Custom class name */
  className?: string;
}

export const CodeBlock = memo(function CodeBlock({
  code,
  language = 'text',
  showLineNumbers = true,
  showCopyButton = true,
  className = '',
}: CodeBlockProps) {
  const trimmedCode = useMemo(() => code.replace(/\n+$/, ''), [code]);

  return (
    <div className={`relative group rounded-lg overflow-hidden ${className}`}>
      {/* Header with language and copy button */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 dark:bg-gray-900 border-b border-gray-700">
        <span className="text-xs font-mono text-gray-400">
          {language}
        </span>
        {showCopyButton && (
          <CopyButton
            text={trimmedCode}
            label="Copy code"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          />
        )}
      </div>

      {/* Code content */}
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        showLineNumbers={showLineNumbers}
        customStyle={{
          margin: 0,
          borderRadius: 0,
          padding: '1rem',
          fontSize: '0.875rem',
          lineHeight: '1.5',
        }}
        lineNumberStyle={{
          minWidth: '2.5em',
          paddingRight: '1em',
          color: '#6b7280',
          borderRight: '1px solid #374151',
          marginRight: '1em',
        }}
      >
        {trimmedCode}
      </SyntaxHighlighter>
    </div>
  );
});
