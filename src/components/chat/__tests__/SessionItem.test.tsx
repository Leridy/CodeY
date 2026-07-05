import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { SessionItem } from "../SessionItem";
import type { ChatSession } from "../../../types/chat";

const createMockSession = (overrides: Partial<ChatSession> = {}): ChatSession => ({
  id: "session-1",
  title: "Test Session",
  messages: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
  model: "claude-sonnet-4-20250514",
  provider: "anthropic",
  ...overrides,
});

describe("SessionItem", () => {
  it("should render session title", () => {
    const session = createMockSession({ title: "My Chat" });
    render(<SessionItem session={session} isActive={false} onSelect={vi.fn()} onDelete={vi.fn()} onRename={vi.fn()} />);
    expect(screen.getByText("My Chat")).toBeDefined();
  });

  it("should show message count", () => {
    const session = createMockSession({
      messages: [
        { id: "m1", role: "user", content: "hi", timestamp: Date.now(), toolCalls: [], parentId: null, branchIndex: 0, status: "completed" },
      ],
    });
    render(<SessionItem session={session} isActive={false} onSelect={vi.fn()} onDelete={vi.fn()} onRename={vi.fn()} />);
    expect(screen.getByText("1 message")).toBeDefined();
  });

  it("should call onSelect when clicked", () => {
    const onSelect = vi.fn();
    const session = createMockSession();
    render(<SessionItem session={session} isActive={false} onSelect={onSelect} onDelete={vi.fn()} onRename={vi.fn()} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onSelect).toHaveBeenCalledWith("session-1");
  });

  it("should apply active styles when isActive is true", () => {
    const session = createMockSession();
    render(<SessionItem session={session} isActive={true} onSelect={vi.fn()} onDelete={vi.fn()} onRename={vi.fn()} />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-current", "true");
  });

  it("should show rename and delete buttons on hover", () => {
    const session = createMockSession();
    render(<SessionItem session={session} isActive={false} onSelect={vi.fn()} onDelete={vi.fn()} onRename={vi.fn()} />);
    const container = screen.getByRole("button");
    fireEvent.mouseEnter(container);
    expect(screen.getByLabelText("Rename")).toBeDefined();
    expect(screen.getByLabelText("Delete")).toBeDefined();
  });

  it("should call onDelete when delete button is clicked", () => {
    const onDelete = vi.fn();
    const session = createMockSession();
    render(<SessionItem session={session} isActive={false} onSelect={vi.fn()} onDelete={onDelete} onRename={vi.fn()} />);
    fireEvent.mouseEnter(screen.getByRole("button"));
    fireEvent.click(screen.getByLabelText("Delete"));
    expect(onDelete).toHaveBeenCalledWith("session-1");
  });

  it("should enter edit mode on double click", () => {
    const session = createMockSession({ title: "Editable" });
    render(<SessionItem session={session} isActive={false} onSelect={vi.fn()} onDelete={vi.fn()} onRename={vi.fn()} />);
    fireEvent.doubleClick(screen.getByRole("button"));
    expect(screen.getByLabelText("Session title")).toBeDefined();
  });

  it("should call onRename when editing is confirmed", () => {
    const onRename = vi.fn();
    const session = createMockSession({ title: "Old Title" });
    render(<SessionItem session={session} isActive={false} onSelect={vi.fn()} onDelete={vi.fn()} onRename={onRename} />);
    fireEvent.doubleClick(screen.getByRole("button"));
    const input = screen.getByLabelText("Session title");
    fireEvent.change(input, { target: { value: "New Title" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onRename).toHaveBeenCalledWith("session-1", "New Title");
  });

  it("should cancel editing on Escape", () => {
    const onRename = vi.fn();
    const session = createMockSession({ title: "Original" });
    render(<SessionItem session={session} isActive={false} onSelect={vi.fn()} onDelete={vi.fn()} onRename={onRename} />);
    fireEvent.doubleClick(screen.getByRole("button"));
    const input = screen.getByLabelText("Session title");
    fireEvent.change(input, { target: { value: "Changed" } });
    fireEvent.keyDown(input, { key: "Escape" });
    expect(onRename).not.toHaveBeenCalled();
  });
});
