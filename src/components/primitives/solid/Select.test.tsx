import { fireEvent, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, expect, it } from "vitest";

import Select from "./Select";

describe("Select", () => {
  it("selects the supplied value when it is not the first option", () => {
    const { getByRole } = render(() => (
      <Select
        label="Algorithm"
        value="SHA-256"
        options={[
          { value: "SHA-1", label: "HMAC-SHA1" },
          { value: "SHA-256", label: "HMAC-SHA256" },
        ]}
      />
    ));

    expect(getByRole("combobox", { name: "Algorithm" })).toHaveValue("SHA-256");
    expect(getByRole("option", { name: "HMAC-SHA256" })).toHaveProperty("selected", true);
  });

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

    fireEvent.change(select, { target: { value: "SHA-512" } });
    expect(value()).toBe("SHA-512");
    expect(select).toHaveValue("SHA-512");

    setValue("SHA-1");
    expect(select).toHaveValue("SHA-1");
  });

  it("supports labelled and visually hidden control variants", () => {
    const { getByRole } = render(() => (
      <Select
        label="Language"
        name="language"
        autocomplete="off"
        options={[{ value: "text", label: "Text" }]}
      />
    ));
    const select = getByRole("combobox", { name: "Language" });

    expect(select).toHaveAttribute("name", "language");
    expect(select).toHaveAttribute("autocomplete", "off");
  });

  it("forwards an accessible name when no visible label is needed", () => {
    const { getByRole } = render(() => (
      <Select aria-label="Original language" options={[{ value: "text", label: "Text" }]} />
    ));

    expect(getByRole("combobox", { name: "Original language" })).toBeInTheDocument();
  });
});
