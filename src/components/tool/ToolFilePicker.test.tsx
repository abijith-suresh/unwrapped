import { fireEvent, render } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";

import ToolFilePicker from "./ToolFilePicker";

describe("ToolFilePicker", () => {
  it("renders a keyboard-focusable action that opens the native picker", () => {
    const { getByRole } = render(() => <ToolFilePicker />);
    const button = getByRole("button", { name: "Open file" });
    const click = vi.spyOn(HTMLInputElement.prototype, "click");

    expect(button).not.toHaveAttribute("tabindex", "-1");
    fireEvent.click(button);

    expect(click).toHaveBeenCalledOnce();
    click.mockRestore();
  });

  it("forwards the selected file and resets the native input", () => {
    const onFileChange = vi.fn();
    const { container } = render(() => <ToolFilePicker onFileChange={onFileChange} />);
    const input = container.querySelector('input[type="file"]');
    const file = new File(["content"], "example.txt", { type: "text/plain" });

    if (!input) {
      throw new Error("File input was not rendered");
    }

    Object.defineProperty(input, "files", {
      configurable: true,
      value: [file],
    });
    fireEvent.change(input);

    expect(onFileChange).toHaveBeenCalledWith(file);
    expect(input).toHaveValue("");
  });
});
