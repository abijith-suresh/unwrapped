import { stringify } from "yaml";

import { sortJsonKeys } from "./jsonFormatter";
import { JSON_NUMBER_YAML_TAG, parseJson } from "./structuredData";
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
    const parsed = parseJson(input);
    const sorted = sortJsonKeys(parsed);

    return {
      ok: true,
      output: stringify(sorted, {
        customTags: [JSON_NUMBER_YAML_TAG],
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
