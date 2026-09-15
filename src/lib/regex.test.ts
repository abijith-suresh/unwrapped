import { describe, expect, it } from "vitest";

import { buildRegexReplaceResult, buildRegexResult } from "./regex";

describe("regex utilities", () => {
  it("builds regex results with matches and highlighting", () => {
    const result = buildRegexResult("foo", new Set(["g"]), "foo bar foo");

    expect(result.error).toBeNull();
    expect(result.matches).toHaveLength(2);
    expect(result.highlighted.map((segment) => segment.text).join("")).toBe("foo bar foo");
    expect(result.highlighted.some((segment) => segment.kind === "match")).toBe(true);
    expect(result.summary.firstMatchIndex).toBe(0);
  });

  it("keeps hostile input as text while highlighting matches", () => {
    const input = "</span><script>alert(1)</script><img src=x onerror=alert(1)>";
    const result = buildRegexResult("script", new Set(["g"]), input);

    expect(result.highlighted.map((segment) => segment.text).join("")).toBe(input);
    expect(result.highlighted.some((segment) => segment.kind === "match")).toBe(true);
  });

  it("captures named and unnamed groups", () => {
    const result = buildRegexResult("(?<word>foo)(bar)", new Set(["g"]), "foobar");

    expect(result.matches[0]?.groups).toEqual([
      { name: "word", value: "foo" },
      { name: null, value: "bar" },
    ]);
  });

  it("reports invalid regex patterns", () => {
    const result = buildRegexResult("(", new Set(["g"]), "foo");

    expect(result.error).toBeTruthy();
    expect(result.matches).toEqual([]);
  });

  it("builds replacement results", () => {
    const result = buildRegexReplaceResult("foo", new Set(["g"]), "foo bar foo", "baz");

    expect("error" in result).toBe(false);
    if (!("error" in result)) {
      expect(result.output).toBe("baz bar baz");
      expect(result.replacements).toBe(2);
    }
  });

  it("tracks empty matches in the summary", () => {
    const result = buildRegexResult("^", new Set(["g", "m"]), "foo\nbar");

    expect(result.summary.emptyMatchCount).toBeGreaterThan(0);
  });
});
