import { describe, expect, it } from "vitest";
import { normalizeFavorites, toggleFavorite } from "@/lib/favorites";

describe("favorite preferences", () => {
  it("retains only unique registered tool IDs, without retaining user data", () => {
    expect(
      normalizeFavorites([
        "base64",
        "unknown-tool",
        { input: "secret" },
        "base64",
        "json-formatter",
      ])
    ).toEqual(["base64", "json-formatter"]);
    expect(normalizeFavorites({ query: "private-search" })).toEqual([]);
  });
  it("adds and removes favorites without altering the input list", () => {
    const original = ["base64"];
    expect(toggleFavorite(original, "json-formatter")).toEqual(["base64", "json-formatter"]);
    expect(toggleFavorite(original, "base64")).toEqual([]);
    expect(toggleFavorite(original, "unknown")).toEqual(original);
    expect(original).toEqual(["base64"]);
  });
});
