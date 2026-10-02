import { parse as parseToml, stringify as stringifyToml, type TomlTable } from "smol-toml";
import { parseAllDocuments, stringify } from "yaml";
import {
  JSON_NUMBER_YAML_TAG,
  parseJson,
  readYamlValue,
  sortObjectKeys,
  stringifyJson,
} from "./structuredData";
import { normalizeNewlines, toErrorMessage } from "./text";

export interface StructuredCompareError {
  side: "left" | "right";
  message: string;
}

export interface StructuredCompareResult {
  original: string;
  modified: string;
  strategy: "text" | "json" | "toml" | "yaml" | "env";
  errors: StructuredCompareError[];
}

interface NormalizeJsonSuccess {
  ok: true;
  output: string;
}

interface NormalizeJsonFailure {
  ok: false;
  message: string;
}

type NormalizeJsonResult = NormalizeJsonSuccess | NormalizeJsonFailure;
type NormalizeYamlResult = NormalizeJsonResult;
type NormalizeEnvResult = NormalizeJsonResult;
type NormalizeTomlResult = NormalizeJsonResult;

function parseEnvKeyAndValue(line: string): { key: string; value: string } {
  const trimmedLine = line.trim();

  if (trimmedLine.length === 0 || trimmedLine.startsWith("#")) {
    throw new Error(`Invalid env entry: ${line}`);
  }

  const withoutExport = trimmedLine.startsWith("export ")
    ? trimmedLine.slice(7).trimStart()
    : trimmedLine;
  const equalsIndex = withoutExport.indexOf("=");

  if (equalsIndex === -1) {
    throw new Error(`Invalid env entry: ${line}`);
  }

  const key = withoutExport.slice(0, equalsIndex).trim();

  if (!/^[A-Za-z_][A-Za-z0-9_.-]*$/.test(key)) {
    throw new Error(`Invalid env key: ${key}`);
  }

  return {
    key,
    value: withoutExport.slice(equalsIndex + 1),
  };
}

function parseEnvRecord(input: string): Record<string, string> {
  const normalizedInput = normalizeNewlines(input);
  const values: Record<string, string> = Object.create(null);
  const lines = normalizedInput.split("\n");

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const trimmedLine = line.trim();

    if (trimmedLine.length === 0 || trimmedLine.startsWith("#")) {
      continue;
    }

    const { key, value: rawValue } = parseEnvKeyAndValue(line);
    const trimmedValue = rawValue.trim();
    const openingQuote = trimmedValue[0];

    if (openingQuote === '"' || openingQuote === "'" || openingQuote === "`") {
      let buffer = "";
      let remainder = trimmedValue.slice(1);
      let closed = false;

      while (true) {
        let escaped = false;

        for (let charIndex = 0; charIndex < remainder.length; charIndex++) {
          const character = remainder[charIndex];

          if (escaped) {
            buffer += character;
            escaped = false;
            continue;
          }

          if (character === "\\") {
            buffer += character;
            escaped = true;
            continue;
          }

          if (character === openingQuote) {
            const trailing = remainder.slice(charIndex + 1).trim();

            if (trailing.length > 0 && !trailing.startsWith("#")) {
              throw new Error(`Invalid env entry: ${line}`);
            }

            closed = true;
            break;
          }

          buffer += character;
        }

        if (closed) {
          values[key] =
            openingQuote === '"' ? buffer.replace(/\\n/g, "\n").replace(/\\r/g, "\r") : buffer;
          break;
        }

        index += 1;

        if (index >= lines.length) {
          throw new Error("Unterminated quoted env value");
        }

        buffer += "\n";
        remainder = lines[index];
      }

      continue;
    }

    if (trimmedValue.length === 0 || trimmedValue.startsWith("#")) {
      values[key] = "";
      continue;
    }

    const inlineCommentIndex = trimmedValue.search(/\s#/);
    values[key] =
      inlineCommentIndex === -1
        ? trimmedValue
        : trimmedValue.slice(0, inlineCommentIndex).trimEnd();
  }

  return values;
}

export function normalizeJsonForDiff(input: string): NormalizeJsonResult {
  if (input.trim().length === 0) {
    return { ok: true, output: "" };
  }

  try {
    const parsed = parseJson(input);
    return { ok: true, output: stringifyJson(sortObjectKeys(parsed), 2) };
  } catch (error) {
    return {
      ok: false,
      message: toErrorMessage(error, "Invalid JSON input"),
    };
  }
}

export function normalizeYamlForDiff(input: string): NormalizeYamlResult {
  if (input.trim().length === 0) {
    return { ok: true, output: "" };
  }

  try {
    const documents = parseAllDocuments(input, { intAsBigInt: true, stringKeys: true });

    for (const document of documents) {
      if (document.errors.length > 0) {
        throw document.errors[0];
      }
    }

    const normalizedDocuments = documents.map((document) => {
      const sorted = sortObjectKeys(readYamlValue(document));
      return stringify(sorted, {
        customTags: [JSON_NUMBER_YAML_TAG],
        defaultStringType: "PLAIN",
        sortMapEntries: true,
      }).trimEnd();
    });

    return {
      ok: true,
      output: normalizedDocuments.join("\n---\n"),
    };
  } catch (error) {
    return {
      ok: false,
      message: toErrorMessage(error, "Invalid YAML input"),
    };
  }
}

export function normalizeTomlForDiff(input: string): NormalizeTomlResult {
  if (input.trim().length === 0) {
    return { ok: true, output: "" };
  }

  try {
    const parsed = parseToml(input) as TomlTable;
    const sorted = sortObjectKeys(parsed) as TomlTable;

    return {
      ok: true,
      output: normalizeNewlines(stringifyToml(sorted as TomlTable)).trimEnd(),
    };
  } catch (error) {
    return {
      ok: false,
      message: toErrorMessage(error, "Invalid TOML input"),
    };
  }
}

export function normalizeEnvForDiff(input: string): NormalizeEnvResult {
  if (input.trim().length === 0) {
    return { ok: true, output: "" };
  }

  try {
    const parsed = parseEnvRecord(input);

    const output = Object.entries(parsed)
      .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
      .map(([key, value]) => `${key}=${value}`)
      .join("\n");

    return { ok: true, output };
  } catch (error) {
    return {
      ok: false,
      message: toErrorMessage(error, "Invalid env input"),
    };
  }
}

const normalizers = {
  json: normalizeJsonForDiff,
  yaml: normalizeYamlForDiff,
  toml: normalizeTomlForDiff,
  env: normalizeEnvForDiff,
};

export function prepareStructuredCompare(input: {
  original: string;
  modified: string;
  leftLanguage: string;
  rightLanguage: string;
}): StructuredCompareResult {
  const { original, modified, leftLanguage, rightLanguage } = input;
  const fallback: StructuredCompareResult = { original, modified, strategy: "text", errors: [] };
  if (leftLanguage !== rightLanguage || !Object.hasOwn(normalizers, leftLanguage)) return fallback;
  const strategy = leftLanguage as keyof typeof normalizers;
  const left = normalizers[strategy](original);
  const right = normalizers[strategy](modified);
  if (left.ok && right.ok) {
    return { original: left.output, modified: right.output, strategy, errors: [] };
  }
  if (!left.ok) fallback.errors.push({ side: "left", message: left.message });
  if (!right.ok) fallback.errors.push({ side: "right", message: right.message });
  return fallback;
}
