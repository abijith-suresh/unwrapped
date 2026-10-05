import { describe, expect, it } from "vitest";

import { buildRegexReplaceResult, buildRegexResult } from "./regex";

describe("regex utilities", () => {
  it("builds regex results with matches and highlighting", () => {
    const result = buildRegexResult("foo", new Set(["g"]), "foo bar foo");

    expect(result.error).toBeNull();
    expect(result.matches).toEqual([
      { index: 0, fullMatch: "foo", groups: [], namedGroups: [] },
      { index: 8, fullMatch: "foo", groups: [], namedGroups: [] },
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
      { number: 1, value: "foo" },
      { number: 2, value: "bar" },
    ]);
    expect(result.matches[0]?.namedGroups).toEqual([{ name: "word", value: "foo" }]);
    expect(result.summary.captureGroupCount).toBe(2);
  });

  it.each([
    ["(?<named>a)(a)", "aa"],
    ["(a)(?<named>a)", "aa"],
    ["(?<named>(a))", "a"],
    ["((?<named>a))", "a"],
  ])("preserves both numbered captures for %s", (pattern, input) => {
    const result = buildRegexResult(pattern, new Set(["g"]), input);

    expect(result.matches[0]?.groups).toEqual([
      { number: 1, value: "a" },
      { number: 2, value: "a" },
    ]);
    expect(result.matches[0]?.namedGroups).toEqual([{ name: "named", value: "a" }]);
    expect(result.summary.captureGroupCount).toBe(2);
  });

  it.each([
    ["(?<first>a)(?<second>a)(a)", "aaa"],
    ["(?<first>(?<second>a))(a)", "aa"],
  ])("keeps multiple same-valued named aliases separate for %s", (pattern, input) => {
    const result = buildRegexResult(pattern, new Set(["g"]), input);

    expect(result.matches[0]?.groups).toEqual([
      { number: 1, value: "a" },
      { number: 2, value: "a" },
      { number: 3, value: "a" },
    ]);
    expect(result.matches[0]?.namedGroups).toEqual([
      { name: "first", value: "a" },
      { name: "second", value: "a" },
    ]);
    expect(result.summary.captureGroupCount).toBe(3);
  });

  it.each([true, false])("retains optional slots and empty captures with global=%s", (global) => {
    const result = buildRegexResult(
      "a(?<optional>b)?(c)?(?<empty>)(d*)",
      new Set(global ? ["g"] : []),
      "a abc"
    );

    expect(result.matches).toHaveLength(global ? 2 : 1);
    expect(result.matches[0]?.groups).toEqual([
      { number: 1, value: null },
      { number: 2, value: null },
      { number: 3, value: "" },
      { number: 4, value: "" },
    ]);
    expect(result.matches[0]?.namedGroups).toEqual([
      { name: "optional", value: null },
      { name: "empty", value: "" },
    ]);
    if (global) {
      expect(result.matches[1]?.groups).toEqual([
        { number: 1, value: "b" },
        { number: 2, value: "c" },
        { number: 3, value: "" },
        { number: 4, value: "" },
      ]);
      expect(result.matches[1]?.namedGroups).toEqual([
        { name: "optional", value: "b" },
        { name: "empty", value: "" },
      ]);
    }
    expect(result.summary.captureGroupCount).toBe(global ? 8 : 4);
    expect(JSON.parse(JSON.stringify(result.matches))).toEqual(result.matches);
    expect(result.highlighted.map((segment) => segment.text).join("")).toBe("a abc");
  });

  it("keeps unmatched alternation groups in their numbered positions", () => {
    const result = buildRegexResult("(a)|(b)", new Set(["g"]), "ab");

    expect(result.matches.map((match) => match.groups)).toEqual([
      [
        { number: 1, value: "a" },
        { number: 2, value: null },
      ],
      [
        { number: 1, value: null },
        { number: 2, value: "b" },
      ],
    ]);
    expect(result.summary.captureGroupCount).toBe(4);
  });

  it.each([true, false])(
    "keeps named and numbered replacements working with global=%s",
    (global) => {
      expect(
        buildRegexReplaceResult(
          "(?<named>a)(a)",
          new Set(global ? ["g"] : []),
          "aa aa",
          "$<named>-$2-$1"
        )
      ).toEqual({
        output: global ? "a-a-a a-a-a" : "a-a-a aa",
        replacements: global ? 2 : 1,
      });
    }
  );

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
      { index: 0, fullMatch: "", groups: [], namedGroups: [] },
      { index: 4, fullMatch: "", groups: [], namedGroups: [] },
    ]);
    expect(result.summary.emptyMatchCount).toBe(2);
  });
});

it("rejects excessive match counts instead of allocating an unbounded report", () => {
  const result = buildRegexResult("a", new Set(["g"]), "a".repeat(10_001));
  expect(result.error).toContain("Too many matches");
  expect(result.matches).toEqual([]);
});
