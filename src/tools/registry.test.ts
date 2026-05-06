import { describe, expect, it } from "vitest";

import { getToolBySlug, tools, validateToolRegistry } from "./registry";

const toolComponentPaths = tools.map((tool) => tool.componentPath);

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

  it("includes the case converter route", () => {
    expect(getToolBySlug("case-converter")).toMatchObject({
      id: "case-converter",
      category: "text",
      componentPath: "/src/tools/case-converter/CaseConverter.tsx",
    });
  });
});
