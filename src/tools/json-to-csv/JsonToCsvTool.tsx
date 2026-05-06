import { createMemo, createSignal, Show } from "solid-js";

import CopyButton from "@/components/CopyButton";
import ToolStatusMessage from "@/components/ToolStatusMessage";
import { convertJsonToCsv } from "@/lib/jsonToCsv";

export default function JsonToCsvTool() {
  const [input, setInput] = createSignal('[{"name":"Alice","active":true},{"name":"Bob"}]');
  const result = createMemo(() => convertJsonToCsv(input()));
  const output = createMemo(() => {
    const current = result();
    return current.ok ? current.output : "";
  });
  const error = createMemo(() => {
    const current = result();
    return current.ok ? "" : current.error;
  });

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
        display: "grid",
        gap: "1.25rem",
        padding: "1.5rem",
        "max-width": "1100px",
        margin: "0 auto",
        width: "100%",
        "grid-template-columns": "repeat(auto-fit, minmax(320px, 1fr))",
      }}
    >
      <section style={{ display: "flex", "flex-direction": "column", gap: "0.375rem" }}>
        <label style={labelStyle}>JSON array input</label>
        <textarea
          value={input()}
          onInput={(event) => setInput(event.currentTarget.value)}
          placeholder="Paste an array of JSON objects to convert…"
          rows={14}
          spellcheck={false}
          style={{
            width: "100%",
            padding: "0.875rem 1rem",
            "border-radius": "0.5rem",
            border: `1px solid ${error() ? "var(--accent-error)" : "var(--border)"}`,
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
      </section>

      <section
        style={{
          display: "flex",
          "flex-direction": "column",
          gap: "0.75rem",
          padding: "1rem",
          background: "var(--bg-secondary)",
          border: "1px solid var(--border)",
          "border-radius": "0.75rem",
        }}
      >
        <div
          style={{ display: "flex", "align-items": "center", "justify-content": "space-between" }}
        >
          <span style={labelStyle}>CSV output</span>
          <CopyButton text={output()} label="Copy CSV" />
        </div>

        <Show
          when={!error()}
          fallback={<ToolStatusMessage tone="error">{error()}</ToolStatusMessage>}
        >
          <pre
            style={{
              margin: "0",
              padding: "1rem",
              "border-radius": "0.5rem",
              border: "1px solid var(--border)",
              background: "var(--bg-primary)",
              color: "var(--text-primary)",
              "font-family": "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              "font-size": "0.875rem",
              "line-height": "1.7",
              "white-space": "pre-wrap",
              "word-break": "break-word",
              "min-height": "20rem",
            }}
          >
            {output() || "—"}
          </pre>
        </Show>
      </section>
    </div>
  );
}
