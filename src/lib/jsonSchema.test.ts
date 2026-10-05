import { afterEach, describe, expect, it, vi } from "vitest";
import { validateJsonSchema } from "./jsonSchema";

afterEach(() => vi.restoreAllMocks());

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
  it("registers format validation", () => {
    expect(validateJsonSchema('"bad"', '{"type":"string","format":"email"}')).toMatchObject({
      ok: true,
      output: expect.stringContaining("email"),
    });
  });
  it("rejects malformed and unsupported schemas without requests", () => {
    const request = vi.spyOn(globalThis, "fetch");
    expect(validateJsonSchema("{", "{}").ok).toBe(false);
    expect(validateJsonSchema("{}", "[]").ok).toBe(false);
    expect(validateJsonSchema("{}", '{"typo":true}').ok).toBe(false);
    expect(validateJsonSchema("{}", '{"$ref":"https://example.com/schema.json"}').ok).toBe(false);
    expect(request).not.toHaveBeenCalled();
  });
  it("does not coerce string values or remove additional properties", () => {
    const result = validateJsonSchema(
      '{"age":"2","extra":true}',
      '{"type":"object","properties":{"age":{"type":"integer"}},"additionalProperties":false}'
    );
    expect(result).toMatchObject({ output: expect.stringContaining("must be integer") });
    expect(result).toMatchObject({ output: expect.stringContaining("additional properties") });
  });
  it("bounds input sizes", () => {
    expect(validateJsonSchema(" ".repeat(100001), "{}").ok).toBe(false);
  });
});
