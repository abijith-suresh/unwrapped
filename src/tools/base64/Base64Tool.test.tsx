import { fireEvent, render, waitFor } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import Base64Tool from "./Base64Tool";

describe("Base64 composed controls and panels", () => {
  it("opens a file directly and removes it to return to typed input", async () => {
    const view = render(() => <Base64Tool />);
    const file = new File([new Uint8Array([0, 255, 16])], "bytes.bin");
    Object.defineProperty(file, "arrayBuffer", {
      value: async () => new Uint8Array([0, 255, 16]).buffer,
    });
    fireEvent.change(view.container.querySelector('input[type="file"]') as HTMLInputElement, {
      target: { files: [file] },
    });
    await waitFor(() => expect(view.container.querySelector("pre")).toHaveTextContent("AP8Q"));
    expect(view.queryByRole("textbox")).not.toBeInTheDocument();
    expect(view.getByRole("button", { name: "Replace file" })).toBeEnabled();
    fireEvent.click(view.getByRole("button", { name: "Remove file" }));
    expect(view.getByRole("textbox", { name: "Plain text" })).toHaveValue("");
    expect(view.getByRole("note")).toBeInTheDocument();
    fireEvent.change(view.container.querySelector('input[type="file"]') as HTMLInputElement, {
      target: { files: [file] },
    });
    await waitFor(() => expect(view.container.querySelector("pre")).toHaveTextContent("AP8Q"));
    fireEvent.click(view.getByRole("radio", { name: "Decode" }));
    expect(view.getByRole("textbox", { name: "Base64" })).toHaveValue("AP8Q");
    expect(view.container.querySelector("pre")).toHaveTextContent("00 ff 10");
    expect(view.getByRole("button", { name: "Download file" })).toBeEnabled();
  });

  it("ignores a pending file read after reset", async () => {
    const view = render(() => <Base64Tool />);
    let finish!: (value: ArrayBuffer) => void;
    const file = new File(["Ada"], "pending.txt");
    Object.defineProperty(file, "arrayBuffer", {
      value: () =>
        new Promise<ArrayBuffer>((resolve) => {
          finish = resolve;
        }),
    });
    fireEvent.change(view.container.querySelector('input[type="file"]') as HTMLInputElement, {
      target: { files: [file] },
    });
    fireEvent.click(view.getByRole("button", { name: "Reset" }));
    finish(new TextEncoder().encode("Ada").buffer);
    await Promise.resolve();
    expect(view.getByRole("textbox", { name: "Plain text" })).toHaveValue("");
    expect(view.getByRole("note")).toBeInTheDocument();
    expect(view.queryByRole("button", { name: "Remove file" })).not.toBeInTheDocument();
  });
  it("keeps examples outside the input and supports a real swap and reset", () => {
    const view = render(() => <Base64Tool />);
    const input = view.getByRole("textbox", { name: "Plain text" });
    expect(input).toHaveValue("");
    expect(view.getByRole("region", { name: "Base64" })).toContainElement(
      view.getByRole("note", { name: "Example output" })
    );
    expect(view.queryByRole("button", { name: "Copy" })).not.toBeInTheDocument();
    fireEvent.input(input, { target: { value: "Ada" } });
    expect(view.container.querySelector("pre")).toHaveTextContent("QWRh");
    expect(view.getByRole("button", { name: "Copy" })).toBeEnabled();
    fireEvent.click(view.getByRole("button", { name: "⇅ Swap" }));
    expect(view.getByRole("textbox", { name: "Base64" })).toHaveValue("QWRh");
    expect(view.container.querySelector("pre")).toHaveTextContent("Ada");
    expect(view.getByRole("radio", { name: "Decode" })).toHaveAttribute("aria-checked", "true");
    fireEvent.click(view.getByRole("button", { name: "Reset" }));
    expect(view.getByRole("textbox", { name: "Plain text" })).toHaveValue("");
    expect(view.getByRole("note", { name: "Example output" })).toBeInTheDocument();
    expect(view.queryByRole("button", { name: "Copy" })).not.toBeInTheDocument();
  });

  it("supports keyboard mode selection and reports invalid input on the editor", () => {
    const view = render(() => <Base64Tool />);
    const encode = view.getByRole("radio", { name: "Encode" });
    encode.focus();
    fireEvent.keyDown(encode, { key: "ArrowRight" });
    const decode = view.getByRole("radio", { name: "Decode" });
    expect(document.activeElement).toBe(decode);
    expect(decode).toHaveAttribute("aria-checked", "true");
    const input = view.getByRole("textbox", { name: "Base64" });
    fireEvent.input(input, { target: { value: "!invalid" } });
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription(view.getByRole("alert").textContent ?? "");
    expect(view.container.querySelector("pre")).not.toBeInTheDocument();
    fireEvent.input(input, { target: { value: "QWRh" } });
    expect(input).not.toHaveAttribute("aria-invalid", "true");
    expect(view.queryByRole("alert")).not.toBeInTheDocument();
    expect(view.container.querySelector("pre")).toHaveTextContent("Ada");
    expect(view.queryByRole("radio", { name: "File / binary" })).not.toBeInTheDocument();
    expect(view.getByRole("button", { name: "Download file" })).toBeEnabled();
    expect(view.getByRole("button", { name: "Copy" })).toBeEnabled();
    fireEvent.input(input, { target: { value: "AP8Q" } });
    expect(view.container.querySelector("pre")).toHaveTextContent("00 ff 10");
    expect(view.getByRole("button", { name: "Download file" })).toBeEnabled();
    expect(view.getByRole("button", { name: "⇅ Swap" })).toBeDisabled();
    expect(view.queryByRole("button", { name: "Copy" })).not.toBeInTheDocument();
  });
});
