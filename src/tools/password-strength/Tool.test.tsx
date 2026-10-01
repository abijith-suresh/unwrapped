import { fireEvent, render, screen } from "@solidjs/testing-library";
import { expect, it, vi } from "vitest";
import Tool from "./Tool";

it("masks the secret, evaluates locally and clears the secret and result", () => {
  const request = vi.spyOn(globalThis, "fetch");
  const storage = vi.spyOn(Storage.prototype, "setItem");
  render(() => <Tool />);
  const input = screen.getByLabelText("Password to evaluate");
  expect(input).toHaveAttribute("type", "password");
  fireEvent.input(input, { target: { value: "password" } });
  fireEvent.click(screen.getByRole("button", { name: "Evaluate strength" }));
  expect(screen.getByText("Very weak · 0/4")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Show password" }));
  expect(input).toHaveAttribute("type", "text");
  fireEvent.click(screen.getByRole("button", { name: "Clear" }));
  expect(input).toHaveValue("");
  expect(input).toHaveAttribute("type", "password");
  expect(screen.queryByRole("meter")).toBeNull();
  expect(request).not.toHaveBeenCalled();
  expect(storage).not.toHaveBeenCalled();
  request.mockRestore();
  storage.mockRestore();
});
