import { describe, expect, it } from "vitest";

import { analyzeDiff } from "./diffAnalysis";

describe("diffAnalysis", () => {
  it("analyzes structured JSON diffs into normalized rows and stats", () => {
    const result = analyzeDiff({
      original: '{"b":2,"a":1}',
      modified: '{"a":1,"b":3}',
      leftLanguage: "json",
      rightLanguage: "json",
      changesOnly: true,
      context: 0,
    });

    expect(result.strategy).toBe("json");
    expect(result.errors).toEqual([]);
    expect(result.stats).toEqual({ added: 1, removed: 1 });
    expect(result.isIdentical).toBe(false);
    expect(result.filteredRows).toEqual([
      {
        sourceIndex: 2,
        row: {
          left: '  "b": 2',
          right: '  "b": 3',
          leftLineNum: 3,
          rightLineNum: 3,
          type: "changed",
        },
      },
    ]);
    expect(result.changeIndices).toEqual([2]);
  });

  it("falls back to text diff with side specific structured errors", () => {
    const result = analyzeDiff({
      original: '{"a":',
      modified: '{"a":1}',
      leftLanguage: "json",
      rightLanguage: "json",
      changesOnly: true,
    });

    expect(result.strategy).toBe("text");
    expect(result.errors).toEqual([expect.objectContaining({ side: "left" })]);
    expect(result.rows).toEqual([
      {
        left: '{"a":',
        right: '{"a":1}',
        leftLineNum: 1,
        rightLineNum: 1,
        type: "changed",
      },
    ]);
  });

  it("returns all rows when changes-only mode is disabled", () => {
    const result = analyzeDiff({
      original: "same\nold\n",
      modified: "same\nnew\nextra\n",
      leftLanguage: "text",
      rightLanguage: "text",
      changesOnly: false,
    });

    expect(result.rows).toEqual([
      { left: "same", right: "same", leftLineNum: 1, rightLineNum: 1, type: "equal" },
      { left: "old", right: "new", leftLineNum: 2, rightLineNum: 2, type: "changed" },
      { left: null, right: "extra", leftLineNum: null, rightLineNum: 3, type: "added" },
    ]);
    expect(result.filteredRows).toEqual(
      result.rows.map((row, sourceIndex) => ({ row, sourceIndex }))
    );
    expect(result.changeIndices).toEqual([1, 2]);
    expect(result.stats).toEqual({ added: 2, removed: 1 });
  });

  it("marks identical input as identical with no changes", () => {
    const result = analyzeDiff({
      original: "alpha\nbeta\n",
      modified: "alpha\nbeta\n",
      leftLanguage: "text",
      rightLanguage: "text",
      changesOnly: true,
    });

    expect(result.isIdentical).toBe(true);
    expect(result.stats).toEqual({ added: 0, removed: 0 });
    expect(result.changeIndices).toEqual([]);
  });
});
