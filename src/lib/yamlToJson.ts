import { parseDocument } from "yaml";

import { sortJsonKeys } from "./jsonFormatter";
import { readYamlValue, stringifyJson } from "./structuredData";
import { type TextTransformResult, toErrorMessage } from "./text";

export type YamlToJsonResult = TextTransformResult;

export function convertYamlToJson(input: string): YamlToJsonResult {
  if (input.trim().length === 0) {
    return {
      ok: true,
      output: "",
    };
  }

  try {
    const document = parseDocument(input, { intAsBigInt: true, stringKeys: true });

    if (document.errors.length > 0) {
      throw document.errors[0];
    }

    const parsed = readYamlValue(document, true);
    const sorted = sortJsonKeys(parsed);

    return {
      ok: true,
      output: stringifyJson(sorted, 2),
    };
  } catch (error) {
    return {
      ok: false,
      error: `Invalid YAML input: ${toErrorMessage(error, "Unable to parse YAML.")}`,
    };
  }
}
