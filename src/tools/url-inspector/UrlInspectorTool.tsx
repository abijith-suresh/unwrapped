import { createMemo, createSignal, createUniqueId, For, Show } from "solid-js";

import Card from "@/components/primitives/solid/Card";
import ToolStatusMessage from "@/components/ToolStatusMessage";
import ToolBadge from "@/components/tool/ToolBadge";
import ToolContainer from "@/components/tool/ToolContainer";
import ToolInputPanel from "@/components/tool/ToolInputPanel";
import ToolInspectorWorkspace from "@/components/tool/ToolInspectorWorkspace";
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
  const errorId = createUniqueId();
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
    <ToolContainer>
      <ToolInspectorWorkspace
        isExample={isExample()}
        error={error()}
        errorId={errorId}
        input={
          <ToolInputPanel
            compact
            label="URL or raw query string"
            value={input()}
            onInput={setInput}
            placeholder={EXAMPLE_URL}
            rows={5}
            error={!!error()}
            describedBy={error() ? errorId : undefined}
          />
        }
        fields={SECTION_LABELS.map(([key, label]) => ({ label, value: inspection()?.[key] ?? "" }))}
      >
        <Card class="flex flex-col gap-3">
          <div class="flex items-center justify-between gap-3">
            <h3 class="m-0 text-[var(--fs-label)] font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)]">
              Decoded query params
            </h3>
            <ToolBadge tone="muted">
              {inspection()?.kind === "query" ? "raw query" : "full url"}
            </ToolBadge>
          </div>

          <div class="overflow-auto">
            <table class="w-full table-fixed border-collapse">
              <thead>
                <tr class="border-b border-[var(--border)]">
                  <th class="w-[var(--space-8)] px-[var(--space-3)] py-[var(--space-2)] text-left text-[var(--fs-label)] font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)]">
                    #
                  </th>
                  <th class="w-[32%] px-[var(--space-3)] py-[var(--space-2)] text-left text-[var(--fs-label)] font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)]">
                    Key
                  </th>
                  <th class="px-[var(--space-3)] py-[var(--space-2)] text-left text-[var(--fs-label)] font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)]">
                    Value
                  </th>
                </tr>
              </thead>
              <tbody>
                <For each={inspection()?.queryParams ?? []}>
                  {(param, index) => (
                    <tr class="border-b border-[var(--border)] last:border-b-0">
                      <td class="px-[var(--space-3)] py-[var(--space-2)] align-top text-[var(--text-muted)]">
                        {index() + 1}
                      </td>
                      <td class="min-w-0 break-words px-[var(--space-3)] py-[var(--space-2)] align-top text-[var(--text-primary)]">
                        <code>{param.key || "—"}</code>
                      </td>
                      <td class="min-w-0 break-words px-[var(--space-3)] py-[var(--space-2)] align-top text-[var(--text-primary)]">
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
      </ToolInspectorWorkspace>
    </ToolContainer>
  );
}
