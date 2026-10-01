import { describe, expect, it } from "vitest";
import { buildQuery, parseQuery } from "./queryString";

describe("query string editor", () => {
  it("preserves duplicates, empty values, order and fragments", () => {
    const parsed = parseQuery("https://example.com/a?tag=a&tag=b&empty=#section");
    expect(parsed.entries).toEqual([
      { key: "tag", value: "a" },
      { key: "tag", value: "b" },
      { key: "empty", value: "" },
    ]);
    expect(buildQuery(parsed)).toBe("https://example.com/a?tag=a&tag=b&empty=#section");
  });
  it("distinguishes literal plus from spaces and encodes Unicode", () => {
    expect(buildQuery(parseQuery("?q=a%2Bb+c&name=%E2%9C%93"))).toBe("q=a%2Bb+c&name=%E2%9C%93");
  });
  it("handles URLs without queries and relative URLs", () => {
    expect(buildQuery(parseQuery("https://example.com/path#x"))).toBe("https://example.com/path#x");
    expect(buildQuery(parseQuery("/path?x=1#x"))).toBe("/path?x=1#x");
    expect(buildQuery(parseQuery(""))).toBe("");
  });
  it("removes the question mark when all parameters are removed", () => {
    expect(buildQuery({ ...parseQuery("https://example.com/?a=1#x"), entries: [] })).toBe(
      "https://example.com/#x"
    );
  });
});
