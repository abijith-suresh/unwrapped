import { createMemo, createSignal, Show } from "solid-js";

import CopyButton from "@/components/CopyButton";
import ToolActionButton from "@/components/ToolActionButton";
import ToolStatusMessage from "@/components/ToolStatusMessage";
import {
  DEFAULT_TOKEN_OPTIONS,
  generateToken,
  MAX_TOKEN_LENGTH,
  MIN_TOKEN_LENGTH,
  type TokenGeneratorOptions,
} from "@/lib/tokenGenerator";

function createInitialState() {
  const result = generateToken(DEFAULT_TOKEN_OPTIONS);
  return {
    token: result.ok ? result.token : "",
    error: result.ok ? "" : result.error,
  };
}

export default function TokenGenerator() {
  const initial = createInitialState();
  const [options, setOptions] = createSignal<TokenGeneratorOptions>(DEFAULT_TOKEN_OPTIONS);
  const [token, setToken] = createSignal(initial.token);
  const [error, setError] = createSignal(initial.error);

  const labelStyle = {
    "font-size": "0.75rem",
    "font-weight": "600" as const,
    "letter-spacing": "0.05em",
    "text-transform": "uppercase" as const,
    color: "var(--text-secondary)",
  };

  const activeGroups = createMemo(() => {
    const current = options();
    return [
      current.uppercase && "uppercase",
      current.lowercase && "lowercase",
      current.digits && "digits",
      current.symbols && "symbols",
    ].filter(Boolean);
  });

  function regenerate(nextOptions: TokenGeneratorOptions = options()) {
    const result = generateToken(nextOptions);
    if (result.ok) {
      setToken(result.token);
      setError("");
      return;
    }

    setToken("");
    setError(result.error);
  }

  function updateOption<K extends keyof TokenGeneratorOptions>(
    key: K,
    value: TokenGeneratorOptions[K]
  ) {
    setOptions((current) => {
      const next = { ...current, [key]: value };
      regenerate(next);
      return next;
    });
  }

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
      <div style={{ display: "grid", gap: "1rem", "grid-template-columns": "2fr 1fr" }}>
        <div
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
          <div style={{ display: "flex", "justify-content": "space-between", gap: "0.75rem" }}>
            <span style={labelStyle}>Generated token</span>
            <CopyButton text={token()} label="Copy token" />
          </div>
          <code
            style={{
              color: "var(--text-primary)",
              "font-size": "1rem",
              "line-height": "1.7",
              "font-family": "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              "word-break": "break-all",
              "min-height": "4.5rem",
            }}
          >
            {token() || "—"}
          </code>
        </div>

        <div
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
          <span style={labelStyle}>Options</span>
          <label style={{ color: "var(--text-secondary)", "font-size": "0.875rem" }}>Length</label>
          <input
            type="number"
            min={MIN_TOKEN_LENGTH}
            max={MAX_TOKEN_LENGTH}
            value={options().length}
            onInput={(event) => updateOption("length", Number(event.currentTarget.value) || 0)}
            style={{
              width: "100%",
              padding: "0.625rem 0.75rem",
              border: "1px solid var(--border)",
              "border-radius": "0.5rem",
              background: "var(--bg-primary)",
              color: "var(--text-primary)",
            }}
          />
          <ToolActionButton onClick={() => regenerate()} variant="primary">
            Regenerate
          </ToolActionButton>
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", "flex-wrap": "wrap" }}>
        <ToolActionButton
          active={options().uppercase}
          onClick={() => updateOption("uppercase", !options().uppercase)}
        >
          Uppercase
        </ToolActionButton>
        <ToolActionButton
          active={options().lowercase}
          onClick={() => updateOption("lowercase", !options().lowercase)}
        >
          Lowercase
        </ToolActionButton>
        <ToolActionButton
          active={options().digits}
          onClick={() => updateOption("digits", !options().digits)}
        >
          Digits
        </ToolActionButton>
        <ToolActionButton
          active={options().symbols}
          onClick={() => updateOption("symbols", !options().symbols)}
        >
          Symbols
        </ToolActionButton>
      </div>

      <Show when={error()}>
        {(message) => <ToolStatusMessage tone="error">{message()}</ToolStatusMessage>}
      </Show>

      <ToolStatusMessage tone="muted">
        Uses <code>crypto.getRandomValues()</code> locally with {activeGroups().length || "no"}{" "}
        character set{activeGroups().length === 1 ? "" : "s"} enabled.
      </ToolStatusMessage>
    </div>
  );
}
