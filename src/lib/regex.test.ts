import { describe, expect, it } from "vitest";

import { buildRegexReplaceResult, buildRegexResult } from "./regex";

describe("regex utilities", () => {
  it("builds regex results with matches and highlighting", () => {
    const result = buildRegexResult("foo", new Set(["g"]), "foo bar foo");

    expect(result.error).toBeNull();
    expect(result.matches).toEqual([
      { index: 0, fullMatch: "foo", groups: [] },
      { index: 8, fullMatch: "foo", groups: [] },
    ]);
    expect(result.highlighted).toEqual([
      { text: "foo", kind: "match" },
      { text: " bar ", kind: "plain" },
      { text: "foo", kind: "match" },
    ]);
    expect(result.summary.firstMatchIndex).toBe(0);
  });

  it("keeps hostile input as text while highlighting matches", () => {
    const input = "</span><script>alert(1)</script><img src=x onerror=alert(1)>";
    const result = buildRegexResult("script", new Set(["g"]), input);

    expect(result.highlighted.map((segment) => segment.text).join("")).toBe(input);
    expect(result.highlighted.filter((segment) => segment.kind === "match")).toEqual([
      { text: "script", kind: "match" },
      { text: "script", kind: "match" },
    ]);
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
    expect(buildRegexReplaceResult("foo", new Set(["g"]), "foo bar foo", "baz")).toEqual({
      output: "baz bar baz",
      replacements: 2,
    });
  });

  it("tracks empty matches in the summary", () => {
    const result = buildRegexResult("^", new Set(["g", "m"]), "foo\nbar");

    expect(result.error).toBeNull();
    expect(result.matches).toEqual([
      { index: 0, fullMatch: "", groups: [] },
      { index: 4, fullMatch: "", groups: [] },
    ]);
    expect(result.summary.emptyMatchCount).toBe(2);
  });
});

it("rejects excessive match counts instead of allocating an unbounded report", () => {
  const result = buildRegexResult("a", new Set(["g"]), "a".repeat(10_001));
  expect(result.error).toContain("Too many matches");
  expect(result.matches).toEqual([]);
});
