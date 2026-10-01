import { createMemo, createSignal, For, Show } from "solid-js";

import CopyButton from "@/components/CopyButton";
import Card from "@/components/primitives/solid/Card";
import Label from "@/components/primitives/solid/Label";
import Textarea from "@/components/primitives/solid/Textarea";
import ToolStatusMessage from "@/components/ToolStatusMessage";
import ToolContainer from "@/components/tool/ToolContainer";
import ToolExampleNotice from "@/components/tool/ToolExampleNotice";
import { EXAMPLE_URL } from "@/lib/exampleData";
import { inspectUrl } from "@/lib/urlInspector";

const SECTION_LABELS = [
  ["normalized", "Normalized"],
  ["protocol", "Protocol"],
  ["hostname", "Hostname"],
  ["port", "Port"],
  ["path", "Path"],
  ["hash", "Hash"],
  ["username", "Username"],
  ["password", "Password"],
] as const;

export default function UrlInspectorTool() {
  const [input, setInput] = createSignal("");
  const isExample = () => input() === "";
  const result = createMemo(() => inspectUrl(input() || EXAMPLE_URL));

  const inspection = createMemo(() => {
    const current = result();
    return current.ok ? current.inspection : null;
  });
  const error = createMemo(() => {
    if (!input().trim()) return "";
    const current = result();
    return current.ok ? "" : current.error;
  });

  return (
    <ToolContainer width="wide">
      <Textarea
        label="URL or raw query string"
        value={input()}
        onInput={(value) => setInput(value)}
        placeholder={EXAMPLE_URL}
        rows={5}
        spellcheck={false}
        error={!!error()}
      />

      <ToolExampleNotice when={isExample()} />

      <Show
        when={!error()}
        fallback={<ToolStatusMessage tone="error">{error()}</ToolStatusMessage>}
      >
        <div class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-3">
          <For each={SECTION_LABELS}>
            {([key, label]) => {
              const value = () => {
                const current = inspection();
                if (!current) return "";
                return key === "normalized" ? current.normalized : current[key];
              };

              return (
                <Card class="flex flex-col gap-2">
                  <div class="flex justify-between gap-3">
                    <Label>{label}</Label>
                    <Show when={!isExample()}>
                      <CopyButton text={value()} label={`Copy ${label}`} />
                    </Show>
                  </div>
                  <code class="text-[var(--text-primary)] text-sm leading-relaxed break-all">
                    {value() || "—"}
                  </code>
                </Card>
              );
            }}
          </For>
        </div>

        <Card class="flex flex-col gap-3">
          <div class="flex justify-between gap-3">
            <Label>Decoded query params</Label>
            <Show when={inspection()?.normalized}>
              <span class="text-xs px-1.5 py-1 rounded bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
                {inspection()?.kind === "query" ? "raw query" : "full url"}
              </span>
            </Show>
          </div>

          <div class="overflow-auto">
            <table class="w-full border-collapse">
              <thead>
                <tr>
                  <th class="px-3 py-2 text-left">
                    <Label>#</Label>
                  </th>
                  <th class="px-3 py-2 text-left">
                    <Label>Key</Label>
                  </th>
                  <th class="px-3 py-2 text-left">
                    <Label>Value</Label>
                  </th>
                </tr>
              </thead>
              <tbody>
                <For each={inspection()?.queryParams ?? []}>
                  {(param, index) => (
                    <tr>
                      <td class="px-3 py-2 text-[var(--text-muted)]">{index() + 1}</td>
                      <td class="px-3 py-2 text-[var(--text-primary)]">
                        <code>{param.key || "—"}</code>
                      </td>
                      <td class="px-3 py-2 text-[var(--text-primary)]">
                        <code>{param.value || "—"}</code>
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>

          <Show when={(inspection()?.queryParams.length ?? 0) === 0}>
            <ToolStatusMessage tone="muted">
              {inspection()
                ? "No query params found."
                : "Enter a URL or query string to inspect its parts."}
            </ToolStatusMessage>
          </Show>
        </Card>
      </Show>
    </ToolContainer>
  );
}
