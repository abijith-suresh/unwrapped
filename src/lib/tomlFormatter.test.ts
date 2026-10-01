import { parse } from "smol-toml";
import { describe, expect, it } from "vitest";
import { formatToml } from "./tomlFormatter";

describe("TOML formatter", () => {
  it("preserves tables, arrays, quoted keys and dates", () => {
    const input =
      '[app]\n"a.b" = [1, 2]\ncreated = 1979-05-27T07:32:00Z\n[[app.users]]\nname = "Ada"';
    const result = formatToml(input);
    expect(result.ok).toBe(true);
    if (result.ok) expect(parse(result.output)).toEqual(parse(input));
  });
  it("rejects duplicate keys and malformed input", () => {
    expect(formatToml("a=1\na=2").ok).toBe(false);
    expect(formatToml("[broken").ok).toBe(false);
  });
  it("accepts empty documents and drops comments", () => {
    expect(formatToml("")).toEqual({ ok: true, output: "" });
    const result = formatToml("# comment\nx=1");
    if (result.ok) expect(result.output).not.toContain("comment");
  });
});
