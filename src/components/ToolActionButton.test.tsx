import { render } from "@solidjs/testing-library";
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
});
