import Ajv, { type AnySchema } from "ajv";
import addFormats from "ajv-formats";
import type { TextTransformResult } from "@/lib/text";
export function validateJsonSchema(input: string, schemaText: string): TextTransformResult {
  if (input.length > 100_000 || schemaText.length > 100_000)
    return { ok: false, error: "JSON and schema are limited to 100,000 characters each." };
  let data: unknown;
  let schema: unknown;
  try {
    data = JSON.parse(input);
  } catch {
    return { ok: false, error: "Invalid JSON document." };
  }
  try {
    schema = JSON.parse(schemaText);
  } catch {
    return { ok: false, error: "Invalid schema JSON." };
  }
  if (
    typeof schema !== "boolean" &&
    (typeof schema !== "object" || schema === null || Array.isArray(schema))
  )
    return { ok: false, error: "Schema must be an object or boolean." };
  try {
    const ajv = new Ajv({ allErrors: true, strict: true, ownProperties: true });
    addFormats(ajv);
    const validate = ajv.compile(schema as AnySchema);
    if (validate(data)) return { ok: true, output: "Valid. The document matches the schema." };
    return {
      ok: true,
      output:
        "Invalid. The document does not match the schema.\n\n" +
        (validate.errors ?? [])
          .map(
            (error) =>
              `${error.instancePath || "/"}: ${error.message} ${JSON.stringify(error.params)}`
          )
          .join("\n"),
    };
  } catch (error) {
    return {
      ok: false,
      error: `Schema error: ${error instanceof Error ? error.message : "Cannot compile schema."}`,
    };
  }
}
