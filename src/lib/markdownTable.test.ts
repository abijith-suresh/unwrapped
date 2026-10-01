import Papa from "papaparse";
import { describe, expect, it } from "vitest";
import { convertTable } from "./markdownTable";

describe("Markdown table converter", () => {
  it("converts CSV headers, quoted commas and empty cells", () => {
    expect(convertTable('Name,Note\nAda,"one,two"\nGrace,', "csv")).toEqual({
      ok: true,
      output: "| Name | Note |\n| --- | --- |\n| Ada | one,two |\n| Grace |  |",
    });
  });
  it("round trips escaped pipes, backslashes and multiline fields", () => {
    const csv = 'Name,Note\nAda,"a|b\\c\nx"';
    const table = convertTable(csv, "csv");
    expect(table.ok).toBe(true);
    if (table.ok) {
      const restored = convertTable(table.output, "markdown");
      expect(restored.ok).toBe(true);
      if (restored.ok)
        expect(Papa.parse(restored.output, { delimiter: "," }).data).toEqual(
          Papa.parse(csv, { delimiter: "," }).data
        );
    }
  });
  it("converts TSV and aligned Markdown", () => {
    expect(convertTable("a\tb\n1\t2\n", "tsv")).toMatchObject({
      output: expect.stringContaining("| 1 | 2 |"),
    });
    expect(convertTable("| a | b |\n| :--- | ---: |\n| 1 | 2 |", "markdown")).toEqual({
      ok: true,
      output: "a,b\n1,2",
    });
  });
  it("rejects ragged CSV, unterminated quotes and non-table Markdown", () => {
    expect(convertTable("a,b\n1,2,3", "csv").ok).toBe(false);
    expect(convertTable('a,b\n"oops', "csv").ok).toBe(false);
    expect(convertTable("# Hello", "markdown").ok).toBe(false);
    expect(convertTable("| a |\n| --- |\n| 1 |\n\n| b |\n| --- |\n| 2 |", "markdown").ok).toBe(
      false
    );
    expect(convertTable("a,b\n x,2", "csv").ok).toBe(false);
    expect(convertTable("", "csv")).toEqual({ ok: true, output: "" });
  });
  it.each([
    "<br>",
    "<BR />",
    "<br   />",
    "<script>alert(1)</script>",
    "&lt;br&gt;",
    "&amp;lt;br&amp;gt;",
    "&#10;",
    "&#13;",
    "&copy;",
    "a\\|b",
    "a\\\\|b",
    "a\\\\\\|b",
    "`<br>`",
    "``a`<br>``",
    "`a\nb`",
    "a\rb",
    "a\r\nb",
    "a\nb",
    "<br>\n&lt;br&gt;\r\n`code`",
  ])("preserves cell data through a CSV/Markdown round trip: %j", (cell) => {
    const csv = Papa.unparse([["Note"], [cell]], { newline: "\n" });
    const table = convertTable(csv, "csv");
    expect(table.ok).toBe(true);
    if (!table.ok) return;
    const restored = convertTable(table.output, "markdown");
    expect(restored.ok).toBe(true);
    if (restored.ok)
      expect(Papa.parse(restored.output, { delimiter: "," }).data).toEqual([["Note"], [cell]]);
  });

  it("keeps inline code literal and decodes text entities once", () => {
    const source =
      "| Note |\n| --- |\n| `<br>&lt;br&gt;`<br>&lt;br&gt; |\n| ``a`<BR />`` |\n| `x\\|y` |";
    const result = convertTable(source, "markdown");
    expect(result.ok).toBe(true);
    if (result.ok)
      expect(Papa.parse(result.output, { delimiter: "," }).data).toEqual([
        ["Note"],
        ["`<br>&lt;br&gt;`\n<br>"],
        ["``a`<BR />``"],
        ["`x|y`"],
      ]);
  });

  it.each(["| 1 | 2 | 3 |", "| 1 |", "1 | 2 | 3"])(
    "rejects Markdown rows that would be truncated or padded: %s",
    (row) => {
      expect(convertTable(`| a | b |\n| --- | --- |\n${row}`, "markdown")).toEqual({
        ok: false,
        error: "Every row must have the same number of columns.",
      });
    }
  );
});
