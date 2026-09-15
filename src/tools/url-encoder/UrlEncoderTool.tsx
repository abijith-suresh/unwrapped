import { createMemo, createSignal, Show } from "solid-js";

import CopyButton from "@/components/CopyButton";
import Card from "@/components/primitives/solid/Card";
import Label from "@/components/primitives/solid/Label";
import Textarea from "@/components/primitives/solid/Textarea";
import ToolStatusMessage from "@/components/ToolStatusMessage";
import { decodeUrlText, encodeUrlText } from "@/lib/urlEncoding";

export default function UrlEncoderTool() {
  const [plainText, setPlainText] = createSignal("");
  const [encodedText, setEncodedText] = createSignal("");

  const encodedOutput = createMemo(() => encodeUrlText(plainText()));
  const decodedOutput = createMemo(() => decodeUrlText(encodedText()));
  const decodedValue = createMemo(() => {
    const current = decodedOutput();
    return current.ok ? current.value : "";
  });
  const decodeError = createMemo(() => {
    const current = decodedOutput();
    return current.ok ? "" : current.error;
  });

  return (
    <div class="flex flex-col gap-5 p-6 mx-auto w-full max-w-[1100px]">
      <div class="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-5">
        <Card class="flex flex-col gap-4">
          <Textarea
            label="Plain text"
            value={plainText()}
            onInput={(v) => setPlainText(v)}
            placeholder="Enter text to percent-encode…"
            rows={7}
          />

          <div class="flex items-center justify-between">
            <Label>Encoded output</Label>
            <CopyButton text={encodedOutput()} label="Copy encoded" />
          </div>
          <pre class="m-0 px-4 py-3.5 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] font-mono text-sm leading-[1.7] min-h-[7rem] whitespace-pre-wrap break-all">
            {encodedOutput() || "—"}
          </pre>
        </Card>

        <Card class="flex flex-col gap-4">
          <Textarea
            label="Percent-encoded text"
            name="percent-encoded-text"
            autocomplete="off"
            value={encodedText()}
            onInput={(value) => setEncodedText(value)}
            placeholder="Enter percent-encoded text to decode…"
            rows={7}
            spellcheck={false}
            resize="y"
            describedBy={decodeError() ? "percent-encoded-text-error" : undefined}
            error={!!decodeError()}
            controlClass="!bg-[var(--bg-primary)] text-sm"
          />

          <Show
            when={!decodeError()}
            fallback={
              <ToolStatusMessage id="percent-encoded-text-error" tone="error">
                {decodeError()}
              </ToolStatusMessage>
            }
          >
            <div class="flex items-center justify-between">
              <Label>Decoded output</Label>
              <CopyButton text={decodedValue()} label="Copy decoded" />
            </div>
            <pre class="m-0 px-4 py-3.5 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] font-mono text-sm leading-[1.7] min-h-[7rem] whitespace-pre-wrap break-all">
              {decodedValue() || "—"}
            </pre>
          </Show>
        </Card>
      </div>
    </div>
  );
}
