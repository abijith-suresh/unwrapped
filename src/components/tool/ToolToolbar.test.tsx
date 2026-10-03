import { render, within } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";

import ToolToolbar from "./ToolToolbar";

describe("ToolToolbar", () => {
  it("groups controls under an accessible name", () => {
    const { getByRole } = render(() => (
      <ToolToolbar label="Formatting controls">
        <button type="button">Format</button>
      </ToolToolbar>
    ));

    const controls = getByRole("group", { name: "Formatting controls" });
    expect(within(controls).getByRole("button", { name: "Format" })).toBeEnabled();
  });
});
