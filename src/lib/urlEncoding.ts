import type { TextTransformResult } from "./text";

export type UrlDecodeResult = TextTransformResult<"value">;

export function encodeUrlText(input: string): string {
  return encodeURIComponent(input);
}

export function decodeUrlText(input: string): UrlDecodeResult {
  try {
    return {
      ok: true,
      value: decodeURIComponent(input),
    };
  } catch {
    return {
      ok: false,
      error: "Invalid percent-encoded input.",
    };
  }
}
