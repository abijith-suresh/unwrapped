import { createMemo, createSignal, Show } from "solid-js";

import CopyButton from "@/components/CopyButton";
import Textarea from "@/components/primitives/solid/Textarea";
import ToolActionButton from "@/components/ToolActionButton";
import ToolCodeBlock from "@/components/tool/ToolCodeBlock";
import ToolContainer from "@/components/tool/ToolContainer";
import ToolInlineError from "@/components/tool/ToolInlineError";
import ToolPanel from "@/components/tool/ToolPanel";
import ToolSegmentedControl from "@/components/tool/ToolSegmentedControl";
import ToolToolbar from "@/components/tool/ToolToolbar";
import ToolWorkspace from "@/components/tool/ToolWorkspace";
import { formatJson, type IndentSize, type JsonFormatResult } from "@/lib/jsonFormatter";

export default function JsonFormatter() {
  const [input, setInput] = createSignal("");
  const [indent, setIndent] = createSignal<IndentSize>(2);
  const [minify, setMinify] = createSignal(false);
  const [sortKeys, setSortKeys] = createSignal(false);
  const result = createMemo(
    (): JsonFormatResult => formatJson(input(), indent(), minify(), sortKeys())
  );

  return (
    <ToolContainer width="wide">
      <ToolToolbar label="Formatting controls">
        <div class="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <ToolSegmentedControl label="Indentation" class="w-full sm:w-auto">
            <ToolActionButton
              active={indent() === 2 && !minify()}
              variant="segment"
              onClick={() => {
                setIndent(2);
                setMinify(false);
              }}
              class="min-w-0 flex-1 sm:min-w-[5.5rem]"
            >
              2 spaces
            </ToolActionButton>
            <ToolActionButton
              active={indent() === 4 && !minify()}
              variant="segment"
              onClick={() => {
                setIndent(4);
                setMinify(false);
              }}
              class="min-w-0 flex-1 sm:min-w-[5.5rem]"
            >
              4 spaces
            </ToolActionButton>
          </ToolSegmentedControl>

          <div class="flex w-full flex-wrap items-center gap-2 sm:ml-auto sm:w-auto">
            <ToolActionButton
              active={minify()}
              variant="toggle"
              onClick={() => setMinify((value) => !value)}
            >
              Minify
            </ToolActionButton>

            <ToolActionButton
              active={sortKeys()}
              variant="toggle"
              onClick={() => setSortKeys((value) => !value)}
            >
              Sort keys
            </ToolActionButton>

            <Show when={input().trim()}>
              <ToolActionButton variant="ghost" onClick={() => setInput("")} class="ml-auto">
                Clear
              </ToolActionButton>
            </Show>
          </div>
        </div>
      </ToolToolbar>

      <ToolWorkspace
        switcherLabel="JSON formatter views"
        views={[
          {
            id: "input",
            label: "Input",
            content: (
              <ToolPanel title="Input" description="Paste a JSON document to format or validate.">
                <div class="space-y-3">
                  <Textarea
                    id="json-input"
                    name="json-input"
                    label="JSON document"
                    value={input()}
                    onInput={(value) => setInput(value)}
                    placeholder="Paste JSON here…"
                    rows={12}
                    class="min-h-[15rem] md:min-h-[22rem]"
                    spellcheck={false}
                    autocomplete="off"
                    describedBy={result().error ? "json-input-error" : undefined}
                    error={!!result().error}
                  />

                  <Show when={result().error}>
                    {(msg) => (
                      <ToolInlineError
                        id="json-input-error"
                        message="JSON could not be parsed."
                        hint={
                          result().errorLine && result().errorColumn
                            ? `Check the value near line ${result().errorLine}, column ${result().errorColumn}.`
                            : "Check commas, quotes, and brackets, then try again."
                        }
                      >
                        <details class="text-xs text-[var(--text-secondary)]">
                          <summary class="cursor-pointer font-semibold text-[var(--text-primary)] underline decoration-[var(--border-strong)] underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]">
                            Show error details
                          </summary>
                          <div class="mt-2 space-y-2">
                            <p class="m-0 font-mono leading-relaxed text-[var(--text-secondary)]">
                              {msg()}
                            </p>

                            <Show when={result().errorContext}>
                              {(context) => (
                                <pre class="m-0 max-h-40 overflow-auto rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg-primary)] p-3 font-mono leading-relaxed whitespace-pre-wrap break-words text-[var(--text-primary)]">
                                  {context()}
                                </pre>
                              )}
                            </Show>
                          </div>
                        </details>
                      </ToolInlineError>
                    )}
                  </Show>
                </div>
              </ToolPanel>
            ),
          },
          {
            id: "output",
            label: "Output",
            content: (
              <ToolPanel
                title={
                  minify()
                    ? `Minified${sortKeys() ? " · sorted" : ""}`
                    : `Formatted${sortKeys() ? " · sorted" : ` · ${indent()} spaces`}`
                }
                description="The result stays in your browser."
                actions={
                  <Show when={result().raw}>
                    <CopyButton text={result().raw} label="Copy JSON" />
                  </Show>
                }
              >
                <Show
                  when={result().html}
                  fallback={
                    <div class="flex min-h-[16rem] items-center justify-center rounded-[var(--radius-control)] border border-dashed border-[var(--border)] bg-[var(--bg-primary)] p-6 text-center text-sm leading-relaxed text-[var(--text-muted)] md:min-h-[22rem]">
                      Formatted JSON will appear here.
                    </div>
                  }
                >
                  {(html) => (
                    <ToolCodeBlock
                      html={html()}
                      aria-label="Formatted JSON output"
                      class="text-[0.8125rem]"
                    />
                  )}
                </Show>
              </ToolPanel>
            ),
          },
        ]}
      />
    </ToolContainer>
  );
}
