import { createMemo, createSignal } from "solid-js";
import ToolContainer from "@/components/tool/ToolContainer";
import ToolInputPanel from "@/components/tool/ToolInputPanel";
import ToolInspectorWorkspace from "@/components/tool/ToolInspectorWorkspace";
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
      <ToolInspectorWorkspace
        isExample={isExample()}
        input={
          <ToolInputPanel
            compact
            label="Text input"
            value={input()}
            onInput={setInput}
            placeholder={EXAMPLE_STATS_TEXT}
            rows={10}
          />
        }
        fields={METRIC_LABELS.map(([key, label]) => ({
          label,
          value: statistics()[key].toLocaleString(),
          metric: true,
        }))}
      />
    </ToolContainer>
  );
}
