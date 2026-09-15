import { createMemo, createSignal, Show } from "solid-js";

import CopyButton from "@/components/CopyButton";
import ToolStatusMessage from "@/components/ToolStatusMessage";
import ToolCodeBlock from "@/components/tool/ToolCodeBlock";
import ToolCodeEditor from "@/components/tool/ToolCodeEditor";
import ToolContainer from "@/components/tool/ToolContainer";
import ToolPanel from "@/components/tool/ToolPanel";
import ToolWorkspace from "@/components/tool/ToolWorkspace";
import { convertJsonToYaml } from "@/lib/jsonToYaml";

const EDITOR_PANEL_CLASSES = "flex h-[clamp(18rem,44dvh,28rem)] min-h-0 flex-col";
const EDITOR_BODY_CLASSES = "flex min-h-0 flex-1 flex-col";

export default function JsonToYamlTool() {
  const [input, setInput] = createSignal('{\n  "hello": "world"\n}');
  const result = createMemo(() => convertJsonToYaml(input()));
  const output = createMemo(() => {
    const current = result();
    return current.ok ? current.output : "";
  });
  const error = createMemo(() => {
    const current = result();
    return current.ok ? "" : current.error;
  });

  return (
    <ToolContainer width="wide">
      <Show when={error()}>
        <p id="json-to-yaml-input-error" class="sr-only">
          {error()}
        </p>
      </Show>

      <ToolWorkspace
        switcherLabel="JSON to YAML views"
        views={[
          {
            id: "input",
            label: "Input",
            content: (
              <ToolPanel title="Input" class={EDITOR_PANEL_CLASSES} bodyClass={EDITOR_BODY_CLASSES}>
                <ToolCodeEditor
                  id="json-to-yaml-input"
                  name="json-to-yaml-input"
                  label="JSON document"
                  labelClass="sr-only"
                  value={input()}
                  onInput={(value) => setInput(value)}
                  placeholder="Paste JSON to convert…"
                  rows={12}
                  spellcheck={false}
                  autocomplete="off"
                  describedBy={error() ? "json-to-yaml-input-error" : undefined}
                  error={!!error()}
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
                class={EDITOR_PANEL_CLASSES}
                bodyClass={EDITOR_BODY_CLASSES}
                actions={
                  <Show when={output()}>
                    <CopyButton text={output()} label="Copy YAML" />
                  </Show>
                }
              >
                <Show
                  when={!error()}
                  fallback={
                    <div class="flex min-h-0 flex-1 items-start">
                      <ToolStatusMessage tone="error">{error()}</ToolStatusMessage>
                    </div>
                  }
                >
                  <ToolCodeBlock fill aria-label="YAML output">
                    {output() || "—"}
                  </ToolCodeBlock>
                </Show>
              </ToolPanel>
            ),
          },
        ]}
      />
    </ToolContainer>
  );
}
