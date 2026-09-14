import { fireEvent, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, expect, it } from "vitest";

import ToolActionButton from "./ToolActionButton";

describe("ToolActionButton", () => {
  it("uses a safe default type and exposes toggle state", () => {
    const { getByRole } = render(() => (
      <ToolActionButton active variant="secondary">
        Sort keys
      </ToolActionButton>
    ));

    const button = getByRole("button", { name: "Sort keys" });
    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveAttribute("aria-pressed", "true");
  });

  it("updates its visual and accessible state when the value changes", () => {
    const [active, setActive] = createSignal(false);
    const { getByRole } = render(() => (
      <ToolActionButton active={active()} variant="toggle" onClick={() => setActive(true)}>
        Minify
      </ToolActionButton>
    ));

    const button = getByRole("button", { name: "Minify" });
    expect(button).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(button);

    expect(button).toHaveAttribute("aria-pressed", "true");
    expect(button).toHaveClass("text-[var(--accent-primary)]");
  });

  it("owns radio and tab state without exposing conflicting pressed state", () => {
    const { getByRole } = render(() => (
      <>
        <ToolActionButton active role="radio" variant="segment">
          Two spaces
        </ToolActionButton>
        <ToolActionButton active={false} role="tab" variant="segment">
          Output
        </ToolActionButton>
      </>
    ));

    const radio = getByRole("radio", { name: "Two spaces" });
    const tab = getByRole("tab", { name: "Output" });

    expect(radio).toHaveAttribute("aria-checked", "true");
    expect(radio).not.toHaveAttribute("aria-pressed");
    expect(radio).toHaveAttribute("tabindex", "0");
    expect(tab).toHaveAttribute("aria-selected", "false");
    expect(tab).not.toHaveAttribute("aria-pressed");
    expect(tab).toHaveAttribute("tabindex", "-1");
  });
});
