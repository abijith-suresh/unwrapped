import { createMemo, createSignal, Show } from "solid-js";

import CopyButton from "@/components/CopyButton";
import Card from "@/components/primitives/solid/Card";
import Label from "@/components/primitives/solid/Label";
import Textarea from "@/components/primitives/solid/Textarea";
import ToolStatusMessage from "@/components/ToolStatusMessage";
import ToolContainer from "@/components/tool/ToolContainer";
import ToolExampleNotice from "@/components/tool/ToolExampleNotice";
import { EXAMPLE_JSON_ARRAY } from "@/lib/exampleData";
import { convertJsonToCsv } from "@/lib/jsonToCsv";

export default function JsonToCsvTool() {
  const [input, setInput] = createSignal("");
  const isExample = () => input() === "";
  const result = createMemo(() => convertJsonToCsv(input() || EXAMPLE_JSON_ARRAY));
  const output = createMemo(() => {
    const current = result();
    return current.ok ? current.output : "";
  });
  const error = createMemo(() => {
    const current = result();
    return current.ok ? "" : current.error;
  });

  return (
    <ToolContainer width="wide">
      <Textarea
        label="JSON array input"
        value={input()}
        onInput={(value) => setInput(value)}
        placeholder={EXAMPLE_JSON_ARRAY}
        rows={14}
        spellcheck={false}
        error={!!error()}
      />

      <ToolExampleNotice when={isExample()} />

      <Card class="flex flex-col gap-3">
        <div class="flex items-center justify-between">
          <Label>CSV output</Label>
          <Show when={!isExample()}>
            <CopyButton text={output()} label="Copy CSV" />
          </Show>
        </div>

        <Show
          when={!error()}
          fallback={<ToolStatusMessage tone="error">{error()}</ToolStatusMessage>}
        >
          <pre class="m-0 p-4 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] font-mono text-sm leading-relaxed whitespace-pre-wrap break-words min-h-[20rem]">
            {output() || "—"}
          </pre>
        </Show>
      </Card>
    </ToolContainer>
  );
}
