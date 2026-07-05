/**
 * ToolCallList Tests
 *
 * Tests tool call list rendering.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ToolCallList } from '../ToolCallList';
import type { ToolCallState } from '../../../types/chat';

const createToolCall = (id: string, name: string): ToolCallState => ({
  id,
  name,
  arguments: '{}',
  status: 'completed',
});

describe('ToolCallList', () => {
  it('should render nothing when empty', () => {
    const { container } = render(<ToolCallList toolCalls={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render tool call cards', () => {
    const toolCalls = [createToolCall('tc-1', 'file/read'), createToolCall('tc-2', 'shell/execute')];
    render(<ToolCallList toolCalls={toolCalls} />);
    expect(screen.getByTestId('tool-call-list')).toBeDefined();
    const items = screen.getAllByTestId('tool-call-card');
    expect(items.length).toBe(2);
  });

  it('should render tool names', () => {
    const toolCalls = [createToolCall('tc-1', 'file/read'), createToolCall('tc-2', 'shell/execute')];
    render(<ToolCallList toolCalls={toolCalls} />);
    expect(screen.getByText('file/read')).toBeDefined();
    expect(screen.getByText('shell/execute')).toBeDefined();
  });
});
