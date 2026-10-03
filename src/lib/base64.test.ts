import { describe, expect, it } from "vitest";

import {
  decodeBase64Input,
  deriveDecodedFileName,
  encodeBytesToBase64,
  encodeTextToBase64,
} from "./base64";

describe("base64 utilities", () => {
  it("previews readable Unicode and keeps the original bytes for download", () => {
    const bytes = new TextEncoder().encode("\uFEFFAda ☕\n");
    const result = decodeBase64Input(encodeBytesToBase64(bytes, "url"), "url", "note.txt.b64");
    expect(result).toEqual({
      ok: true,
      outputKind: "text",
      value: "Ada ☕\n",
      bytes,
      downloadName: "note.txt",
    });
  });

  it("automatically previews binary bytes, including valid UTF-8 control bytes", () => {
    for (const bytes of [new Uint8Array([0, 255, 16]), new Uint8Array([0, 1, 2])]) {
      const result = decodeBase64Input(encodeBytesToBase64(bytes, "standard"), "standard");
      expect(result).toMatchObject({
        ok: true,
        outputKind: "bytes",
        value: expect.stringMatching(/^3 bytes\n/),
        bytes,
      });
    }
  });

  it("distinguishes invalid Base64 from empty and binary input", () => {
    expect(decodeBase64Input("!invalid", "standard").ok).toBe(false);
    expect(decodeBase64Input("", "standard")).toMatchObject({
      ok: true,
      value: "",
      bytes: new Uint8Array(),
    });
  });
  it("encodes and decodes base64url text", () => {
    const encoded = encodeTextToBase64("hello?", "url");

    expect(encoded).toBe("aGVsbG8_");
    expect(decodeBase64Input(encoded, "url")).toMatchObject({
      ok: true,
      outputKind: "text",
      value: "hello?",
    });
  });

  it("derives decoded file names from encoded source names", () => {
    expect(deriveDecodedFileName()).toBe("decoded.bin");
    expect(deriveDecodedFileName("archive.tar.b64")).toBe("archive.tar");
    expect(deriveDecodedFileName("image.png.base64.txt")).toBe("image.png");
    expect(deriveDecodedFileName("payload.txt")).toBe("payload.txt.decoded.bin");
  });
});
