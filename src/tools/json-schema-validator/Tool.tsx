import { createMemo, createSignal, onCleanup, Show } from "solid-js";
import ToolActionButton from "@/components/ToolActionButton";
import ToolStatusMessage from "@/components/ToolStatusMessage";
import ToolComparerWorkspace from "@/components/tool/ToolComparerWorkspace";
import ToolContainer from "@/components/tool/ToolContainer";
import ToolInputPanel from "@/components/tool/ToolInputPanel";
import ToolOutputPanel from "@/components/tool/ToolOutputPanel";
import { useToolHandoff } from "@/components/toolHandoff";
import { EXAMPLE_JSON_SCHEMA, EXAMPLE_SCHEMA_DOCUMENT } from "@/lib/exampleData";
import { validateJsonSchema } from "@/lib/jsonSchema";
import { createJsonSchemaExecutor } from "@/lib/jsonSchemaExecution";
import type { TextTransformResult } from "@/lib/text";
import { WorkerExecutionError } from "@/lib/workerExecution";
export default function Tool() {
  const [input, setInput] = createSignal("");
  const [schema, setSchema] = createSignal("");
  const [result, setResult] = createSignal<TextTransformResult | null>(null);
  const [pending, setPending] = createSignal(false);
  const [cancelled, setCancelled] = createSignal(false);
  const executor = createJsonSchemaExecutor();
  let run = 0;

  function resetValidation() {
    run++;
    executor.cancel();
    setPending(false);
    setCancelled(false);
    setResult(null);
  }

  async function validate() {
    resetValidation();
    const currentRun = run;
    setPending(true);
    try {
      const response = await executor.execute({ input: input(), schema: schema() });
      if (currentRun === run) setResult(response.result);
    } catch (error: unknown) {
      if (currentRun === run)
        setResult({
          ok: false,
          error: error instanceof WorkerExecutionError ? error.message : "Validation failed.",
        });
    } finally {
      if (currentRun === run) setPending(false);
    }
  }

  onCleanup(() => {
    run++;
    executor.dispose();
  });
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
  useToolHandoff("json-schema-validator", (handoff) => {
    resetValidation();
    setInput(handoff.value);
  });

  return (
    <ToolContainer>
      <ToolComparerWorkspace
        left={
          <ToolInputPanel
            label="JSON"
            value={input()}
            placeholder={EXAMPLE_SCHEMA_DOCUMENT}
            onInput={(value) => {
              resetValidation();
              setInput(value);
            }}
          />
        }
        right={
          <ToolInputPanel
            label="Draft-07 schema"
            value={schema()}
            placeholder={EXAMPLE_JSON_SCHEMA}
            onInput={(value) => {
              resetValidation();
              setSchema(value);
            }}
          />
        }
      >
        <div class="flex gap-2 flex-wrap">
          <ToolActionButton
            variant="primary"
            disabled={isExample()}
            onClick={() => void validate()}
          >
            Validate document
          </ToolActionButton>
          <ToolActionButton
            onClick={() => {
              resetValidation();
              setInput("");
              setSchema("");
            }}
          >
            Clear inputs
          </ToolActionButton>
        </div>
        <Show when={pending()}>
          <div class="flex flex-wrap items-center gap-2" role="status">
            <span class="text-sm text-[var(--text-muted)]">Validating…</span>
            <ToolActionButton
              onClick={() => {
                resetValidation();
                setCancelled(true);
              }}
            >
              Cancel validation
            </ToolActionButton>
          </div>
        </Show>
        <Show when={cancelled()}>
          <ToolStatusMessage>Validation cancelled. Validate again when ready.</ToolStatusMessage>
        </Show>
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
