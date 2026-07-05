import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { SessionSidebar } from "../SessionSidebar";
import type { ChatSession } from "../../../types/chat";

const createMockSession = (id: string, title: string): ChatSession => ({
  id,
  title,
  messages: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
  model: "claude-sonnet-4-20250514",
  provider: "anthropic",
});

describe("SessionSidebar", () => {
  const defaultProps = {
    visible: true,
    activeSessionId: null,
    sessions: [] as ChatSession[],
    onSelect: vi.fn(),
    onNewSession: vi.fn(),
    onDelete: vi.fn(),
    onRename: vi.fn(),
    onClose: vi.fn(),
  };

  it("should not render when visible is false", () => {
    const { container } = render(<SessionSidebar {...defaultProps} visible={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("should render when visible is true", () => {
    render(<SessionSidebar {...defaultProps} />);
    expect(screen.getByText("Sessions")).toBeDefined();
  });

  it("should render session list", () => {
    const sessions = [
      createMockSession("s1", "Chat 1"),
      createMockSession("s2", "Chat 2"),
    ];
    render(<SessionSidebar {...defaultProps} sessions={sessions} />);
    expect(screen.getByText("Chat 1")).toBeDefined();
    expect(screen.getByText("Chat 2")).toBeDefined();
  });

  it("should call onNewSession when new button is clicked", () => {
    const onNewSession = vi.fn();
    render(<SessionSidebar {...defaultProps} onNewSession={onNewSession} />);
    fireEvent.click(screen.getByLabelText("New session"));
    expect(onNewSession).toHaveBeenCalled();
  });

  it("should call onClose when close button is clicked", () => {
    const onClose = vi.fn();
    render(<SessionSidebar {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText("Close sidebar"));
    expect(onClose).toHaveBeenCalled();
  });

  it("should show empty state when no sessions", () => {
    render(<SessionSidebar {...defaultProps} sessions={[]} />);
    expect(screen.getByText("No sessions yet")).toBeDefined();
  });

  it("should show session count in footer", () => {
    const sessions = [createMockSession("s1", "Chat 1"), createMockSession("s2", "Chat 2")];
    render(<SessionSidebar {...defaultProps} sessions={sessions} />);
    expect(screen.getByText("2 sessions")).toBeDefined();
  });

  it("should filter sessions based on search query", () => {
    const sessions = [
      createMockSession("s1", "Code Review"),
      createMockSession("s2", "Debug Help"),
    ];
    render(<SessionSidebar {...defaultProps} sessions={sessions} />);
    fireEvent.change(screen.getByLabelText("Search sessions"), { target: { value: "Code" } });
    expect(screen.getByText("Code Review")).toBeDefined();
    expect(screen.queryByText("Debug Help")).toBeNull();
  });

  it("should show no matching sessions when search has no results", () => {
    const sessions = [createMockSession("s1", "Chat 1")];
    render(<SessionSidebar {...defaultProps} sessions={sessions} />);
    fireEvent.change(screen.getByLabelText("Search sessions"), { target: { value: "xyz" } });
    expect(screen.getByText("No matching sessions")).toBeDefined();
  });
});
