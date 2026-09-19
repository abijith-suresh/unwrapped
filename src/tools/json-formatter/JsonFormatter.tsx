import { createEffect, createMemo, createSignal, onCleanup, Show } from "solid-js";

import CopyButton from "@/components/CopyButton";
import ToolActionButton from "@/components/ToolActionButton";
import ToolCodeBlock from "@/components/tool/ToolCodeBlock";
import ToolCodeEditor from "@/components/tool/ToolCodeEditor";
import ToolContainer from "@/components/tool/ToolContainer";
import ToolPanel from "@/components/tool/ToolPanel";
import ToolSegmentedControl from "@/components/tool/ToolSegmentedControl";
import ToolToast from "@/components/tool/ToolToast";
import ToolToolbar from "@/components/tool/ToolToolbar";
import ToolWorkspace from "@/components/tool/ToolWorkspace";
import { formatJson, type IndentSize, type JsonFormatResult } from "@/lib/jsonFormatter";

type OutputFormat = "two-spaces" | "four-spaces" | "minified";

const EDITOR_PANEL_CLASSES = "flex h-[clamp(18rem,44dvh,28rem)] min-h-0 flex-col";
const EDITOR_BODY_CLASSES = "flex min-h-0 flex-1 flex-col";

export default function JsonFormatter() {
  const [input, setInput] = createSignal("");
  const [outputFormat, setOutputFormat] = createSignal<OutputFormat>("two-spaces");
  const [sortKeys, setSortKeys] = createSignal(false);
  const indent = createMemo<IndentSize>(() => (outputFormat() === "four-spaces" ? 4 : 2));
  const minify = createMemo(() => outputFormat() === "minified");
  const result = createMemo(
    (): JsonFormatResult => formatJson(input(), indent(), minify(), sortKeys())
  );
  const errorHint = createMemo(() => {
    const current = result();
    return current.errorLine && current.errorColumn
      ? `Check the value near line ${current.errorLine}, column ${current.errorColumn}.`
      : "Check commas, quotes, and brackets, then try again.";
  });
  const diagnostic = createMemo(() => {
    const current = result();
    return current.errorPosition === null
      ? null
      : { start: current.errorPosition, length: current.errorLength };
  });
  const [toastOpen, setToastOpen] = createSignal(false);
  let toastTimer: ReturnType<typeof setTimeout> | undefined;
  let hadError = false;

  createEffect(() => {
    const hasError = Boolean(result().error);

    if (hasError && !hadError) {
      setToastOpen(true);
      if (toastTimer) {
        clearTimeout(toastTimer);
      }
      toastTimer = setTimeout(() => setToastOpen(false), 3500);
    } else if (!hasError) {
      setToastOpen(false);
      if (toastTimer) {
        clearTimeout(toastTimer);
        toastTimer = undefined;
      }
    }

    hadError = hasError;
  });

  onCleanup(() => {
    if (toastTimer) {
      clearTimeout(toastTimer);
    }
  });

  return (
    <ToolContainer width="wide">
      <ToolToast open={toastOpen()} message="JSON could not be parsed." tone="error" />

      <ToolToolbar label="Formatting controls">
        <div class="grid w-full min-w-0 grid-cols-2 gap-2 sm:grid-cols-[max-content_max-content] sm:items-end sm:gap-3">
          <ToolSegmentedControl
            label="Output format"
            value={outputFormat()}
            options={[
              { value: "two-spaces", label: "2 spaces" },
              { value: "four-spaces", label: "4 spaces" },
              { value: "minified", label: "Minified" },
            ]}
            onChange={(value) => setOutputFormat(value)}
            class="col-span-2 min-w-0 sm:col-span-1"
          />

          <ToolActionButton
            active={sortKeys()}
            variant="toggle"
            onClick={() => setSortKeys((value) => !value)}
            class="col-span-2 h-[2.625rem] w-full sm:col-span-1 sm:w-auto"
          >
            Sort keys A-Z
          </ToolActionButton>
        </div>
      </ToolToolbar>

      <Show when={result().error}>
        <p id="json-input-error" class="sr-only">
          JSON could not be parsed. {errorHint()}
        </p>
      </Show>

      <ToolWorkspace
        switcherLabel="JSON formatter views"
        views={[
          {
            id: "input",
            label: "Input",
            content: (
              <ToolPanel title="Input" class={EDITOR_PANEL_CLASSES} bodyClass={EDITOR_BODY_CLASSES}>
                <ToolCodeEditor
                  id="json-input"
                  name="json-input"
                  label="JSON document"
                  labelClass="sr-only"
                  diagnostic={diagnostic()}
                  value={input()}
                  onInput={(value) => setInput(value)}
                  placeholder="Paste JSON here…"
                  rows={12}
                  spellcheck={false}
                  autocomplete="off"
                  describedBy={result().error ? "json-input-error" : undefined}
                  error={!!result().error}
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
                  <Show when={result().raw}>
                    <CopyButton text={result().raw} label="Copy JSON" />
                  </Show>
                }
              >
                <Show
                  when={result().raw}
                  fallback={
                    <div class="flex min-h-0 flex-1 items-center justify-center rounded-[var(--radius-control)] border border-dashed border-[var(--border)] bg-[var(--bg-primary)] p-6 text-center text-sm leading-relaxed text-[var(--text-muted)]">
                      JSON output will appear here.
                    </div>
                  }
                >
                  <ToolCodeBlock
                    fill
                    segments={result().segments}
                    aria-label="JSON output"
                    class="text-[0.8125rem]"
                  />
                </Show>
              </ToolPanel>
            ),
          },
        ]}
      />
    </ToolContainer>
  );
}
