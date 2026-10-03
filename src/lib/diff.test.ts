import { describe, expect, it } from "vitest";

import { createDiffRows, getChangeSourceIndices } from "./diff";

describe("diff utilities", () => {
  it("builds paired changed rows for adjacent removed and added hunks", () => {
    const rows = createDiffRows("alpha\nbeta\n", "alpha\ngamma\n");

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ left: "alpha", right: "alpha", type: "equal" });
    expect(rows[1]).toMatchObject({ left: "beta", right: "gamma", type: "changed" });
  });

  it("keeps surplus lines in uneven replace hunks as added or removed rows", () => {
    const rows = createDiffRows("same\nold\n", "same\nnew\nextra\n");

    expect(rows).toHaveLength(3);
    expect(rows[1]).toMatchObject({ left: "old", right: "new", type: "changed" });
    expect(rows[2]).toMatchObject({ left: null, right: "extra", type: "added" });
  });

  it("returns original change indices for navigation", () => {
    const rows = createDiffRows("a\nb\nc\n", "a\nx\ny\n");

    expect(getChangeSourceIndices(rows)).toEqual([1, 2]);
  });
});
