/**
 * BranchNavigator Tests
 *
 * Tests branch navigation: Previous/Next switching, create branch,
 * boundary conditions, and keyboard navigation.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BranchNavigator } from '../BranchNavigator';

describe('BranchNavigator', () => {
  it('should not render when totalBranches is 1 and no onCreateBranch', () => {
    const { container } = render(
      <BranchNavigator
        currentIndex={0}
        totalBranches={1}
        onSwitch={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render when totalBranches > 1', () => {
    render(
      <BranchNavigator
        currentIndex={0}
        totalBranches={3}
        onSwitch={vi.fn()}
      />
    );
    expect(screen.getByTestId('branch-navigator')).toBeDefined();
  });

  it('should render when onCreateBranch is provided', () => {
    render(
      <BranchNavigator
        currentIndex={0}
        totalBranches={1}
        onSwitch={vi.fn()}
        onCreateBranch={vi.fn()}
      />
    );
    expect(screen.getByTestId('branch-navigator')).toBeDefined();
  });

  it('should display branch indicator with correct position', () => {
    render(
      <BranchNavigator
        currentIndex={1}
        totalBranches={3}
        onSwitch={vi.fn()}
      />
    );
    expect(screen.getByTestId('branch-indicator-text').textContent).toBe('2/3');
  });

  describe('Previous button', () => {
    it('should call onSwitch with previous index when clicked', () => {
      const onSwitch = vi.fn();
      render(
        <BranchNavigator
          currentIndex={1}
          totalBranches={3}
          onSwitch={onSwitch}
        />
      );

      fireEvent.click(screen.getByTestId('branch-prev'));
      expect(onSwitch).toHaveBeenCalledWith(0);
    });

    it('should be disabled when at first branch (currentIndex=0)', () => {
      render(
        <BranchNavigator
          currentIndex={0}
          totalBranches={3}
          onSwitch={vi.fn()}
        />
      );

      const prevButton = screen.getByTestId('branch-prev');
      expect(prevButton).toBeDisabled();
    });

    it('should not call onSwitch when disabled', () => {
      const onSwitch = vi.fn();
      render(
        <BranchNavigator
          currentIndex={0}
          totalBranches={3}
          onSwitch={onSwitch}
        />
      );

      fireEvent.click(screen.getByTestId('branch-prev'));
      expect(onSwitch).not.toHaveBeenCalled();
    });
  });

  describe('Next button', () => {
    it('should call onSwitch with next index when clicked', () => {
      const onSwitch = vi.fn();
      render(
        <BranchNavigator
          currentIndex={0}
          totalBranches={3}
          onSwitch={onSwitch}
        />
      );

      fireEvent.click(screen.getByTestId('branch-next'));
      expect(onSwitch).toHaveBeenCalledWith(1);
    });

    it('should be disabled when at last branch', () => {
      render(
        <BranchNavigator
          currentIndex={2}
          totalBranches={3}
          onSwitch={vi.fn()}
        />
      );

      const nextButton = screen.getByTestId('branch-next');
      expect(nextButton).toBeDisabled();
    });

    it('should not call onSwitch when disabled', () => {
      const onSwitch = vi.fn();
      render(
        <BranchNavigator
          currentIndex={2}
          totalBranches={3}
          onSwitch={onSwitch}
        />
      );

      fireEvent.click(screen.getByTestId('branch-next'));
      expect(onSwitch).not.toHaveBeenCalled();
    });
  });

  describe('Create branch button', () => {
    it('should render create button when onCreateBranch is provided', () => {
      render(
        <BranchNavigator
          currentIndex={0}
          totalBranches={1}
          onSwitch={vi.fn()}
          onCreateBranch={vi.fn()}
        />
      );

      expect(screen.getByTestId('branch-create')).toBeDefined();
    });

    it('should not render create button when onCreateBranch is not provided', () => {
      render(
        <BranchNavigator
          currentIndex={0}
          totalBranches={3}
          onSwitch={vi.fn()}
        />
      );

      expect(screen.queryByTestId('branch-create')).toBeNull();
    });

    it('should call onCreateBranch when clicked', () => {
      const onCreateBranch = vi.fn();
      render(
        <BranchNavigator
          currentIndex={0}
          totalBranches={1}
          onSwitch={vi.fn()}
          onCreateBranch={onCreateBranch}
        />
      );

      fireEvent.click(screen.getByTestId('branch-create'));
      expect(onCreateBranch).toHaveBeenCalledTimes(1);
    });
  });

  describe('keyboard navigation', () => {
    it('should switch to previous branch on ArrowLeft', () => {
      const onSwitch = vi.fn();
      render(
        <BranchNavigator
          currentIndex={1}
          totalBranches={3}
          onSwitch={onSwitch}
        />
      );

      fireEvent.keyDown(screen.getByTestId('branch-navigator'), {
        key: 'ArrowLeft',
      });
      expect(onSwitch).toHaveBeenCalledWith(0);
    });

    it('should switch to next branch on ArrowRight', () => {
      const onSwitch = vi.fn();
      render(
        <BranchNavigator
          currentIndex={0}
          totalBranches={3}
          onSwitch={onSwitch}
        />
      );

      fireEvent.keyDown(screen.getByTestId('branch-navigator'), {
        key: 'ArrowRight',
      });
      expect(onSwitch).toHaveBeenCalledWith(1);
    });

    it('should not switch on ArrowLeft when at first branch', () => {
      const onSwitch = vi.fn();
      render(
        <BranchNavigator
          currentIndex={0}
          totalBranches={3}
          onSwitch={onSwitch}
        />
      );

      fireEvent.keyDown(screen.getByTestId('branch-navigator'), {
        key: 'ArrowLeft',
      });
      expect(onSwitch).not.toHaveBeenCalled();
    });

    it('should not switch on ArrowRight when at last branch', () => {
      const onSwitch = vi.fn();
      render(
        <BranchNavigator
          currentIndex={2}
          totalBranches={3}
          onSwitch={onSwitch}
        />
      );

      fireEvent.keyDown(screen.getByTestId('branch-navigator'), {
        key: 'ArrowRight',
      });
      expect(onSwitch).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('should have navigation role', () => {
      render(
        <BranchNavigator
          currentIndex={0}
          totalBranches={3}
          onSwitch={vi.fn()}
        />
      );

      const nav = screen.getByRole('navigation');
      expect(nav).toBeDefined();
    });

    it('should have correct aria-label on navigation', () => {
      render(
        <BranchNavigator
          currentIndex={0}
          totalBranches={3}
          onSwitch={vi.fn()}
        />
      );

      const nav = screen.getByRole('navigation');
      expect(nav.getAttribute('aria-label')).toBe('Branch navigation');
    });

    it('should have aria-label on previous button', () => {
      render(
        <BranchNavigator
          currentIndex={1}
          totalBranches={3}
          onSwitch={vi.fn()}
        />
      );

      expect(screen.getByLabelText('Previous branch')).toBeDefined();
    });

    it('should have aria-label on next button', () => {
      render(
        <BranchNavigator
          currentIndex={0}
          totalBranches={3}
          onSwitch={vi.fn()}
        />
      );

      expect(screen.getByLabelText('Next branch')).toBeDefined();
    });
  });
});
