import { parseDocument, stringify } from "yaml";

import { sortJsonKeys } from "./jsonFormatter";
import { JSON_NUMBER_YAML_TAG, readYamlValue } from "./structuredData";
import { clampIndentSize, type TextTransformResult, toErrorMessage } from "./text";

export interface YamlFormatterOptions {
  indent: number;
  sortKeys: boolean;
}

export type YamlFormatterResult = TextTransformResult;

export function formatYaml(input: string, options: YamlFormatterOptions): YamlFormatterResult {
  if (input.trim().length === 0) {
    return {
      ok: true,
      output: "",
    };
  }

  try {
    const document = parseDocument(input, { intAsBigInt: true });

    if (document.errors.length > 0) {
      throw document.errors[0];
    }

    const parsed = readYamlValue(document);
    const value = options.sortKeys ? sortJsonKeys(parsed) : parsed;

    return {
      ok: true,
      output: stringify(value, {
        customTags: [JSON_NUMBER_YAML_TAG],
        indent: clampIndentSize(options.indent),
        defaultStringType: "PLAIN",
        sortMapEntries: options.sortKeys,
      }).trimEnd(),
    };
  } catch (error) {
    return {
      ok: false,
      error: `Invalid YAML input: ${toErrorMessage(error, "Unable to format YAML.")}`,
    };
  }
}
