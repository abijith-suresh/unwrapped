import { fireEvent, render, waitFor } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";

import JsonToYamlTool from "./JsonToYamlTool";

describe("JsonToYamlTool", () => {
  it("renders the converter in the shared workspace", () => {
    const { getByRole } = render(() => <JsonToYamlTool />);

    expect(getByRole("textbox", { name: "JSON document" })).toBeInTheDocument();
    expect(getByRole("heading", { name: "Input" })).toBeInTheDocument();
    expect(getByRole("heading", { name: "Output" })).toBeInTheDocument();
    expect(getByRole("button", { name: "Copy YAML" })).toBeInTheDocument();
    expect(getByRole("tab", { name: "Input" })).toHaveAttribute("aria-selected", "true");
  });

  it("keeps conversion errors visible and associated with the editor", async () => {
    const { getByRole, queryByRole } = render(() => <JsonToYamlTool />);
    const editor = getByRole("textbox", { name: "JSON document" });

    fireEvent.input(editor, { target: { value: '{"name":' } });

    await waitFor(() => expect(getByRole("alert")).toHaveTextContent("Invalid JSON input"));
    expect(editor).toHaveAttribute("aria-invalid", "true");
    expect(editor).toHaveAttribute("aria-describedby", "json-to-yaml-input-error");
    expect(queryByRole("button", { name: "Copy YAML" })).not.toBeInTheDocument();
  });
});
