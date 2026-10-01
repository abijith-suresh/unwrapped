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
      if (restored.ok) expect(Papa.parse(restored.output).data).toEqual(Papa.parse(csv).data);
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
});
