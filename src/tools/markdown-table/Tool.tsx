import { createMemo, createSignal } from "solid-js";
import ToolActionButton from "@/components/ToolActionButton";
import ToolContainer from "@/components/tool/ToolContainer";
import ToolSegmentedControl from "@/components/tool/ToolSegmentedControl";
import ToolToolbar from "@/components/tool/ToolToolbar";
import ToolTransformWorkspace from "@/components/tool/ToolTransformWorkspace";
import { EXAMPLE_CSV } from "@/lib/exampleData";
import type { TableMode } from "@/lib/markdownTable";
import { convertTable } from "@/lib/markdownTable";

const exampleMarkdown = convertTable(EXAMPLE_CSV, "csv");
const examples: Record<TableMode, string> = {
  csv: EXAMPLE_CSV,
  tsv: EXAMPLE_CSV.replaceAll(",", "\t"),
  markdown: exampleMarkdown.ok ? exampleMarkdown.output : "",
};

export default function Tool() {
  const [input, setInput] = createSignal("");
  const [mode, setMode] = createSignal<TableMode>("csv");
  const isExample = () => input() === "";
  const result = createMemo(() => convertTable(input() || examples[mode()], mode()));
  const output = () => {
    const current = result();
    return current.ok ? current.output : "";
  };
  const error = () => {
    const current = result();
    return current.ok ? "" : current.error;
  };
  return (
    <ToolContainer>
      <ToolToolbar
        label="Options"
        actions={<ToolActionButton onClick={() => setInput("")}>Clear input</ToolActionButton>}
      >
        <ToolSegmentedControl
          label="Input format"
          value={mode()}
          onChange={setMode}
          options={[
            { value: "csv", label: "CSV" },
            { value: "tsv", label: "TSV" },
            { value: "markdown", label: "Markdown" },
          ]}
        />
      </ToolToolbar>

      <ToolTransformWorkspace
        input={{
          label: "Source",
          value: input(),
          onInput: setInput,
          placeholder: examples[mode()],
          name: "source",
        }}
        output={{
          title: mode() === "markdown" ? "CSV" : "Markdown",
          value: output(),
          isExample: isExample(),
          error: error(),
          copyLabel: "Copy output",
        }}
      />
    </ToolContainer>
  );
}
