import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";

import Select from "./Select";

describe("Select", () => {
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
