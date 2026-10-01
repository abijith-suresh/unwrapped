import { fireEvent, render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";

import CronTool from "@/tools/cron/CronTool";
import JsonToCsvTool from "@/tools/json-to-csv/JsonToCsvTool";
import JsonToYamlTool from "@/tools/json-to-yaml/JsonToYamlTool";
import UrlInspectorTool from "@/tools/url-inspector/UrlInspectorTool";
import XmlFormatterTool from "@/tools/xml-formatter/XmlFormatterTool";
import YamlFormatterTool from "@/tools/yaml-formatter/YamlFormatterTool";
import YamlToJsonTool from "@/tools/yaml-to-json/YamlToJsonTool";

const tools = [
  {
    name: "Cron",
    Tool: CronTool,
    label: "Cron expression",
    input: "0 12 * * *",
    invalid: "invalid",
  },
  {
    name: "JSON to CSV",
    Tool: JsonToCsvTool,
    label: "JSON array input",
    input: '[{"name":"Ada"}]',
    invalid: "[",
  },
  {
    name: "JSON to YAML",
    Tool: JsonToYamlTool,
    label: "JSON document",
    input: '{"name":"Ada"}',
    invalid: "{",
  },
  {
    name: "URL Inspector",
    Tool: UrlInspectorTool,
    label: "URL or raw query string",
    input: "https://example.net/?q=user",
    invalid: "https://[",
  },
  {
    name: "XML Formatter",
    Tool: XmlFormatterTool,
    label: "XML input",
    input: "<user>Ada</user>",
    invalid: "<user>",
  },
  {
    name: "YAML Formatter",
    Tool: YamlFormatterTool,
    label: "YAML input",
    input: "name: Ada",
    invalid: "name: [",
  },
  {
    name: "YAML to JSON",
    Tool: YamlToJsonTool,
    label: "YAML document",
    input: "name: Ada",
    invalid: "name: [",
  },
];

describe("Tool input placeholders", () => {
  it.each(tools)(
    "$name starts empty and validates only user input",
    ({ Tool, label, input, invalid }) => {
      const { getByRole, queryByRole, queryAllByRole } = render(() => <Tool />);
      const editor = getByRole("textbox", { name: label });

      expect(editor).toHaveValue("");
      expect(editor.getAttribute("placeholder")?.trim()).toBeTruthy();
      expect(editor).not.toHaveAttribute("aria-invalid", "true");
      expect(queryByRole("alert")).not.toBeInTheDocument();
      for (const button of queryAllByRole("button", { name: /^Copy / })) {
        expect(button).toBeDisabled();
      }

      fireEvent.input(editor, { target: { value: input } });
      expect(editor).toHaveValue(input);
      expect(queryByRole("alert")).not.toBeInTheDocument();

      fireEvent.input(editor, { target: { value: invalid } });
      expect(getByRole("alert")).toBeInTheDocument();
      expect(editor).toHaveAttribute("aria-invalid", "true");

      fireEvent.input(editor, { target: { value: "" } });
      expect(editor).toHaveValue("");
      expect(editor).not.toHaveAttribute("aria-invalid", "true");
      expect(queryByRole("alert")).not.toBeInTheDocument();
      for (const button of queryAllByRole("button", { name: /^Copy / })) {
        expect(button).toBeDisabled();
      }
    }
  );
});
