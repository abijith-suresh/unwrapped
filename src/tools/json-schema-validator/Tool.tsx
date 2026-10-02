import { createMemo, createSignal } from "solid-js";
import ToolActionButton from "@/components/ToolActionButton";
import ToolComparerWorkspace from "@/components/tool/ToolComparerWorkspace";
import ToolContainer from "@/components/tool/ToolContainer";
import ToolInputPanel from "@/components/tool/ToolInputPanel";
import ToolOutputPanel from "@/components/tool/ToolOutputPanel";
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
      <ToolComparerWorkspace
        left={
          <ToolInputPanel
            label="JSON"
            value={input()}
            placeholder={EXAMPLE_SCHEMA_DOCUMENT}
            onInput={(value) => {
              setInput(value);
              setResult(null);
            }}
          />
        }
        right={
          <ToolInputPanel
            label="Draft-07 schema"
            value={schema()}
            placeholder={EXAMPLE_JSON_SCHEMA}
            onInput={(value) => {
              setSchema(value);
              setResult(null);
            }}
          />
        }
      >
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
        <ToolOutputPanel
          compact
          title="Validation result"
          value={output()}
          error={error()}
          isExample={isExample()}
          copyLabel="Copy result"
        />
      </ToolComparerWorkspace>
    </ToolContainer>
  );
}
