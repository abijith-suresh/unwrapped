import { describe, expect, it } from "vitest";

import { convertJsonToYaml } from "./jsonToYaml";

describe("convertJsonToYaml", () => {
  it("converts nested JSON values into stable YAML output", () => {
    const result = convertJsonToYaml(
      '{"z":true,"a":{"c":2,"b":1},"items":[{"name":"alpha"},null]}'
    );

    expect(result).toEqual({
      ok: true,
      output: ["a:", "  b: 1", "  c: 2", "items:", "  - name: alpha", "  - null", "z: true"].join(
        "\n"
      ),
    });
  });

  it("surfaces clear validation feedback for invalid JSON", () => {
    expect(convertJsonToYaml('{"missing": }')).toEqual({
      ok: false,
      error: expect.stringContaining("JSON"),
    });
  });
});
