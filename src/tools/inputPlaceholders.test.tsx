import { fireEvent, render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";

import CronTool from "@/tools/cron/CronTool";
import CssMinifierTool from "@/tools/css-minifier/Tool";
import JsonToCsvTool from "@/tools/json-to-csv/JsonToCsvTool";
import JsonToYamlTool from "@/tools/json-to-yaml/JsonToYamlTool";
import TomlFormatterTool from "@/tools/toml-formatter/Tool";
import UrlInspectorTool from "@/tools/url-inspector/UrlInspectorTool";
import XmlFormatterTool from "@/tools/xml-formatter/XmlFormatterTool";
import YamlFormatterTool from "@/tools/yaml-formatter/YamlFormatterTool";
import YamlToJsonTool from "@/tools/yaml-to-json/YamlToJsonTool";

const tools = [
  {
    name: "TOML formatter",
    Tool: TomlFormatterTool,
    label: "Source",
    input: 'name = "User"',
    invalid: "date = 2024-02-30",
    exampleOutput: "8080",
    userOutput: "User",
  },
  {
    name: "CSS minifier",
    Tool: CssMinifierTool,
    label: "Source",
    input: ".user { color: red; }",
    invalid: ".user { color: red; } }",
    exampleOutput: ".card",
    userOutput: ".user",
  },
  {
    name: "Cron",
    Tool: CronTool,
    label: "Cron expression",
    input: "0 12 * * *",
    invalid: "invalid",
    exampleOutput: "09:30 on Monday",
    userOutput: "12:00",
  },
  {
    name: "JSON to CSV",
    Tool: JsonToCsvTool,
    label: "JSON array input",
    input: '[{"name":"Ada"}]',
    invalid: "[",
    exampleOutput: "Alice",
    userOutput: "Ada",
  },
  {
    name: "JSON to YAML",
    Tool: JsonToYamlTool,
    label: "JSON document",
    input: '{"name":"Ada"}',
    invalid: "{",
    exampleOutput: "Alice",
    userOutput: "Ada",
  },
  {
    name: "URL Inspector",
    Tool: UrlInspectorTool,
    label: "URL or raw query string",
    input: "https://example.net/?q=user",
    invalid: "https://[",
    exampleOutput: "hello world",
    userOutput: "example.net",
  },
  {
    name: "XML Formatter",
    Tool: XmlFormatterTool,
    label: "XML input",
    input: "<user>Ada</user>",
    invalid: "<user>",
    exampleOutput: '<item id="1">',
    userOutput: "Ada",
  },
  {
    name: "YAML Formatter",
    Tool: YamlFormatterTool,
    label: "YAML input",
    input: "name: Ada",
    invalid: "name: [",
    exampleOutput: "child:",
    userOutput: "Ada",
  },
  {
    name: "YAML to JSON",
    Tool: YamlToJsonTool,
    label: "YAML document",
    input: "name: Ada",
    invalid: "name: [",
    exampleOutput: '"enabled": true',
    userOutput: "Ada",
  },
];

describe("Tool input placeholders", () => {
  it.each(tools)(
    "$name starts empty and validates only user input",
    ({ Tool, label, input, invalid, exampleOutput, userOutput }) => {
      const { container, getByRole, queryByRole, queryAllByRole } = render(() => <Tool />);
      const editor = getByRole("textbox", { name: label });

      expect(editor).toHaveValue("");
      expect(editor.getAttribute("placeholder")?.trim()).toBeTruthy();
      expect(editor).not.toHaveAttribute("aria-invalid", "true");
      expect(queryByRole("alert")).not.toBeInTheDocument();
      expect(getByRole("note", { name: "Example output" })).toBeInTheDocument();
      expect(container).toHaveTextContent(exampleOutput);
      expect(queryAllByRole("button", { name: /^Copy / })).toHaveLength(0);

      fireEvent.input(editor, { target: { value: input } });
      expect(editor).toHaveValue(input);
      expect(queryByRole("alert")).not.toBeInTheDocument();
      expect(queryByRole("note", { name: "Example output" })).not.toBeInTheDocument();
      expect(container).toHaveTextContent(userOutput);
      expect(container).not.toHaveTextContent(exampleOutput);

      fireEvent.input(editor, { target: { value: invalid } });
      expect(getByRole("alert")).toBeInTheDocument();
      expect(editor).toHaveAttribute("aria-invalid", "true");
      expect(queryByRole("note", { name: "Example output" })).not.toBeInTheDocument();
      expect(container).not.toHaveTextContent(exampleOutput);

      fireEvent.input(editor, { target: { value: "" } });
      expect(editor).toHaveValue("");
      expect(editor).not.toHaveAttribute("aria-invalid", "true");
      expect(queryByRole("alert")).not.toBeInTheDocument();
      expect(getByRole("note", { name: "Example output" })).toBeInTheDocument();
      expect(container).toHaveTextContent(exampleOutput);
      expect(queryAllByRole("button", { name: /^Copy / })).toHaveLength(0);
    }
  );
});
