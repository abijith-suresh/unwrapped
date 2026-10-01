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
import { minifyCss } from "@/lib/cssMinifier";
import { EXAMPLE_CSS } from "@/lib/exampleData";

export default function Tool() {
  const [input, setInput] = createSignal("");
  const isExample = () => input() === "";

  const result = createMemo(() => minifyCss(input() || EXAMPLE_CSS));
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
                  placeholder={EXAMPLE_CSS}
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
        Uses CSSO with rule restructuring disabled. Strings, URLs, calc expressions, and custom
        properties are parsed as CSS. Input is limited to 100,000 characters.
      </ToolStatusMessage>
    </ToolContainer>
  );
}
