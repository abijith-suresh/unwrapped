import { describe, expect, it } from "vitest";

import { formatYaml } from "./yamlFormatter";

describe("formatYaml", () => {
  it("formats valid YAML with the requested indentation", () => {
    expect(formatYaml("root:\n  child:\n    - 1\n    - 2", { indent: 4, sortKeys: false })).toEqual(
      {
        ok: true,
        output: ["root:", "    child:", "        - 1", "        - 2"].join("\n"),
      }
    );
  });

  it("sorts keys recursively when requested", () => {
    expect(formatYaml("z: true\na:\n  c: 2\n  b: 1", { indent: 2, sortKeys: true })).toEqual({
      ok: true,
      output: ["a:", "  b: 1", "  c: 2", "z: true"].join("\n"),
    });
  });

  it("returns clear feedback for invalid YAML", () => {
    expect(formatYaml("root: [", { indent: 2, sortKeys: false })).toEqual({
      ok: false,
      error: expect.stringContaining("YAML"),
    });
  });
});
