import { clampIndentSize, type TextTransformResult, toErrorMessage } from "./text";

export interface XmlFormatterOptions {
  indent: number;
}

export type XmlFormatterResult = TextTransformResult;

type XmlToken =
  | { type: "open"; raw: string; name: string }
  | { type: "close"; raw: string; name: string }
  | { type: "self" | "declaration" | "comment" | "cdata"; raw: string }
  | { type: "text"; raw: string };

function tokenizeXml(input: string): XmlToken[] {
  const tokens: XmlToken[] = [];
  let index = 0;

  while (index < input.length) {
    if (input[index] !== "<") {
      const nextTagIndex = input.indexOf("<", index);
      const end = nextTagIndex === -1 ? input.length : nextTagIndex;
      tokens.push({ type: "text", raw: input.slice(index, end) });
      index = end;
      continue;
    }

    if (input.startsWith("<!--", index)) {
      const end = input.indexOf("-->", index + 4);
      if (end === -1) {
        throw new Error("Unterminated XML comment");
      }
      tokens.push({ type: "comment", raw: input.slice(index, end + 3) });
      index = end + 3;
      continue;
    }

    if (input.startsWith("<![CDATA[", index)) {
      const end = input.indexOf("]]>", index + 9);
      if (end === -1) {
        throw new Error("Unterminated CDATA section");
      }
      tokens.push({ type: "cdata", raw: input.slice(index, end + 3) });
      index = end + 3;
      continue;
    }

    const end = input.indexOf(">", index + 1);
    if (end === -1) {
      throw new Error("Unterminated XML tag");
    }

    const raw = input.slice(index, end + 1);
    index = end + 1;

    if (raw.startsWith("<?") || raw.startsWith("<!DOCTYPE")) {
      tokens.push({ type: "declaration", raw });
      continue;
    }

    const closeMatch = raw.match(/^<\/(.+?)>$/s);
    if (closeMatch) {
      tokens.push({ type: "close", raw, name: closeMatch[1].trim() });
      continue;
    }

    const openMatch = raw.match(/^<([^!?][^\s/>]*)(?:\s[^>]*)?>$/s);
    const selfMatch = raw.match(/^<([^!?][^\s/>]*)(?:\s[^>]*)?\/>$/s);

    if (selfMatch) {
      tokens.push({ type: "self", raw });
      continue;
    }

    if (openMatch) {
      tokens.push({ type: "open", raw, name: openMatch[1].trim() });
      continue;
    }

    throw new Error(`Unsupported XML token: ${raw}`);
  }

  return tokens;
}

function validateTokens(tokens: XmlToken[]): void {
  const stack: string[] = [];

  for (const token of tokens) {
    if (token.type === "open") {
      stack.push(token.name);
      continue;
    }

    if (token.type === "close") {
      const expected = stack.pop();
      if (expected !== token.name) {
        throw new Error(
          `Mismatched closing tag: expected </${expected ?? "?"}> but found </${token.name}>`
        );
      }
    }
  }

  if (stack.length > 0) {
    throw new Error(`Unclosed XML tag: <${stack.at(-1)}>`);
  }
}

export function formatXml(input: string, options: XmlFormatterOptions): XmlFormatterResult {
  if (input.trim().length === 0) {
    return { ok: true, output: "" };
  }

  try {
    const tokens = tokenizeXml(input);
    validateTokens(tokens);

    const lines: string[] = [];
    const indentUnit = " ".repeat(clampIndentSize(options.indent));
    let level = 0;

    for (const token of tokens) {
      if (token.type === "text") {
        const value = token.raw.trim();
        if (value.length > 0) {
          lines.push(`${indentUnit.repeat(level)}${value}`);
        }
        continue;
      }

      if (token.type === "close") {
        level = Math.max(0, level - 1);
        lines.push(`${indentUnit.repeat(level)}${token.raw}`);
        continue;
      }

      lines.push(`${indentUnit.repeat(level)}${token.raw}`);

      if (token.type === "open") {
        level += 1;
      }
    }

    return {
      ok: true,
      output: lines.join("\n"),
    };
  } catch (error) {
    return {
      ok: false,
      error: `Invalid XML input: ${toErrorMessage(error, "Unable to format XML.")}`,
    };
  }
}
