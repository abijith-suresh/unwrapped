import { createMemo, createSignal, For, Show } from "solid-js";
import CopyButton from "@/components/CopyButton";
import Input from "@/components/primitives/solid/Input";
import ToolStatusMessage from "@/components/ToolStatusMessage";
import ToolContainer from "@/components/tool/ToolContainer";
import ToolInspectorWorkspace from "@/components/tool/ToolInspectorWorkspace";
import ToolSegmentedControl from "@/components/tool/ToolSegmentedControl";
import ToolToolbar from "@/components/tool/ToolToolbar";
import {
  type HttpStatusCategory,
  type HttpStatusCodeEntry,
  searchHttpStatusCodes,
} from "@/lib/httpStatusCodes";

type CategoryFilter = "all" | HttpStatusCategory;

interface Section {
  category: HttpStatusCategory;
  label: string;
  entries: HttpStatusCodeEntry[];
}

const CATEGORY_ORDER: { category: HttpStatusCategory; label: string }[] = [
  { category: "Informational", label: "Informational" },
  { category: "Success", label: "Successful" },
  { category: "Redirection", label: "Redirection" },
  { category: "Client Error", label: "Client Error" },
  { category: "Server Error", label: "Server Error" },
];

function StatusRow(props: { entry: HttpStatusCodeEntry }) {
  return (
    <li
      style={{
        display: "grid",
        "grid-template-columns": "var(--ref-term-width) minmax(0,1fr) auto",
        gap: "var(--space-4)",
        padding: "var(--space-3) var(--space-4)",
      }}
      class="min-w-0 items-center border-b border-[var(--border)] last:border-b-0"
    >
      <div class="min-w-0">
        <div
          class="truncate font-mono font-semibold text-[var(--text-primary)]"
          style={{ "font-size": "var(--fs-body)" }}
          title={String(props.entry.code)}
        >
          {props.entry.code}
        </div>
        <div
          class="truncate font-mono text-[var(--text-muted)]"
          style={{ "font-size": "var(--fs-2xs)" }}
          title={props.entry.name}
        >
          {props.entry.name}
        </div>
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
          title={`${props.entry.code} ${props.entry.name}`}
        >
          {props.entry.code} {props.entry.name}
        </code>
      </div>
      <CopyButton
        text={`${props.entry.code} ${props.entry.name}`}
        label={`Copy ${props.entry.code} ${props.entry.name}`}
        compact
      />
    </li>
  );
}

export default function HttpStatusCodesTool() {
  const [query, setQuery] = createSignal("");
  const [category, setCategory] = createSignal<CategoryFilter>("all");
  const results = createMemo(() => searchHttpStatusCodes(query()));
  const entries = createMemo(() => {
    const selected = category();
    if (selected === "all") return results();
    return results().filter((entry) => entry.category === selected);
  });
  const sections = createMemo<Section[]>(() => {
    const filtered = entries();
    return CATEGORY_ORDER.map(({ category: cat, label }) => ({
      category: cat,
      label,
      entries: filtered.filter((entry) => entry.category === cat),
    })).filter((section) => section.entries.length > 0);
  });

  return (
    <ToolContainer>
      <ToolInspectorWorkspace
        input={
          <>
            <Input
              label="Search by code or name"
              value={query()}
              onInput={setQuery}
              placeholder="Try 404, unprocessable, or redirect…"
              type="search"
              autocomplete="off"
            />
            <ToolToolbar label="Status category">
              <ToolSegmentedControl
                label="Status category"
                hideLabel
                value={category()}
                onChange={(value) => setCategory(value as CategoryFilter)}
                options={[
                  { value: "all", label: "All" },
                  ...CATEGORY_ORDER.map(({ category: cat, label }) => ({
                    value: cat,
                    label,
                  })),
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
          <div class="flex min-w-0 flex-col gap-4" style={{ "--ref-term-width": "5rem" }}>
            <For each={sections()}>
              {(section) => (
                <section
                  aria-labelledby={`status-${section.category.replace(/\s+/g, "-").toLowerCase()}`}
                  class="min-w-0 overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--bg-secondary)]"
                >
                  <h2
                    id={`status-${section.category.replace(/\s+/g, "-").toLowerCase()}`}
                    class="m-0 border-b border-[var(--border)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)]"
                  >
                    {section.label}
                  </h2>
                  <ul class="m-0 list-none p-0">
                    <For each={section.entries}>{(entry) => <StatusRow entry={entry} />}</For>
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
