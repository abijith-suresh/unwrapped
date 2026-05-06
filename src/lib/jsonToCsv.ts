import { sortJsonKeys } from "./jsonFormatter";

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
type JsonRecord = Record<string, JsonValue>;

export type JsonToCsvResult =
  | {
      ok: true;
      output: string;
    }
  | {
      ok: false;
      error: string;
    };

function isJsonRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function escapeCsvCell(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

function serializeCsvValue(value: JsonValue | undefined): string {
  if (value === undefined || value === null) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return JSON.stringify(sortJsonKeys(value));
}

export function convertJsonToCsv(input: string): JsonToCsvResult {
  try {
    const parsed = JSON.parse(input) as unknown;

    if (!Array.isArray(parsed) || !parsed.every(isJsonRecord)) {
      return {
        ok: false,
        error: "Input must be a JSON array of objects.",
      };
    }

    const headers: string[] = [];
    for (const row of parsed) {
      for (const key of Object.keys(row)) {
        if (!headers.includes(key)) {
          headers.push(key);
        }
      }
    }

    const lines = [headers.map(escapeCsvCell).join(",")];

    for (const row of parsed) {
      lines.push(headers.map((header) => escapeCsvCell(serializeCsvValue(row[header]))).join(","));
    }

    return {
      ok: true,
      output: lines.join("\n"),
    };
  } catch {
    return {
      ok: false,
      error: "Invalid JSON input.",
    };
  }
}
