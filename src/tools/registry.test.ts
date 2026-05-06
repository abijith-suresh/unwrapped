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

  it("includes the text statistics route", () => {
    expect(getToolBySlug("text-statistics")).toMatchObject({
      id: "text-statistics",
      category: "text",
      componentPath: "/src/tools/text-statistics/TextStatisticsTool.tsx",
    });
  });

  it("includes the token generator route", () => {
    expect(getToolBySlug("token-generator")).toMatchObject({
      id: "token-generator",
      category: "generators",
      componentPath: "/src/tools/token-generator/TokenGenerator.tsx",
    });
  });

  it("includes the URL encoder route", () => {
    expect(getToolBySlug("url-encoder")).toMatchObject({
      id: "url-encoder",
      category: "encoding",
      componentPath: "/src/tools/url-encoder/UrlEncoderTool.tsx",
    });
  });

  it("includes the HTTP status codes route", () => {
    expect(getToolBySlug("http-status-codes")).toMatchObject({
      id: "http-status-codes",
      category: "network",
      componentPath: "/src/tools/http-status-codes/HttpStatusCodesTool.tsx",
    });
  });

  it("includes the JSON to YAML route", () => {
    expect(getToolBySlug("json-to-yaml")).toMatchObject({
      id: "json-to-yaml",
      category: "data",
      componentPath: "/src/tools/json-to-yaml/JsonToYamlTool.tsx",
    });
  });

  it("includes the YAML to JSON route", () => {
    expect(getToolBySlug("yaml-to-json")).toMatchObject({
      id: "yaml-to-json",
      category: "data",
      componentPath: "/src/tools/yaml-to-json/YamlToJsonTool.tsx",
    });
  });

  it("includes the YAML formatter route", () => {
    expect(getToolBySlug("yaml-formatter")).toMatchObject({
      id: "yaml-formatter",
      category: "data",
      componentPath: "/src/tools/yaml-formatter/YamlFormatterTool.tsx",
    });
  });

  it("includes the XML formatter route", () => {
    expect(getToolBySlug("xml-formatter")).toMatchObject({
      id: "xml-formatter",
      category: "data",
      componentPath: "/src/tools/xml-formatter/XmlFormatterTool.tsx",
    });
  });

  it("includes the JSON to CSV route", () => {
    expect(getToolBySlug("json-to-csv")).toMatchObject({
      id: "json-to-csv",
      category: "data",
      componentPath: "/src/tools/json-to-csv/JsonToCsvTool.tsx",
    });
  });

  it("includes the chmod calculator route", () => {
    expect(getToolBySlug("chmod-calculator")).toMatchObject({
      id: "chmod-calculator",
      category: "security",
      componentPath: "/src/tools/chmod-calculator/ChmodCalculatorTool.tsx",
    });
  });

  it("includes the HMAC generator route", () => {
    expect(getToolBySlug("hmac-generator")).toMatchObject({
      id: "hmac-generator",
      category: "security",
      componentPath: "/src/tools/hmac-generator/HmacGeneratorTool.tsx",
    });
  });

  it("includes the URL inspector route", () => {
    expect(getToolBySlug("url-inspector")).toMatchObject({
      id: "url-inspector",
      category: "network",
      componentPath: "/src/tools/url-inspector/UrlInspectorTool.tsx",
    });
  });
});
