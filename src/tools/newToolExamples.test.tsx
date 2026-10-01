import { fireEvent, render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { EXAMPLE_JSON_SCHEMA, EXAMPLE_SCHEMA_DOCUMENT } from "@/lib/exampleData";
import CronTool from "@/tools/cron/CronTool";
import HtmlEntitiesTool from "@/tools/html-entities/Tool";
import JsonSchemaTool from "@/tools/json-schema-validator/Tool";
import QueryStringTool from "@/tools/query-string-editor/Tool";

describe("Examples in added tools", () => {
  it("uses a matching HTML example in both modes without inserting source markup", () => {
    const view = render(() => <HtmlEntitiesTool />);
    const source = view.getByLabelText("Source");
    expect(source).toHaveValue("");
    expect(source).toHaveAttribute("placeholder", '<p title="Hello">Tom & Jerry ©</p>');
    expect(view.container.querySelector("pre")).toHaveTextContent("&lt;p");
    expect(view.queryByRole("button", { name: "Copy output" })).toBeNull();
    fireEvent.click(view.getByRole("button", { name: "Decode" }));
    expect(source.getAttribute("placeholder")).toContain("&lt;p");
    expect(view.container.querySelector("pre")).toHaveTextContent(
      '<p title="Hello">Tom & Jerry ©</p>'
    );
    expect(view.container.querySelector("p[title]")).toBeNull();
    fireEvent.input(source, { target: { value: "&lt;user&gt;Ada&lt;/user&gt;" } });
    expect(view.queryByRole("note", { name: "Example output" })).toBeNull();
    expect(view.container.querySelector("pre")).toHaveTextContent("<user>Ada</user>");
    fireEvent.click(view.getByRole("button", { name: "Clear input" }));
    expect(source).toHaveValue("");
    expect(view.getByRole("note", { name: "Example output" })).toBeInTheDocument();
  });

  it("never substitutes schema or document examples into partially entered user data", () => {
    const view = render(() => <JsonSchemaTool />);
    const input = view.getByLabelText("JSON");
    const schema = view.getByLabelText("Draft-07 schema");
    const validate = view.getByRole("button", { name: "Validate document" });
    expect(input).toHaveValue("");
    expect(schema).toHaveValue("");
    expect(view.container).toHaveTextContent("Valid. The document matches the schema.");
    expect(validate).toBeDisabled();
    expect(view.queryByRole("button", { name: "Copy result" })).toBeNull();
    fireEvent.input(input, { target: { value: EXAMPLE_SCHEMA_DOCUMENT } });
    expect(view.queryByRole("note", { name: "Example output" })).toBeNull();
    expect(view.container).not.toHaveTextContent("Valid. The document matches the schema.");
    fireEvent.click(validate);
    expect(view.getByRole("alert")).toHaveTextContent("Invalid schema JSON.");
    fireEvent.input(schema, { target: { value: EXAMPLE_JSON_SCHEMA } });
    fireEvent.click(validate);
    expect(view.container).toHaveTextContent("Valid. The document matches the schema.");
    fireEvent.click(view.getByRole("button", { name: "Clear inputs" }));
    expect(input).toHaveValue("");
    expect(schema).toHaveValue("");
    expect(view.getByRole("note", { name: "Example output" })).toBeInTheDocument();
    fireEvent.input(schema, { target: { value: "true" } });
    fireEvent.click(validate);
    expect(view.getByRole("alert")).toHaveTextContent("Invalid JSON document.");
  });

  it("shows read-only query examples and starts manual rows with empty native inputs", () => {
    const view = render(() => <QueryStringTool />);
    const source = view.getByLabelText("URL or query string");
    expect(source).toHaveValue("");
    expect(view.getAllByRole("textbox")).toHaveLength(1);
    expect(view.container).toHaveTextContent("hello world");
    expect(view.queryByRole("button", { name: "Copy result" })).toBeNull();
    fireEvent.click(view.getByRole("button", { name: "Add parameter" }));
    expect(view.queryByRole("note", { name: "Example output" })).toBeNull();
    expect(view.getByLabelText("Key 1")).toHaveValue("");
    expect(view.getByLabelText("Value 1")).toHaveValue("");
    fireEvent.input(view.getByLabelText("Key 1"), { target: { value: "q" } });
    fireEvent.input(view.getByLabelText("Value 1"), { target: { value: "Ada + Bob" } });
    expect(view.container).toHaveTextContent("q=Ada+%2B+Bob");
    fireEvent.click(view.getByRole("button", { name: "Clear inputs" }));
    expect(view.getByRole("note", { name: "Example output" })).toBeInTheDocument();
    fireEvent.input(source, { target: { value: "/path?tag=one&tag=two#frag" } });
    expect(view.container.querySelector("pre")).toHaveTextContent("");
    expect(view.container).not.toHaveTextContent("hello world");
    fireEvent.click(view.getByRole("button", { name: "Load parameters" }));
    expect(view.getByLabelText("Key 1")).toHaveValue("tag");
    expect(view.getByLabelText("Value 2")).toHaveValue("two");
    fireEvent.input(view.getByLabelText("Value 2"), { target: { value: "three" } });
    expect(view.container).toHaveTextContent("/path?tag=one&tag=three#frag");
    fireEvent.input(source, { target: { value: "" } });
    expect(view.getByRole("note", { name: "Example output" })).toBeInTheDocument();
    expect(view.getAllByRole("textbox")).toHaveLength(1);
  });

  it("keeps cron builder placeholders separate from presets and loaded expressions", () => {
    const view = render(() => <CronTool />);
    for (const field of view.getAllByRole("textbox")) {
      expect(field).toHaveValue("");
      expect(field.getAttribute("placeholder")).toBeTruthy();
    }
    const preview = view.getByRole("button", { name: "Preview built schedule" });
    expect(preview).toBeDisabled();
    fireEvent.input(view.getByLabelText("Cron expression"), { target: { value: "0 12 * * *" } });
    expect(view.getByRole("note", { name: "Example builder output" })).toBeInTheDocument();
    expect(view.queryByRole("note", { name: "Example output" })).toBeNull();
    fireEvent.click(view.getByRole("button", { name: "Load expression into builder" }));
    expect(view.queryByRole("note", { name: "Example builder output" })).toBeNull();
    expect(preview).not.toBeDisabled();
    expect(view.getByLabelText("Hour (0-23)")).toHaveValue("12");
    fireEvent.click(view.getByRole("button", { name: "Every 5 minutes" }));
    expect(view.getByLabelText("Cron expression")).toHaveValue("*/5 * * * *");
  });
});
