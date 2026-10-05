import { describe, expect, it } from "vitest";

import { hashBytesWithAlgorithms, hashTextWithAlgorithms } from "./hash";

describe("hash", () => {
  it("computes all supported digests for text", async () => {
    const results = await hashTextWithAlgorithms("hello");

    expect(results).toEqual([
      { algorithm: "SHA-1", hex: "aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d" },
      {
        algorithm: "SHA-256",
        hex: "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
      },
      {
        algorithm: "SHA-384",
        hex: "59e1748777448c69de6b800d7a33bbfb9ff1b463e44354c3553bcdb9c666fa90125a3c79f90397bdf5f6a13de828684f",
      },
      {
        algorithm: "SHA-512",
        hex: "9b71d224bd62f3785d96d46ad3ea3d73319bfbc2890caadae2dff72519673ca72323c3d99ba5c11d7c7acc6e14b8c5da0c4663475c2e5c3adef46f73bcdec043",
      },
    ]);
  });

  it("computes all supported digests for bytes", async () => {
    const results = await hashBytesWithAlgorithms(new Uint8Array([0, 255, 16]));

    expect(results).toEqual([
      { algorithm: "SHA-1", hex: "a14c2fba17201c1ead45b6c4af4409fbfc16ba8a" },
      {
        algorithm: "SHA-256",
        hex: "2da45f2cd1f9c8e69a67abf7a6b26c282533d0a7686787a9533265418680d4d2",
      },
      {
        algorithm: "SHA-384",
        hex: "ad8b7bc3149d63462b2b95ce7fc8aa7cec833cd5d3840eab42f92ea63479aefe71e79a2e3abfb3d60566aea38f5737a4",
      },
      {
        algorithm: "SHA-512",
        hex: "b29a9bd5abb2e2e27b92298e242f28970486bd49d6999ed928800d749fed69ffa8bf4c58cde2cb80018d97e8893ea4067040cfac81bfa891bec7249d4b0fbb33",
      },
    ]);
  });
});
