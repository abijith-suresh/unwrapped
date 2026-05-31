export type IndentSize = 2 | 4;

type JsonPrimitive = null | boolean | number | string;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export interface JsonFormatResult {
  html: string;
  raw: string;
  error: string | null;
  errorLine: number | null;
  errorColumn: number | null;
  errorContext: string | null;
}

interface JsonErrorSourceContext {
  line: number;
  column: number;
  context: string;
}

export function syntaxHighlightJson(json: string): string {
  return json
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
      (match) => {
        let style = "color: var(--accent-primary)";
        if (/^"/.test(match)) {
          style = /:$/.test(match)
            ? "color: var(--text-primary); font-weight: 600"
            : "color: var(--accent-success)";
        } else if (/true|false/.test(match)) {
          style = "color: var(--accent-warning)";
        } else if (/null/.test(match)) {
          style = "color: var(--text-muted)";
        }
        return `<span style="${style}">${match}</span>`;
      }
    );
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
  position: number
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
      return parseJsonErrorSourceContext(input, fallbackPosition);
    }
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
      html: "",
      raw: "",
      error: null,
      errorLine: null,
      errorColumn: null,
      errorContext: null,
    };
  }

  let parsed: JsonValue;
  try {
    parsed = JSON.parse(trimmed) as JsonValue;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const errorContext = parseJsonErrorContext(trimmed, message);

    return {
      html: "",
      raw: "",
      error: `JSON parse error: ${message}`,
      errorLine: errorContext?.line ?? null,
      errorColumn: errorContext?.column ?? null,
      errorContext: errorContext?.context ?? null,
    };
  }

  const output = sortKeys ? sortJsonKeys(parsed) : parsed;
  const raw = minify ? JSON.stringify(output) : JSON.stringify(output, null, indent);
  return {
    html: syntaxHighlightJson(raw),
    raw,
    error: null,
    errorLine: null,
    errorColumn: null,
    errorContext: null,
  };
}
