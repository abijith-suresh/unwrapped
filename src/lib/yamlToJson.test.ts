import { describe, expect, it } from "vitest";

import { convertYamlToJson } from "./yamlToJson";

describe("convertYamlToJson", () => {
  it("converts representative YAML into formatted JSON", () => {
    expect(
      convertYamlToJson(["name: demo", "enabled: true", "items:", "  - 1", "  - null"].join("\n"))
    ).toEqual({
      ok: true,
      output: JSON.stringify({ enabled: true, items: [1, null], name: "demo" }, null, 2),
    });
  });

  it("surfaces clear validation feedback for invalid YAML", () => {
    expect(convertYamlToJson("name: [")).toEqual({
      ok: false,
      error: expect.stringContaining("YAML"),
    });
  });
});
