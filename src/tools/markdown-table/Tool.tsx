import { createMemo, createSignal, Show } from "solid-js";
import CopyButton from "@/components/CopyButton";
import ToolActionButton from "@/components/ToolActionButton";
import ToolStatusMessage from "@/components/ToolStatusMessage";
import ToolCodeBlock from "@/components/tool/ToolCodeBlock";
import ToolCodeEditor from "@/components/tool/ToolCodeEditor";
import ToolContainer from "@/components/tool/ToolContainer";
import ToolPanel, {
  TOOL_EDITOR_BODY_CLASSES,
  TOOL_EDITOR_PANEL_CLASSES,
} from "@/components/tool/ToolPanel";
import ToolToolbar from "@/components/tool/ToolToolbar";
import ToolWorkspace from "@/components/tool/ToolWorkspace";
import type { TableMode } from "@/lib/markdownTable";
import { convertTable } from "@/lib/markdownTable";
export default function Tool() {
  const [input, setInput] = createSignal("Name,Role\nAda,Engineer\nGrace,Scientist");
  const [mode, setMode] = createSignal<TableMode>("csv");
  const result = createMemo(() => convertTable(input(), mode()));
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
                actions={<CopyButton text={output()} label="Copy output" />}
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
        inline formatting stays as text. Leading or trailing cell whitespace must be trimmed first.
        Input limit: 100,000 characters.
      </ToolStatusMessage>
    </ToolContainer>
  );
}
