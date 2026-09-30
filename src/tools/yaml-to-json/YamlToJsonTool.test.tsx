import { fireEvent, render, waitFor } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";

import YamlToJsonTool from "./YamlToJsonTool";

describe("YamlToJsonTool", () => {
  it("renders the converter in the shared workspace", () => {
    const { getByRole } = render(() => <YamlToJsonTool />);

    expect(getByRole("textbox", { name: "YAML document" })).toBeInTheDocument();
    expect(getByRole("heading", { name: "Input" })).toBeInTheDocument();
    expect(getByRole("heading", { name: "Output" })).toBeInTheDocument();
    expect(getByRole("button", { name: "Copy JSON" })).toBeInTheDocument();
    expect(getByRole("tab", { name: "Input" })).toHaveAttribute("aria-selected", "true");
  });

  it("keeps conversion errors visible and associated with the editor", async () => {
    const { getByRole, queryByRole } = render(() => <YamlToJsonTool />);
    const editor = getByRole("textbox", { name: "YAML document" });

    fireEvent.input(editor, { target: { value: "name: [" } });

    await waitFor(() => expect(getByRole("alert")).toHaveTextContent("Invalid YAML input"));
    expect(editor).toHaveAttribute("aria-invalid", "true");
    expect(editor).toHaveAttribute("aria-describedby", "yaml-to-json-input-error");
    expect(queryByRole("button", { name: "Copy JSON" })).not.toBeInTheDocument();
  });
});
