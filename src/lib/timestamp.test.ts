import { describe, expect, it } from "vitest";

import {
  formatEpoch,
  formatInZone,
  formatMongoObjectIdSeed,
  getDerivedTimestampFormats,
  localInputToMs,
  msToLocalInput,
  parseEpoch,
} from "./timestamp";

describe("timestamp", () => {
  it("detects seconds and milliseconds epoch inputs", () => {
    expect(parseEpoch("1700000000")).toEqual({ ms: 1_700_000_000_000, unit: "s" });
    expect(parseEpoch("1700000000001")).toEqual({ ms: 1_700_000_000_001, unit: "ms" });
    expect(parseEpoch("not-a-time")).toHaveProperty("error");
  });

  it("uses explicit units for early, short, negative and fractional epochs", () => {
    expect(parseEpoch("946684800000", "ms")).toEqual({ ms: 946_684_800_000, unit: "ms" });
    expect(parseEpoch("16", "ms")).toEqual({ ms: 16, unit: "ms" });
    expect(parseEpoch("-16", "ms")).toEqual({ ms: -16, unit: "ms" });
    expect(parseEpoch("+1.123", "s")).toEqual({ ms: 1123, unit: "s" });
    expect(parseEpoch("-0.001", "s")).toEqual({ ms: -1, unit: "s" });
    expect(parseEpoch("1.0010", "s")).toEqual({ ms: 1001, unit: "s" });
    expect(parseEpoch(" 123.000 ", "ms")).toEqual({ ms: 123, unit: "ms" });
    expect(parseEpoch("1700000000001", "s")).toEqual({ ms: 1_700_000_000_001_000, unit: "s" });
  });

  it("keeps the documented Auto threshold on both sides of zero", () => {
    for (const sign of [1, -1]) {
      expect(parseEpoch(String(sign * 1e12))).toEqual({ ms: sign * 1e15, unit: "s" });
      expect(parseEpoch(String(sign * (1e12 + 1)))).toEqual({ ms: sign * (1e12 + 1), unit: "ms" });
    }
    expect(parseEpoch("946684800000")).toEqual({ ms: 946_684_800_000_000, unit: "s" });
    expect(parseEpoch("-1.123")).toEqual({ ms: -1123, unit: "s" });
  });

  it.each([
    "",
    " ",
    "not-a-time",
    "0x10",
    "0b10",
    "0o10",
    "1e3",
    "Infinity",
    "-Infinity",
    "NaN",
    "1_000",
    "1,000",
    "1.2.3",
    "1.",
    ".5",
    "--1",
    "1 2",
    "9".repeat(310),
  ])("rejects invalid decimal input %j", (raw) => {
    expect(parseEpoch(raw)).toHaveProperty("error");
  });

  it("reports sub-millisecond precision instead of rounding", () => {
    expect(parseEpoch("1.0001", "s")).toHaveProperty("error");
    expect(parseEpoch("1.1", "ms")).toHaveProperty("error");
    expect(parseEpoch("-0.0001", "s")).toHaveProperty("error");
  });

  it("accepts the exact Date limits and rejects values beyond them", () => {
    for (const sign of ["", "-"]) {
      expect(parseEpoch(`${sign}8640000000000000`, "ms")).toEqual({
        ms: Number(`${sign}8640000000000000`),
        unit: "ms",
      });
      expect(parseEpoch(`${sign}8640000000000`, "s")).toEqual({
        ms: Number(`${sign}8640000000000000`),
        unit: "s",
      });
      expect(parseEpoch(`${sign}8640000000000001`, "ms")).toHaveProperty("error");
      expect(parseEpoch(`${sign}8640000000000.001`, "s")).toHaveProperty("error");
    }
  });

  it("round-trips formatted epoch values without losing milliseconds", () => {
    for (const ms of [
      0,
      1,
      -1,
      1001,
      -1123,
      946684800123,
      1704164645123,
      1e15,
      1e15 + 1,
      -1e15 - 1,
      8640000000000000 - 1,
    ]) {
      for (const unit of ["auto", "s", "ms"] as const) {
        expect(parseEpoch(formatEpoch(ms, unit), unit)).toMatchObject({ ms });
      }
    }
    expect(formatEpoch(-1, "s")).toBe("-0.001");
    expect(formatEpoch(1704164645123, "s")).toBe("1704164645.123");
    expect(formatEpoch(8639999999999999, "s")).toBe("8639999999999.999");
  });

  it("round-trips local datetime values at millisecond precision", () => {
    for (const value of [
      "2024-01-02T03:04",
      "2024-01-02T03:04:05",
      "2024-01-02T03:04:05.123",
      "2024-01-02T03:04:05.001",
      "0099-01-02T03:04:05.123",
      "12024-01-02T03:04:05.123",
    ]) {
      const ms = localInputToMs(value);
      expect(ms).not.toBeNull();
      expect(localInputToMs(msToLocalInput(ms as number))).toBe(ms);
    }
    const ms = new Date(2024, 0, 2, 3, 4, 5, 123).getTime();
    expect(msToLocalInput(ms)).toBe("2024-01-02T03:04:05.123");
  });

  it.each([
    "",
    "invalid",
    "2024-02-30T03:04",
    "2024-13-01T03:04",
    "2024-01-02T24:04",
    "0000-01-02T03:04",
    "999999-01-02T03:04",
    "2024-01-02T03:04:05.1234",
    "2024-01-02T03:04:05Z",
  ])("rejects invalid local datetime %j", (value) => {
    expect(localInputToMs(value)).toBeNull();
  });

  it("only emits Mongo seeds for unsigned 32-bit seconds", () => {
    expect(formatMongoObjectIdSeed(new Date(0))).toBe("00000000");
    expect(formatMongoObjectIdSeed(new Date(999))).toBe("00000000");
    expect(formatMongoObjectIdSeed(new Date(4294967295999))).toBe("ffffffff");
    for (const ms of [-1, 4294967296000, NaN]) {
      expect(formatMongoObjectIdSeed(new Date(ms))).toBeNull();
    }
    for (const ms of [-1, 4294967296000]) {
      expect(
        getDerivedTimestampFormats(new Date(ms)).some(
          (field) => field.label === "Mongo ObjectID seed"
        )
      ).toBe(false);
    }
  });

  it("formats valid and invalid timezones predictably", () => {
    expect(formatInZone(new Date(Date.UTC(2024, 0, 2, 3, 4, 5)), "UTC")).toContain("03:04:05");
    expect(formatInZone(new Date(), "Not/AZone")).toBe("Invalid timezone");
  });

  it("builds a derived output matrix from a canonical date", () => {
    const derived = getDerivedTimestampFormats(new Date(Date.UTC(2024, 0, 2, 3, 4, 5)));

    expect(derived.map((item) => item.label)).toEqual([
      "ISO 8601",
      "RFC 3339",
      "RFC 7231",
      "UTC string",
      "ISO 9075",
      "Mongo ObjectID seed",
    ]);
    expect(derived.find((item) => item.label === "RFC 3339")?.value).toBe(
      "2024-01-02T03:04:05.000Z"
    );
    expect(derived.find((item) => item.label === "RFC 7231")?.value).toBe(
      "Tue, 02 Jan 2024 03:04:05 GMT"
    );
    expect(derived.find((item) => item.label === "ISO 9075")?.value).toBe("2024-01-02 03:04:05");
    expect(derived.find((item) => item.label === "Mongo ObjectID seed")?.value).toBe("65937d25");
  });
});
