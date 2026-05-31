import { describe, expect, it } from "vitest";

import {
  formatJson,
  parseJsonErrorSourceContext,
  sortJsonKeys,
  syntaxHighlightJson,
} from "./jsonFormatter";

describe("json formatter utilities", () => {
  it("formats JSON with configurable indentation", () => {
    const result = formatJson('{"b":2,"a":1}', 2, false, false);

    expect(result.error).toBeNull();
    expect(result.raw).toBe(`{
  "b": 2,
  "a": 1
}`);
  });

  it("minifies JSON when requested", () => {
    const result = formatJson(
      `{
      "a": 1,
      "b": 2
    }`,
      2,
      true,
      false
    );

    expect(result.raw).toBe('{"a":1,"b":2}');
  });

  it("sorts keys recursively when requested", () => {
    const result = formatJson('{"b":2,"a":{"d":4,"c":3},"z":[{"b":2,"a":1}]}', 2, false, true);

    expect(result.raw).toBe(`{
  "a": {
    "c": 3,
    "d": 4
  },
  "b": 2,
  "z": [
    {
      "a": 1,
      "b": 2
    }
  ]
}`);
  });

  it("sortJsonKeys preserves array order while sorting object keys", () => {
    expect(
      sortJsonKeys([
        { b: 2, a: 1 },
        { d: 4, c: 3 },
      ])
    ).toEqual([
      { a: 1, b: 2 },
      { c: 3, d: 4 },
    ]);
  });

  it("returns parse errors with line, column, and nearby context", () => {
    const result = formatJson('{"a":1,\n"b":\n}', 2, false, false);

    expect(result.error).toContain("JSON parse error:");
    expect(result.errorLine).toBe(3);
    expect(result.errorColumn).toBe(1);
    expect(result.errorContext).toContain('2 | "b":');
    expect(result.errorContext).toContain("3 | }");
    expect(result.errorContext).toContain("^");
  });

  it("builds source context from parser positions", () => {
    expect(parseJsonErrorSourceContext('{"a":1,\n"b":\n}', 13)).toEqual({
      line: 3,
      column: 1,
      context: `2 | "b":
3 | }
    ^`,
    });
  });

  it("wraps highlighted JSON tokens in span elements", () => {
    expect(syntaxHighlightJson('{"a":true}')).toContain("<span");
  });
});
