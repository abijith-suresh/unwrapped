import { stringify } from "yaml";

import { sortJsonKeys } from "./jsonFormatter";

export type JsonToYamlResult =
  | {
      ok: true;
      output: string;
    }
  | {
      ok: false;
      error: string;
    };

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
      error: `Invalid JSON input: ${error instanceof Error ? error.message : "Unable to parse JSON."}`,
    };
  }
}
