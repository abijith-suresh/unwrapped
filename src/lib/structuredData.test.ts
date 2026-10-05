import { describe, expect, it } from "vitest";
import { processBase64Input } from "@/lib/base64";
import { analyzeDiff } from "@/lib/diffAnalysis";
import { formatJson } from "@/lib/jsonFormatter";
import { convertJsonToCsv } from "@/lib/jsonToCsv";
import { convertJsonToYaml } from "@/lib/jsonToYaml";
import {
  normalizeEnvForDiff,
  normalizeJsonForDiff,
  normalizeYamlForDiff,
} from "@/lib/structuredCompare";
import { parseJson, stringifyJson } from "@/lib/structuredData";
import { formatYaml } from "@/lib/yamlFormatter";
import { convertYamlToJson } from "@/lib/yamlToJson";

describe("structured data preservation", () => {
  const numbers = "[9007199254740993,1.234567890123456789,1e500,1e-500,-0,2.370]";

  it("sorts nested keys when converting between JSON and YAML", () => {
    const yaml = convertJsonToYaml('{"z":true,"a":{"c":2,"b":1},"items":[null]}');
    expect(yaml).toEqual({
      ok: true,
      output: "a:\n  b: 1\n  c: 2\nitems:\n  - null\nz: true",
    });
    if (!yaml.ok) throw new Error("Expected conversion to succeed");
    expect(convertYamlToJson(yaml.output)).toEqual({
      ok: true,
      output:
        '{\n  "a": {\n    "b": 1,\n    "c": 2\n  },\n  "items": [\n    null\n  ],\n  "z": true\n}',
    });
  });

  it("preserves numeric tokens through formatting, sorting and JSON/YAML conversion", () => {
    expect(formatJson(numbers, 2, true, true).raw).toBe(numbers);
    const yaml = convertJsonToYaml(numbers);
    expect(yaml.ok).toBe(true);
    if (!yaml.ok) return;
    const formatted = formatYaml(yaml.output, { indent: 4, sortKeys: true });
    expect(formatted.ok).toBe(true);
    if (!formatted.ok) return;
    const json = convertYamlToJson(formatted.output);
    expect(json.ok).toBe(true);
    if (json.ok) expect(stringifyJson(parseJson(json.output))).toBe(numbers);
  });

  it("keeps distinct large numbers and prototype-named keys distinct in Diff", () => {
    for (const [original, modified] of [
      ['{"id":9007199254740993}', '{"id":9007199254740992}'],
      ['{"__proto__":{"x":1}}', '{"__proto__":{"x":2}}'],
    ]) {
      expect(
        analyzeDiff({
          original,
          modified,
          leftLanguage: "json",
          rightLanguage: "json",
          changesOnly: true,
        }).isIdentical
      ).toBe(false);
    }
    expect(normalizeEnvForDiff("__proto__=one")).toEqual({ ok: true, output: "__proto__=one" });
    expect(normalizeYamlForDiff("__proto__:\n  x: 9007199254740993")).toEqual({
      ok: true,
      output: "__proto__:\n  x: 9007199254740993",
    });
    expect(normalizeJsonForDiff('{"__proto__":{"x":1}}')).toEqual({
      ok: true,
      output: '{\n  "__proto__": {\n    "x": 1\n  }\n}',
    });
  });

  it("does not discard duplicate keys or silently convert non-finite YAML to null", () => {
    expect(formatJson('{"id":1,"id":2}', 2, false, false).error).toContain("Duplicate key");
    expect(convertJsonToYaml('{"id":1,"id":2}').ok).toBe(false);
    expect(convertYamlToJson("number: .inf").ok).toBe(false);
    expect(formatYaml("number: .inf", { indent: 2, sortKeys: false })).toEqual({
      ok: true,
      output: "number: .inf",
    });
  });

  it("treats number-wrapper names and prototype names as ordinary user data", () => {
    const source =
      '{"isLosslessNumber":true,"source":"1e500","value":"text","toString":"value","__proto__":{"constructor":1}}';
    expect(stringifyJson(parseJson(source))).toBe(source);
    expect(formatJson(source, 2, true, false).raw).toBe(source);
  });

  it("converts YAML number notation and scalar keys without rounding", () => {
    const result = convertYamlToJson("1: .5\nhex: 0x20000000000001\nsmall: 1e-500");
    expect(result).toEqual({
      ok: true,
      output: '{\n  "1": 0.5,\n  "hex": 9007199254740993,\n  "small": 1e-500\n}',
    });
  });

  it("exports exact CSV values and blanks for absent prototype-named columns", () => {
    expect(
      convertJsonToCsv('[{"__proto__":"first","id":9007199254740993},{"other":"second"}]')
    ).toEqual({ ok: true, output: "__proto__,id,other\nfirst,9007199254740993,\n,,second" });
    expect(convertJsonToCsv("[1,2]").ok).toBe(false);
  });

  it("encodes whitespace as bytes", () => {
    expect(processBase64Input(" \t\n", "encode", "standard", "text")).toEqual({
      ok: true,
      value: "IAkK",
      outputKind: "text",
    });
  });
});
