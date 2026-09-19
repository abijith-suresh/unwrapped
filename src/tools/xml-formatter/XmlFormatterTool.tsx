import { createMemo, createSignal, Show } from "solid-js";

import CopyButton from "@/components/CopyButton";
import Card from "@/components/primitives/solid/Card";
import Input from "@/components/primitives/solid/Input";
import Label from "@/components/primitives/solid/Label";
import Textarea from "@/components/primitives/solid/Textarea";
import ToolStatusMessage from "@/components/ToolStatusMessage";
import { formatXml } from "@/lib/xmlFormatter";

export default function XmlFormatterTool() {
  const [input, setInput] = createSignal('<root><item id="1">value</item></root>');
  const [indent, setIndent] = createSignal(2);
  const result = createMemo(() => formatXml(input(), { indent: indent() }));
  const output = createMemo(() => {
    const current = result();
    return current.ok ? current.output : "";
  });
  const error = createMemo(() => {
    const current = result();
    return current.ok ? "" : current.error;
  });

  return (
    <div class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))] gap-5 p-6 mx-auto w-full max-w-[1100px]">
      <div class="flex flex-col gap-3">
        <Input
          label="Indent"
          name="xml-indent"
          autocomplete="off"
          type="number"
          min={2}
          max={8}
          inputmode="numeric"
          value={String(indent())}
          onInput={(value) => setIndent(Number(value) || 2)}
          class="flex-row items-center gap-3"
          controlClass="!w-20 rounded-lg !px-3 !py-2"
        />

        <Textarea
          label="XML input"
          value={input()}
          onInput={(value) => setInput(value)}
          placeholder="Paste XML to format…"
          rows={14}
          spellcheck={false}
          name="xml-input"
          autocomplete="off"
          describedBy={error() ? "xml-input-error" : undefined}
          error={!!error()}
        />
      </div>

      <Card class="flex flex-col gap-3">
        <div class="flex items-center justify-between">
          <Label>Formatted XML</Label>
          <CopyButton text={output()} label="Copy XML" />
        </div>

        <Show
          when={!error()}
          fallback={
            <ToolStatusMessage id="xml-input-error" tone="error">
              {error()}
            </ToolStatusMessage>
          }
        >
          <pre class="m-0 p-4 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] font-mono text-sm leading-relaxed whitespace-pre-wrap break-words min-h-[20rem]">
            {output() || "—"}
          </pre>
        </Show>
      </Card>
    </div>
  );
}
