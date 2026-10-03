import { parse } from "@ltd/j-toml";
import { describe, expect, it } from "vitest";
import { formatToml } from "./tomlFormatter";

describe("TOML formatter", () => {
  it("preserves tables, arrays, quoted keys and dates", () => {
    const input =
      '[app]\n"a.b" = [1, 2]\ncreated = 1979-05-27T07:32:00Z\n[[app.users]]\nname = "Ada"';
    const result = formatToml(input);
    expect(result.ok).toBe(true);
    if (result.ok)
      expect(parse(result.output, { joiner: "\n" })).toEqual(parse(input, { joiner: "\n" }));
  });
  it.each([
    "1.0",
    "-0.0",
    "+1e2",
    "0xDEAD_BEEF",
    "9223372036854775807",
    "-9223372036854775808",
    "07:32:00.123456",
    "07:32:00.123456789012345",
    "1979-05-27T07:32:00.123456789-07:00",
    "1979-05-27T07:32:00.123456789",
    "2024-02-29",
    "0000-01-01",
  ])("preserves the literal value %s", (value) => {
    const result = formatToml(`x=${value}`);
    expect(result).toEqual({ ok: true, output: `x = ${value}\n` });
  });
  it("preserves numeric types and timestamps inside nested collections", () => {
    expect(
      formatToml("items = [{ integer = 1, float = 1.0, zero = -0.0, time = 07:32:00.123456 }]")
    ).toEqual({
      ok: true,
      output: "items = [{ integer = 1, float = 1.0, zero = -0.0, time = 07:32:00.123456 }]\n",
    });
  });
  it.each([
    "2024-02-30",
    "2023-02-29",
    "2024-04-31",
    "2024-00-01",
    "24:00:00",
    "23:60:00",
    "1979-05-27T07:32:00+24:00",
    "9223372036854775808",
    "-9223372036854775809",
  ])("rejects invalid value %s without producing changed output", (value) => {
    expect(formatToml(`x=${value}`)).toMatchObject({ ok: false });
  });
  it.each(["23:59:60", "2016-12-31T23:59:60Z", "[2016-12-31T23:59:60Z]"])(
    "rejects unsupported leap seconds in %s",
    (value) => {
      expect(formatToml(`x=${value}`)).toEqual({
        ok: false,
        error: "Leap-second timestamps are not supported. Input has not been changed.",
      });
    }
  );
  it("allows date-like text in quoted keys, escaped and multiline strings, and comments", () => {
    const input = `"23:59:60" = '2024-02-30'\ntext = "escaped \\" 23:59:60"\nbasic = """\n23:59:60\n"""\nliteral = '''23:59:60'''\n# 23:59:60\nvalid = 2024-02-29`;
    const result = formatToml(input);
    expect(result.ok).toBe(true);
    if (result.ok)
      expect(parse(result.output, { joiner: "\n" })).toEqual(parse(input, { joiner: "\n" }));
  });
  it("rejects duplicate keys, malformed input and oversized input", () => {
    expect(formatToml("a=1\na=2").ok).toBe(false);
    expect(formatToml("[broken").ok).toBe(false);
    expect(formatToml(" ".repeat(100001)).ok).toBe(false);
  });
  it("accepts empty documents and drops comments", () => {
    expect(formatToml("")).toEqual({ ok: true, output: "" });
    expect(formatToml("# comment\nx=1")).toEqual({ ok: true, output: "x = 1\n" });
  });
});
