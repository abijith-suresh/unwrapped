import { describe, expect, it } from "vitest";

import { DEFAULT_TOKEN_OPTIONS, generateToken, normalizeTokenOptions } from "./tokenGenerator";

describe("normalizeTokenOptions", () => {
  it("clamps token length into the supported range", () => {
    expect(normalizeTokenOptions({ ...DEFAULT_TOKEN_OPTIONS, length: 0 }).length).toBe(1);
    expect(normalizeTokenOptions({ ...DEFAULT_TOKEN_OPTIONS, length: 999 }).length).toBe(512);
  });
});

describe("generateToken", () => {
  it("returns a clear validation error when all character sets are disabled", () => {
    expect(
      generateToken({
        length: 16,
        uppercase: false,
        lowercase: false,
        digits: false,
        symbols: false,
      })
    ).toEqual({
      ok: false,
      error: "Select at least one character set.",
    });
  });

  it("uses the requested character sets only", () => {
    const result = generateToken(
      {
        length: 8,
        uppercase: false,
        lowercase: true,
        digits: true,
        symbols: false,
      },
      (length) => Uint8Array.from([0, 25, 26, 35, 36, 61, 70, 251].slice(0, length))
    );

    expect(result).toEqual({
      ok: true,
      token: "az09az89",
      alphabet: "abcdefghijklmnopqrstuvwxyz0123456789",
    });
  });

  it("retries bytes that would introduce modulo bias", () => {
    const calls: number[] = [];
    const result = generateToken(
      {
        length: 4,
        uppercase: false,
        lowercase: false,
        digits: false,
        symbols: true,
      },
      (length) => {
        calls.push(length);
        return calls.length === 1 ? Uint8Array.from([0, 1, 250, 251]) : Uint8Array.from([2, 3]);
      }
    );

    expect(result).toEqual({
      ok: true,
      token: '!"#$',
      alphabet: '!"#$%&()*+,-./:;<=>?@[\\]^_{|}~',
    });
    expect(calls).toEqual([4, 2]);
  });
});
