import { X } from "lucide-solid";
import { createMemo, createSignal, For, Index, Show } from "solid-js";
import Input from "@/components/primitives/solid/Input";
import Label from "@/components/primitives/solid/Label";
import ToolActionButton from "@/components/ToolActionButton";
import ToolCodeBlock from "@/components/tool/ToolCodeBlock";
import ToolContainer from "@/components/tool/ToolContainer";
import ToolInputPanel from "@/components/tool/ToolInputPanel";
import ToolInspectorWorkspace from "@/components/tool/ToolInspectorWorkspace";
import ToolPanel from "@/components/tool/ToolPanel";
import ToolResultList from "@/components/tool/ToolResultList";
import { EXAMPLE_QUERY } from "@/lib/exampleData";
import { buildQuery, parseQuery, type QueryDocument } from "@/lib/queryString";
export default function Tool() {
  const [source, setSource] = createSignal("");
  const [document, setDocument] = createSignal<QueryDocument>(parseQuery(""));
  const [editing, setEditing] = createSignal(false);
  const exampleDocument = parseQuery(EXAMPLE_QUERY);
  const isExample = () => source() === "" && !editing();
  const output = createMemo(() => buildQuery(isExample() ? exampleDocument : document()));
  function clear() {
    setSource("");
    setDocument(parseQuery(""));
    setEditing(false);
  }
  function update(index: number, field: "key" | "value", value: string) {
    setDocument((current) => ({
      ...current,
      entries: current.entries.map((entry, i) =>
        i === index ? { ...entry, [field]: value } : entry
      ),
    }));
  }
  return (
    <ToolContainer>
      <ToolInspectorWorkspace
        isExample={isExample()}
        input={
          <ToolInputPanel
            compact
            label="URL or query string"
            actions={<ToolActionButton onClick={clear}>Clear inputs</ToolActionButton>}
            value={source()}
            onInput={(value) => {
              setSource(value);
              setDocument(parseQuery(value));
              setEditing(false);
            }}
            placeholder={EXAMPLE_QUERY}
            rows={3}
          />
        }
      >
        <ToolPanel
          title="Parameters"
          description="Duplicate keys and parameter order are preserved."
        >
          <div class="flex flex-col gap-3">
            <Show
              when={isExample()}
              fallback={
                <div class="tool-appear flex flex-col gap-3">
                  <Index each={document().entries}>
                    {(entry, index) => (
                      <div class="grid grid-cols-[1fr_1fr_auto] items-end gap-[var(--space-3)]">
                        <Input
                          label={`Key ${index + 1}`}
                          value={entry().key}
                          placeholder="tag"
                          autocomplete="off"
                          onInput={(value) => update(index, "key", value)}
                        />
                        <Input
                          label={`Value ${index + 1}`}
                          value={entry().value}
                          placeholder="one"
                          autocomplete="off"
                          onInput={(value) => update(index, "value", value)}
                        />
                        <ToolActionButton
                          variant="ghost"
                          aria-label={`Remove parameter ${index + 1}`}
                          style={{ "padding-inline": "0", width: "var(--size-control)" }}
                          onClick={() =>
                            setDocument((current) => ({
                              ...current,
                              entries: current.entries.filter((_, i) => i !== index),
                            }))
                          }
                        >
                          <X size={16} aria-hidden="true" />
                        </ToolActionButton>
                      </div>
                    )}
                  </Index>
                </div>
              }
            >
              <div class="tool-appear flex flex-col gap-3">
                <For each={exampleDocument.entries}>
                  {(entry, index) => (
                    <div class="grid gap-[var(--space-3)] sm:grid-cols-2">
                      <div class="flex flex-col gap-1.5">
                        <Label>Key {index() + 1}</Label>
                        <ToolCodeBlock class="!min-h-0">{entry.key}</ToolCodeBlock>
                      </div>
                      <div class="flex flex-col gap-1.5">
                        <Label>Value {index() + 1}</Label>
                        <ToolCodeBlock class="!min-h-0">{entry.value}</ToolCodeBlock>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </Show>
            <ToolActionButton
              onClick={() => {
                setEditing(true);
                setDocument((current) => ({
                  ...current,
                  entries: [...current.entries, { key: "", value: "" }],
                }));
              }}
            >
              Add parameter
            </ToolActionButton>
          </div>
        </ToolPanel>
        <ToolResultList
          fields={[{ label: "Encoded result", value: output(), copyLabel: "Copy result" }]}
          isExample={isExample()}
          layout="rows"
        />
      </ToolInspectorWorkspace>
    </ToolContainer>
  );
}
