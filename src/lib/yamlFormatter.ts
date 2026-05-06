import { parseDocument, stringify } from "yaml";

import { sortJsonKeys } from "./jsonFormatter";

export interface YamlFormatterOptions {
  indent: number;
  sortKeys: boolean;
}

export type YamlFormatterResult =
  | {
      ok: true;
      output: string;
    }
  | {
      ok: false;
      error: string;
    };

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
        indent: Math.min(8, Math.max(2, Math.trunc(options.indent) || 2)),
        defaultStringType: "PLAIN",
        sortMapEntries: options.sortKeys,
      }).trimEnd(),
    };
  } catch (error) {
    return {
      ok: false,
      error: `Invalid YAML input: ${error instanceof Error ? error.message : "Unable to format YAML."}`,
    };
  }
}
