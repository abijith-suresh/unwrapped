import { createMemo, createSignal, Index } from "solid-js";
import CopyButton from "@/components/CopyButton";
import Input from "@/components/primitives/solid/Input";
import ToolActionButton from "@/components/ToolActionButton";
import ToolStatusMessage from "@/components/ToolStatusMessage";
import ToolCodeBlock from "@/components/tool/ToolCodeBlock";
import ToolContainer from "@/components/tool/ToolContainer";
import ToolPanel from "@/components/tool/ToolPanel";
import { buildQuery, parseQuery, type QueryDocument } from "@/lib/queryString";
export default function Tool() {
  const [source, setSource] = createSignal(
    "https://example.com/search?q=hello+world&tag=one&tag=two#results"
  );
  const [document, setDocument] = createSignal<QueryDocument>(parseQuery(source()));
  const output = createMemo(() => buildQuery(document()));
  function update(index: number, field: "key" | "value", value: string) {
    setDocument((current) => ({
      ...current,
      entries: current.entries.map((entry, i) =>
        i === index ? { ...entry, [field]: value } : entry
      ),
    }));
  }
  return (
    <ToolContainer width="wide">
      <ToolPanel
        title="Import query"
        description="Paste a full URL, relative URL with ?, or raw query string."
      >
        <Input
          label="URL or query string"
          value={source()}
          autocomplete="off"
          onInput={setSource}
        />
        <ToolActionButton onClick={() => setDocument(parseQuery(source()))}>
          Load parameters
        </ToolActionButton>
      </ToolPanel>
      <ToolPanel title="Parameters" description="Duplicate keys and parameter order are preserved.">
        <div class="flex flex-col gap-3">
          <Index each={document().entries}>
            {(entry, index) => (
              <div class="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                <Input
                  label={`Key ${index + 1}`}
                  value={entry().key}
                  autocomplete="off"
                  onInput={(value) => update(index, "key", value)}
                />
                <Input
                  label={`Value ${index + 1}`}
                  value={entry().value}
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
          <ToolActionButton
            onClick={() =>
              setDocument((current) => ({
                ...current,
                entries: [...current.entries, { key: "", value: "" }],
              }))
            }
          >
            Add parameter
          </ToolActionButton>
        </div>
      </ToolPanel>
      <ToolPanel
        title="Encoded result"
        actions={<CopyButton text={output()} label="Copy result" />}
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
