import { describe, expect, it } from "vitest";

import { searchHttpStatusCodes } from "./httpStatusCodes";

describe("searchHttpStatusCodes", () => {
  it("finds entries by numeric code", () => {
    expect(searchHttpStatusCodes("404").map((entry) => entry.code)).toEqual([404]);
  });

  it("finds entries by standard name", () => {
    expect(searchHttpStatusCodes("unprocessable")).toEqual([
      expect.objectContaining({ code: 422, name: "Unprocessable Content" }),
    ]);
  });

  it("finds entries by category text", () => {
    expect(searchHttpStatusCodes("redirect").map((entry) => entry.code)).toEqual([
      300, 301, 302, 303, 304, 305, 307, 308,
    ]);
  });
});
