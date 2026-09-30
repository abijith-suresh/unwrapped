import { bytesToHex } from "./bytes";
import { type TextTransformResult, toErrorMessage } from "./text";

export const HMAC_ALGORITHMS = [
  { id: "SHA-1", label: "HMAC-SHA1" },
  { id: "SHA-256", label: "HMAC-SHA256" },
  { id: "SHA-384", label: "HMAC-SHA384" },
  { id: "SHA-512", label: "HMAC-SHA512" },
] as const;

export type HmacAlgorithm = (typeof HMAC_ALGORITHMS)[number]["id"];

export interface HmacInput {
  message: string;
  secret: string;
  algorithm: HmacAlgorithm;
}

export type HmacResult = TextTransformResult;

export async function generateHmac(
  input: HmacInput,
  runtime: Pick<Crypto, "subtle"> | null = globalThis.crypto
): Promise<HmacResult> {
  if (!runtime?.subtle) {
    return {
      ok: false,
      error: "Web Crypto HMAC support is unavailable in this runtime.",
    };
  }

  try {
    const encoder = new TextEncoder();
    const key = await runtime.subtle.importKey(
      "raw",
      encoder.encode(input.secret),
      { name: "HMAC", hash: input.algorithm },
      false,
      ["sign"]
    );
    const signature = await runtime.subtle.sign("HMAC", key, encoder.encode(input.message));

    return {
      ok: true,
      output: bytesToHex(new Uint8Array(signature)),
    };
  } catch (error) {
    return {
      ok: false,
      error: toErrorMessage(error, "Unable to generate HMAC."),
    };
  }
}
