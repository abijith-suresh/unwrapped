import { fireEvent, render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import TokenGenerator from "./TokenGenerator";

describe("token generator character sets", () => {
  it("hides Regenerate and explains inline while no set is selected, then recovers", () => {
    const view = render(() => <TokenGenerator />);
    const digits = view.getByRole("button", { name: "Digits" });
    const lowercase = view.getByRole("button", { name: "Lowercase" });
    const uppercase = view.getByRole("button", { name: "Uppercase" });

    expect(view.getByRole("button", { name: "Regenerate" })).toBeEnabled();
    fireEvent.click(digits);
    fireEvent.click(lowercase);
    fireEvent.click(uppercase);
    expect(view.getByText("Select at least one character set.")).toBeInTheDocument();
    expect(view.queryByRole("button", { name: "Regenerate" })).not.toBeInTheDocument();

    fireEvent.click(digits);
    expect(view.getByRole("button", { name: "Regenerate" })).toBeEnabled();
    expect(view.queryByText("Select at least one character set.")).not.toBeInTheDocument();
    view.unmount();
  });
});
