import { fireEvent, render, waitFor } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";

import JsonToYamlTool from "./JsonToYamlTool";

describe("JsonToYamlTool", () => {
  it("renders the converter in the shared workspace", () => {
    const { getByRole, queryByRole } = render(() => <JsonToYamlTool />);

    expect(getByRole("textbox", { name: "JSON document" })).toBeInTheDocument();
    expect(getByRole("heading", { name: "JSON document" })).toBeInTheDocument();
    expect(getByRole("heading", { name: "Output" })).toBeInTheDocument();
    expect(queryByRole("button", { name: "Copy YAML" })).not.toBeInTheDocument();
    expect(getByRole("region", { name: "JSON document input panel" })).toBeInTheDocument();

    fireEvent.input(getByRole("textbox", { name: "JSON document" }), {
      target: { value: '{"name":"Ada"}' },
    });
    expect(getByRole("button", { name: "Copy YAML" })).toBeInTheDocument();
  });

  it("keeps conversion errors visible and associated with the editor", async () => {
    const { getByRole, queryByRole } = render(() => <JsonToYamlTool />);
    const editor = getByRole("textbox", { name: "JSON document" });

    fireEvent.input(editor, { target: { value: '{"name":' } });

    await waitFor(() => expect(getByRole("alert")).toHaveTextContent("Invalid JSON input"));
    expect(editor).toHaveAttribute("aria-invalid", "true");
    expect(editor).toHaveAccessibleDescription(getByRole("alert").textContent ?? "");
    expect(queryByRole("button", { name: "Copy YAML" })).not.toBeInTheDocument();
  });
});
