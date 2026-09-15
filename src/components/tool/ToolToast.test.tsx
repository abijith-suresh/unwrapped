import { render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, expect, it } from "vitest";

import ToolToast from "./ToolToast";

describe("ToolToast", () => {
  it("announces an open message and hides a closed message", () => {
    const [open, setOpen] = createSignal(true);
    const { getByRole } = render(() => <ToolToast open={open()} message="Could not parse input" />);

    const toast = getByRole("status");
    expect(toast).toHaveTextContent("Could not parse input");
    expect(toast).toHaveAttribute("aria-live", "polite");
    expect(toast).toHaveAttribute("aria-atomic", "true");
    expect(toast).not.toHaveAttribute("aria-hidden", "true");

    setOpen(false);
    expect(getByRole("status", { hidden: true })).toHaveAttribute("aria-hidden", "true");
  });
});
