/**
 * BranchIndicator Tests
 *
 * Tests branch position display (e.g., "1/3").
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BranchIndicator } from '../BranchIndicator';

describe('BranchIndicator', () => {
  it('should not render when totalBranches is 1', () => {
    const { container } = render(
      <BranchIndicator currentIndex={0} totalBranches={1} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render branch position text', () => {
    render(<BranchIndicator currentIndex={0} totalBranches={3} />);
    expect(screen.getByTestId('branch-indicator-text').textContent).toBe('1/3');
  });

  it('should display correct 1-based index', () => {
    render(<BranchIndicator currentIndex={1} totalBranches={3} />);
    expect(screen.getByTestId('branch-indicator-text').textContent).toBe('2/3');
  });

  it('should display last branch correctly', () => {
    render(<BranchIndicator currentIndex={2} totalBranches={3} />);
    expect(screen.getByTestId('branch-indicator-text').textContent).toBe('3/3');
  });

  it('should have correct aria-label', () => {
    render(<BranchIndicator currentIndex={1} totalBranches={3} />);
    const indicator = screen.getByTestId('branch-indicator');
    expect(indicator.getAttribute('aria-label')).toBe('Branch 2 of 3');
  });

  it('should render for two branches', () => {
    render(<BranchIndicator currentIndex={0} totalBranches={2} />);
    expect(screen.getByTestId('branch-indicator-text').textContent).toBe('1/2');
  });

  it('should not render when totalBranches is 0', () => {
    const { container } = render(
      <BranchIndicator currentIndex={0} totalBranches={0} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should apply custom className', () => {
    render(
      <BranchIndicator
        currentIndex={0}
        totalBranches={2}
        className="custom-class"
      />
    );
    const indicator = screen.getByTestId('branch-indicator');
    expect(indicator.className).toContain('custom-class');
  });
});
