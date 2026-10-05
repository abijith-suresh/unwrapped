import { describe, expect, it } from "vitest";

import { generateHmac } from "./hmac";

describe("generateHmac", () => {
  it("formats a known SHA-256 test vector as lowercase hex", async () => {
    await expect(
      generateHmac({
        message: "The quick brown fox jumps over the lazy dog",
        secret: "key",
        algorithm: "SHA-256",
      })
    ).resolves.toEqual({
      ok: true,
      output: "f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8",
    });
  });

  it("returns a clear error when Web Crypto is unavailable", async () => {
    await expect(
      generateHmac(
        {
          message: "hello",
          secret: "world",
          algorithm: "SHA-256",
        },
        null
      )
    ).resolves.toEqual({
      ok: false,
      error: "Web Crypto HMAC support is unavailable in this runtime.",
    });
  });
});
