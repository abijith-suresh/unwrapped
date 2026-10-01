import { createMemo, createSignal, Show } from "solid-js";
import CopyButton from "@/components/CopyButton";
import ToolActionButton from "@/components/ToolActionButton";
import ToolStatusMessage from "@/components/ToolStatusMessage";
import ToolCodeBlock from "@/components/tool/ToolCodeBlock";
import ToolCodeEditor from "@/components/tool/ToolCodeEditor";
import ToolContainer from "@/components/tool/ToolContainer";
import ToolExampleNotice from "@/components/tool/ToolExampleNotice";
import ToolPanel, {
  TOOL_EDITOR_BODY_CLASSES,
  TOOL_EDITOR_PANEL_CLASSES,
} from "@/components/tool/ToolPanel";
import ToolToolbar from "@/components/tool/ToolToolbar";
import ToolWorkspace from "@/components/tool/ToolWorkspace";
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
    <ToolContainer width="wide">
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
      <ToolExampleNotice when={isExample()} />
      <ToolWorkspace
        views={[
          {
            id: "input",
            label: "Input",
            content: (
              <ToolPanel
                title="Input"
                class={TOOL_EDITOR_PANEL_CLASSES}
                bodyClass={TOOL_EDITOR_BODY_CLASSES}
              >
                <ToolCodeEditor
                  label="Source"
                  value={input()}
                  placeholder={examples[mode()]}
                  onInput={setInput}
                  spellcheck={false}
                  autocomplete="off"
                  error={!!error()}
                  describedBy={error() ? "transform-error" : undefined}
                />
              </ToolPanel>
            ),
          },
          {
            id: "output",
            label: "Output",
            content: (
              <ToolPanel
                title="Output"
                class={TOOL_EDITOR_PANEL_CLASSES}
                bodyClass={TOOL_EDITOR_BODY_CLASSES}
                actions={
                  <Show when={!isExample()}>
                    <CopyButton text={output()} label="Copy output" />
                  </Show>
                }
              >
                <Show
                  when={!error()}
                  fallback={
                    <ToolStatusMessage id="transform-error" tone="error">
                      {error()}
                    </ToolStatusMessage>
                  }
                >
                  <ToolCodeBlock fill>{output()}</ToolCodeBlock>
                </Show>
              </ToolPanel>
            ),
          },
        ]}
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
