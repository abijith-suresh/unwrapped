import { describe, expect, it } from "vitest";

import { getToolBySlug, getToolRoute, tools, validateToolRegistry } from "./registry";

const toolComponentPaths = Object.keys(
  import.meta.glob(["./*/*.tsx", "!./**/*.test.tsx", "!./**/*.spec.tsx"])
).map((path) => `/src/tools/${path.slice(2)}`);

describe("tool registry", () => {
  it("has no duplicate ids, duplicate slugs, or missing component paths", () => {
    expect(validateToolRegistry(toolComponentPaths)).toEqual([]);
  });

  it("uses component paths that match the tool slug folders", () => {
    for (const tool of tools) {
      expect(tool.componentPath).toBe(
        `/src/tools/${tool.slug}/${tool.componentPath.split("/").at(-1)}`
      );
    }
  });

  it("resolves every registered slug to its tool and route", () => {
    for (const tool of tools) {
      expect(getToolBySlug(tool.slug)).toBe(tool);
      expect(getToolRoute(tool.slug)).toBe(`/tools/${tool.slug}`);
    }
  });

  it("returns no tool for an unknown slug", () => {
    expect(getToolBySlug("not-a-tool")).toBeUndefined();
  });
});
