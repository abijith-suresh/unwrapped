import { createMemo, createSignal } from "solid-js";
import ToolActionButton from "@/components/ToolActionButton";
import ToolStatusMessage from "@/components/ToolStatusMessage";
import ToolContainer from "@/components/tool/ToolContainer";
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
      <ToolToolbar label="Options">
        <ToolActionButton active={mode() === "csv"} onClick={() => setMode("csv")}>
          CSV to Markdown
        </ToolActionButton>
        <ToolActionButton active={mode() === "tsv"} onClick={() => setMode("tsv")}>
          TSV to Markdown
        </ToolActionButton>
        <ToolActionButton active={mode() === "markdown"} onClick={() => setMode("markdown")}>
          Markdown to CSV
        </ToolActionButton>
        <ToolActionButton onClick={() => setInput("")}>Clear input</ToolActionButton>
      </ToolToolbar>

      <ToolTransformWorkspace
        inputLabel="Source"
        value={input()}
        onInput={setInput}
        placeholder={examples[mode()]}
        output={output()}
        isExample={isExample()}
        error={error()}
        copyLabel="Copy output"
      />
      <ToolStatusMessage tone="muted">
        The first CSV or TSV row is the header. Newlines become {"<br>"}. Markdown converts to CSV;
        literal HTML and entities are escaped to preserve cell text. Inline formatting stays as
        text. Leading or trailing cell whitespace must be trimmed first. Input limit: 100,000
        characters.
      </ToolStatusMessage>
    </ToolContainer>
  );
}
