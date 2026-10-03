import { batch, createMemo, createSignal, createUniqueId, For, Show } from "solid-js";

import CopyButton from "@/components/CopyButton";
import Card from "@/components/primitives/solid/Card";
import Input from "@/components/primitives/solid/Input";
import Label from "@/components/primitives/solid/Label";
import Select from "@/components/primitives/solid/Select";
import ToolActionButton from "@/components/ToolActionButton";
import ToolContainer from "@/components/tool/ToolContainer";
import ToolInspectorWorkspace from "@/components/tool/ToolInspectorWorkspace";
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

  const fields = createMemo(() => {
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
              <div class="flex flex-col gap-1.5">
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
                <Show when={!isExample() && source() === "epoch" && date()}>
                  <span class="text-xs text-[var(--text-muted)]">
                    Interpreted as {interpretedUnit() === "s" ? "seconds" : "milliseconds"}
                  </span>
                </Show>
              </div>
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
            <Show when={unit() === "auto"}>
              <p class="text-xs text-[var(--text-muted)]">
                Auto uses milliseconds when the absolute value exceeds 1,000,000,000,000; otherwise
                seconds. Choose units for early or short millisecond timestamps.
              </p>
            </Show>
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
