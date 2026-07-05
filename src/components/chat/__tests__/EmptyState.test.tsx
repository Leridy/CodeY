/**
 * EmptyState Tests
 *
 * Tests empty state display with default and custom content.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from '../EmptyState';

describe('EmptyState', () => {
  it('should render default title', () => {
    render(<EmptyState />);
    expect(screen.getByText('Start a conversation')).toBeDefined();
  });

  it('should render default description', () => {
    render(<EmptyState />);
    expect(screen.getByText(/send a message/i)).toBeDefined();
  });

  it('should render custom title', () => {
    render(<EmptyState title="Custom Title" />);
    expect(screen.getByText('Custom Title')).toBeDefined();
  });

  it('should render custom description', () => {
    render(<EmptyState description="Custom description" />);
    expect(screen.getByText('Custom description')).toBeDefined();
  });

  it('should render chat icon', () => {
    const { container } = render(<EmptyState />);
    const svg = container.querySelector('svg');
    expect(svg).toBeDefined();
  });
});
