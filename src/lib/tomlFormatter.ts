import { parse, stringify } from "smol-toml";
import type { TextTransformResult } from "@/lib/text";
export function formatToml(input: string): TextTransformResult {
  if (!input.trim()) return { ok: true, output: "" };
  try {
    return { ok: true, output: stringify(parse(input)) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Invalid TOML." };
  }
}
