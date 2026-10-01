import { Show } from "solid-js";

export default function ToolExampleNotice(props: { when: boolean; label?: string }) {
  return (
    <Show when={props.when}>
      <div
        role="note"
        aria-label={props.label ?? "Example output"}
        class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs leading-relaxed text-[var(--text-muted)]"
      >
        <span class="rounded border border-[var(--border)] bg-[var(--bg-secondary)] px-2 py-1 font-semibold text-[var(--text-secondary)]">
          {props.label ?? "Example output"}
        </span>
        <span>Type or paste your input to see your results.</span>
      </div>
    </Show>
  );
}
