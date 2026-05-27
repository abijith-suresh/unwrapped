import { createMemo, createSignal, For, Show } from "solid-js";

import CopyButton from "@/components/CopyButton";
import ToolActionButton from "@/components/ToolActionButton";
import ToolStatusMessage from "@/components/ToolStatusMessage";
import {
  DEFAULT_ZONES,
  formatInZone,
  getDerivedTimestampFormats,
  localInputToMs,
  msToLocalInput,
  parseEpoch,
  PRESET_ZONES,
  type TimeZoneOption,
} from "@/lib/timestamp";

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function TimestampTool() {
  const [epochInput, setEpochInput] = createSignal("");
  const [datetimeInput, setDatetimeInput] = createSignal("");
  const [zones, setZones] = createSignal<TimeZoneOption[]>(DEFAULT_ZONES);

  const parsed = createMemo((): { ms: number; unit: "s" | "ms" } | null => {
    // Prefer epoch input; fall back to datetime-local
    const raw = epochInput().trim();
    if (raw) return parseEpoch(raw);
    const dtMs = localInputToMs(datetimeInput());
    if (dtMs !== null) return { ms: dtMs, unit: "ms" };
    return null;
  });

  const date = createMemo((): Date | null => {
    const p = parsed();
    if (!p) return null;
    const d = new Date(p.ms);
    return Number.isNaN(d.getTime()) ? null : d;
  });

  function useNow() {
    const now = Date.now();
    setEpochInput(String(Math.floor(now / 1000)));
    setDatetimeInput(msToLocalInput(now));
  }

  function reset() {
    setEpochInput("");
    setDatetimeInput("");
    setZones(DEFAULT_ZONES);
  }

  function handleEpochInput(value: string) {
    setEpochInput(value);
    const p = parseEpoch(value);
    if (p) {
      setDatetimeInput(msToLocalInput(p.ms));
    }
  }

  function handleDatetimeInput(value: string) {
    setDatetimeInput(value);
    const ms = localInputToMs(value);
    if (ms !== null) {
      setEpochInput(String(Math.floor(ms / 1000)));
    }
  }

  function changeZone(index: number, tz: string) {
    setZones((prev) => prev.map((z, i) => (i === index ? { ...z, tz } : z)));
  }

  const inputStyle = {
    padding: "0.625rem 0.875rem",
    "border-radius": "0.375rem",
    border: "1px solid var(--border)",
    background: "var(--bg-secondary)",
    color: "var(--text-primary)",
    "font-family": "var(--font-mono)",
    "font-size": "0.875rem",
    outline: "none",
    "box-sizing": "border-box" as const,
  };

  return (
    <div class="tool-container" style={{ "--tool-max-width": "760px", "--tool-gap": "1.5rem" }}>
      {/* ------------------------------------------------------------------ */}
      {/* Input row                                                           */}
      {/* ------------------------------------------------------------------ */}
      <div
        style={{
          display: "grid",
          "grid-template-columns": "1fr auto 1fr",
          gap: "1rem",
          "align-items": "end",
        }}
      >
        {/* Epoch input */}
        <div style={{ display: "flex", "flex-direction": "column", gap: "0.375rem" }}>
          <label class="tool-label">Unix timestamp</label>
          <input
            type="text"
            inputmode="numeric"
            value={epochInput()}
            onInput={(e) => handleEpochInput(e.currentTarget.value)}
            placeholder="e.g. 1700000000"
            style={{ ...inputStyle, width: "100%" }}
          />
          <Show when={parsed()}>
            {(p) => (
              <span style={{ "font-size": "0.75rem", color: "var(--text-muted)" }}>
                Detected: {p().unit === "s" ? "seconds" : "milliseconds"}
              </span>
            )}
          </Show>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", "align-items": "center" }}>
          <ToolActionButton onClick={useNow} variant="primary">
            Use now
          </ToolActionButton>
          <ToolActionButton onClick={reset} variant="ghost">
            Reset
          </ToolActionButton>
        </div>

        {/* Datetime-local input */}
        <div style={{ display: "flex", "flex-direction": "column", gap: "0.375rem" }}>
          <label class="tool-label">Date & time (local)</label>
          <input
            type="datetime-local"
            value={datetimeInput()}
            onInput={(e) => handleDatetimeInput(e.currentTarget.value)}
            style={{ ...inputStyle, width: "100%" }}
          />
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Derived epoch values                                                */}
      {/* ------------------------------------------------------------------ */}
      <Show when={date()}>
        {(d) => (
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              "flex-wrap": "wrap",
            }}
          >
            {/* Seconds */}
            <div
              style={{
                flex: "1",
                "min-width": "160px",
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                "border-radius": "0.5rem",
                padding: "0.875rem 1rem",
              }}
            >
              <div class="tool-label">Epoch (seconds)</div>
              <div
                style={{
                  display: "flex",
                  "align-items": "center",
                  gap: "0.5rem",
                  "margin-top": "0.375rem",
                }}
              >
                <code
                  style={{
                    "font-size": "0.9375rem",
                    color: "var(--accent-primary)",
                    "font-family": "var(--font-mono)",
                    flex: "1",
                    "word-break": "break-all",
                  }}
                >
                  {String(Math.floor(d().getTime() / 1000))}
                </code>
                <CopyButton text={String(Math.floor(d().getTime() / 1000))} />
              </div>
            </div>

            {/* Milliseconds */}
            <div
              style={{
                flex: "1",
                "min-width": "160px",
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                "border-radius": "0.5rem",
                padding: "0.875rem 1rem",
              }}
            >
              <div class="tool-label">Epoch (milliseconds)</div>
              <div
                style={{
                  display: "flex",
                  "align-items": "center",
                  gap: "0.5rem",
                  "margin-top": "0.375rem",
                }}
              >
                <code
                  style={{
                    "font-size": "0.9375rem",
                    color: "var(--accent-primary)",
                    "font-family": "var(--font-mono)",
                    flex: "1",
                    "word-break": "break-all",
                  }}
                >
                  {String(d().getTime())}
                </code>
                <CopyButton text={String(d().getTime())} />
              </div>
            </div>

            {/* ISO 8601 */}
            <div
              style={{
                flex: "2",
                "min-width": "220px",
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                "border-radius": "0.5rem",
                padding: "0.875rem 1rem",
              }}
            >
              <div class="tool-label">ISO 8601</div>
              <div
                style={{
                  display: "flex",
                  "align-items": "center",
                  gap: "0.5rem",
                  "margin-top": "0.375rem",
                }}
              >
                <code
                  style={{
                    "font-size": "0.875rem",
                    color: "var(--accent-success)",
                    "font-family": "var(--font-mono)",
                    flex: "1",
                    "word-break": "break-all",
                  }}
                >
                  {d().toISOString()}
                </code>
                <CopyButton text={d().toISOString()} />
              </div>
            </div>
          </div>
        )}
      </Show>

      <Show when={date()}>
        {(d) => (
          <div
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              "border-radius": "0.5rem",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "0.625rem 1rem",
                "border-bottom": "1px solid var(--border)",
              }}
            >
              <span class="tool-label">Derived formats</span>
            </div>

            <div
              style={{
                padding: "0.75rem 1rem",
                display: "grid",
                "grid-template-columns": "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "0.75rem",
              }}
            >
              <For each={getDerivedTimestampFormats(d())}>
                {(item) => (
                  <div
                    style={{
                      display: "flex",
                      "flex-direction": "column",
                      gap: "0.375rem",
                      padding: "0.75rem",
                      background: "var(--bg-primary)",
                      border: "1px solid var(--border)",
                      "border-radius": "0.375rem",
                    }}
                  >
                    <span class="tool-label">{item.label}</span>
                    <code
                      style={{
                        "font-size": "0.8125rem",
                        color: "var(--text-primary)",
                        "font-family": "var(--font-mono)",
                        "word-break": "break-all",
                      }}
                    >
                      {item.value}
                    </code>
                    <div style={{ display: "flex", "justify-content": "flex-end" }}>
                      <CopyButton text={item.value} />
                    </div>
                  </div>
                )}
              </For>
            </div>
          </div>
        )}
      </Show>

      {/* ------------------------------------------------------------------ */}
      {/* Timezone panel                                                      */}
      {/* ------------------------------------------------------------------ */}
      <Show when={date()}>
        {(d) => (
          <div
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              "border-radius": "0.5rem",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "0.625rem 1rem",
                "border-bottom": "1px solid var(--border)",
              }}
            >
              <span class="tool-label">Timezone conversions</span>
            </div>

            <div
              style={{
                padding: "0.75rem 1rem",
                display: "flex",
                "flex-direction": "column",
                gap: "0.75rem",
              }}
            >
              <For each={zones()}>
                {(zone, i) => (
                  <div
                    style={{
                      display: "grid",
                      "grid-template-columns": "180px 1fr auto",
                      gap: "0.75rem",
                      "align-items": "center",
                    }}
                  >
                    <select
                      value={zone.tz}
                      onChange={(e) => changeZone(i(), e.currentTarget.value)}
                      style={{
                        padding: "0.25rem 0.5rem",
                        "border-radius": "0.25rem",
                        border: "1px solid var(--border)",
                        background: "var(--bg-tertiary)",
                        color: "var(--text-secondary)",
                        "font-size": "0.75rem",
                        cursor: "pointer",
                        outline: "none",
                      }}
                    >
                      <For each={PRESET_ZONES}>
                        {(preset) => <option value={preset.tz}>{preset.label}</option>}
                      </For>
                    </select>

                    <code
                      style={{
                        "font-size": "0.875rem",
                        color: "var(--text-primary)",
                        "font-family": "var(--font-mono)",
                      }}
                    >
                      {formatInZone(d(), zone.tz)}
                    </code>

                    <CopyButton text={formatInZone(d(), zone.tz)} />
                  </div>
                )}
              </For>
            </div>
          </div>
        )}
      </Show>

      {/* Empty hint */}
      <Show when={!epochInput().trim() && !datetimeInput()}>
        <ToolStatusMessage tone="muted">
          Enter a Unix timestamp (seconds or ms auto-detected) or pick a date above
        </ToolStatusMessage>
      </Show>
    </div>
  );
}
