import { describe, expect, it, vi } from "vitest";
import { validateJsonSchema } from "./jsonSchema";

describe("JSON Schema validation", () => {
  it("validates nested data and reports instance paths", () => {
    const schema = JSON.stringify({
      type: "object",
      properties: { age: { type: "integer", minimum: 0 } },
      required: ["age"],
      additionalProperties: false,
    });
    expect(validateJsonSchema('{"age":2}', schema)).toEqual({
      ok: true,
      output: "Valid. The document matches the schema.",
    });
    const invalid = validateJsonSchema('{"age":-1}', schema);
    expect(invalid.ok && invalid.output).toContain("/age");
  });
  it("supports boolean schemas, local refs and formats", () => {
    expect(validateJsonSchema("null", "true")).toMatchObject({
      output: expect.stringContaining("Valid."),
    });
    expect(validateJsonSchema("null", "false")).toMatchObject({
      ok: true,
      output: expect.stringContaining("boolean schema is false"),
    });
    expect(validateJsonSchema('"bad"', '{"type":"string","format":"email"}')).toMatchObject({
      output: expect.stringContaining("email"),
    });
    expect(
      validateJsonSchema(
        '"ok"',
        '{"definitions":{"text":{"type":"string"}},"$ref":"#/definitions/text"}'
      )
    ).toMatchObject({ output: expect.stringContaining("Valid.") });
  });
  it("rejects malformed and unsupported schemas without requests", () => {
    const request = vi.spyOn(globalThis, "fetch");
    expect(validateJsonSchema("{", "{}").ok).toBe(false);
    expect(validateJsonSchema("{}", "[]").ok).toBe(false);
    expect(validateJsonSchema("{}", '{"typo":true}').ok).toBe(false);
    expect(validateJsonSchema("{}", '{"$ref":"https://example.com/schema.json"}').ok).toBe(false);
    expect(request).not.toHaveBeenCalled();
    request.mockRestore();
  });
  it("does not coerce string values or remove additional properties", () => {
    const result = validateJsonSchema(
      '{"age":"2","extra":true}',
      '{"type":"object","properties":{"age":{"type":"integer"}},"additionalProperties":false}'
    );
    expect(result).toMatchObject({ output: expect.stringContaining("must be integer") });
    expect(result).toMatchObject({ output: expect.stringContaining("additional properties") });
  });
  it.each([
    "9007199254740993",
    "-9007199254740993",
    "1.0000000000000001",
    "9007199254740992.1",
    "1e309",
    "-1e309",
    "1e-400",
    "-1e-400",
    "4.9406564584124654e-324",
  ])("rejects changed decimal values in data and schema: %s", (number) => {
    expect(validateJsonSchema(`[${number}]`, "true")).toMatchObject({
      ok: false,
      error: expect.stringContaining("JSON document: Precision limit at /0"),
    });
    expect(validateJsonSchema("1", `{"const":${number}}`)).toMatchObject({
      ok: false,
      error: expect.stringContaining("Schema JSON: Precision limit at /const"),
    });
  });
  it("rejects the rounded maximum and const reproductions before validating", () => {
    expect(
      validateJsonSchema(
        '{"n":9007199254740993}',
        '{"type":"object","properties":{"n":{"type":"integer","maximum":9007199254740992}}}'
      )
    ).toMatchObject({ ok: false, error: expect.stringContaining("Precision limit at /n") });
    expect(validateJsonSchema("1.0000000000000001", '{"const":1}')).toMatchObject({ ok: false });
  });
  it.each([
    ["0.1", "0.1000"],
    ["1e0", "1.00"],
    ["1.2300e2", "123"],
    ["-0.000e999999999999999999999", "0"],
    ["1E+21", "1000000000000000000000"],
    ["9007199254740992", "9.007199254740992e15"],
    ["5e-324", "5.0e-324"],
    ["1e-300", "0.10e-299"],
    ["-42.500", "-4.25e1"],
  ])("retains numbers with unchanged decimal values: %s", (data, number) => {
    expect(validateJsonSchema(data, `{"type":"number","const":${number}}`)).toMatchObject({
      ok: true,
      output: "Valid. The document matches the schema.",
    });
  });
  it.each(['{"n":1,"n":2}', '{"items":[{"n":1,"\\u006e":2}]}', '{"__proto__":1,"__proto__":2}'])(
    "rejects duplicate decoded keys in either input: %s",
    (json) => {
      expect(validateJsonSchema(json, "{}")).toMatchObject({
        ok: false,
        error: expect.stringContaining("JSON document: Duplicate key"),
      });
      expect(validateJsonSchema("{}", json)).toMatchObject({
        ok: false,
        error: expect.stringContaining("Schema JSON: Duplicate key"),
      });
    }
  );
  it("keeps numeric lookalike objects, escaped paths and own keys distinct", () => {
    expect(
      validateJsonSchema(
        '{"n":{"source":"1"}}',
        '{"type":"object","properties":{"n":{"type":"number"}}}'
      )
    ).toMatchObject({ output: expect.stringContaining("must be number") });
    expect(validateJsonSchema('{"a/b~c":1.0000000000000001}', "{}")).toMatchObject({
      ok: false,
      error: expect.stringContaining("/a~1b~0c"),
    });
    expect(
      validateJsonSchema('{"__proto__":{"n":1}}', '{"type":"object","additionalProperties":false}')
    ).toMatchObject({ output: expect.stringContaining("additional properties") });
  });
  it("rejects async schemas instead of treating a Promise as success", () => {
    expect(validateJsonSchema("null", '{"$async":true,"type":"string"}')).toMatchObject({
      ok: false,
      error: expect.stringContaining("Async schemas are not supported"),
    });
  });
  it("bounds input sizes", () => {
    expect(validateJsonSchema(" ".repeat(100001), "{}").ok).toBe(false);
    expect(validateJsonSchema("{}", " ".repeat(100001)).ok).toBe(false);
  });
});
