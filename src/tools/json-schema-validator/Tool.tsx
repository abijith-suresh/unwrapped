import { createSignal, Show } from "solid-js";
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
import ToolWorkspace from "@/components/tool/ToolWorkspace";
import { validateJsonSchema } from "@/lib/jsonSchema";
import type { TextTransformResult } from "@/lib/text";
export default function Tool() {
  const [input, setInput] = createSignal('{"name":"Ada"}');
  const [schema, setSchema] = createSignal(
    '{"type":"object","properties":{"name":{"type":"string"}},"required":["name"],"additionalProperties":false}'
  );
  const [result, setResult] = createSignal<TextTransformResult | null>(null);
  const output = () => {
    const current = result();
    return current?.ok ? current.output : "";
  };
  const error = () => {
    const current = result();
    return current && !current.ok ? current.error : "";
  };
  return (
    <ToolContainer width="wide">
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
      <ToolPanel
        title="Validation result"
        actions={<CopyButton text={output()} label="Copy result" />}
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
      <ToolStatusMessage tone="muted">
        JSON Schema draft-07 with standard formats and strict schema checks. Local references work;
        external schemas are never fetched. Data is not coerced or changed. Each input is limited to
        100,000 characters.
      </ToolStatusMessage>
    </ToolContainer>
  );
}
