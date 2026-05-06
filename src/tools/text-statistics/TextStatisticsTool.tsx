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

  const labelStyle = {
    "font-size": "0.75rem",
    "font-weight": "600" as const,
    "letter-spacing": "0.05em",
    "text-transform": "uppercase" as const,
    color: "var(--text-secondary)",
  };

  return (
    <div
      style={{
        display: "flex",
        "flex-direction": "column",
        gap: "1.25rem",
        padding: "1.5rem",
        "max-width": "900px",
        margin: "0 auto",
        width: "100%",
      }}
    >
      <div style={{ display: "flex", "flex-direction": "column", gap: "0.375rem" }}>
        <label style={labelStyle}>Text input</label>
        <textarea
          value={input()}
          onInput={(event) => setInput(event.currentTarget.value)}
          placeholder="Type or paste text to inspect its raw size and structure locally…"
          rows={10}
          spellcheck={false}
          style={{
            width: "100%",
            padding: "0.875rem 1rem",
            "border-radius": "0.5rem",
            border: "1px solid var(--border)",
            background: "var(--bg-secondary)",
            color: "var(--text-primary)",
            "font-family": "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            "font-size": "0.875rem",
            "line-height": "1.6",
            resize: "vertical",
            outline: "none",
            "box-sizing": "border-box",
          }}
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
              <span style={labelStyle}>{label}</span>
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
