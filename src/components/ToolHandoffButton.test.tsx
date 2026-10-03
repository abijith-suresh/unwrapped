import { fireEvent, render, waitFor } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";
import ToolOutputPanel from "@/components/tool/ToolOutputPanel";
import { setToolHandoffNavigator, toolHandoffs } from "@/lib/toolHandoff";

afterEach(() => toolHandoffs.clear());

describe("output handoff controls", () => {
  it("offers only compatible tools for real successful results", () => {
    const { getByRole, queryByRole } = render(() => {
      const [value, setValue] = createSignal("");
      return (
        <div data-tool-id="json-formatter">
          <input
            aria-label="Source"
            value={value()}
            onInput={(event) => setValue(event.currentTarget.value)}
          />
          <ToolOutputPanel
            title="Output"
            value={value() || "example"}
            isExample={!value()}
            error={value() === "bad" ? "Invalid JSON" : undefined}
            download={{ format: "json" }}
          />
        </div>
      );
    });
    expect(queryByRole("combobox")).not.toBeInTheDocument();
    fireEvent.input(getByRole("textbox"), { target: { value: '{"n":9007199254740993}' } });
    expect(getByRole("combobox", { name: "Open output in another tool" })).toBeEnabled();
    expect(getByRole("option", { name: "JSON to YAML" })).toBeInTheDocument();
    expect(queryByRole("option", { name: "YAML to JSON" })).not.toBeInTheDocument();
    expect(queryByRole("option", { name: "JSON Formatter" })).not.toBeInTheDocument();
    fireEvent.input(getByRole("textbox"), { target: { value: "bad" } });
    expect(queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("keeps the source result and clears the transfer when navigation fails", async () => {
    setToolHandoffNavigator(async () => {
      throw new Error("Navigation failed");
    });
    const { getByRole, getByText } = render(() => (
      <div data-tool-id="json-formatter">
        <ToolOutputPanel
          title="Output"
          value='{"private":"unchanged"}'
          download={{ format: "json" }}
        />
      </div>
    ));
    fireEvent.change(getByRole("combobox"), { target: { value: "json-to-yaml" } });
    await waitFor(() => expect(getByRole("alert")).toHaveTextContent("Could not open the tool"));
    expect(getByText('{"private":"unchanged"}')).toBeInTheDocument();
    expect(toolHandoffs.consume("json-to-yaml")).toBeUndefined();
    expect(getByRole("combobox")).toBeEnabled();
  });

  it("omits handoffs when output is marked as binary", () => {
    const { queryByRole } = render(() => (
      <div data-tool-id="base64">
        <ToolOutputPanel
          title="Decoded bytes"
          value="2 decoded bytes"
          download={false}
          handoff={false}
        />
      </div>
    ));
    expect(queryByRole("combobox")).not.toBeInTheDocument();
  });
});
