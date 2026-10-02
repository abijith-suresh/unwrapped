import { describe, expect, it } from "vitest";

import {
  decodeBase64Input,
  decodeBase64ToBytes,
  decodeBase64ToText,
  deriveDecodedFileName,
  encodeBytesToBase64,
  encodeTextToBase64,
  processBase64Input,
  toBase64Url,
} from "./base64";

describe("base64 utilities", () => {
  it("previews readable Unicode and keeps the original bytes for download", () => {
    const bytes = new TextEncoder().encode("\uFEFFAda ☕\n");
    const result = decodeBase64Input(encodeBytesToBase64(bytes, "url"), "url", "note.txt.b64");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.outputKind).toBe("text");
      expect(result.value).toBe("Ada ☕\n");
      expect([...result.bytes]).toEqual([...bytes]);
      expect(result.downloadName).toBe("note.txt");
    }
  });

  it("automatically previews binary bytes, including valid UTF-8 control bytes", () => {
    for (const bytes of [new Uint8Array([0, 255, 16]), new Uint8Array([0, 1, 2])]) {
      const result = decodeBase64Input(encodeBytesToBase64(bytes, "standard"), "standard");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.outputKind).toBe("bytes");
        expect(result.value).toContain("3 bytes");
        expect(result.bytes).toEqual(bytes);
      }
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
  it("encodes and decodes standard base64 text", () => {
    const encoded = encodeTextToBase64("hello world", "standard");

    expect(encoded).toBe("aGVsbG8gd29ybGQ=");
    expect(decodeBase64ToText(encoded, "standard")).toBe("hello world");
  });

  it("encodes and decodes base64url text", () => {
    const encoded = encodeTextToBase64("hello?", "url");

    expect(encoded).toBe(toBase64Url("aGVsbG8/"));
    expect(decodeBase64ToText(encoded, "url")).toBe("hello?");
  });

  it("encodes bytes directly for file workflows", () => {
    expect(encodeBytesToBase64(new Uint8Array([0, 255, 16]), "standard")).toBe("AP8Q");
  });

  it("decodes binary output for file workflows", () => {
    expect(Array.from(decodeBase64ToBytes("AP8Q", "standard"))).toEqual([0, 255, 16]);
  });

  it("reports invalid text decode input", () => {
    expect(processBase64Input("a", "decode", "standard", "text")).toEqual({
      ok: false,
      error:
        "Invalid input for the selected Base64 variant, or the decoded bytes are not valid UTF-8 text.",
    });
  });

  it("returns decoded bytes and a preview for binary decode workflows", () => {
    const result = processBase64Input("AP8Q", "decode", "standard", "file");

    expect(result.ok).toBe(true);
    if (result.ok && result.outputKind === "bytes") {
      expect(Array.from(result.bytes)).toEqual([0, 255, 16]);
      expect(result.value).toContain("3 bytes");
      expect(result.value).toContain("00 ff 10");
      expect(result.downloadName).toBe("decoded.bin");
    }
  });

  it("derives decoded file names from encoded source names", () => {
    expect(deriveDecodedFileName()).toBe("decoded.bin");
    expect(deriveDecodedFileName("archive.tar.b64")).toBe("archive.tar");
    expect(deriveDecodedFileName("image.png.base64.txt")).toBe("image.png");
    expect(deriveDecodedFileName("payload.txt")).toBe("payload.txt.decoded.bin");
  });
});
