/**
 * MessageContent Component
 *
 * Renders message content with Markdown support.
 * Handles code blocks, tables, and other GFM features.
 */

import { memo, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { CodeBlock } from '../shared/CodeBlock';
import type { Components } from 'react-markdown';

export interface MessageContentProps {
  /** Message content in Markdown format */
  content: string;
  /** Whether currently streaming */
  isStreaming?: boolean;
  /** Custom class name */
  className?: string;
}

export const MessageContent = memo(function MessageContent({
  content,
  isStreaming = false,
  className = '',
}: MessageContentProps) {
  const components: Components = useMemo(
    () => ({
      code({ className, children, ...props }) {
        const match = /language-(\w+)/.exec(className || '');
        const isInline = !match && !className;

        if (isInline) {
          return (
            <code
              className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-sm font-mono"
              {...props}
            >
              {children}
            </code>
          );
        }

        return (
          <CodeBlock
            code={String(children).replace(/\n$/, '')}
            language={match?.[1] ?? 'text'}
          />
        );
      },
      table({ children }) {
        return (
          <div className="overflow-x-auto my-4">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              {children}
            </table>
          </div>
        );
      },
      th({ children }) {
        return (
          <th className="px-4 py-2 text-left text-sm font-semibold bg-gray-50 dark:bg-gray-800">
            {children}
          </th>
        );
      },
      td({ children }) {
        return (
          <td className="px-4 py-2 text-sm border-t border-gray-200 dark:border-gray-700">
            {children}
          </td>
        );
      },
      a({ href, children }) {
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 underline"
          >
            {children}
          </a>
        );
      },
      img({ src, alt }) {
        return (
          <img
            src={src}
            alt={alt ?? ''}
            className="max-w-full h-auto rounded-lg my-2"
            loading="lazy"
          />
        );
      },
      ul({ children }) {
        return <ul className="list-disc list-inside my-2 space-y-1">{children}</ul>;
      },
      ol({ children }) {
        return <ol className="list-decimal list-inside my-2 space-y-1">{children}</ol>;
      },
      blockquote({ children }) {
        return (
          <blockquote className="pl-4 border-l-4 border-gray-300 dark:border-gray-600 italic my-2">
            {children}
          </blockquote>
        );
      },
      hr() {
        return <hr className="my-4 border-gray-200 dark:border-gray-700" />;
      },
      h1({ children }) {
        return <h1 className="text-2xl font-bold mt-6 mb-2">{children}</h1>;
      },
      h2({ children }) {
        return <h2 className="text-xl font-bold mt-5 mb-2">{children}</h2>;
      },
      h3({ children }) {
        return <h3 className="text-lg font-semibold mt-4 mb-2">{children}</h3>;
      },
      h4({ children }) {
        return <h4 className="text-base font-semibold mt-3 mb-1">{children}</h4>;
      },
      p({ children }) {
        return <p className="my-1 leading-relaxed">{children}</p>;
      },
    }),
    []
  );

  if (!content && isStreaming) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
      </div>
    );
  }

  if (!content) {
    return null;
  }

  return (
    <div className={`prose prose-sm dark:prose-invert max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={components}
      >
        {content}
      </ReactMarkdown>
      {isStreaming && (
        <span className="inline-block w-2 h-4 ml-1 bg-gray-400 dark:bg-gray-500 animate-pulse" />
      )}
    </div>
  );
});
