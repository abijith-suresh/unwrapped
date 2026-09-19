import { applyPatch, parsePatch } from "diff";
import { describe, expect, it } from "vitest";

import { createUnifiedDiff } from "@/lib/unifiedDiff";

const headers = "--- original\n+++ modified\n";

function expectApplicable(original: string, modified: string, context?: number): string {
  const patch = createUnifiedDiff({ original, modified, context });

  expect(applyPatch(original, patch, { autoConvertLineEndings: false })).toBe(modified);
  expect(parsePatch(patch)).toHaveLength(1);
  return patch;
}

describe("unified diff export", () => {
  it("exports deterministic file headers and a replacement hunk", () => {
    const input = { original: "alpha\nbeta\n", modified: "alpha\ngamma\n" };
    const patch = expectApplicable(input.original, input.modified);

    expect(patch).toBe(`${headers}@@ -1,2 +1,2 @@\n alpha\n-beta\n+gamma\n`);
    expect(createUnifiedDiff(input)).toBe(patch);
  });

  it.each(["", "same", "same\n", "same\r\n"])(
    "exports headers without hunks for identical %j inputs",
    (text) => {
      expect(expectApplicable(text, text)).toBe(headers);
    }
  );

  it.each([
    ["", "first\n", "@@ -0,0 +1,1 @@\n+first\n"],
    ["last\n", "", "@@ -1,1 +0,0 @@\n-last\n"],
  ])("exports empty-side ranges for %j to %j", (original, modified, hunk) => {
    expect(expectApplicable(original, modified)).toBe(headers + hunk);
  });

  it.each([
    ["old", "new", 2],
    ["old\n", "new", 1],
    ["old", "new\n", 1],
    ["same", "same\n", 1],
    ["same\n", "same", 1],
    ["", "new", 1],
    ["old", "", 1],
  ])("preserves missing final newlines for %j to %j", (original, modified, markers) => {
    const patch = expectApplicable(original, modified);

    expect(patch.match(/\\ No newline at end of file\n/g)).toHaveLength(markers);
  });

  it.each([
    ["a\r\nb\r\n", "a\r\nc\r\n"],
    ["a\r\nb", "a\r\nc"],
    ["a\n", "a\r\n"],
    ["a\r\n", "a\n"],
    ["a\r\nb\nc\r\n", "a\r\nx\nc\r\n"],
    ["", "a\r\n"],
    ["a\r\n", ""],
    [" \t\n\n", "\t \n\n\n"],
    ["café\n日本語\n", "café\n中文\n"],
  ])("preserves exact text and line endings for %j to %j", (original, modified) => {
    expectApplicable(original, modified);
  });

  it("uses three context lines by default", () => {
    const original = "1\n2\n3\n4\n5\n6\n7\n8\n9\n";
    const modified = original.replace("5\n", "changed\n");

    expect(expectApplicable(original, modified)).toBe(
      `${headers}@@ -2,7 +2,7 @@\n 2\n 3\n 4\n-5\n+changed\n 6\n 7\n 8\n`
    );
  });

  it.each([
    [0, 2],
    [1, 2],
    [3, 1],
    [Number.MAX_SAFE_INTEGER, 1],
  ])("exports applicable hunks with context %i", (context, hunkCount) => {
    const original = "1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n";
    const modified = original.replace("2\n", "two\n").replace("9\n", "nine\n");
    const patch = expectApplicable(original, modified, context);
    const hunks = parsePatch(patch)[0].hunks;

    expect(hunks).toHaveLength(hunkCount);
    if (context === 0) {
      expect(hunks.map((hunk) => hunk.lines)).toEqual([
        ["-2", "+two"],
        ["-9", "+nine"],
      ]);
    }
    if (context === 1) {
      expect(hunks.map((hunk) => hunk.lines)).toEqual([
        [" 1", "-2", "+two", " 3"],
        [" 8", "-9", "+nine", " 10"],
      ]);
    }
  });

  it.each([-1, 0.5, Number.NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1])(
    "rejects invalid context %s even for identical inputs",
    (context) => {
      expect(() => createUnifiedDiff({ original: "", modified: "", context })).toThrow(
        new RangeError("Context must be a non-negative safe integer.")
      );
    }
  );
});
