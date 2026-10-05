import { describe, expect, it } from "vitest";
import { minifyCss } from "./cssMinifier";

describe("CSS minifier", () => {
  it("minifies CSS without restructuring the rules", () => {
    expect(
      minifyCss("/* hi */ .a { color: #ffffff; margin: 0px; } .b { color: #ffffff; margin: 0px; }")
    ).toEqual({
      ok: true,
      output: ".a{color:#fff;margin:0}.b{color:#fff;margin:0}",
    });
  });
  it("reports syntax errors and enforces the size limit", () => {
    expect(minifyCss(".a { color: red; } }").ok).toBe(false);
    expect(minifyCss(" ".repeat(100001)).ok).toBe(false);
  });
});
