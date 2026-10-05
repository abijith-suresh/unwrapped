import { describe, expect, it, vi } from "vitest";
import { JsonNumber } from "@/lib/structuredData";

import {
  formatJwtTimestamp,
  getJwtClaimsSummary,
  getJwtExpiryStatus,
  parseJwt,
  prettyJson,
} from "./jwt";

const encode = (source: string) => Buffer.from(source).toString("base64url");
const tokenFor = (payload: string, header = '{"alg":"HS256"}') =>
  `${encode(header)}.${encode(payload)}.${encode("signature")}`;

describe("jwt utilities", () => {
  it("parses JWT tokens into header, payload, and signature", () => {
    const token = tokenFor('{"sub":"123","exp":1900000000}', '{"alg":"HS256","typ":"JWT"}');

    expect(parseJwt(token)).toEqual({
      header: { alg: "HS256", typ: "JWT" },
      payload: { sub: "123", exp: new JsonNumber("1900000000") },
      signature: encode("signature"),
    });
  });

  it("rejects invalid JWT segment counts", () => {
    expect(() => parseJwt("not.a.jwt.extra")).toThrow("Expected three");
  });

  it("preserves exact numeric tokens, Unicode and special keys in both decoded objects", () => {
    const source =
      '{"n":9007199254740993,"decimal":1.2300,"huge":1e500,"small":1e-500,"zero":-0,"text":"雪 😀","__proto__":{"exp":100},"constructor":"user","toString":"value"}';
    const parsed = parseJwt(tokenFor(source, source));
    for (const value of [parsed.header, parsed.payload]) {
      expect(prettyJson(value)).toBe(
        `{\n  "n": 9007199254740993,\n  "decimal": 1.2300,\n  "huge": 1e500,\n  "small": 1e-500,\n  "zero": -0,\n  "text": "雪 😀",\n  "__proto__": {\n    "exp": 100\n  },\n  "constructor": "user",\n  "toString": "value"\n}`
      );
      expect(Object.hasOwn(value as object, "__proto__")).toBe(true);
      expect(Object.getPrototypeOf(value)).toBe(Object.prototype);
    }
    expect(getJwtExpiryStatus(parsed.payload, 100)).toBeNull();
  });

  it.each([
    "not JSON",
    '{"a":}',
    '{"a":1,}',
    '{/*comment*/"a":1}',
    "\uFEFF{}",
    "{} {}",
    '"text"',
    "null",
    "true",
    "123",
    "[]",
  ])("rejects malformed JSON or non-object %s in either segment", (source) => {
    expect(() => parseJwt(tokenFor(source))).toThrow(/Payload:/);
    expect(() => parseJwt(tokenFor("{}", source))).toThrow(/Header:/);
  });

  it.each([
    '{"exp":1,"exp":2}',
    '{"exp":1,"\\u0065xp":2}',
    '{"nested":{"__proto__":1,"__proto__":2}}',
    '{"a":[{"x":1,"x":2}]}',
  ])("rejects duplicate keys including escaped and nested keys: %s", (source) => {
    expect(() => parseJwt(tokenFor(source))).toThrow(/Payload: Duplicate key/);
    expect(() => parseJwt(tokenFor("{}", source))).toThrow(/Header: Duplicate key/);
  });

  it.each(["", "a", "e30=", "e3+", "e3/", "e 30", "e30\n", "e31", "%%%%"])(
    "rejects bad base64url segment %s",
    (segment) => {
      expect(() => parseJwt(`${segment}.${encode("{}")}.${encode("sig")}`)).toThrow(/Header:/);
      expect(() => parseJwt(`${encode("{}")}.${segment}.${encode("sig")}`)).toThrow();
      if (segment && !segment.endsWith("\n"))
        expect(() => parseJwt(`${encode("{}")}.${encode("{}")}.${segment}`)).toThrow(/Signature:/);
    }
  );

  it.each([
    [0xc3, 0x28],
    [0xc0, 0xaf],
    [0xed, 0xa0, 0x80],
    [0xe2, 0x82],
  ])("rejects ill-formed UTF-8 bytes %s", (...bytes) => {
    const segment = Buffer.from(bytes).toString("base64url");
    expect(() => parseJwt(`${segment}.${encode("{}")}.${encode("sig")}`)).toThrow(
      "Header: Expected well-formed UTF-8"
    );
    expect(() => parseJwt(`${encode("{}")}.${segment}.${encode("sig")}`)).toThrow();
  });

  it("supports unsecured tokens and checks signature encoding without decoding it as JSON", () => {
    const token = `${encode('{"alg":"none"}')}.${encode("{}")}.`;
    expect(parseJwt(token).signature).toBe("");
    expect(() => parseJwt(`${encode('{"alg":"HS256"}')}.${encode("{}")}.`)).toThrow(
      'empty signature requires header alg "none"'
    );
    expect(() => parseJwt(tokenFor("{}", '{"alg":"none"}'))).toThrow("requires an empty signature");
    expect(parseJwt(`${encode("{}")}.${encode("{}")}._w`).signature).toBe("_w");
  });

  it("expires at equality and respects fractional and negative NumericDates", () => {
    expect(getJwtExpiryStatus({ exp: 100 }, 100)?.expired).toBe(true);
    expect(getJwtExpiryStatus(parseJwt(tokenFor('{"exp":100.5}')).payload, 100.499)?.expired).toBe(
      false
    );
    expect(getJwtExpiryStatus({ exp: 100.5 }, 100.5)?.expired).toBe(true);
    expect(getJwtExpiryStatus({ exp: -0.5 }, -1)?.expired).toBe(false);
    expect(getJwtExpiryStatus({ exp: 300 }, 200)?.label).toMatch(/^Not expired\. Expires at/);
    for (const source of ["100.00000000000000001", "1.0000000000000000001e2"]) {
      expect(getJwtExpiryStatus({ exp: new JsonNumber(source) }, 100)?.expired).toBe(false);
    }
    expect(getJwtExpiryStatus({ exp: new JsonNumber("99.99999999999999999") }, 100)?.expired).toBe(
      true
    );
    expect(
      getJwtExpiryStatus({ exp: new JsonNumber("-100.00000000000000001") }, -100)?.expired
    ).toBe(true);
    expect(getJwtExpiryStatus({ exp: new JsonNumber("1e-500") }, 0)?.expired).toBe(false);
    expect(getJwtExpiryStatus({ exp: new JsonNumber("-0.000") }, 0)?.expired).toBe(true);
  });

  it("uses fractional current time by default", () => {
    const clock = vi.spyOn(Date, "now").mockReturnValue(100_750);
    try {
      expect(getJwtExpiryStatus({ exp: 100.5 })?.expired).toBe(true);
    } finally {
      clock.mockRestore();
    }
  });

  it.each([
    "100",
    undefined,
    null,
    false,
    {},
    [],
    NaN,
    Infinity,
    -Infinity,
    8640000000001,
    -8640000000001,
    new JsonNumber("9007199254740993"),
    new JsonNumber("1e500"),
    new JsonNumber("8640000000000.0001"),
    new JsonNumber("-8640000000000.0001"),
  ])("reports unusable NumericDate %s without a valid expiration or date", (exp) => {
    expect(getJwtExpiryStatus({ exp }, 100)?.expired).toBeNull();
    expect(getJwtExpiryStatus({ exp }, 100)?.label).toMatch(/^Expiration unknown\./);
    expect(formatJwtTimestamp(exp)).toMatch(/NumericDate/);
    const summary = getJwtClaimsSummary({
      header: {},
      payload: { exp, nbf: exp, iat: exp },
      signature: "",
    });
    expect(summary.every((item) => item.displayValue.includes("NumericDate"))).toBe(true);
  });

  it("preserves unusable NumericDate tokens in summary and output", () => {
    const parsed = parseJwt(tokenFor('{"exp":1e500,"nbf":9007199254740993,"iat":1.2300}'));
    const summary = getJwtClaimsSummary(parsed).filter((item) => item.section === "payload");
    expect(summary.map((item) => item.rawValue)).toEqual(["1e500", "9007199254740993", "1.2300"]);
    expect(prettyJson(parsed.payload)).toContain('"exp": 1e500');
    expect(summary[0].displayValue).toContain("finite");
    expect(summary[1].displayValue).toContain("date range");
    expect(formatJwtTimestamp(8640000000000)).not.toContain("NumericDate");
    expect(getJwtExpiryStatus({ exp: 100 }, NaN)?.expired).toBeNull();
  });

  it("ignores inherited registered claims and accepts own claims on null prototypes", () => {
    const header = Object.create({ alg: "none", typ: "JWT" });
    const payload = Object.create({ exp: 100, sub: "inherited" });
    expect(getJwtClaimsSummary({ header, payload, signature: "" })).toEqual([]);
    expect(getJwtExpiryStatus(payload, 100)).toBeNull();
    const ownPayload = Object.assign(Object.create(null), { exp: 100, sub: "own" });
    expect(getJwtExpiryStatus(ownPayload, 100)?.expired).toBe(true);
    expect(
      getJwtClaimsSummary({ header, payload: ownPayload, signature: "" }).map((item) => item.key)
    ).toEqual(["sub", "exp"]);
  });

  it("derives token expiry state from exp claims", () => {
    expect(getJwtExpiryStatus({ exp: 100 }, 200)?.expired).toBe(true);
    expect(getJwtExpiryStatus({ exp: 300 }, 200)?.expired).toBe(false);
    expect(getJwtExpiryStatus({ sub: "123" }, 200)).toBeNull();
  });

  it("extracts standard claims into a compact summary", () => {
    const summary = getJwtClaimsSummary({
      header: { alg: "HS256", typ: "JWT" },
      payload: {
        iss: "issuer",
        sub: "123",
        aud: ["web", "mobile"],
        exp: 1_900_000_000,
        iat: 1_800_000_000,
        jti: "token-id",
      },
      signature: "signature",
    });

    expect(summary.map((item) => item.key)).toEqual([
      "alg",
      "typ",
      "iss",
      "sub",
      "aud",
      "exp",
      "iat",
      "jti",
    ]);
    expect(summary.find((item) => item.key === "aud")?.rawValue).toBe('["web","mobile"]');
    expect(summary.find((item) => item.key === "exp")?.displayValue).toContain("2030");
    expect(summary.find((item) => item.key === "alg")?.section).toBe("header");
    expect(summary.find((item) => item.key === "sub")?.section).toBe("payload");
  });
});
