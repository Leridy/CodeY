/**
 * ToolCallCard Tests
 *
 * Tests tool call rendering and expand/collapse.
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ToolCallCard } from '../ToolCallCard';
import type { ToolCallState } from '../../../types/chat';

const createToolCall = (overrides: Partial<ToolCallState> = {}): ToolCallState => ({
  id: 'tc-1',
  name: 'file/read',
  arguments: '{"path": "/tmp/test.txt"}',
  status: 'completed',
  startTime: Date.now() - 1000,
  endTime: Date.now(),
  ...overrides,
});
describe('ToolCallCard', () => {
  it('should render tool name', () => {
    const tc = createToolCall({ name: 'file/read' });
    render(<ToolCallCard toolCall={tc} />);
    expect(screen.getByTestId('tool-call-name').textContent).toBe('file/read');
  });
  it('should render collapsed by default', () => {
    const tc = createToolCall();
    render(<ToolCallCard toolCall={tc} />);
    expect(screen.queryByTestId('tool-call-details')).toBeNull();
  });
  it('should expand when clicked', () => {
    const tc = createToolCall();
    render(<ToolCallCard toolCall={tc} />);
    fireEvent.click(screen.getByTestId('tool-call-toggle'));
    expect(screen.getByTestId('tool-call-details')).toBeDefined();
  });
  it('should collapse when clicked again', () => {
    const tc = createToolCall();
    render(<ToolCallCard toolCall={tc} />);
    fireEvent.click(screen.getByTestId('tool-call-toggle'));
    fireEvent.click(screen.getByTestId('tool-call-toggle'));
    expect(screen.queryByTestId('tool-call-details')).toBeNull();
  });
  it('should show args when expanded', () => {
    const tc = createToolCall({ arguments: '{"path": "/tmp/test.txt"}' });
    render(<ToolCallCard toolCall={tc} />);
    fireEvent.click(screen.getByTestId('tool-call-toggle'));
    const args = screen.getByTestId('tool-call-args');
    expect(args.textContent).toContain('/tmp/test.txt');
  });
  it('should show result when expanded and result exists', () => {
    const tc = createToolCall({ result: '{"content": "hello"}' });
    render(<ToolCallCard toolCall={tc} />);
    fireEvent.click(screen.getByTestId('tool-call-toggle'));
    expect(screen.getByTestId('tool-call-result')).toBeDefined();
  });
  it('should show error when expanded and error exists', () => {
    const tc = createToolCall({ status: 'error', error: 'File not found' });
    render(<ToolCallCard toolCall={tc} />);
    fireEvent.click(screen.getByTestId('tool-call-toggle'));
    const errEl = screen.getByTestId('tool-call-error');
    expect(errEl.textContent).toContain('File not found');
  });
  it('should render expanded when defaultExpanded is true', () => {
    const tc = createToolCall();
    render(<ToolCallCard toolCall={tc} defaultExpanded={true} />);
    expect(screen.getByTestId('tool-call-details')).toBeDefined();
  });
});
