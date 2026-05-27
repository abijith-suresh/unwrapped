import { createSignal, For, Show } from "solid-js";

import CopyButton from "@/components/CopyButton";
import ToolActionButton from "@/components/ToolActionButton";
import ToolStatusMessage from "@/components/ToolStatusMessage";
import { generateHmac, HMAC_ALGORITHMS, type HmacAlgorithm } from "@/lib/hmac";

export default function HmacGeneratorTool() {
  const [message, setMessage] = createSignal("");
  const [secret, setSecret] = createSignal("");
  const [algorithm, setAlgorithm] = createSignal<HmacAlgorithm>("SHA-256");
  const [output, setOutput] = createSignal("");
  const [error, setError] = createSignal("");
  const [pending, setPending] = createSignal(false);

  async function handleGenerate() {
    setPending(true);
    const result = await generateHmac({
      message: message(),
      secret: secret(),
      algorithm: algorithm(),
    });
    setPending(false);

    if (result.ok) {
      setOutput(result.output);
      setError("");
      return;
    }

    setOutput("");
    setError(result.error);
  }

  return (
    <div class="tool-container">
      <div
        style={{
          display: "grid",
          gap: "1rem",
          "grid-template-columns": "repeat(auto-fit, minmax(260px, 1fr))",
        }}
      >
        <div style={{ display: "flex", "flex-direction": "column", gap: "0.375rem" }}>
          <label class="tool-label">Message</label>
          <textarea
            value={message()}
            onInput={(event) => setMessage(event.currentTarget.value)}
            rows={6}
            spellcheck={false}
            class="tool-textarea"
          />
        </div>

        <div style={{ display: "flex", "flex-direction": "column", gap: "0.375rem" }}>
          <label class="tool-label">Secret</label>
          <textarea
            value={secret()}
            onInput={(event) => setSecret(event.currentTarget.value)}
            rows={6}
            spellcheck={false}
            class="tool-textarea"
          />
        </div>
      </div>

      <div
        style={{ display: "flex", gap: "0.75rem", "flex-wrap": "wrap", "align-items": "center" }}
      >
        <label class="tool-label">Algorithm</label>
        <select
          value={algorithm()}
          onChange={(event) => setAlgorithm(event.currentTarget.value as HmacAlgorithm)}
          style={{
            padding: "0.5rem 0.75rem",
            "border-radius": "0.5rem",
            border: "1px solid var(--border)",
            background: "var(--bg-secondary)",
            color: "var(--text-primary)",
          }}
        >
          <For each={HMAC_ALGORITHMS}>
            {(item) => <option value={item.id}>{item.label}</option>}
          </For>
        </select>
        <ToolActionButton
          onClick={() => void handleGenerate()}
          variant="primary"
          disabled={pending()}
        >
          {pending() ? "Generating…" : "Generate HMAC"}
        </ToolActionButton>
      </div>

      <Show when={error()}>
        {(message) => <ToolStatusMessage tone="error">{message()}</ToolStatusMessage>}
      </Show>

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
          <span class="tool-label">Hex output</span>
          <CopyButton text={output()} label="Copy HMAC" />
        </div>
        <code
          style={{
            color: "var(--text-primary)",
            "font-size": "0.95rem",
            "line-height": "1.7",
            "font-family": "var(--font-mono)",
            "word-break": "break-all",
            "min-height": "3rem",
          }}
        >
          {output() || "—"}
        </code>
      </section>

      <ToolStatusMessage tone="muted">
        Secrets remain in memory only and are processed with the browser&apos;s Web Crypto API.
      </ToolStatusMessage>
    </div>
  );
}
