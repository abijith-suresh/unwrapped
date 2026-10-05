import { fireEvent, render, screen } from "@solidjs/testing-library";
import { afterEach, expect, it, vi } from "vitest";
import Tool from "./Tool";

afterEach(() => vi.restoreAllMocks());

it("masks the secret, evaluates locally and clears the secret and result", () => {
  const request = vi.spyOn(globalThis, "fetch");
  const storage = vi.spyOn(Storage.prototype, "setItem");
  render(() => <Tool />);
  const input = screen.getByLabelText("Password to evaluate");
  expect(input).toHaveAttribute("type", "password");
  fireEvent.input(input, { target: { value: "password" } });
  expect(screen.queryByRole("button", { name: "Evaluate strength" })).toBeNull();
  expect(screen.getByText("Very weak · 0/4")).toBeInTheDocument();
  const visibility = screen.getByRole("button", { name: "Show password" });
  expect(visibility).toHaveAttribute("aria-pressed", "false");
  fireEvent.click(visibility);
  expect(visibility).toHaveAttribute("aria-pressed", "true");
  expect(input).toHaveAttribute("type", "text");
  fireEvent.input(input, { target: { value: "a".repeat(257) } });
  expect(screen.getByRole("alert")).toHaveTextContent("Use at most 256 characters");
  expect(screen.queryByRole("meter")).not.toBeInTheDocument();
  expect(screen.queryByRole("note", { name: "Example output" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Clear" }));
  expect(input).toHaveValue("");
  expect(input).toHaveAttribute("type", "password");
  expect(screen.getByRole("note", { name: "Example output" })).toBeInTheDocument();
  expect(screen.getByRole("meter")).toBeInTheDocument();
  expect(request).not.toHaveBeenCalled();
  expect(storage).not.toHaveBeenCalled();
});
