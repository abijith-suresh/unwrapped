import { createMemo, createSignal, Show } from "solid-js";

import CopyButton from "@/components/CopyButton";
import ToolStatusMessage from "@/components/ToolStatusMessage";
import { formatXml } from "@/lib/xmlFormatter";

export default function XmlFormatterTool() {
  const [input, setInput] = createSignal('<root><item id="1">value</item></root>');
  const [indent, setIndent] = createSignal(2);
  const result = createMemo(() => formatXml(input(), { indent: indent() }));
  const output = createMemo(() => {
    const current = result();
    return current.ok ? current.output : "";
  });
  const error = createMemo(() => {
    const current = result();
    return current.ok ? "" : current.error;
  });

  return (
    <div
      class="tool-container"
      style={{
        "--tool-max-width": "1100px",
        display: "grid",
        "grid-template-columns": "repeat(auto-fit, minmax(320px, 1fr))",
      }}
    >
      <section style={{ display: "flex", "flex-direction": "column", gap: "0.75rem" }}>
        <div
          style={{ display: "flex", "align-items": "center", gap: "0.75rem", "flex-wrap": "wrap" }}
        >
          <label class="tool-label">Indent</label>
          <input
            type="number"
            min={2}
            max={8}
            value={indent()}
            onInput={(event) => setIndent(Number(event.currentTarget.value) || 2)}
            style={{
              width: "5rem",
              padding: "0.5rem 0.75rem",
              "border-radius": "0.5rem",
              border: "1px solid var(--border)",
              background: "var(--bg-secondary)",
              color: "var(--text-primary)",
            }}
          />
        </div>

        <textarea
          value={input()}
          onInput={(event) => setInput(event.currentTarget.value)}
          placeholder="Paste XML to format…"
          rows={14}
          spellcheck={false}
          class="tool-textarea"
          style={{
            border: `1px solid ${error() ? "var(--accent-error)" : "var(--border)"}`,
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
          <span class="tool-label">Formatted XML</span>
          <CopyButton text={output()} label="Copy XML" />
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
              "font-family": "var(--font-mono)",
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
