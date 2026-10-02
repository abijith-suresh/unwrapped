import { fireEvent, render, waitFor } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";

import YamlToJsonTool from "./YamlToJsonTool";

describe("YamlToJsonTool", () => {
  it("renders the converter in the shared workspace", () => {
    const { getByRole, queryByRole } = render(() => <YamlToJsonTool />);

    expect(getByRole("textbox", { name: "YAML document" })).toBeInTheDocument();
    expect(getByRole("heading", { name: "YAML document" })).toBeInTheDocument();
    expect(getByRole("heading", { name: "Output" })).toBeInTheDocument();
    expect(queryByRole("button", { name: "Copy JSON" })).not.toBeInTheDocument();
    expect(getByRole("region", { name: "YAML document input panel" })).toBeInTheDocument();

    fireEvent.input(getByRole("textbox", { name: "YAML document" }), {
      target: { value: "name: Ada" },
    });
    expect(getByRole("button", { name: "Copy JSON" })).toBeInTheDocument();
  });

  it("keeps conversion errors visible and associated with the editor", async () => {
    const { getByRole, queryByRole } = render(() => <YamlToJsonTool />);
    const editor = getByRole("textbox", { name: "YAML document" });

    fireEvent.input(editor, { target: { value: "name: [" } });

    await waitFor(() => expect(getByRole("alert")).toHaveTextContent("Invalid YAML input"));
    expect(editor).toHaveAttribute("aria-invalid", "true");
    expect(editor).toHaveAccessibleDescription(
      getByRole("alert").textContent?.replace(/\s+/g, " ").trim() ?? ""
    );
    expect(queryByRole("button", { name: "Copy JSON" })).not.toBeInTheDocument();
  });
});
