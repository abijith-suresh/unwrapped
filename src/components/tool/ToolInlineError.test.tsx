import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";

import ToolInlineError from "./ToolInlineError";

describe("ToolInlineError", () => {
  it("renders its message and optional recovery hint as an alert", () => {
    const { getByRole, getByText } = render(() => (
      <ToolInlineError message="Invalid input" hint="Check the value and try again." />
    ));

    expect(getByRole("alert")).toHaveTextContent("Invalid input");
    expect(getByText("Check the value and try again.")).toBeInTheDocument();
  });
});
