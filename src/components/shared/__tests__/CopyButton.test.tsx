/**
 * CopyButton Tests
 *
 * Tests copy functionality and visual feedback.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CopyButton } from '../CopyButton';

// Mock clipboard API
const mockWriteText = vi.fn().mockResolvedValue(undefined);
Object.assign(navigator, {
  clipboard: {
    writeText: mockWriteText,
  },
});

describe('CopyButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render copy button', () => {
    render(<CopyButton text="Hello" />);
    expect(screen.getByRole('button', { name: /copy/i })).toBeDefined();
  });

  it('should show default label', () => {
    render(<CopyButton text="Hello" />);
    expect(screen.getByText('Copy')).toBeDefined();
  });

  it('should show custom label', () => {
    render(<CopyButton text="Hello" label="Copy code" />);
    expect(screen.getByText('Copy code')).toBeDefined();
  });

  it('should copy text to clipboard on click', async () => {
    render(<CopyButton text="Hello World" />);

    const button = screen.getByRole('button', { name: /copy/i });
    fireEvent.click(button);

    expect(mockWriteText).toHaveBeenCalledWith('Hello World');
  });

  it('should show "Copied!" after successful copy', async () => {
    render(<CopyButton text="Hello" />);

    const button = screen.getByRole('button', { name: /copy/i });
    fireEvent.click(button);

    // Wait for the state update
    await vi.waitFor(() => {
      expect(screen.getByText('Copied!')).toBeDefined();
    });
  });

  it('should update button styling after copy', async () => {
    render(<CopyButton text="Hello" />);

    const button = screen.getByRole('button', { name: /copy/i });
    fireEvent.click(button);

    await vi.waitFor(() => {
      expect(button.className).toContain('green');
    });
  });
});
