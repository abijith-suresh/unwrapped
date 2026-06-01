import { createMemo, createSignal, For } from "solid-js";

import Card from "@/components/primitives/solid/Card";
import Label from "@/components/primitives/solid/Label";
import Textarea from "@/components/primitives/solid/Textarea";
import ToolStatusMessage from "@/components/ToolStatusMessage";
import { analyzeText } from "@/lib/textStatistics";

const METRIC_LABELS = [
  ["characters", "Characters"],
  ["words", "Words"],
  ["lines", "Lines"],
  ["bytes", "Bytes"],
] as const satisfies ReadonlyArray<readonly [keyof ReturnType<typeof analyzeText>, string]>;

export default function TextStatisticsTool() {
  const [input, setInput] = createSignal("");
  const statistics = createMemo(() => analyzeText(input()));

  return (
    <div class="flex flex-col gap-5 p-6 mx-auto w-full max-w-[900px]">
      <Textarea
        label="Text input"
        value={input()}
        onInput={setInput}
        placeholder="Type or paste text to inspect its raw size and structure locally…"
        rows={10}
      />

      <div class="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
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
    </div>
  );
}
