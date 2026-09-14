import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";

import ToolPanel from "./ToolPanel";

describe("ToolPanel", () => {
  it("provides a named region with an optional action area", () => {
    const { getByRole, getByText } = render(() => (
      <ToolPanel
        title="Output"
        description="Rendered locally."
        actions={<button type="button">Copy</button>}
      >
        <p>Result</p>
      </ToolPanel>
    ));

    expect(getByRole("region", { name: "Output" })).toBeInTheDocument();
    expect(getByRole("heading", { name: "Output" })).toBeInTheDocument();
    expect(getByText("Rendered locally.")).toBeInTheDocument();
    expect(getByRole("button", { name: "Copy" })).toBeInTheDocument();
  });
});
