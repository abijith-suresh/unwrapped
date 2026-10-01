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
import { transformEntities } from "@/lib/htmlEntities";

export default function Tool() {
  const [input, setInput] = createSignal('<p title="Hello">Tom & Jerry \u00a9</p>');
  const [mode, setMode] = createSignal<"encode" | "decode">("encode");
  const [nonAscii, setNonAscii] = createSignal(false);
  const result = createMemo(() => transformEntities(input(), mode(), nonAscii()));
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
        <ToolActionButton active={mode() === "encode"} onClick={() => setMode("encode")}>
          Encode
        </ToolActionButton>
        <ToolActionButton active={mode() === "decode"} onClick={() => setMode("decode")}>
          Decode
        </ToolActionButton>
        <ToolActionButton active={nonAscii()} onClick={() => setNonAscii((value) => !value)}>
          Encode non-ASCII
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
        Decode requires a terminating semicolon. Output is displayed as text and is never rendered
        as HTML.
      </ToolStatusMessage>
    </ToolContainer>
  );
}
