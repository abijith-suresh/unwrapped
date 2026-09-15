import { fireEvent, render } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";

import ToolSegmentedControl from "./ToolSegmentedControl";

const OPTIONS = [
  { value: "json", label: "JSON" },
  { value: "yaml", label: "YAML" },
] as const;

describe("ToolSegmentedControl", () => {
  it("exposes the selected option and emits the next value", () => {
    const onChange = vi.fn();
    const { getByRole } = render(() => (
      <ToolSegmentedControl label="Format" value="json" options={OPTIONS} onChange={onChange} />
    ));

    const json = getByRole("radio", { name: "JSON" });
    const yaml = getByRole("radio", { name: "YAML" });
    expect(json).toHaveAttribute("aria-checked", "true");
    expect(yaml).toHaveAttribute("aria-checked", "false");

    fireEvent.click(yaml);
    expect(onChange).toHaveBeenCalledWith("yaml");
  });

  it("supports arrow-key movement between enabled options", () => {
    const onChange = vi.fn();
    const { getByRole } = render(() => (
      <ToolSegmentedControl
        label="Format"
        value="json"
        options={[...OPTIONS, { value: "toml", label: "TOML", disabled: true }]}
        onChange={onChange}
      />
    ));

    const json = getByRole("radio", { name: "JSON" });
    const yaml = getByRole("radio", { name: "YAML" });
    json.focus();
    fireEvent.keyDown(json, { key: "ArrowRight" });

    expect(document.activeElement).toBe(yaml);
    expect(onChange).toHaveBeenCalledWith("yaml");
  });
});
