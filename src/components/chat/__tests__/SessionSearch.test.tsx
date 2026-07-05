import "@testing-library/jest-dom";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SessionSearch } from "../SessionSearch";

describe("SessionSearch", () => {
  it("should render search input", () => {
    render(<SessionSearch onSearch={vi.fn()} />);
    expect(screen.getByRole("textbox")).toBeDefined();
  });

  it("should show placeholder text", () => {
    render(<SessionSearch onSearch={vi.fn()} placeholder="Find sessions..." />);
    expect(screen.getByPlaceholderText("Find sessions...")).toBeDefined();
  });

  it("should call onSearch when typing", () => {
    const onSearch = vi.fn();
    render(<SessionSearch onSearch={onSearch} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "test" } });
    expect(onSearch).toHaveBeenCalledWith("test");
  });

  it("should show clear button when input has value", () => {
    render(<SessionSearch onSearch={vi.fn()} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "test" } });
    expect(screen.getByLabelText("Clear search")).toBeDefined();
  });

  it("should clear input and call onSearch with empty string", () => {
    const onSearch = vi.fn();
    render(<SessionSearch onSearch={onSearch} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "test" } });
    fireEvent.click(screen.getByLabelText("Clear search"));
    expect(onSearch).toHaveBeenCalledWith("");
    expect(input).toHaveValue("");
  });

  it("should not show clear button when input is empty", () => {
    render(<SessionSearch onSearch={vi.fn()} />);
    expect(screen.queryByLabelText("Clear search")).toBeNull();
  });
});
