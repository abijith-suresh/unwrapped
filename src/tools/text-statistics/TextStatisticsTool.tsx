import { createMemo, createSignal, For } from "solid-js";

import Card from "@/components/primitives/solid/Card";
import Label from "@/components/primitives/solid/Label";
import Textarea from "@/components/primitives/solid/Textarea";
import ToolStatusMessage from "@/components/ToolStatusMessage";
import ToolContainer from "@/components/tool/ToolContainer";
import ToolExampleNotice from "@/components/tool/ToolExampleNotice";
import { EXAMPLE_STATS_TEXT } from "@/lib/exampleData";
import { analyzeText } from "@/lib/textStatistics";

const METRIC_LABELS = [
  ["characters", "Characters"],
  ["words", "Words"],
  ["lines", "Lines"],
  ["bytes", "Bytes"],
] as const satisfies ReadonlyArray<readonly [keyof ReturnType<typeof analyzeText>, string]>;

export default function TextStatisticsTool() {
  const [input, setInput] = createSignal("");
  const isExample = () => input() === "";
  const statistics = createMemo(() => analyzeText(input() || EXAMPLE_STATS_TEXT));

  return (
    <ToolContainer>
      <Textarea
        label="Text input"
        value={input()}
        onInput={setInput}
        placeholder={EXAMPLE_STATS_TEXT}
        rows={10}
      />

      <ToolExampleNotice when={isExample()} />

      <div class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,180px),1fr))] gap-3">
        <For each={METRIC_LABELS}>
          {([key, label]) => (
            <Card class="flex flex-col gap-1.5">
              <Label>{label}</Label>
              <strong class="text-[var(--text-primary)] text-[1.625rem] leading-[1.2]">
                {statistics()[key].toLocaleString()}
              </strong>
            </Card>
          )}
        </For>
      </div>

      <ToolStatusMessage tone="muted">
        Counts update locally as you type. Byte size is measured from the encoded UTF-8 text.
      </ToolStatusMessage>
    </ToolContainer>
  );
}
