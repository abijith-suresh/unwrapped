import { createMemo, createSignal, For, Show } from "solid-js";
import CopyButton from "@/components/CopyButton";
import Input from "@/components/primitives/solid/Input";
import ToolActionButton from "@/components/ToolActionButton";
import ToolStatusMessage from "@/components/ToolStatusMessage";
import ToolContainer from "@/components/tool/ToolContainer";
import ToolExampleNotice from "@/components/tool/ToolExampleNotice";
import ToolInspectorWorkspace from "@/components/tool/ToolInspectorWorkspace";
import ToolPanel from "@/components/tool/ToolPanel";
import ToolSegmentedControl from "@/components/tool/ToolSegmentedControl";
import { CRON_FIELD_SPECS, SUPPORTED_CRON_SYNTAX } from "@/lib/cron";
import { buildCron, CRON_PRESETS, type CronBuilderFields, cronFields } from "@/lib/cronBuilder";
import { buildCronScheduleSummary, type CronTimeZoneMode } from "@/lib/cronSchedule";
import { EXAMPLE_CRON } from "@/lib/exampleData";

function formatPreview(date: Date, mode: CronTimeZoneMode): string {
  return mode === "utc"
    ? `${date.toISOString().replace("T", " ").replace(".000Z", " UTC")}`
    : date.toLocaleString();
}

export default function CronTool() {
  const [input, setInput] = createSignal("");
  const exampleFields = cronFields(EXAMPLE_CRON);
  const [fields, setFields] = createSignal<CronBuilderFields>({
    minute: "",
    hour: "",
    dayOfMonth: "",
    month: "",
    dayOfWeek: "",
  });
  const isBuilderExample = () =>
    SUPPORTED_CRON_SYNTAX.fieldOrder.every((field) => fields()[field] === "");
  const built = createMemo(() => buildCron(isBuilderExample() ? exampleFields : fields()));
  const builtOutput = () => {
    const result = built();
    return result.ok ? result.output : "";
  };
  const [timeZone, setTimeZone] = createSignal<CronTimeZoneMode>("local");
  const isExample = () => input() === "";

  const summary = createMemo(() =>
    buildCronScheduleSummary(input() || EXAMPLE_CRON, {
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
    if (!input().trim()) return "";
    const current = summary();
    return current.ok ? "" : current.error.message;
  });

  return (
    <ToolContainer>
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
                placeholder={exampleFields[field]}
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
            disabled={isBuilderExample() || !built().ok}
          >
            Preview built schedule
          </ToolActionButton>
          <Show when={!isBuilderExample()}>
            <CopyButton text={builtOutput()} label="Copy built expression" />
          </Show>
          <ToolActionButton
            disabled={!input().trim() || !!error()}
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
        <ToolExampleNotice when={isBuilderExample()} label="Example builder output" />
        <ToolStatusMessage tone={built().ok ? "muted" : "error"}>
          {(() => {
            const result = built();
            return result.ok ? result.output : result.error;
          })()}
        </ToolStatusMessage>
      </ToolPanel>
      <ToolInspectorWorkspace
        input={
          <>
            <div class="flex flex-col gap-1.5">
              <Input
                label="Cron expression"
                name="cron-expression"
                autocomplete="off"
                type="text"
                value={input()}
                onInput={setInput}
                placeholder={EXAMPLE_CRON}
                spellcheck={false}
                describedBy={error() ? "cron-expression-error" : undefined}
                error={!!error()}
              />
            </div>
            <ToolSegmentedControl
              label="Timezone"
              value={timeZone()}
              onChange={setTimeZone}
              options={[
                { value: "local", label: "Local time" },
                { value: "utc", label: "UTC" },
              ]}
            />
          </>
        }
        isExample={isExample()}
        error={error()}
        errorId="cron-expression-error"
        layout="rows"
        fields={
          (isExample() || input().trim()) && !error()
            ? [
                { label: "Humanized schedule", value: description(), copy: false },
                {
                  label: "Next runs",
                  value: nextRuns()
                    .map((run, index) => `${index + 1}. ${formatPreview(run, timeZone())}`)
                    .join("\n"),
                  copy: false,
                },
              ]
            : []
        }
      />
    </ToolContainer>
  );
}
