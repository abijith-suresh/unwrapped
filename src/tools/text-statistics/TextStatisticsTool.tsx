import { createMemo, createSignal, For } from "solid-js";

import Card from "@/components/primitives/solid/Card";
import Label from "@/components/primitives/solid/Label";
import Textarea from "@/components/primitives/solid/Textarea";
import ToolStatusMessage from "@/components/ToolStatusMessage";
import ToolContainer from "@/components/tool/ToolContainer";
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
    <ToolContainer width="standard">
      <Textarea
        label="Text input"
        value={input()}
        onInput={setInput}
        placeholder={"Hello, world!\nA second line of text."}
        rows={10}
      />

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
