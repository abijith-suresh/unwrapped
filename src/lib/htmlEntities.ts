import { decode, encode } from "html-entities";
import type { TextTransformResult } from "@/lib/text";
export function transformEntities(
  input: string,
  mode: "encode" | "decode",
  nonAscii = false
): TextTransformResult {
  return {
    ok: true,
    output:
      mode === "decode"
        ? decode(input, { level: "html5", scope: "strict" })
        : encode(input, { level: "html5", mode: nonAscii ? "nonAscii" : "specialChars" }),
  };
}
