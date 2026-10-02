import { Show } from "solid-js";

export default function ToolExampleNotice(props: { when: boolean; label?: string }) {
  return (
    <Show when={props.when}>
      <div
        role="note"
        aria-label={props.label ?? "Example output"}
        class="text-xs font-medium leading-relaxed text-[var(--text-muted)]"
      >
        {props.label ?? "Example"}
      </div>
    </Show>
  );
}
