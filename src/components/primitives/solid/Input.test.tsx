import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";

import Input from "./Input";

describe("Input", () => {
  it("associates its label and forwards native input attributes", () => {
    const { getByRole } = render(() => (
      <Input
        label="Token length"
        name="token-length"
        autocomplete="off"
        type="number"
        min={1}
        max={100}
        inputmode="numeric"
      />
    ));
    const input = getByRole("spinbutton", { name: "Token length" });

    expect(input).toHaveAttribute("name", "token-length");
    expect(input).toHaveAttribute("autocomplete", "off");
    expect(input).toHaveAttribute("min", "1");
    expect(input).toHaveAttribute("max", "100");
    expect(input).toHaveAttribute("inputmode", "numeric");
  });
});
