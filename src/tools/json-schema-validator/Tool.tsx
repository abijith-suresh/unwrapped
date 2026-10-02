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
import ToolWorkspace from "@/components/tool/ToolWorkspace";
import { EXAMPLE_JSON_SCHEMA, EXAMPLE_SCHEMA_DOCUMENT } from "@/lib/exampleData";
import { validateJsonSchema } from "@/lib/jsonSchema";
import type { TextTransformResult } from "@/lib/text";
export default function Tool() {
  const [input, setInput] = createSignal("");
  const [schema, setSchema] = createSignal("");
  const [result, setResult] = createSignal<TextTransformResult | null>(null);
  const isExample = () => input() === "" && schema() === "";
  const displayedResult = createMemo(() =>
    isExample() ? validateJsonSchema(EXAMPLE_SCHEMA_DOCUMENT, EXAMPLE_JSON_SCHEMA) : result()
  );
  const output = () => {
    const current = displayedResult();
    return current?.ok ? current.output : "";
  };
  const error = () => {
    const current = displayedResult();
    return current && !current.ok ? current.error : "";
  };
  return (
    <ToolContainer>
      <ToolWorkspace
        views={[
          {
            id: "document",
            label: "Document",
            content: (
              <ToolPanel
                title="JSON document"
                class={TOOL_EDITOR_PANEL_CLASSES}
                bodyClass={TOOL_EDITOR_BODY_CLASSES}
              >
                <ToolCodeEditor
                  label="JSON"
                  value={input()}
                  placeholder={EXAMPLE_SCHEMA_DOCUMENT}
                  onInput={(value) => {
                    setInput(value);
                    setResult(null);
                  }}
                  spellcheck={false}
                  autocomplete="off"
                />
              </ToolPanel>
            ),
          },
          {
            id: "schema",
            label: "Schema",
            content: (
              <ToolPanel
                title="JSON Schema"
                class={TOOL_EDITOR_PANEL_CLASSES}
                bodyClass={TOOL_EDITOR_BODY_CLASSES}
              >
                <ToolCodeEditor
                  label="Draft-07 schema"
                  value={schema()}
                  placeholder={EXAMPLE_JSON_SCHEMA}
                  onInput={(value) => {
                    setSchema(value);
                    setResult(null);
                  }}
                  spellcheck={false}
                  autocomplete="off"
                />
              </ToolPanel>
            ),
          },
        ]}
      />
      <div class="flex gap-2 flex-wrap">
        <ToolActionButton
          variant="primary"
          disabled={isExample()}
          onClick={() => setResult(validateJsonSchema(input(), schema()))}
        >
          Validate document
        </ToolActionButton>
        <ToolActionButton
          onClick={() => {
            setInput("");
            setSchema("");
            setResult(null);
          }}
        >
          Clear inputs
        </ToolActionButton>
      </div>
      <ToolExampleNotice when={isExample()} />
      <ToolPanel
        title="Validation result"
        actions={
          <Show when={!isExample()}>
            <CopyButton text={output()} label="Copy result" />
          </Show>
        }
      >
        <Show
          when={!error()}
          fallback={<ToolStatusMessage tone="error">{error()}</ToolStatusMessage>}
        >
          <ToolCodeBlock aria-live="polite">
            {output() || "Select Validate document to check the schema."}
          </ToolCodeBlock>
        </Show>
      </ToolPanel>
    </ToolContainer>
  );
}
