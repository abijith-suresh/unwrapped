import { createMemo, createSignal, For, Show } from "solid-js";
import CopyButton from "@/components/CopyButton";
import Input from "@/components/primitives/solid/Input";
import ToolActionButton from "@/components/ToolActionButton";
import ToolStatusMessage from "@/components/ToolStatusMessage";
import ToolCodeBlock from "@/components/tool/ToolCodeBlock";
import ToolContainer from "@/components/tool/ToolContainer";
import ToolPanel from "@/components/tool/ToolPanel";
import ToolToolbar from "@/components/tool/ToolToolbar";
import { type ReferenceKind, searchNetworkReference } from "@/lib/networkReference";
export default function Tool() {
  const [query, setQuery] = createSignal("");
  const [kind, setKind] = createSignal<ReferenceKind>("all");
  const entries = createMemo(() => searchNetworkReference(query(), kind()));
  return (
    <ToolContainer width="wide">
      <Input
        label="Search record types or headers"
        value={query()}
        onInput={setQuery}
        autocomplete="off"
        placeholder="IPv6"
      />
      <ToolToolbar label="Reference category">
        <ToolActionButton active={kind() === "all"} onClick={() => setKind("all")}>
          All
        </ToolActionButton>
        <ToolActionButton active={kind() === "dns"} onClick={() => setKind("dns")}>
          DNS records
        </ToolActionButton>
        <ToolActionButton active={kind() === "headers"} onClick={() => setKind("headers")}>
          HTTP headers
        </ToolActionButton>
      </ToolToolbar>
      <ToolStatusMessage tone="muted">
        {entries().length} results. Bundled reference checked on October 1, 2026. Examples use
        placeholder domains and addresses. No DNS queries or HTTP requests are made. Source links
        open external documentation when selected.
      </ToolStatusMessage>
      <Show
        when={entries().length}
        fallback={<ToolStatusMessage tone="muted">No matching entries.</ToolStatusMessage>}
      >
        <div class="grid gap-4 md:grid-cols-2">
          <For each={entries()}>
            {(entry) => (
              <ToolPanel
                title={entry.name}
                description={entry.kind === "dns" ? "DNS record" : "HTTP header"}
                actions={<CopyButton text={entry.example} label={`Copy ${entry.name} example`} />}
              >
                <p class="mt-0 text-sm text-[var(--text-secondary)]">{entry.description}</p>
                <ToolCodeBlock class="!min-h-0">{entry.example}</ToolCodeBlock>
                <a
                  href={entry.source}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-block mt-3 text-sm text-[var(--accent-primary)] underline"
                >
                  {entry.kind === "dns" ? "IANA source" : "MDN source"}
                </a>
              </ToolPanel>
            )}
          </For>
        </div>
      </Show>
    </ToolContainer>
  );
}
