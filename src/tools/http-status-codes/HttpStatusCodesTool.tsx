import { createMemo, createSignal, For } from "solid-js";
import CopyButton from "@/components/CopyButton";
import Card from "@/components/primitives/solid/Card";
import Input from "@/components/primitives/solid/Input";
import Label from "@/components/primitives/solid/Label";
import ToolStatusMessage from "@/components/ToolStatusMessage";
import ToolContainer from "@/components/tool/ToolContainer";
import ToolInspectorWorkspace from "@/components/tool/ToolInspectorWorkspace";
import { searchHttpStatusCodes } from "@/lib/httpStatusCodes";

export default function HttpStatusCodesTool() {
  const [query, setQuery] = createSignal("");
  const results = createMemo(() => searchHttpStatusCodes(query()));

  return (
    <ToolContainer>
      <ToolInspectorWorkspace
        input={
          <Input
            label="Search by code or name"
            value={query()}
            onInput={setQuery}
            placeholder="Try 404, unprocessable, or redirect…"
            type="search"
          />
        }
      >
        <ToolStatusMessage tone="muted">
          {results().length.toLocaleString()} status code{results().length === 1 ? "" : "s"} shown.
        </ToolStatusMessage>

        <div class="flex flex-col gap-3">
          <For each={results()}>
            {(entry) => (
              <Card class="flex flex-col gap-2 p-4">
                <div class="flex min-w-0 flex-wrap items-start justify-between gap-3">
                  <div class="flex min-w-0 flex-1 flex-col gap-1">
                    <div class="flex min-w-0 flex-wrap gap-2.5 items-baseline">
                      <strong class="text-[var(--text-primary)] text-[1.375rem]">
                        {entry.code}
                      </strong>
                      <span class="text-[var(--text-primary)] text-base">{entry.name}</span>
                    </div>
                    <Label>{entry.category}</Label>
                  </div>
                  <CopyButton
                    text={`${entry.code} ${entry.name}`}
                    label={`Copy ${entry.code} ${entry.name}`}
                  />
                </div>
                <p class="m-0 text-[var(--text-secondary)] leading-[1.6]">{entry.description}</p>
              </Card>
            )}
          </For>
        </div>
      </ToolInspectorWorkspace>
    </ToolContainer>
  );
}
