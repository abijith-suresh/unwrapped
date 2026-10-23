import { createMemo, createSignal, For, Show } from "solid-js";
import CopyButton from "@/components/CopyButton";
import Input from "@/components/primitives/solid/Input";
import ToolStatusMessage from "@/components/ToolStatusMessage";
import ToolContainer from "@/components/tool/ToolContainer";
import ToolInspectorWorkspace from "@/components/tool/ToolInspectorWorkspace";
import ToolSegmentedControl from "@/components/tool/ToolSegmentedControl";
import ToolToolbar from "@/components/tool/ToolToolbar";
import {
  type NetworkReferenceEntry,
  type ReferenceKind,
  searchNetworkReference,
} from "@/lib/networkReference";

interface Section {
  label: string;
  entries: NetworkReferenceEntry[];
}

const KIND_SECTIONS: { value: ReferenceKind; label: string }[] = [
  { value: "dns", label: "DNS records" },
  { value: "headers", label: "HTTP headers" },
];

function ReferenceRow(props: { entry: NetworkReferenceEntry }) {
  return (
    <li class="grid min-w-0 grid-cols-1 items-center gap-2 border-b border-[var(--border)] px-3 py-2 last:border-b-0 sm:grid-cols-[minmax(6rem,9rem)_minmax(0,1fr)_auto] sm:gap-4 sm:px-4 sm:py-3">
      <div
        class="min-w-0 truncate font-mono font-semibold text-[var(--text-primary)]"
        style={{ "font-size": "var(--fs-body)" }}
        title={props.entry.name}
      >
        {props.entry.name}
      </div>
      <div class="flex min-w-0 flex-col gap-[var(--space-2)]">
        <p
          class="m-0 min-w-0 leading-relaxed text-[var(--text-secondary)]"
          style={{ "font-size": "var(--fs-body)" }}
        >
          {props.entry.description}
        </p>
        <code
          class="min-w-0 truncate font-mono text-[var(--text-secondary)]"
          style={{ "font-size": "var(--fs-control)" }}
          title={props.entry.example}
        >
          {props.entry.example}
        </code>
        <a
          href={props.entry.source}
          target="_blank"
          rel="noopener noreferrer"
          class="w-fit text-[var(--fs-2xs)] text-[var(--accent-secondary)] underline decoration-dotted underline-offset-2 transition-colors duration-[var(--motion-fast)] ease-[var(--motion-ease-standard)] hover:text-[var(--accent-primary)]"
        >
          Source
        </a>
      </div>
      <CopyButton text={props.entry.example} label={`Copy ${props.entry.name} example`} compact />
    </li>
  );
}

export default function Tool() {
  const [query, setQuery] = createSignal("");
  const [kind, setKind] = createSignal<ReferenceKind>("all");
  const entries = createMemo(() => searchNetworkReference(query(), kind()));
  const sections = createMemo<Section[]>(() => {
    const filtered = entries();
    return KIND_SECTIONS.map((section) => ({
      label: section.label,
      entries: filtered.filter((entry) => entry.kind === section.value),
    })).filter((section) => section.entries.length > 0);
  });

  return (
    <ToolContainer>
      <ToolInspectorWorkspace
        input={
          <>
            <Input
              label="Search record types or headers"
              value={query()}
              onInput={setQuery}
              autocomplete="off"
              type="search"
              placeholder="IPv6"
            />
            <ToolToolbar label="Reference category">
              <ToolSegmentedControl
                label="Reference category"
                hideLabel
                value={kind()}
                onChange={setKind}
                options={[
                  { value: "all", label: "All" },
                  { value: "dns", label: "DNS records" },
                  { value: "headers", label: "HTTP headers" },
                ]}
              />
            </ToolToolbar>
          </>
        }
      >
        <ToolStatusMessage tone="muted">{entries().length} entries shown</ToolStatusMessage>
        <Show
          when={entries().length}
          fallback={<ToolStatusMessage tone="muted">No matching entries.</ToolStatusMessage>}
        >
          <div class="flex min-w-0 flex-col gap-4">
            <For each={sections()}>
              {(section) => (
                <section
                  aria-labelledby={`reference-${section.label.replace(/\s+/g, "-").toLowerCase()}`}
                  class="min-w-0 overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--bg-secondary)]"
                >
                  <h2
                    id={`reference-${section.label.replace(/\s+/g, "-").toLowerCase()}`}
                    class="m-0 border-b border-[var(--border)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)]"
                  >
                    {section.label}
                  </h2>
                  <ul class="m-0 list-none p-0">
                    <For each={section.entries}>{(entry) => <ReferenceRow entry={entry} />}</For>
                  </ul>
                </section>
              )}
            </For>
          </div>
        </Show>
      </ToolInspectorWorkspace>
    </ToolContainer>
  );
}
