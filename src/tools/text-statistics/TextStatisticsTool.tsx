import { createMemo, createSignal, For } from "solid-js";

import ToolStatusMessage from "@/components/ToolStatusMessage";
import { analyzeText } from "@/lib/textStatistics";

const METRIC_LABELS = [
  ["characters", "Characters"],
  ["words", "Words"],
  ["lines", "Lines"],
  ["bytes", "Bytes"],
] as const satisfies ReadonlyArray<readonly [keyof ReturnType<typeof analyzeText>, string]>;

export default function TextStatisticsTool() {
  const [input, setInput] = createSignal("");
  const statistics = createMemo(() => analyzeText(input()));

  return (
    <div class="tool-container">
      <div style={{ display: "flex", "flex-direction": "column", gap: "0.375rem" }}>
        <label class="tool-label">Text input</label>
        <textarea
          value={input()}
          onInput={(event) => setInput(event.currentTarget.value)}
          placeholder="Type or paste text to inspect its raw size and structure locally…"
          rows={10}
          spellcheck={false}
          class="tool-textarea"
        />
      </div>

      <div
        style={{
          display: "grid",
          gap: "0.75rem",
          "grid-template-columns": "repeat(auto-fit, minmax(180px, 1fr))",
        }}
      >
        <For each={METRIC_LABELS}>
          {([key, label]) => (
            <section
              style={{
                display: "flex",
                "flex-direction": "column",
                gap: "0.375rem",
                padding: "0.875rem",
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                "border-radius": "0.5rem",
              }}
            >
              <span class="tool-label">{label}</span>
              <strong
                style={{
                  color: "var(--text-primary)",
                  "font-size": "1.625rem",
                  "line-height": "1.2",
                }}
              >
                {statistics()[key].toLocaleString()}
              </strong>
            </section>
          )}
        </For>
      </div>

      <ToolStatusMessage tone="muted">
        Counts update locally as you type. Byte size is measured from the encoded UTF-8 text.
      </ToolStatusMessage>
    </div>
  );
}
