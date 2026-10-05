import Ajv, { type AnySchema } from "ajv";
import addFormats from "ajv-formats";
import { JsonNumber, parseJson } from "@/lib/structuredData";
import type { TextTransformResult } from "@/lib/text";

// Compare decimal values without expanding exponents or rounding the source token.
// This is a Number serialization boundary, not arbitrary-precision Ajv arithmetic.
function decimalValue(source: string): string {
  const [mantissa, exponent = "0"] = source.toLowerCase().split("e");
  const [integer, fraction = ""] = mantissa.replace(/^-/, "").split(".");
  const digits = (integer + fraction).replace(/^0+/, "");
  if (!digits) return "0";
  const coefficient = digits.replace(/0+$/, "");
  const power =
    BigInt(exponent) - BigInt(fraction.length) + BigInt(digits.length - coefficient.length);
  return `${source.startsWith("-") ? "-" : ""}${coefficient}e${power}`;
}

function ajvValue(value: unknown, path = ""): unknown {
  if (value instanceof JsonNumber) {
    const number = Number(value.source);
    if (!Number.isFinite(number) || decimalValue(value.source) !== decimalValue(String(number))) {
      throw new Error(
        `Precision limit at ${path || "/"}: number cannot round-trip through JavaScript Number without changing its decimal value.`
      );
    }
    return number;
  }
  if (Array.isArray(value)) return value.map((item, index) => ajvValue(item, `${path}/${index}`));
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        ajvValue(item, `${path}/${key.replaceAll("~", "~0").replaceAll("/", "~1")}`),
      ])
    );
  }
  return value;
}

function inputError(error: unknown, label: string, malformed: string): TextTransformResult {
  return {
    ok: false,
    error:
      error instanceof Error &&
      (error.message.startsWith("Precision limit") || error.message.startsWith("Duplicate key"))
        ? `${label}: ${error.message}`
        : malformed,
  };
}

/** Synchronous core for the validation worker and trusted bundled examples only. */
export function validateJsonSchema(input: string, schemaText: string): TextTransformResult {
  if (input.length > 100_000 || schemaText.length > 100_000)
    return { ok: false, error: "JSON and schema are limited to 100,000 characters each." };
  let data: unknown;
  let schema: unknown;
  try {
    data = ajvValue(parseJson(input));
  } catch (error) {
    return inputError(error, "JSON document", "Invalid JSON document.");
  }
  try {
    schema = ajvValue(parseJson(schemaText));
  } catch (error) {
    return inputError(error, "Schema JSON", "Invalid schema JSON.");
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
    if ("$async" in validate && validate.$async)
      return { ok: false, error: "Schema error: Async schemas are not supported." };
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
