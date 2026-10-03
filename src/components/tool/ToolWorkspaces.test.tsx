import { fireEvent, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, expect, it } from "vitest";
import ToolActionButton from "@/components/ToolActionButton";
import ToolGeneratorWorkspace from "./ToolGeneratorWorkspace";
import ToolInputPanel from "./ToolInputPanel";
import ToolInspectorWorkspace from "./ToolInspectorWorkspace";
import ToolTransformWorkspace from "./ToolTransformWorkspace";

describe("shared workspaces", () => {
  it("keeps examples out of transform inputs and connects errors to the editor", () => {
    const { getByRole, queryByRole } = render(() => {
      const [input, setInput] = createSignal("");
      return (
        <ToolTransformWorkspace
          input={{ label: "Source", value: input(), onInput: setInput, placeholder: "sample" }}
          output={{
            title: "Result",
            value: input() || "sample output",
            isExample: input() === "",
            error: input() === "invalid" ? "Invalid source" : undefined,
          }}
        />
      );
    });
    const editor = getByRole("textbox", { name: "Source" });
    expect(editor).toHaveValue("");
    const output = getByRole("region", { name: "Result" });
    expect(output).toHaveTextContent("sample output");
    expect(getByRole("note", { name: "Example output" })).toBeInTheDocument();
    expect(queryByRole("button", { name: "Copy output" })).not.toBeInTheDocument();
    expect(queryByRole("button", { name: "Download result" })).not.toBeInTheDocument();
    fireEvent.input(editor, { target: { value: "user text" } });
    expect(output).toHaveTextContent("user text");
    expect(output).not.toHaveTextContent("sample output");
    expect(queryByRole("note", { name: "Example output" })).not.toBeInTheDocument();
    expect(getByRole("button", { name: "Copy output" })).toBeEnabled();
    expect(getByRole("button", { name: "Download result" })).toBeEnabled();
    fireEvent.input(editor, { target: { value: "invalid" } });
    expect(getByRole("alert")).toHaveTextContent("Invalid source");
    expect(editor).toHaveAttribute("aria-invalid", "true");
    expect(editor).toHaveAttribute("aria-describedby", getByRole("alert").id);
    expect(queryByRole("button", { name: "Copy output" })).not.toBeInTheDocument();
    expect(queryByRole("button", { name: "Download result" })).not.toBeInTheDocument();
    fireEvent.input(editor, { target: { value: "" } });
    expect(editor).not.toHaveAttribute("aria-invalid", "true");
    expect(output).toHaveTextContent("sample output");
    expect(queryByRole("alert")).not.toBeInTheDocument();
    expect(getByRole("note", { name: "Example output" })).toBeInTheDocument();
    expect(queryByRole("button", { name: "Copy output" })).not.toBeInTheDocument();
  });
  it("suppresses inspector results on error and restores them after editing", () => {
    const { getByRole, queryByRole } = render(() => {
      const [input, setInput] = createSignal("invalid");
      return (
        <ToolInspectorWorkspace
          input={<ToolInputPanel label="Value" value={input()} onInput={setInput} />}
          error={input() === "invalid" ? "Cannot inspect value" : undefined}
          fields={[
            { label: "Parsed value", value: input() },
            { label: "Absent", value: "" },
          ]}
        />
      );
    });
    expect(getByRole("alert")).toHaveTextContent("Cannot inspect value");
    expect(queryByRole("button", { name: "Copy Parsed value" })).not.toBeInTheDocument();
    fireEvent.input(getByRole("textbox", { name: "Value" }), { target: { value: "valid" } });
    expect(getByRole("button", { name: "Copy Parsed value" })).toBeEnabled();
    expect(queryByRole("button", { name: "Copy Absent" })).not.toBeInTheDocument();
  });
  it("updates generator results through the shared action slot", () => {
    const { getByRole } = render(() => {
      const [output, setOutput] = createSignal("first");
      return (
        <ToolGeneratorWorkspace
          configuration={<span>Options</span>}
          actions={
            <ToolActionButton onClick={() => setOutput("second")}>Regenerate</ToolActionButton>
          }
          fields={[{ label: "Generated value", value: output() }]}
        />
      );
    });
    expect(getByRole("region", { name: "Generated value" })).toHaveTextContent("first");
    fireEvent.click(getByRole("button", { name: "Regenerate" }));
    expect(getByRole("region", { name: "Generated value" })).toHaveTextContent("second");
    expect(getByRole("button", { name: "Copy Generated value" })).toBeEnabled();
  });
});
