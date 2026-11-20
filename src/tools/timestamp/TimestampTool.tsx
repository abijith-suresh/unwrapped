import { batch, createMemo, createSignal, createUniqueId, For, Show } from "solid-js";

import CopyButton from "@/components/CopyButton";
import Input from "@/components/primitives/solid/Input";
import Select from "@/components/primitives/solid/Select";
import ToolActionButton from "@/components/ToolActionButton";
import ToolContainer from "@/components/tool/ToolContainer";
import ToolExampleNotice from "@/components/tool/ToolExampleNotice";
import ToolInspectorWorkspace from "@/components/tool/ToolInspectorWorkspace";
import ToolPanel from "@/components/tool/ToolPanel";
import ToolSegmentedControl from "@/components/tool/ToolSegmentedControl";
import ToolToolbar from "@/components/tool/ToolToolbar";
import { EXAMPLE_EPOCH } from "@/lib/exampleData";
import {
  DEFAULT_ZONES,
  type EpochUnit,
  formatEpoch,
  formatInZone,
  getDerivedTimestampFormats,
  localInputToMs,
  msToLocalInput,
  type ParsedEpoch,
  PRESET_ZONES,
  parseEpoch,
  type TimeZoneOption,
} from "@/lib/timestamp";

export default function TimestampTool() {
  const [epochInput, setEpochInput] = createSignal("");
  const [datetimeInput, setDatetimeInput] = createSignal("");
  const [unit, setUnit] = createSignal<EpochUnit>("auto");
  const [source, setSource] = createSignal<"epoch" | "datetime">("epoch");
  const [zones, setZones] = createSignal<TimeZoneOption[]>(DEFAULT_ZONES);
  const errorId = createUniqueId();
  const isExample = () => epochInput() === "" && datetimeInput() === "";

  const parsed = createMemo((): ParsedEpoch => {
    if (isExample()) return parseEpoch(EXAMPLE_EPOCH);
    if (source() === "epoch") return parseEpoch(epochInput(), unit());
    const ms = localInputToMs(datetimeInput());
    return ms === null
      ? { error: "Enter a valid local date and time within the supported Date range." }
      : { ms, unit: "ms" };
  });
  const error = () => {
    const result = parsed();
    return "error" in result ? result.error : null;
  };
  const interpretedUnit = () => {
    const result = parsed();
    return "unit" in result ? result.unit : null;
  };
  const date = createMemo(() => {
    const result = parsed();
    return "error" in result ? null : new Date(result.ms);
  });

  function useNow() {
    handleEpochInput(formatEpoch(Date.now(), unit()));
  }

  function reset() {
    batch(() => {
      setEpochInput("");
      setDatetimeInput("");
      setUnit("auto");
      setSource("epoch");
      setZones(DEFAULT_ZONES);
    });
  }

  function handleEpochInput(value: string) {
    const result = parseEpoch(value, unit());
    batch(() => {
      setSource("epoch");
      setEpochInput(value);
      setDatetimeInput("error" in result ? "" : msToLocalInput(result.ms));
    });
  }

  function handleDatetimeInput(value: string) {
    const ms = localInputToMs(value);
    batch(() => {
      setSource("datetime");
      setDatetimeInput(value);
      setEpochInput(ms === null ? "" : formatEpoch(ms, unit()));
    });
  }

  function changeUnit(value: EpochUnit) {
    batch(() => {
      setUnit(value);
      if (isExample()) return;
      if (source() === "epoch") handleEpochInput(epochInput());
      else handleDatetimeInput(datetimeInput());
    });
  }

  function changeZone(index: number, tz: string) {
    const selectedZone = PRESET_ZONES.find((zone) => zone.tz === tz);
    setZones((prev) =>
      prev.map((zone, i) =>
        i === index ? { ...zone, tz, label: selectedZone?.label ?? tz } : zone
      )
    );
  }

  const fields = createMemo<Array<{ label: string; value: string; copyLabel?: string }>>(() => {
    const current = date();
    if (!current) return [];
    return [
      {
        label: "Epoch (seconds)",
        value: formatEpoch(current.getTime(), "s"),
        copyLabel: "Copy epoch seconds",
      },
      {
        label: "Epoch (milliseconds)",
        value: String(current.getTime()),
        copyLabel: "Copy epoch milliseconds",
      },
      ...getDerivedTimestampFormats(current),
    ];
  });
  return (
    <ToolContainer>
      <ToolInspectorWorkspace
        isExample={isExample()}
        error={error()}
        errorId={errorId}
        input={
          <div class="flex flex-col gap-4">
            <ToolToolbar
              label="Timestamp controls"
              actions={
                <>
                  <ToolExampleNotice when={isExample()} />
                  <ToolActionButton onClick={useNow} variant="primary">
                    Use now
                  </ToolActionButton>
                  <ToolActionButton onClick={reset} variant="ghost">
                    Reset
                  </ToolActionButton>
                </>
              }
            >
              <ToolSegmentedControl<EpochUnit>
                label="Timestamp unit"
                value={unit()}
                onChange={changeUnit}
                options={[
                  { value: "auto", label: "Auto" },
                  { value: "s", label: "Seconds" },
                  { value: "ms", label: "Milliseconds" },
                ]}
              />
            </ToolToolbar>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Unix timestamp"
                name="unix-timestamp"
                autocomplete="off"
                inputmode="decimal"
                type="text"
                value={epochInput()}
                onInput={handleEpochInput}
                placeholder={EXAMPLE_EPOCH}
                error={source() === "epoch" && !!error()}
                describedBy={source() === "epoch" && error() ? errorId : undefined}
              />
              <Input
                label="Date & time (local)"
                name="local-datetime"
                autocomplete="off"
                type="datetime-local"
                step="0.001"
                value={datetimeInput()}
                onInput={handleDatetimeInput}
                error={source() === "datetime" && !!error()}
                describedBy={source() === "datetime" && error() ? errorId : undefined}
              />
            </div>
            <div class="flex min-h-[var(--space-5)] items-center">
              <Show when={!isExample() && source() === "epoch" && date()}>
                <span class="text-[var(--fs-label)] leading-[var(--space-5)] text-[var(--text-muted)]">
                  Interpreted as {interpretedUnit() === "s" ? "seconds" : "milliseconds"}
                </span>
              </Show>
            </div>
            <p class="m-0 text-[var(--fs-label)] leading-relaxed text-[var(--text-muted)]">
              Auto uses milliseconds when the absolute value exceeds 1,000,000,000,000; otherwise
              seconds. Choose units for early or short millisecond timestamps.
            </p>
          </div>
        }
      >
        <Show when={date()}>
          {(d) => (
            <>
              <ToolPanel title="Converted formats" bodyClass="p-0 sm:p-0">
                <div class="flex min-w-0 flex-col">
                  <For each={fields()}>
                    {(field) => (
                      <div class="grid min-w-0 grid-cols-1 items-start gap-1.5 border-b border-[var(--border)] px-3 py-2.5 last:border-b-0 sm:grid-cols-[minmax(0,auto)_minmax(0,1fr)_auto] sm:items-center sm:gap-3 sm:px-4">
                        <span class="whitespace-nowrap font-mono text-[var(--fs-2xs)] font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)]">
                          {field.label}
                        </span>
                        <code class="min-w-0 whitespace-pre-wrap break-words font-mono text-[var(--fs-control)] text-[var(--text-primary)]">
                          {field.value || "—"}
                        </code>
                        <Show when={!isExample() && field.value}>
                          <CopyButton
                            text={field.value}
                            label={field.copyLabel ?? `Copy ${field.label}`}
                            compact
                          />
                        </Show>
                      </div>
                    )}
                  </For>
                </div>
              </ToolPanel>
              <ToolPanel title="Timezone conversions" bodyClass="p-0 sm:p-0">
                <div class="flex min-w-0 flex-col">
                  <For each={zones()}>
                    {(zone, i) => (
                      <div class="grid grid-cols-1 items-center gap-3 border-b border-[var(--border)] px-3 py-2.5 last:border-b-0 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)_auto] sm:px-4">
                        <Select
                          label={`Timezone ${i() + 1}`}
                          name={`timezone-${i() + 1}`}
                          autocomplete="off"
                          value={zone.tz}
                          onChange={(tz) => changeZone(i(), tz)}
                          options={PRESET_ZONES.map((z) => ({ value: z.tz, label: z.label }))}
                        />
                        <code class="min-w-0 whitespace-pre-wrap break-words font-mono text-[var(--fs-control)] text-[var(--text-primary)]">
                          {formatInZone(d(), zone.tz)}
                        </code>
                        <Show when={!isExample()}>
                          <CopyButton
                            text={formatInZone(d(), zone.tz)}
                            label={`Copy ${zone.label} time`}
                            compact
                          />
                        </Show>
                      </div>
                    )}
                  </For>
                </div>
              </ToolPanel>
            </>
          )}
        </Show>
      </ToolInspectorWorkspace>
    </ToolContainer>
  );
}
