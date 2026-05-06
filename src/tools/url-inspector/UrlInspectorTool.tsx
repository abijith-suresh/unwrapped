import { createMemo, createSignal, For, Show } from "solid-js";

import CopyButton from "@/components/CopyButton";
import ToolStatusMessage from "@/components/ToolStatusMessage";
import { inspectUrl } from "@/lib/urlInspector";

const SECTION_LABELS = [
  ["normalized", "Normalized"],
  ["protocol", "Protocol"],
  ["hostname", "Hostname"],
  ["port", "Port"],
  ["path", "Path"],
  ["hash", "Hash"],
  ["username", "Username"],
  ["password", "Password"],
] as const;

export default function UrlInspectorTool() {
  const [input, setInput] = createSignal(
    "https://user:pass@example.com:8443/path/name?foo=1&foo=2&bar=hello%20world#frag"
  );
  const result = createMemo(() => inspectUrl(input()));

  const inspection = createMemo(() => {
    const current = result();
    return current.ok ? current.inspection : null;
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
        display: "flex",
        "flex-direction": "column",
        gap: "1.25rem",
        padding: "1.5rem",
        "max-width": "1100px",
        margin: "0 auto",
        width: "100%",
      }}
    >
      <div style={{ display: "flex", "flex-direction": "column", gap: "0.375rem" }}>
        <label style={labelStyle}>URL or raw query string</label>
        <textarea
          value={input()}
          onInput={(event) => setInput(event.currentTarget.value)}
          rows={5}
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
      </div>

      <Show
        when={!error()}
        fallback={<ToolStatusMessage tone="error">{error()}</ToolStatusMessage>}
      >
        <div
          style={{
            display: "grid",
            gap: "0.75rem",
            "grid-template-columns": "repeat(auto-fit, minmax(220px, 1fr))",
          }}
        >
          <For each={SECTION_LABELS}>
            {([key, label]) => {
              const value = () => {
                const current = inspection();
                if (!current) return "";
                return key === "normalized" ? current.normalized : current[key];
              };

              return (
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
                    style={{ display: "flex", "justify-content": "space-between", gap: "0.75rem" }}
                  >
                    <span style={labelStyle}>{label}</span>
                    <CopyButton text={value()} label={`Copy ${label}`} />
                  </div>
                  <code
                    style={{
                      color: "var(--text-primary)",
                      "font-size": "0.875rem",
                      "line-height": "1.6",
                      "word-break": "break-all",
                    }}
                  >
                    {value() || "—"}
                  </code>
                </section>
              );
            }}
          </For>
        </div>

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
          <div style={{ display: "flex", "justify-content": "space-between", gap: "0.75rem" }}>
            <span style={labelStyle}>Decoded query params</span>
            <Show when={inspection()?.normalized}>
              <ToolStatusMessage tone="muted" style={{ padding: "0.375rem 0.625rem" }}>
                {inspection()?.kind === "query" ? "raw query" : "full url"}
              </ToolStatusMessage>
            </Show>
          </div>

          <div style={{ overflow: "auto" }}>
            <table style={{ width: "100%", "border-collapse": "collapse" }}>
              <thead>
                <tr>
                  <th style={{ padding: "0.5rem 0.75rem", "text-align": "left", ...labelStyle }}>
                    #
                  </th>
                  <th style={{ padding: "0.5rem 0.75rem", "text-align": "left", ...labelStyle }}>
                    Key
                  </th>
                  <th style={{ padding: "0.5rem 0.75rem", "text-align": "left", ...labelStyle }}>
                    Value
                  </th>
                </tr>
              </thead>
              <tbody>
                <For each={inspection()?.queryParams ?? []}>
                  {(param, index) => (
                    <tr>
                      <td style={{ padding: "0.5rem 0.75rem", color: "var(--text-muted)" }}>
                        {index() + 1}
                      </td>
                      <td style={{ padding: "0.5rem 0.75rem", color: "var(--text-primary)" }}>
                        <code>{param.key || "—"}</code>
                      </td>
                      <td style={{ padding: "0.5rem 0.75rem", color: "var(--text-primary)" }}>
                        <code>{param.value || "—"}</code>
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>

          <Show when={(inspection()?.queryParams.length ?? 0) === 0}>
            <ToolStatusMessage tone="muted">No query params found.</ToolStatusMessage>
          </Show>
        </section>
      </Show>
    </div>
  );
}
