import { decode } from "html-entities";
import MarkdownIt from "markdown-it";
import Papa from "papaparse";
import type { TextTransformResult } from "@/lib/text";
export type TableMode = "csv" | "tsv" | "markdown";
function escapeCell(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\\", "\\\\")
    .replaceAll("|", "\\|")
    .replaceAll("`", "\\`")
    .replaceAll("\r", "&#13;")
    .replaceAll("\n", "<br>");
}

function unescapeCell(value: string): string {
  let output = "";
  let text = "";
  let index = 0;
  const flush = () => {
    // Decode once, after recognizing line breaks. Escaped literal HTML and
    // entity text must not turn into another line break or entity.
    output += decode(text, { level: "html5", scope: "strict" });
    text = "";
  };
  while (index < value.length) {
    if (value[index] === "\\" && ["\\", "|", "`"].includes(value[index + 1])) {
      text += value[index + 1];
      index += 2;
      continue;
    }
    if (value[index] === "`") {
      let end = index;
      while (value[end] === "`") end++;
      const delimiter = value.slice(index, end);
      let closing = value.indexOf(delimiter, end);
      while (
        closing !== -1 &&
        (value[closing - 1] === "`" || value[closing + delimiter.length] === "`")
      ) {
        closing = value.indexOf(delimiter, closing + delimiter.length);
      }
      if (closing !== -1) {
        flush();
        // Inline code is literal, including HTML, entities and backslashes.
        output += value.slice(index, closing + delimiter.length).replaceAll("\\|", "|");
        index = closing + delimiter.length;
        continue;
      }
    }
    const lineBreak = value.slice(index).match(/^<br\s*\/?>/i);
    if (lineBreak) {
      text += "\n";
      index += lineBreak[0].length;
    } else {
      text += value[index++];
    }
  }
  flush();
  return output;
}

function splitMarkdownRow(line: string): string[] {
  const cells: string[] = [];
  const source = line.trim();
  let start = 0;
  for (let index = 0; index < source.length; index++) {
    // Match markdown-it's table separators, retaining escapes for the cell
    // decoder rather than allowing the parser to truncate or pad rows.
    if (source[index] === "|" && source[index - 1] !== "\\") {
      cells.push(source.slice(start, index));
      start = index + 1;
    }
  }
  cells.push(source.slice(start));
  if (cells[0] === "") cells.shift();
  if (cells.at(-1) === "") cells.pop();
  return cells.map((cell) => cell.trim());
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
      const lines = input.replace(/\r\n?/g, "\n").split("\n");
      for (const token of tokens) {
        if (token.type !== "tr_open" || !token.map) continue;
        const cells = splitMarkdownRow(lines[token.map[0]]);
        if (rows.length && cells.length !== rows[0].length) {
          return { ok: false, error: "Every row must have the same number of columns." };
        }
        rows.push(cells.map(unescapeCell));
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
