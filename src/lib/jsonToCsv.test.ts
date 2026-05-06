import { describe, expect, it } from "vitest";

import { convertJsonToCsv } from "./jsonToCsv";

describe("convertJsonToCsv", () => {
  it("converts arrays of JSON objects with stable headers and escaped values", () => {
    expect(
      convertJsonToCsv(
        JSON.stringify([
          { name: "Alice", note: 'hello, "world"', active: true },
          { name: "Bob", note: "line 1\nline 2" },
        ])
      )
    ).toEqual({
      ok: true,
      output: ["name,note,active", 'Alice,"hello, ""world""",true', 'Bob,"line 1\nline 2",'].join(
        "\n"
      ),
    });
  });

  it("rejects unsupported JSON shapes clearly", () => {
    expect(convertJsonToCsv('{"name":"Alice"}')).toEqual({
      ok: false,
      error: "Input must be a JSON array of objects.",
    });
  });
});
