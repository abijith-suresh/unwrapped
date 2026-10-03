import { fireEvent, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, expect, it } from "vitest";

import Select from "./Select";

describe("Select", () => {
  it("keeps selection in sync with user changes and updated values", () => {
    const [value, setValue] = createSignal("SHA-256");
    const { getByRole } = render(() => (
      <Select
        label="Algorithm"
        value={value()}
        onChange={setValue}
        options={[
          { value: "SHA-1", label: "HMAC-SHA1" },
          { value: "SHA-256", label: "HMAC-SHA256" },
          { value: "SHA-512", label: "HMAC-SHA512" },
        ]}
      />
    ));
    const select = getByRole("combobox", { name: "Algorithm" });

    expect(select).toHaveValue("SHA-256");

    fireEvent.change(select, { target: { value: "SHA-512" } });
    expect(value()).toBe("SHA-512");
    expect(select).toHaveValue("SHA-512");

    setValue("SHA-1");
    expect(select).toHaveValue("SHA-1");
  });
});
