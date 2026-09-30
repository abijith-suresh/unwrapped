import { stringify } from "yaml";

import { sortJsonKeys } from "./jsonFormatter";
import { type TextTransformResult, toErrorMessage } from "./text";

export type JsonToYamlResult = TextTransformResult;

export function convertJsonToYaml(input: string): JsonToYamlResult {
  if (input.trim().length === 0) {
    return {
      ok: true,
      output: "",
    };
  }

  try {
    const parsed = JSON.parse(input) as unknown;
    const sorted = sortJsonKeys(parsed);

    return {
      ok: true,
      output: stringify(sorted, {
        defaultStringType: "PLAIN",
        sortMapEntries: true,
      }).trimEnd(),
    };
  } catch (error) {
    return {
      ok: false,
      error: `Invalid JSON input: ${toErrorMessage(error, "Unable to parse JSON.")}`,
    };
  }
}
