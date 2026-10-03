import { clampIndentSize, type TextTransformResult, toErrorMessage } from "@/lib/text";

export interface XmlFormatterOptions {
  indent: number;
}
export type XmlFormatterResult = TextTransformResult;

interface Token {
  raw: string;
  start: number;
  end: number;
  kind: "open" | "close" | "self" | "text" | "markup" | "cdata";
}
interface Element {
  open: Token;
  close?: Token;
  children: Array<Element | Token>;
}

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let start = 0;
  while (start < source.length) {
    let end: number;
    let kind: Token["kind"] = "markup";
    const delimiter = source.startsWith("<!--", start)
      ? "-->"
      : source.startsWith("<![CDATA[", start)
        ? "]]>"
        : source.startsWith("<?", start)
          ? "?>"
          : null;
    if (source[start] !== "<") {
      const next = source.indexOf("<", start);
      end = next === -1 ? source.length : next;
      kind = "text";
    } else if (delimiter) {
      end = source.indexOf(delimiter, start) + delimiter.length;
      if (source.startsWith("<![CDATA[", start)) kind = "cdata";
    } else {
      let quote = "";
      let brackets = 0;
      end = start + 1;
      for (; end < source.length; end++) {
        const char = source[end];
        if (quote) {
          if (char === quote) quote = "";
        } else if (char === '"' || char === "'") quote = char;
        else if (char === "[") brackets++;
        else if (char === "]") brackets--;
        else if (char === ">" && brackets === 0) {
          end++;
          break;
        }
      }
      if (source.startsWith("</", start)) kind = "close";
      else if (!source.startsWith("<!", start)) kind = source[end - 2] === "/" ? "self" : "open";
    }
    if (end <= start) throw new Error("Unterminated XML token.");
    tokens.push({ raw: source.slice(start, end), start, end, kind });
    start = end;
  }
  return tokens;
}

/** Validate locally, then format original tokens so names, entities and text stay intact. */
export function formatXml(input: string, options: XmlFormatterOptions): XmlFormatterResult {
  if (!input.trim()) return { ok: true, output: "" };
  try {
    const document = new DOMParser().parseFromString(input, "application/xml");
    const error = [...document.getElementsByTagName("parsererror")].find((element) =>
      [
        "http://www.mozilla.org/newlayout/xml/parsererror.xml",
        "http://www.w3.org/1999/xhtml",
      ].includes(element.namespaceURI ?? "")
    );
    if (error) throw new Error(error.textContent ?? "Malformed XML document.");
    const roots: Array<Element | Token> = [];
    const stack: Element[] = [];
    for (const token of tokenize(input)) {
      if (token.kind === "close") {
        const element = stack.pop();
        if (!element) throw new Error("Unexpected closing tag.");
        element.close = token;
      } else {
        const children = stack.at(-1)?.children ?? roots;
        if (token.kind === "open") {
          const element = { open: token, children: [] };
          children.push(element);
          stack.push(element);
        } else children.push(token);
      }
    }
    const unit = " ".repeat(clampIndentSize(options.indent));
    function render(node: Element | Token, depth: number): string {
      const padding = unit.repeat(depth);
      if (!("open" in node)) return padding + node.raw;
      const mixed = node.children.some(
        (child) =>
          !("open" in child) &&
          (child.kind === "cdata" || (child.kind === "text" && child.raw.trim().length > 0))
      );
      const preserved = /\bxml:space\s*=\s*(["'])preserve\1/.test(node.open.raw);
      const children = node.children.filter(
        (child) => "open" in child || child.kind !== "text" || child.raw.trim()
      );
      if (mixed || preserved || !children.length) {
        return padding + input.slice(node.open.start, node.close?.end ?? node.open.end);
      }
      return [
        padding + node.open.raw,
        ...children.map((child) => render(child, depth + 1)),
        padding + node.close?.raw,
      ].join("\n");
    }
    return {
      ok: true,
      output: roots
        .filter((node) => "open" in node || node.kind !== "text")
        .map((node) => render(node, 0))
        .join("\n"),
    };
  } catch (error) {
    return {
      ok: false,
      error: `Invalid XML input: ${toErrorMessage(error, "Unable to format XML.")}`,
    };
  }
}
