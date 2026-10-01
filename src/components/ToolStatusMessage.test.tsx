import { render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, expect, it } from "vitest";
import ToolStatusMessage from "./ToolStatusMessage";

describe("ToolStatusMessage", () => {
  it("updates feedback styling and announcements when validation changes", () => {
    const [invalid, setInvalid] = createSignal(false);
    const { getByRole, queryByRole } = render(() => (
      <ToolStatusMessage tone={invalid() ? "error" : "muted"}>
        {invalid() ? "Minute must be between 0 and 59." : "*/5 * * * *"}
      </ToolStatusMessage>
    ));
    expect(getByRole("status")).toHaveAttribute("aria-live", "polite");
    setInvalid(true);
    expect(queryByRole("status")).not.toBeInTheDocument();
    expect(getByRole("alert")).toHaveTextContent("Minute must be between 0 and 59.");
    expect(getByRole("alert")).toHaveAttribute("aria-live", "assertive");
    expect(getByRole("alert").style.color).toBe("var(--accent-error)");
    setInvalid(false);
    expect(queryByRole("alert")).not.toBeInTheDocument();
    expect(getByRole("status").style.color).toBe("var(--text-muted)");
  });
});
