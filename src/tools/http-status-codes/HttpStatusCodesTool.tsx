import { createMemo, createSignal, For } from "solid-js";

import CopyButton from "@/components/CopyButton";
import ToolStatusMessage from "@/components/ToolStatusMessage";
import { searchHttpStatusCodes } from "@/lib/httpStatusCodes";

export default function HttpStatusCodesTool() {
  const [query, setQuery] = createSignal("");
  const results = createMemo(() => searchHttpStatusCodes(query()));

  return (
    <div class="tool-container" style={{ "--tool-max-width": "960px", "--tool-gap": "1rem" }}>
      <div style={{ display: "flex", "flex-direction": "column", gap: "0.375rem" }}>
        <label class="tool-label">Search by code or name</label>
        <input
          type="search"
          value={query()}
          onInput={(event) => setQuery(event.currentTarget.value)}
          placeholder="Try 404, unprocessable, or redirect…"
          spellcheck={false}
          class="tool-input"
          style={{ "font-size": "0.9375rem" }}
        />
      </div>

      <ToolStatusMessage tone="muted">
        {results().length.toLocaleString()} status code{results().length === 1 ? "" : "s"} shown
        from a bundled local reference.
      </ToolStatusMessage>

      <div style={{ display: "flex", "flex-direction": "column", gap: "0.75rem" }}>
        <For each={results()}>
          {(entry) => (
            <section
              style={{
                display: "flex",
                "flex-direction": "column",
                gap: "0.5rem",
                padding: "1rem",
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                "border-radius": "0.75rem",
              }}
            >
              <div style={{ display: "flex", "justify-content": "space-between", gap: "1rem" }}>
                <div style={{ display: "flex", "flex-direction": "column", gap: "0.25rem" }}>
                  <div style={{ display: "flex", gap: "0.625rem", "align-items": "baseline" }}>
                    <strong style={{ color: "var(--text-primary)", "font-size": "1.375rem" }}>
                      {entry.code}
                    </strong>
                    <span style={{ color: "var(--text-primary)", "font-size": "1rem" }}>
                      {entry.name}
                    </span>
                  </div>
                  <span class="tool-label">{entry.category}</span>
                </div>
                <CopyButton text={`${entry.code} ${entry.name}`} label="Copy entry" />
              </div>
              <p style={{ margin: 0, color: "var(--text-secondary)", "line-height": 1.6 }}>
                {entry.description}
              </p>
            </section>
          )}
        </For>
      </div>
    </div>
  );
}
