import { createMemo, createSignal, Show } from "solid-js";

import CopyButton from "@/components/CopyButton";
import Card from "@/components/primitives/solid/Card";
import Label from "@/components/primitives/solid/Label";
import Textarea from "@/components/primitives/solid/Textarea";
import ToolStatusMessage from "@/components/ToolStatusMessage";
import ToolContainer from "@/components/tool/ToolContainer";
import ToolExampleNotice from "@/components/tool/ToolExampleNotice";
import { EXAMPLE_TEXT } from "@/lib/exampleData";
import { decodeUrlText, encodeUrlText } from "@/lib/urlEncoding";

export default function UrlEncoderTool() {
  const [plainText, setPlainText] = createSignal("");
  const [encodedText, setEncodedText] = createSignal("");

  const isEncodingExample = () => plainText() === "";
  const isDecodingExample = () => encodedText() === "";
  const encodedExample = encodeUrlText(EXAMPLE_TEXT);
  const encodedOutput = createMemo(() => encodeUrlText(plainText() || EXAMPLE_TEXT));
  const decodedOutput = createMemo(() => decodeUrlText(encodedText() || encodedExample));
  const decodedValue = createMemo(() => {
    const current = decodedOutput();
    return current.ok ? current.value : "";
  });
  const decodeError = createMemo(() => {
    const current = decodedOutput();
    return current.ok ? "" : current.error;
  });

  return (
    <ToolContainer>
      <div class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))] gap-5">
        <Card class="flex flex-col gap-4">
          <Textarea
            label="Plain text"
            value={plainText()}
            onInput={(v) => setPlainText(v)}
            placeholder={EXAMPLE_TEXT}
            rows={7}
          />

          <ToolExampleNotice when={isEncodingExample()} />
          <div class="flex items-center justify-between">
            <Label>Encoded output</Label>
            <Show when={!isEncodingExample()}>
              <CopyButton text={encodedOutput()} label="Copy encoded" />
            </Show>
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
            placeholder={encodedExample}
            rows={7}
            spellcheck={false}
            resize="y"
            describedBy={decodeError() ? "percent-encoded-text-error" : undefined}
            error={!!decodeError()}
            controlClass="!bg-[var(--bg-primary)] text-sm"
          />

          <ToolExampleNotice when={isDecodingExample()} />
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
              <Show when={!isDecodingExample()}>
                <CopyButton text={decodedValue()} label="Copy decoded" />
              </Show>
            </div>
            <pre class="m-0 px-4 py-3.5 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] font-mono text-sm leading-[1.7] min-h-[7rem] whitespace-pre-wrap break-all">
              {decodedValue() || "—"}
            </pre>
          </Show>
        </Card>
      </div>
    </ToolContainer>
  );
}
