import { createMemo, createSignal, Show } from "solid-js";

import CopyButton from "@/components/CopyButton";
import Textarea from "@/components/primitives/solid/Textarea";
import ToolActionButton from "@/components/ToolActionButton";
import ToolCodeBlock from "@/components/tool/ToolCodeBlock";
import ToolContainer from "@/components/tool/ToolContainer";
import ToolPanel from "@/components/tool/ToolPanel";
import ToolSplitPane from "@/components/tool/ToolSplitPane";
import ToolToolbar from "@/components/tool/ToolToolbar";
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
      <ToolToolbar label="Formatting options">
        <div class="flex flex-wrap items-center gap-1">
          <span class="px-2 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
            Indent
          </span>
          <ToolActionButton
            active={indent() === 2 && !minify()}
            variant={indent() === 2 && !minify() ? "primary" : "ghost"}
            onClick={() => {
              setIndent(2);
              setMinify(false);
            }}
          >
            2 spaces
          </ToolActionButton>
          <ToolActionButton
            active={indent() === 4 && !minify()}
            variant={indent() === 4 && !minify() ? "primary" : "ghost"}
            onClick={() => {
              setIndent(4);
              setMinify(false);
            }}
          >
            4 spaces
          </ToolActionButton>
        </div>

        <ToolActionButton
          active={minify()}
          variant="secondary"
          onClick={() => setMinify((value) => !value)}
        >
          Minify
        </ToolActionButton>

        <ToolActionButton
          active={sortKeys()}
          variant="secondary"
          onClick={() => setSortKeys((value) => !value)}
        >
          Sort keys
        </ToolActionButton>

        <Show when={input().trim()}>
          <div class="ml-auto">
            <ToolActionButton variant="ghost" onClick={() => setInput("")}>
              Clear
            </ToolActionButton>
          </div>
        </Show>
      </ToolToolbar>

      <Show when={result().error}>
        {(msg) => (
          <ToolPanel
            id="json-input-error"
            title="Input error"
            tone="error"
            role="alert"
            aria-live="polite"
            bodyClass="space-y-3"
          >
            <p class="m-0 font-mono text-sm leading-relaxed text-[var(--accent-error)]">{msg()}</p>

            <Show when={result().errorLine && result().errorColumn}>
              <p class="m-0 text-xs text-[var(--text-secondary)]">
                Line {result().errorLine}, column {result().errorColumn}
              </p>
            </Show>

            <Show when={result().errorContext}>
              {(context) => (
                <pre class="m-0 max-h-48 overflow-auto rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg-primary)] p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap break-words text-[var(--text-primary)]">
                  {context()}
                </pre>
              )}
            </Show>
          </ToolPanel>
        )}
      </Show>

      <ToolSplitPane>
        <ToolPanel title="Input" description="Paste a JSON document to format or validate.">
          <Textarea
            id="json-input"
            name="json-input"
            label="JSON document"
            value={input()}
            onInput={(value) => setInput(value)}
            placeholder="Paste JSON here…"
            rows={16}
            spellcheck={false}
            autocomplete="off"
            describedBy={result().error ? "json-input-error" : undefined}
            error={!!result().error}
          />
        </ToolPanel>

        <ToolPanel
          title={
            minify()
              ? `Minified${sortKeys() ? " · sorted" : ""}`
              : `Formatted${sortKeys() ? " · sorted" : ` · ${indent()} spaces`}`
          }
          description="The result stays in your browser."
          bodyClass="p-3 sm:p-4"
          actions={
            <Show when={result().raw}>
              <CopyButton text={result().raw} label="Copy JSON" />
            </Show>
          }
        >
          <Show
            when={result().html}
            fallback={
              <div class="flex min-h-[22rem] items-center justify-center rounded-[var(--radius-control)] border border-dashed border-[var(--border)] bg-[var(--bg-primary)] p-6 text-center text-sm leading-relaxed text-[var(--text-muted)]">
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
      </ToolSplitPane>
    </ToolContainer>
  );
}
