import { describe, expect, it } from "vitest";
import {
  normalizeEnvForDiff,
  normalizeJsonForDiff,
  normalizeTomlForDiff,
  normalizeYamlForDiff,
  prepareStructuredCompare,
} from "./structuredCompare";

describe("structured comparison", () => {
  it.each([
    {
      language: "json",
      original: '{"b":2,"a":1}',
      modified: '{"a":1,"b":2}',
      output: '{\n  "a": 1,\n  "b": 2\n}',
    },
    { language: "yaml", original: "b: 2\na: 1\n", modified: "a: 1\nb: 2\n", output: "a: 1\nb: 2" },
    {
      language: "toml",
      original: "b = 2\na = 1\n[tool]\nz = 3\na = 1\n",
      modified: "a = 1\nb = 2\n[tool]\na = 1\nz = 3\n",
      output: "a = 1\nb = 2\n\n[tool]\na = 1\nz = 3",
    },
    {
      language: "env",
      original: "TOKEN=abc\nAPI_URL=https://example.com\n",
      modified: "API_URL=https://example.com\nTOKEN=abc\n",
      output: "API_URL=https://example.com\nTOKEN=abc",
    },
  ])("compares $language after normalization", ({ language, original, modified, output }) => {
    expect(
      prepareStructuredCompare({
        original,
        modified,
        leftLanguage: language,
        rightLanguage: language,
      })
    ).toEqual({
      original: output,
      modified: output,
      strategy: language,
      errors: [],
    });
  });

  it.each([
    { language: "json", original: '{"a":1', modified: '{"a":1,"b":2}', side: "left" },
    {
      language: "yaml",
      original: "service:\n  image: app:latest\n",
      modified: "service: [",
      side: "right",
    },
    {
      language: "toml",
      original: '[tool\nname = "broken"\n',
      modified: 'name = "ok"\n',
      side: "left",
    },
    { language: "env", original: "INVALID LINE", modified: "TOKEN=abc", side: "left" },
  ])("preserves raw $language inputs on failure", ({ language, original, modified, side }) => {
    expect(
      prepareStructuredCompare({
        original,
        modified,
        leftLanguage: language,
        rightLanguage: language,
      })
    ).toEqual({
      original,
      modified,
      strategy: "text",
      errors: [{ side, message: expect.any(String) }],
    });
  });

  it("keeps mixed formats as raw text", () => {
    expect(
      prepareStructuredCompare({
        original: '{"a":1}',
        modified: "a: 1",
        leftLanguage: "json",
        rightLanguage: "yaml",
      })
    ).toEqual({
      original: '{"a":1}',
      modified: "a: 1",
      strategy: "text",
      errors: [],
    });
  });

  it("accepts blank JSON", () => {
    expect(normalizeJsonForDiff("   ")).toEqual({ ok: true, output: "" });
  });

  it("canonicalizes inline TOML tables", () => {
    expect(normalizeTomlForDiff("tool = { z = 3, a = 1 }\n")).toEqual({
      ok: true,
      output: "[tool]\na = 1\nz = 3",
    });
  });

  it("normalizes multi-document YAML", () => {
    expect(normalizeYamlForDiff("b: 2\na: 1\n---\nservice:\n  z: 3\n  a: 1\n")).toEqual({
      ok: true,
      output: "a: 1\nb: 2\n---\nservice:\n  a: 1\n  z: 3",
    });
  });
});

describe("env parsing", () => {
  it.each([
    {
      name: "normalizes env files by sorting keys and ignoring comments",
      input:
        "# comment\nAPI_URL=https://example.com # prod\n export TOKEN = abc123 \n\nMODE=prod\n",
      output: "API_URL=https://example.com\nMODE=prod\nTOKEN=abc123",
    },
    {
      name: "preserves hash characters inside unquoted env values",
      input: "PASSWORD=abc#123\nURL=https://example.com/#fragment\nTOKEN=abc\n",
      output: "PASSWORD=abc#123\nTOKEN=abc\nURL=https://example.com/#fragment",
    },
    {
      name: "treats comment-only empty env values as empty strings",
      input: "EMPTY= # comment\nTOKEN=abc\n",
      output: "EMPTY=\nTOKEN=abc",
    },
    {
      name: "preserves multiline quoted env values",
      input: 'PRIVATE_KEY="line1\nline2"\nTOKEN=abc\n',
      output: "PRIVATE_KEY=line1\nline2\nTOKEN=abc",
    },
    {
      name: "accepts escaped quotes inside double-quoted env values",
      input: 'QUOTE_TEST="a\\"b"\nTOKEN=abc\n',
      output: 'QUOTE_TEST=a\\"b\nTOKEN=abc',
    },
    {
      name: "preserves literal backslashes in double-quoted env values",
      input: 'PATH="C:\\Program Files\\App"\nTAB="\\t"\n',
      output: "PATH=C:\\Program Files\\App\nTAB=\\t",
    },
    {
      name: "accepts multiline single-quoted env values",
      input: "PRIVATE_KEY='line1\nline2'\nTOKEN=abc\n",
      output: "PRIVATE_KEY=line1\nline2\nTOKEN=abc",
    },
    {
      name: "accepts escaped single quotes inside single-quoted env values",
      input: "QUOTE_TEST='it\\'s fine'\nTOKEN=abc\n",
      output: "QUOTE_TEST=it\\'s fine\nTOKEN=abc",
    },
    {
      name: "accepts dotted and dashed env keys",
      input: "FOO.BAR=baz\nFOO-BAR=qux\n",
      output: "FOO-BAR=qux\nFOO.BAR=baz",
    },
    {
      name: "accepts multiline backtick-quoted env values",
      input: "PRIVATE_KEY=`line1\nline2`\nTOKEN=abc\n",
      output: "PRIVATE_KEY=line1\nline2\nTOKEN=abc",
    },
    {
      name: "accepts bare quote characters inside unquoted env values",
      input: 'A=foo"bar\nTOKEN=abc\n',
      output: 'A=foo"bar\nTOKEN=abc',
    },
    {
      name: "ignores trailing comments after quoted env values",
      input: 'A="x" # comment "quoted"\nTOKEN=abc\n',
      output: "A=x\nTOKEN=abc",
    },
  ])("$name", ({ input, output }) => {
    expect(normalizeEnvForDiff(input)).toEqual({ ok: true, output });
  });

  it("rejects unterminated values for each quote style", () => {
    for (const quote of ['"', "'", "`"])
      expect(normalizeEnvForDiff(`A=${quote}foo\nTOKEN=abc\n`)).toEqual({
        ok: false,
        message: "Unterminated quoted env value",
      });
  });
});
