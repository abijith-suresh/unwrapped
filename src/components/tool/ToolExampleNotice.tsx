import { Show } from "solid-js";

export default function ToolExampleNotice(props: { when: boolean; label?: string }) {
  return (
    <Show when={props.when}>
      <div
        role="note"
        aria-label={props.label ?? "Example output"}
        class="inline-flex items-center rounded-full border border-[var(--border)] px-2 py-1 text-[0.6875rem] font-medium leading-none text-[var(--text-muted)]"
      >
        {props.label ?? "Example"}
      </div>
    </Show>
  );
}
