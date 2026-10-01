import MarkdownIt from "markdown-it";
import Papa from "papaparse";
import type { TextTransformResult } from "@/lib/text";
export type TableMode = "csv" | "tsv" | "markdown";
function escapeCell(value: string): string {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("|", "\\|")
    .replace(/\r\n?|\n/g, "<br>");
}
function unescapeCell(value: string): string {
  return value.replace(/\\([\\|])/g, "$1").replace(/<br\s*\/?>/gi, "\n");
}
export function convertTable(input: string, mode: TableMode): TextTransformResult {
  if (!input.trim()) return { ok: true, output: "" };
  if (input.length > 100_000)
    return { ok: false, error: "Table input is limited to 100,000 characters." };
  try {
    if (mode === "markdown") {
      const tokens = new MarkdownIt({ html: false }).parse(input, {});
      if (
        tokens[0]?.type !== "table_open" ||
        tokens.at(-1)?.type !== "table_close" ||
        tokens.filter((token) => token.type === "table_open").length !== 1
      )
        return { ok: false, error: "Input must contain exactly one Markdown table." };
      const rows: string[][] = [];
      for (let index = 0; index < tokens.length; index++) {
        const token = tokens[index];
        if (token.type === "tr_open") rows.push([]);
        if (token.type === "inline" && ["th_open", "td_open"].includes(tokens[index - 1]?.type))
          rows.at(-1)?.push(unescapeCell(token.content));
      }
      return { ok: true, output: Papa.unparse(rows, { newline: "\n" }) };
    }
    const parsed = Papa.parse<string[]>(input, {
      delimiter: mode === "csv" ? "," : "\t",
      skipEmptyLines: false,
    });
    if (parsed.errors.length) return { ok: false, error: parsed.errors[0].message };
    const rows = parsed.data;
    if (/\r?\n$/.test(input) && rows.at(-1)?.length === 1 && rows.at(-1)?.[0] === "") rows.pop();
    const width = rows[0]?.length ?? 0;
    if (!width || rows.some((row) => row.length !== width))
      return { ok: false, error: "Every row must have the same number of columns." };
    if (rows.some((row) => row.some((cell) => cell !== cell.trim())))
      return {
        ok: false,
        error:
          "Leading or trailing cell whitespace cannot be preserved in Markdown. Trim those cells first.",
      };
    const line = (row: string[]) => `| ${row.map(escapeCell).join(" | ")} |`;
    return {
      ok: true,
      output: [
        line(rows[0]),
        line(Array<string>(width).fill("---")),
        ...rows.slice(1).map(line),
      ].join("\n"),
    };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Cannot convert table." };
  }
}
