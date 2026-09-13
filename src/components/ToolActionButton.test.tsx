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
});
