import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSession } from "../useSession";
import { useChatStore, useSessionStore } from "../../stores/chatStore";

// Reset stores before each test
beforeEach(() => {
  useChatStore.setState({ activeSessionId: null, isStreaming: false, streamingMessageId: null });
  useSessionStore.setState({ sessions: {}, sessionList: [] });
});

describe("useSession", () => {
  it("should return null activeSession initially", () => {
    const { result } = renderHook(() => useSession());
    expect(result.current.activeSession).toBeNull();
  });

  it("should return empty sessions list initially", () => {
    const { result } = renderHook(() => useSession());
    expect(result.current.sessions).toEqual([]);
  });

  it("should create a session and set it as active", () => {
    const { result } = renderHook(() => useSession());
    act(() => {
      result.current.create({ title: "Test Chat" });
    });
    expect(result.current.activeSession).not.toBeNull();
    expect(result.current.activeSession?.title).toBe("Test Chat");
    expect(result.current.sessions.length).toBe(1);
  });

  it("should switch to a different session", () => {
    const { result } = renderHook(() => useSession());
    let s1: string;
    act(() => {
      const session1 = result.current.create({ title: "Chat 1" });
      s1 = session1.id;
    });
    act(() => {
      result.current.create({ title: "Chat 2" });
    });
    expect(result.current.activeSession?.title).toBe("Chat 2");
    act(() => {
      result.current.switchTo(s1!);
    });
    expect(result.current.activeSession?.title).toBe("Chat 1");
  });

  it("should delete a session", () => {
    const { result } = renderHook(() => useSession());
    act(() => {
      result.current.create({ title: "To Delete" });
    });
    expect(result.current.sessions.length).toBe(1);
    const sessionId = result.current.activeSession!.id;
    act(() => {
      result.current.remove(sessionId);
    });
    expect(result.current.sessions.length).toBe(0);
    expect(result.current.activeSession).toBeNull();
  });

  it("should rename a session", () => {
    const { result } = renderHook(() => useSession());
    act(() => {
      result.current.create({ title: "Old Name" });
    });
    const sessionId = result.current.activeSession!.id;
    act(() => {
      result.current.rename(sessionId, "New Name");
    });
    expect(result.current.activeSession?.title).toBe("New Name");
  });
});
