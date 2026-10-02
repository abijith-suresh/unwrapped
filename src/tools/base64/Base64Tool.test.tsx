import { fireEvent, render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import Base64Tool from "./Base64Tool";

describe("Base64 composed controls and panels", () => {
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
    fireEvent.click(view.getByRole("radio", { name: "File / binary" }));
    expect(view.getByRole("button", { name: "Download file" })).toBeEnabled();
    expect(view.queryByRole("button", { name: "Copy" })).not.toBeInTheDocument();
  });
});
