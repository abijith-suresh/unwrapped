import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";

import ToolToolbar from "./ToolToolbar";

describe("ToolToolbar", () => {
  it("exposes its label through the fieldset legend", () => {
    const { container, getByRole } = render(() => (
      <ToolToolbar label="Formatting controls">
        <button type="button">Format</button>
      </ToolToolbar>
    ));

    expect(container.querySelector("fieldset")).toBeInTheDocument();
    expect(container.querySelector("legend")).toHaveTextContent("Formatting controls");
    expect(getByRole("group", { name: "Formatting controls" })).toBeInTheDocument();
    expect(getByRole("button", { name: "Format" })).toBeInTheDocument();
  });
});
