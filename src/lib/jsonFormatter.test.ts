import { describe, expect, it } from "vitest";

import { formatJson, sortJsonKeys, syntaxHighlightJson } from "./jsonFormatter";

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
    const result = formatJson(
      '{"b":2,"a":{"d":4,"c":3},"z":[{"b":2,"a":1},{"d":4,"c":3}]}',
      2,
      false,
      true
    );

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
    },
    {
      "c": 3,
      "d": 4
    }
  ]
}`);
  });

  it("preserves special object keys while sorting", () => {
    const value = JSON.parse('{"__proto__":{"polluted":true},"constructor":"safe"}') as {
      __proto__: { polluted: boolean };
      constructor: string;
    };
    const sorted = sortJsonKeys(value) as typeof value;

    expect(Object.hasOwn(sorted, "__proto__")).toBe(true);
    expect(Object.getPrototypeOf(sorted)).toBe(Object.prototype);
    expect(Object.getOwnPropertyDescriptor(sorted, "__proto__")?.value).toEqual({
      polluted: true,
    });
    expect(sorted.constructor).toBe("safe");
    expect(({} as { polluted?: boolean }).polluted).toBeUndefined();
  });

  it("returns parse errors with line, column, and nearby context", () => {
    const result = formatJson('{"a":1,\n"b":\n}', 2, false, false);

    expect(result.error).toContain("JSON parse error:");
    expect(result.errorPosition).toBe(13);
    expect(result.errorLength).toBe(1);
    expect(result.errorLine).toBe(3);
    expect(result.errorColumn).toBe(1);
    expect(result.errorContext).toBe('2 | "b":\n3 | }\n    ^');
  });

  it("returns typed highlighted JSON segments without changing the source text", () => {
    const source = '{"<script>":"</span><script>alert(1)</script>","active":true}';
    const segments = syntaxHighlightJson(source);

    expect(segments.map((segment) => segment.text).join("")).toBe(source);
    expect(segments.some((segment) => segment.kind === "json-key")).toBe(true);
    expect(segments.some((segment) => segment.kind === "json-string")).toBe(true);
    expect(segments.some((segment) => segment.kind === "json-boolean")).toBe(true);
  });
});
