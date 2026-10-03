import { describe, expect, it } from "vitest";
import { tools } from "@/tools/registry";
import { searchTools } from "./toolSearch";

describe("searchTools", () => {
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

describe("catalog ordering", () => {
  it("rotates every tool through the first discovery slot without changing the registry", () => {
    const registryIds = tools.map((tool) => tool.id);
    const firstIds = Array.from(
      { length: tools.length },
      (_, rotation) => searchTools("", { rotation })[0].id
    );
    expect(new Set(firstIds).size).toBe(tools.length);
    expect(tools.map((tool) => tool.id)).toEqual(registryIds);
    expect(searchTools("", { rotation: tools.length })).toEqual(searchTools(""));
  });

  it("pins favorites ahead of the rotation and keeps all matching tools", () => {
    const favoriteIds = ["yaml-formatter", "base64"];
    const catalog = searchTools("", { favoriteIds, rotation: 4 });
    expect(catalog.slice(0, 2).map((tool) => tool.id)).toEqual(["base64", "yaml-formatter"]);
    expect(new Set(catalog.map((tool) => tool.id)).size).toBe(tools.length);
    expect(searchTools("formatter", { favoriteIds, rotation: 4 })[0].id).toBe("yaml-formatter");
    expect(searchTools("sha256", { favoriteIds, rotation: 4 })[0].id).toBe("hash-generator");
  });

  it("keeps favorites stable across rotations and ignores stale IDs", () => {
    const favoriteIds = ["base64", "json-formatter", "removed-tool"];
    for (const rotation of [0, 1, 15, -1, Number.NaN]) {
      expect(
        searchTools("", { favoriteIds, rotation })
          .slice(0, 2)
          .map((tool) => tool.id)
      ).toEqual(["json-formatter", "base64"]);
    }
  });
});
