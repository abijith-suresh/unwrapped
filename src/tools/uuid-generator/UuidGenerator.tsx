import { createSignal, For, Show } from "solid-js";

import CopyButton from "@/components/CopyButton";
import ToolActionButton from "@/components/ToolActionButton";
import ToolStatusMessage from "@/components/ToolStatusMessage";
import { copyToClipboard } from "@/lib/clipboard";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateUuid(): string {
  return crypto.randomUUID();
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function UuidGenerator() {
  const [uuids, setUuids] = createSignal<string[]>([generateUuid()]);
  const [count, setCount] = createSignal(1);
  const [uppercase, setUppercase] = createSignal(false);
  const [copyStatus, setCopyStatus] = createSignal<"idle" | "success" | "error">("idle");

  function display(uuid: string): string {
    return uppercase() ? uuid.toUpperCase() : uuid;
  }

  function generate() {
    const n = Math.max(1, Math.min(count(), 100));
    setUuids(Array.from({ length: n }, generateUuid));
  }

  async function copyAll() {
    const text = uuids().map(display).join("\n");
    const ok = await copyToClipboard(text);
    setCopyStatus(ok ? "success" : "error");
  }

  function reset() {
    setCount(1);
    setUppercase(false);
    setCopyStatus("idle");
    setUuids([generateUuid()]);
  }

  return (
    <div class="tool-container" style={{ "--tool-max-width": "860px" }}>
      {/* ------------------------------------------------------------------ */}
      {/* Controls                                                            */}
      {/* ------------------------------------------------------------------ */}
      <div
        style={{
          display: "flex",
          "align-items": "center",
          "flex-wrap": "wrap",
          gap: "0.75rem",
        }}
      >
        {/* Count input */}
        <div
          style={{
            display: "flex",
            "align-items": "center",
            gap: "0.5rem",
          }}
        >
          <label
            style={{
              "font-size": "0.8125rem",
              color: "var(--text-secondary)",
              "font-weight": "600",
            }}
          >
            Count
          </label>
          <input
            type="number"
            min={1}
            max={100}
            value={count()}
            onInput={(e) => setCount(parseInt(e.currentTarget.value, 10) || 1)}
            style={{
              width: "5rem",
              padding: "0.25rem 0.5rem",
              "border-radius": "0.375rem",
              border: "1px solid var(--border)",
              background: "var(--bg-secondary)",
              color: "var(--text-primary)",
              "font-size": "0.8125rem",
              outline: "none",
            }}
          />
        </div>

        <ToolActionButton onClick={generate} variant="primary">
          Generate
        </ToolActionButton>

        {/* Uppercase toggle */}
        <ToolActionButton active={uppercase()} onClick={() => setUppercase((v) => !v)}>
          UPPER
        </ToolActionButton>

        {/* Copy all */}
        <Show when={uuids().length > 1}>
          <ToolActionButton onClick={() => void copyAll()}>Copy all</ToolActionButton>
        </Show>

        <ToolActionButton onClick={reset} variant="ghost">
          Reset
        </ToolActionButton>
      </div>

      <Show when={copyStatus() === "success"}>
        <ToolStatusMessage tone="success">Copied all generated UUIDs.</ToolStatusMessage>
      </Show>

      <Show when={copyStatus() === "error"}>
        <ToolStatusMessage tone="error">Could not copy the generated UUIDs.</ToolStatusMessage>
      </Show>

      {/* ------------------------------------------------------------------ */}
      {/* UUID list                                                           */}
      {/* ------------------------------------------------------------------ */}
      <div
        style={{
          display: "flex",
          "flex-direction": "column",
          gap: "0.375rem",
        }}
      >
        <For each={uuids()}>
          {(uuid) => (
            <div
              style={{
                display: "flex",
                "align-items": "center",
                "justify-content": "space-between",
                padding: "0.625rem 1rem",
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                "border-radius": "0.375rem",
                gap: "1rem",
              }}
            >
              <code
                style={{
                  "font-size": "0.875rem",
                  color: "var(--text-primary)",
                  "font-family": "var(--font-mono)",
                  "letter-spacing": "0.02em",
                  flex: "1",
                  "word-break": "break-all",
                }}
              >
                {display(uuid)}
              </code>
              <CopyButton text={display(uuid)} />
            </div>
          )}
        </For>
      </div>

      <ToolStatusMessage tone="muted">
        UUID v4 generated via <code>crypto.randomUUID()</code> · max 100 at once
      </ToolStatusMessage>
    </div>
  );
}
