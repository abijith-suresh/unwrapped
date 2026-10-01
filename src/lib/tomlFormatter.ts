import { parse, stringify } from "@ltd/j-toml";
import type { TextTransformResult } from "@/lib/text";

// Date parsers normalize leap seconds to :59. Inspect only unquoted source so
// dates inside strings, quoted keys, or comments cannot trigger this check.
function hasLeapSecond(input: string): boolean {
  let source = "";
  let i = 0;
  while (i < input.length) {
    const char = input[i];
    if (char === "#") {
      while (i < input.length && input[i] !== "\n") i++;
    } else if (char === '"' || char === "'") {
      const triple = input.startsWith(char.repeat(3), i);
      i += triple ? 3 : 1;
      while (i < input.length) {
        if (char === '"' && input[i] === "\\") {
          i += 2;
        } else if (input[i] === char) {
          let count = 1;
          while (input[i + count] === char) count++;
          if (!triple || count >= 3) {
            i += triple ? count : 1;
            break;
          }
          i += count;
        } else {
          i++;
        }
      }
      source += " ";
    } else {
      source += char;
      i++;
    }
  }
  return /\d{2}:\d{2}:60(?!\d)/.test(source);
}

export function formatToml(input: string): TextTransformResult {
  if (input.length > 100_000) return { ok: false, error: "TOML is limited to 100,000 characters." };
  if (!input.trim()) return { ok: true, output: "" };
  if (hasLeapSecond(input)) {
    return {
      ok: false,
      error: "Leap-second timestamps are not supported. Input has not been changed.",
    };
  }
  try {
    const document = parse(input, { joiner: "\n", bigint: true, x: { literal: true } });
    const values: unknown[] = [document];
    while (values.length) {
      const value = values.pop();
      if (typeof value === "bigint" || value instanceof BigInt) {
        const integer = value.valueOf();
        if (integer < -(2n ** 63n) || integer > 2n ** 63n - 1n) {
          return { ok: false, error: "Integer is outside the signed 64-bit TOML range." };
        }
      } else if (
        value &&
        typeof value === "object" &&
        !(value instanceof String) &&
        !(value instanceof Number)
      ) {
        values.push(...Object.values(value));
      }
    }
    // The library supports literal-preserving parse/stringify round trips, but
    // its separate table declarations do not model those boxed literals.
    const printable = document as unknown as Parameters<typeof stringify>[0];
    return { ok: true, output: `${stringify(printable, { newline: "\n" }).trim()}\n` };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Invalid TOML." };
  }
}
