import { fireEvent, render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import CronTool from "@/tools/cron/CronTool";
import UrlInspectorTool from "@/tools/url-inspector/UrlInspectorTool";

const tools = [
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
    name: "URL Inspector",
    Tool: UrlInspectorTool,
    label: "URL or raw query string",
    input: "https://example.net/?q=user",
    invalid: "https://[",
    exampleOutput: "hello world",
    userOutput: "example.net",
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
