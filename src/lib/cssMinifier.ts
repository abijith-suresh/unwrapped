import { minify, syntax } from "csso";
import type { TextTransformResult } from "@/lib/text";
export function minifyCss(input: string): TextTransformResult {
  if (input.length > 100_000)
    return { ok: false, error: "CSS input is limited to 100,000 characters." };
  try {
    syntax.parse(input, {
      onParseError(error) {
        throw error;
      },
    });
    return { ok: true, output: minify(input, { restructure: false }).css };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Invalid CSS." };
  }
}
