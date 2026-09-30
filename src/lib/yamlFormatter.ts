import { parseDocument, stringify } from "yaml";

import { sortJsonKeys } from "./jsonFormatter";
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
    const document = parseDocument(input);

    if (document.errors.length > 0) {
      throw document.errors[0];
    }

    const parsed = document.toJS() as unknown;
    const value = options.sortKeys ? sortJsonKeys(parsed) : parsed;

    return {
      ok: true,
      output: stringify(value, {
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
