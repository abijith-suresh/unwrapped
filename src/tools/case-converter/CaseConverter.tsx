import { createMemo, createSignal, For, Show } from "solid-js";

import CopyButton from "@/components/CopyButton";
import ToolStatusMessage from "@/components/ToolStatusMessage";
import { convertCaseVariants } from "@/lib/caseConverter";

const VARIANT_LABELS = [
  ["lowercase", "lowercase"],
  ["uppercase", "UPPERCASE"],
  ["camelCase", "camelCase"],
  ["pascalCase", "PascalCase"],
  ["snakeCase", "snake_case"],
  ["kebabCase", "kebab-case"],
  ["constantCase", "CONSTANT_CASE"],
  ["dotCase", "dot.case"],
  ["pathCase", "path/case"],
  ["sentenceCase", "Sentence case"],
  ["headerCase", "Header-Case"],
] as const satisfies ReadonlyArray<readonly [keyof ReturnType<typeof convertCaseVariants>, string]>;

export default function CaseConverter() {
  const [input, setInput] = createSignal("");
  const variants = createMemo(() => convertCaseVariants(input()));
  const hasInput = createMemo(() => input().trim().length > 0);

  return (
    <div class="tool-container">
      <div style={{ display: "flex", "flex-direction": "column", gap: "0.375rem" }}>
        <label class="tool-label">Source text</label>
        <textarea
          value={input()}
          onInput={(event) => setInput(event.currentTarget.value)}
          placeholder="Paste text, identifiers, or titles to fan out into multiple case styles…"
          rows={6}
          spellcheck={false}
          class="tool-textarea"
        />
      </div>

      <Show
        when={hasInput()}
        fallback={
          <ToolStatusMessage tone="muted">
            Enter text once to generate copyable case variants locally.
          </ToolStatusMessage>
        }
      >
        <div
          style={{
            display: "grid",
            gap: "0.75rem",
            "grid-template-columns": "repeat(auto-fit, minmax(240px, 1fr))",
          }}
        >
          <For each={VARIANT_LABELS}>
            {([key, label]) => (
              <section
                style={{
                  display: "flex",
                  "flex-direction": "column",
                  gap: "0.5rem",
                  padding: "0.875rem",
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border)",
                  "border-radius": "0.5rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    "align-items": "center",
                    "justify-content": "space-between",
                    gap: "0.75rem",
                  }}
                >
                  <span class="tool-label">{label}</span>
                  <CopyButton text={variants()[key]} label={`Copy ${label}`} />
                </div>
                <code
                  style={{
                    margin: "0",
                    color: "var(--text-primary)",
                    "font-size": "0.875rem",
                    "line-height": "1.7",
                    "font-family": "var(--font-mono)",
                    "white-space": "pre-wrap",
                    "word-break": "break-word",
                  }}
                >
                  {variants()[key] || "—"}
                </code>
              </section>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}
