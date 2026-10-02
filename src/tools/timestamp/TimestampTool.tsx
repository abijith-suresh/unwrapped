import { createMemo, createSignal, For, Show } from "solid-js";

import CopyButton from "@/components/CopyButton";
import Card from "@/components/primitives/solid/Card";
import Input from "@/components/primitives/solid/Input";
import Label from "@/components/primitives/solid/Label";
import Select from "@/components/primitives/solid/Select";
import ToolActionButton from "@/components/ToolActionButton";
import ToolContainer from "@/components/tool/ToolContainer";
import ToolInspectorWorkspace from "@/components/tool/ToolInspectorWorkspace";
import { EXAMPLE_EPOCH } from "@/lib/exampleData";
import {
  DEFAULT_ZONES,
  formatInZone,
  getDerivedTimestampFormats,
  localInputToMs,
  msToLocalInput,
  PRESET_ZONES,
  parseEpoch,
  type TimeZoneOption,
} from "@/lib/timestamp";

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function TimestampTool() {
  const [epochInput, setEpochInput] = createSignal("");
  const [datetimeInput, setDatetimeInput] = createSignal("");
  const [zones, setZones] = createSignal<TimeZoneOption[]>(DEFAULT_ZONES);
  const isExample = () => epochInput() === "" && datetimeInput() === "";

  const parsed = createMemo((): { ms: number; unit: "s" | "ms" } | null => {
    if (isExample()) return parseEpoch(EXAMPLE_EPOCH);
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
    setDatetimeInput(p ? msToLocalInput(p.ms) : "");
  }

  function handleDatetimeInput(value: string) {
    setDatetimeInput(value);
    const ms = localInputToMs(value);
    setEpochInput(ms !== null ? String(Math.floor(ms / 1000)) : "");
  }

  function changeZone(index: number, tz: string) {
    const selectedZone = PRESET_ZONES.find((zone) => zone.tz === tz);
    setZones((prev) =>
      prev.map((zone, i) =>
        i === index ? { ...zone, tz, label: selectedZone?.label ?? tz } : zone
      )
    );
  }

  const fields = createMemo(() => {
    const current = date();
    if (!current) return [];
    return [
      {
        label: "Epoch (seconds)",
        value: String(Math.floor(current.getTime() / 1000)),
        copyLabel: "Copy epoch seconds",
      },
      {
        label: "Epoch (milliseconds)",
        value: String(current.getTime()),
        copyLabel: "Copy epoch milliseconds",
      },
      { label: "ISO 8601", value: current.toISOString() },
      ...getDerivedTimestampFormats(current),
    ];
  });
  return (
    <ToolContainer>
      <ToolInspectorWorkspace
        isExample={isExample()}
        input={
          <div class="grid grid-cols-1 gap-4 items-end sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
            {/* Epoch input */}
            <div class="flex flex-col gap-1.5">
              <Input
                label="Unix timestamp"
                name="unix-timestamp"
                autocomplete="off"
                inputmode="numeric"
                type="text"
                value={epochInput()}
                onInput={handleEpochInput}
                placeholder={EXAMPLE_EPOCH}
              />
              <Show when={!isExample() && parsed()}>
                {(p) => (
                  <span class="text-xs text-[var(--text-muted)]">
                    Detected: {p().unit === "s" ? "seconds" : "milliseconds"}
                  </span>
                )}
              </Show>
            </div>

            <div class="flex gap-2 items-center">
              <ToolActionButton onClick={useNow} variant="primary">
                Use now
              </ToolActionButton>
              <ToolActionButton onClick={reset} variant="ghost">
                Reset
              </ToolActionButton>
            </div>

            {/* Datetime-local input */}
            <div class="flex flex-col gap-1.5">
              <Input
                label="Date & time (local)"
                name="local-datetime"
                autocomplete="off"
                type="datetime-local"
                value={datetimeInput()}
                onInput={handleDatetimeInput}
              />
            </div>
          </div>
        }
        fields={fields()}
      >
        <Show when={date()}>
          {(d) => (
            <Card class="overflow-hidden p-0">
              <div class="px-4 py-2.5 border-b border-[var(--border)]">
                <Label>Timezone conversions</Label>
              </div>

              <div class="p-3 flex flex-col gap-3">
                <For each={zones()}>
                  {(zone, i) => (
                    <div class="grid grid-cols-1 gap-3 items-center sm:grid-cols-[minmax(0,180px)_minmax(0,1fr)_auto]">
                      <Select
                        aria-label={`Timezone ${i() + 1}`}
                        name={`timezone-${i() + 1}`}
                        autocomplete="off"
                        value={zone.tz}
                        onChange={(tz) => changeZone(i(), tz)}
                        options={PRESET_ZONES.map((z) => ({ value: z.tz, label: z.label }))}
                      />

                      <code class="text-sm text-[var(--text-primary)] font-mono">
                        {formatInZone(d(), zone.tz)}
                      </code>

                      <Show when={!isExample()}>
                        <CopyButton
                          text={formatInZone(d(), zone.tz)}
                          label={`Copy ${zone.label} time`}
                        />
                      </Show>
                    </div>
                  )}
                </For>
              </div>
            </Card>
          )}
        </Show>
      </ToolInspectorWorkspace>
    </ToolContainer>
  );
}
