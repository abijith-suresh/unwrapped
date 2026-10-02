import { describe, expect, it } from "vitest";
import { tools } from "@/tools/registry";
import { searchTools } from "./toolSearch";

describe("searchTools", () => {
  it("returns the registry tools once with common tools first for an empty search", () => {
    expect(searchTools("  ")).toHaveLength(tools.length);
    expect(new Set(searchTools("").map((tool) => tool.id)).size).toBe(tools.length);
    expect(searchTools("")[0].id).toBe("json-formatter");
  });
  it("matches multiword encoder and decoder searches across metadata", () => {
    expect(searchTools("  BASE64 encoder  ").map((tool) => tool.id)).toEqual(["base64"]);
    expect(searchTools("base64 decoder").map((tool) => tool.id)).toEqual(["base64"]);
    expect(searchTools("json formatter").map((tool) => tool.id)).toEqual(["json-formatter"]);
  });
  it("uses registry keywords and requires every query term to match", () => {
    expect(searchTools("sha256").map((tool) => tool.id)).toContain("hash-generator");
    expect(searchTools("base64 nonexistent")).toEqual([]);
  });
});
