import { createMemo, createSignal, For, Show } from "solid-js";
import CopyButton from "@/components/CopyButton";
import Card from "@/components/primitives/solid/Card";
import Input from "@/components/primitives/solid/Input";
import Label from "@/components/primitives/solid/Label";
import ToolActionButton from "@/components/ToolActionButton";
import ToolStatusMessage from "@/components/ToolStatusMessage";
import ToolContainer from "@/components/tool/ToolContainer";
import ToolPanel from "@/components/tool/ToolPanel";
import { CRON_FIELD_SPECS, SUPPORTED_CRON_SYNTAX } from "@/lib/cron";
import { buildCron, CRON_PRESETS, cronFields } from "@/lib/cronBuilder";
import { buildCronScheduleSummary, type CronTimeZoneMode } from "@/lib/cronSchedule";

function formatPreview(date: Date, mode: CronTimeZoneMode): string {
  return mode === "utc"
    ? `${date.toISOString().replace("T", " ").replace(".000Z", " UTC")}`
    : date.toLocaleString();
}

export default function CronTool() {
  const [input, setInput] = createSignal("30 9 * * 1");
  const [fields, setFields] = createSignal(cronFields("30 9 * * 1"));
  const built = createMemo(() => buildCron(fields()));
  const builtOutput = () => {
    const result = built();
    return result.ok ? result.output : "";
  };
  const [timeZone, setTimeZone] = createSignal<CronTimeZoneMode>("local");

  const summary = createMemo(() =>
    buildCronScheduleSummary(input(), {
      start: new Date(),
      count: 5,
      timeZone: timeZone(),
    })
  );
  const description = createMemo(() => {
    const current = summary();
    return current.ok ? current.description : "";
  });
  const nextRuns = createMemo(() => {
    const current = summary();
    return current.ok ? current.nextRuns : [];
  });
  const error = createMemo(() => {
    const current = summary();
    return current.ok ? "" : current.error.message;
  });

  return (
    <ToolContainer width="standard">
      <ToolPanel
        title="Build a schedule"
        description="Five numeric fields. Sunday is 0. Restricted day-of-month and day-of-week fields use OR semantics."
      >
        <div class="flex flex-wrap gap-2 mb-4">
          <For each={CRON_PRESETS}>
            {(preset) => (
              <ToolActionButton
                onClick={() => {
                  setFields(cronFields(preset.expression));
                  setInput(preset.expression);
                }}
              >
                {preset.label}
              </ToolActionButton>
            )}
          </For>
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
          <For each={SUPPORTED_CRON_SYNTAX.fieldOrder}>
            {(field) => (
              <Input
                label={`${CRON_FIELD_SPECS[field].label} (${CRON_FIELD_SPECS[field].min}-${CRON_FIELD_SPECS[field].max})`}
                value={fields()[field]}
                autocomplete="off"
                onInput={(value) => setFields((current) => ({ ...current, [field]: value }))}
              />
            )}
          </For>
        </div>
        <div class="flex flex-wrap gap-2 mt-4">
          <ToolActionButton
            onClick={() => {
              const result = built();
              if (result.ok) setInput(result.output);
            }}
            disabled={!built().ok}
          >
            Preview built schedule
          </ToolActionButton>
          <CopyButton text={builtOutput()} label="Copy built expression" />
          <ToolActionButton
            onClick={() => {
              try {
                setFields(cronFields(input()));
              } catch {
                /* Parser feedback appears below. */
              }
            }}
          >
            Load expression into builder
          </ToolActionButton>
        </div>
        <ToolStatusMessage tone={built().ok ? "muted" : "error"}>
          {(() => {
            const result = built();
            return result.ok ? result.output : result.error;
          })()}
        </ToolStatusMessage>
      </ToolPanel>
      <div class="flex flex-col gap-1.5">
        <Input
          label="Cron expression"
          name="cron-expression"
          autocomplete="off"
          type="text"
          value={input()}
          onInput={setInput}
          placeholder="30 9 * * 1"
          spellcheck={false}
          describedBy={error() ? "cron-expression-error" : undefined}
          error={!!error()}
        />
      </div>

      <div class="flex gap-2 flex-wrap items-center">
        <Label>Timezone</Label>
        <ToolActionButton
          active={timeZone() === "local"}
          variant={timeZone() === "local" ? "primary" : "secondary"}
          onClick={() => setTimeZone("local")}
        >
          Local time
        </ToolActionButton>
        <ToolActionButton
          active={timeZone() === "utc"}
          variant={timeZone() === "utc" ? "primary" : "secondary"}
          onClick={() => setTimeZone("utc")}
        >
          UTC
        </ToolActionButton>
      </div>

      <Show
        when={!error()}
        fallback={
          <ToolStatusMessage id="cron-expression-error" tone="error">
            {error()}
          </ToolStatusMessage>
        }
      >
        <Card class="flex flex-col gap-3">
          <Label>Humanized schedule</Label>
          <strong class="text-[var(--text-primary)] text-[1.1rem]">{description()}</strong>
        </Card>

        <Card class="flex flex-col gap-3">
          <Label>Next runs</Label>
          <div class="flex flex-col gap-2">
            <For each={nextRuns()}>
              {(run, index) => (
                <code class="px-3 py-2.5 bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] block">
                  {index() + 1}. {formatPreview(run, timeZone())}
                </code>
              )}
            </For>
          </div>
        </Card>
      </Show>

      <ToolStatusMessage tone="muted">
        Supported subset: {SUPPORTED_CRON_SYNTAX.fieldOrder.join(" ")} · operators{" "}
        {SUPPORTED_CRON_SYNTAX.operators.join(" ")} · preview computation stays local-only.
      </ToolStatusMessage>
    </ToolContainer>
  );
}
