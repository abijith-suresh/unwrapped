import type { CodeHighlightSegment } from "./codeHighlight";

export type IndentSize = 2 | 4;

type JsonPrimitive = null | boolean | number | string;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export interface JsonFormatResult {
  segments: CodeHighlightSegment[];
  raw: string;
  error: string | null;
  errorPosition: number | null;
  errorLength: number;
  errorLine: number | null;
  errorColumn: number | null;
  errorContext: string | null;
}

interface JsonErrorSourceContext {
  position: number;
  length: number;
  line: number;
  column: number;
  context: string;
}

export function syntaxHighlightJson(json: string): CodeHighlightSegment[] {
  const segments: CodeHighlightSegment[] = [];
  const tokenPattern =
    /"(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(?:\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?/g;
  let position = 0;

  for (const match of json.matchAll(tokenPattern)) {
    const token = match[0];
    const start = match.index;

    if (start > position) {
      segments.push({ text: json.slice(position, start), kind: "plain" });
    }

    let kind: CodeHighlightSegment["kind"] = "json-number";
    if (token.startsWith('"')) {
      kind = token.endsWith(":") ? "json-key" : "json-string";
    } else if (token === "true" || token === "false") {
      kind = "json-boolean";
    } else if (token === "null") {
      kind = "json-null";
    }

    segments.push({ text: token, kind });
    position = start + token.length;
  }

  if (position < json.length) {
    segments.push({ text: json.slice(position), kind: "plain" });
  }

  return segments;
}

export function sortJsonKeys<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => sortJsonKeys(item)) as T;
  }

  if (typeof value === "object" && value !== null) {
    return Object.keys(value)
      .sort((left, right) => left.localeCompare(right))
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = sortJsonKeys((value as Record<string, unknown>)[key]);
        return acc;
      }, {}) as T;
  }

  return value;
}

export function parseJsonErrorSourceContext(
  source: string,
  position: number,
  length = 1
): JsonErrorSourceContext | null {
  if (!Number.isInteger(position) || position < 0 || position > source.length) {
    return null;
  }

  const normalized = source.replace(/\r\n?/g, "\n");
  const safePosition = Math.min(position, normalized.length);
  const prefix = normalized.slice(0, safePosition);
  const line = prefix.split("\n").length;
  const lastLineBreak = prefix.lastIndexOf("\n");
  const column = safePosition - lastLineBreak;
  const lines = normalized.split("\n");

  const targetLine = lines[line - 1] ?? "";
  const previousLine = line > 1 ? lines[line - 2] : null;
  const lineNumberWidth = String(line).length;
  const renderedLines = [
    previousLine === null
      ? null
      : `${String(line - 1).padStart(lineNumberWidth, " ")} | ${previousLine}`,
    `${String(line).padStart(lineNumberWidth, " ")} | ${targetLine}`,
    `${" ".repeat(lineNumberWidth)}   ${" ".repeat(Math.max(column - 1, 0))}^`,
  ].filter((entry): entry is string => entry !== null);

  return {
    position: safePosition,
    length: Math.min(Math.max(length, 0), normalized.length - safePosition),
    line,
    column,
    context: renderedLines.join("\n"),
  };
}

function parseJsonErrorContext(input: string, message: string): JsonErrorSourceContext | null {
  const positionMatch = /position (\d+)/.exec(message);
  if (positionMatch) {
    return parseJsonErrorSourceContext(input, parseInt(positionMatch[1], 10));
  }

  const unexpectedTokenMatch = /Unexpected token '(.+?)'/.exec(message);
  if (unexpectedTokenMatch) {
    const token = unexpectedTokenMatch[1];
    const fallbackPosition = input.lastIndexOf(token);
    if (fallbackPosition !== -1) {
      return parseJsonErrorSourceContext(input, fallbackPosition, token.length);
    }
  }

  if (/Unexpected end/.test(message)) {
    return parseJsonErrorSourceContext(input, input.length, 0);
  }

  return null;
}

export function formatJson(
  input: string,
  indent: IndentSize,
  minify: boolean,
  sortKeys: boolean
): JsonFormatResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return {
      segments: [],
      raw: "",
      error: null,
      errorPosition: null,
      errorLength: 0,
      errorLine: null,
      errorColumn: null,
      errorContext: null,
    };
  }

  let parsed: JsonValue;
  try {
    parsed = JSON.parse(input) as JsonValue;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const errorContext = parseJsonErrorContext(input, message);
    const fallbackPosition = Math.max(input.length - 1, 0);
    const errorPosition = errorContext?.position ?? fallbackPosition;
    const errorLength = errorContext?.length ?? (input.length > 0 ? 1 : 0);

    return {
      segments: [],
      raw: "",
      error: `JSON parse error: ${message}`,
      errorPosition,
      errorLength,
      errorLine: errorContext?.line ?? null,
      errorColumn: errorContext?.column ?? null,
      errorContext: errorContext?.context ?? null,
    };
  }

  const output = sortKeys ? sortJsonKeys(parsed) : parsed;
  const raw = minify ? JSON.stringify(output) : JSON.stringify(output, null, indent);
  return {
    segments: syntaxHighlightJson(raw),
    raw,
    error: null,
    errorPosition: null,
    errorLength: 0,
    errorLine: null,
    errorColumn: null,
    errorContext: null,
  };
}
