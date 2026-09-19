import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";

import ToolInlineError from "./ToolInlineError";

describe("ToolInlineError", () => {
  it("renders its message and optional recovery hint as an alert", () => {
    const { getByRole } = render(() => (
      <ToolInlineError message="Invalid input" hint="Check the value and try again." />
    ));

    const alert = getByRole("alert");
    expect(alert).toHaveTextContent("Invalid input");
    expect(alert).toHaveTextContent("Check the value and try again.");
  });
});
