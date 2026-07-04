/**
 * Sidebar Component
 *
 * Explorer panel displaying a file tree with selection and collapse support.
 */

import React from 'react'
import type { FileNode } from '../../types/layout'

interface SidebarProps {
  /** File tree data */
  fileTree: FileNode[]
  /** Currently selected path */
  selectedPath?: string
  /** Selection callback */
  onSelect: (path: string) => void
  /** Width (resizable via drag) */
  width?: number
  /** Whether the sidebar is collapsed */
  collapsed?: boolean
  /** Collapse toggle callback */
  onToggleCollapse?: () => void
}

function FileTreeItem({
  node,
  depth,
  selectedPath,
  onSelect,
}: {
  node: FileNode
  depth: number
  selectedPath?: string
  onSelect: (path: string) => void
}) {
  const isSelected = selectedPath === node.path
  const indent = depth * 16

  return (
    <>
      <button
        className="flex w-full items-center gap-1 px-2 py-1 text-sm text-left hover:opacity-80 transition-opacity"
        style={{
          paddingLeft: indent + 8,
          background: isSelected ? 'var(--color-primary)' : 'transparent',
          color: isSelected ? 'var(--color-text-inverse)' : 'var(--color-text)',
        }}
        onClick={() => onSelect(node.path)}
      >
        <span className="flex-shrink-0">
          {node.type === 'directory' ? '\u{1F4C1}' : '\u{1F4C4}'}
        </span>
        <span className="truncate">{node.name}</span>
        {node.modified && (
          <span
            className="ml-auto flex-shrink-0 w-2 h-2 rounded-full"
            style={{ background: 'var(--color-accent)' }}
          />
        )}
      </button>
      {node.type === 'directory' &&
        node.children?.map((child) => (
          <FileTreeItem
            key={child.path}
            node={child}
            depth={depth + 1}
            selectedPath={selectedPath}
            onSelect={onSelect}
          />
        ))}
    </>
  )
}

export function Sidebar({
  fileTree,
  selectedPath,
  onSelect,
  width,
  collapsed,
  onToggleCollapse,
}: SidebarProps) {
  if (collapsed) {
    return (
      <div
        className="flex flex-col items-center py-2 border-r"
        style={{
          width: 48,
          borderColor: 'var(--color-border)',
          background: 'var(--color-surface)',
        }}
      >
        <button
          onClick={onToggleCollapse}
          className="p-2 hover:opacity-80"
          title="Expand sidebar"
        >
          {'☰'}
        </button>
      </div>
    )
  }

  return (
    <div
      className="flex flex-col h-full overflow-y-auto"
      style={{ width, background: 'var(--color-surface)' }}
    >
      <div
        className="flex items-center justify-between px-3 py-2 border-b"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <span
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Explorer
        </span>
        {onToggleCollapse && (
          <button onClick={onToggleCollapse} className="hover:opacity-80" title="Collapse sidebar">
            {'✕'}
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        {fileTree.map((node) => (
          <FileTreeItem
            key={node.path}
            node={node}
            depth={0}
            selectedPath={selectedPath}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  )
}
