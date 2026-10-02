import { createMemo, createSignal, For, Index, Show } from "solid-js";
import CopyButton from "@/components/CopyButton";
import Input from "@/components/primitives/solid/Input";
import Label from "@/components/primitives/solid/Label";
import ToolActionButton from "@/components/ToolActionButton";
import ToolStatusMessage from "@/components/ToolStatusMessage";
import ToolCodeBlock from "@/components/tool/ToolCodeBlock";
import ToolContainer from "@/components/tool/ToolContainer";
import ToolExampleNotice from "@/components/tool/ToolExampleNotice";
import ToolPanel from "@/components/tool/ToolPanel";
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
      <ToolPanel
        title="Import query"
        description="Paste a full URL, relative URL with ?, or raw query string."
      >
        <Input
          label="URL or query string"
          value={source()}
          placeholder={EXAMPLE_QUERY}
          autocomplete="off"
          onInput={(value) => {
            setSource(value);
            setDocument(parseQuery(""));
            setEditing(false);
          }}
        />
        <ToolActionButton
          disabled={source() === ""}
          onClick={() => {
            setDocument(parseQuery(source()));
            setEditing(true);
          }}
        >
          Load parameters
        </ToolActionButton>
        <ToolActionButton onClick={clear}>Clear inputs</ToolActionButton>
      </ToolPanel>
      <ToolExampleNotice when={isExample()} />
      <ToolPanel title="Parameters" description="Duplicate keys and parameter order are preserved.">
        <div class="flex flex-col gap-3">
          <Show
            when={isExample()}
            fallback={
              <Index each={document().entries}>
                {(entry, index) => (
                  <div class="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
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
                      aria-label={`Remove parameter ${index + 1}`}
                      onClick={() =>
                        setDocument((current) => ({
                          ...current,
                          entries: current.entries.filter((_, i) => i !== index),
                        }))
                      }
                    >
                      Remove
                    </ToolActionButton>
                  </div>
                )}
              </Index>
            }
          >
            <For each={exampleDocument.entries}>
              {(entry, index) => (
                <div class="grid gap-2 sm:grid-cols-2">
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
      <ToolPanel
        title="Encoded result"
        actions={
          <Show when={!isExample()}>
            <CopyButton text={output()} label="Copy result" />
          </Show>
        }
      >
        <ToolCodeBlock>{output()}</ToolCodeBlock>
      </ToolPanel>
      <ToolStatusMessage tone="muted">
        Spaces encode as +. A literal + encodes as %2B. The path and fragment stay intact. Editing
        does not open the URL.
      </ToolStatusMessage>
    </ToolContainer>
  );
}
