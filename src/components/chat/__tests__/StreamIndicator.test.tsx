/**
 * StreamIndicator Tests
 *
 * Tests streaming status display and stop button.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StreamIndicator } from '../StreamIndicator';

describe('StreamIndicator', () => {
  it('should not render when not streaming', () => {
    const { container } = render(
      <StreamIndicator isStreaming={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render when streaming', () => {
    render(<StreamIndicator isStreaming={true} />);
    expect(screen.getByText(/generating/i)).toBeDefined();
  });

  it('should show model name when provided', () => {
    render(<StreamIndicator isStreaming={true} model="claude-sonnet" />);
    expect(screen.getByText(/claude-sonnet/i)).toBeDefined();
  });

  it('should render stop button when onStop provided', () => {
    render(<StreamIndicator isStreaming={true} onStop={vi.fn()} />);
    expect(screen.getByRole('button', { name: /stop/i })).toBeDefined();
  });

  it('should call onStop when clicking stop button', () => {
    const onStop = vi.fn();
    render(<StreamIndicator isStreaming={true} onStop={onStop} />);

    const stopButton = screen.getByRole('button', { name: /stop/i });
    fireEvent.click(stopButton);

    expect(onStop).toHaveBeenCalled();
  });

  it('should not render stop button when onStop not provided', () => {
    render(<StreamIndicator isStreaming={true} />);
    expect(screen.queryByRole('button', { name: /stop/i })).toBeNull();
  });

  it('should show default text when no model', () => {
    render(<StreamIndicator isStreaming={true} />);
    expect(screen.getByText('Generating...')).toBeDefined();
  });
});
