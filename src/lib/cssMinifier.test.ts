import { describe, expect, it } from "vitest";
import { minifyCss } from "./cssMinifier";

describe("CSS minifier", () => {
  it("removes whitespace and ordinary comments", () => {
    expect(minifyCss("/* hi */ .a { color: #ffffff; margin: 0px; }")).toEqual({
      ok: true,
      output: ".a{color:#fff;margin:0}",
    });
  });
  it("preserves meaningful string whitespace, data URLs and calc", () => {
    const result = minifyCss(
      '.a { content: "a  b"; background: url("data:image/svg+xml;base64,AAAA"); width: calc(100% - 2px); --label: "c  d"; }'
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.output).toContain('"a  b"');
      expect(result.output).toContain("data:image/svg+xml;base64,AAAA");
      expect(result.output).toContain("100% - 2px");
      expect(result.output).toContain('"c  d"');
    }
  });
  it("keeps license comments and handles empty input", () => {
    expect(minifyCss("/*! license */ .a { color: red; }")).toMatchObject({
      output: expect.stringContaining("license"),
    });
    expect(minifyCss("")).toEqual({ ok: true, output: "" });
  });
  it("reports syntax errors and enforces the size limit", () => {
    expect(minifyCss(".a { color: red; } }").ok).toBe(false);
    expect(minifyCss(" ".repeat(100001)).ok).toBe(false);
  });
});
