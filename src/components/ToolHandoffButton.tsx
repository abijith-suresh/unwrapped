import { ArrowRight, CircleAlert } from "lucide-solid";
import { createMemo, createSignal, For, onMount, Show } from "solid-js";
import type { TextFormat } from "@/lib/download";
import { getHandoffTargets, openToolHandoff } from "@/lib/toolHandoff";

interface Props {
  value: string;
  format?: TextFormat;
  compact?: boolean;
  label?: string;
}

export default function ToolHandoffButton(props: Props) {
  const [sourceId, setSourceId] = createSignal("");
  const [pending, setPending] = createSignal(false);
  const [failed, setFailed] = createSignal(false);
  onMount(() => {
    setSourceId(document.querySelector<HTMLElement>("[data-tool-id]")?.dataset.toolId ?? "");
  });
  const targets = createMemo(() => getHandoffTargets(sourceId(), props.format ?? "text"));
  async function open(select: HTMLSelectElement) {
    const targetId = select.value;
    select.value = "";
    if (!targetId || pending()) return;
    setPending(true);
    setFailed(false);
    try {
      await openToolHandoff({
        sourceId: sourceId(),
        targetId,
        value: props.value,
        format: props.format ?? "text",
      });
    } catch {
      setFailed(true);
    } finally {
      setPending(false);
    }
  }
  return (
    <Show when={props.value && targets().length > 0}>
      <div class="relative inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg-secondary)] px-3 text-[0.8125rem] font-semibold text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--focus-ring)]">
        {failed() ? (
          <CircleAlert size={16} aria-hidden="true" />
        ) : (
          <ArrowRight size={16} aria-hidden="true" />
        )}
        <span class={props.compact ? "hidden sm:inline" : undefined}>
          {failed() ? "Retry open…" : "Open in…"}
        </span>
        <select
          value=""
          aria-label={props.label ?? "Open output in another tool"}
          title={failed() ? "Could not open the tool. Try again." : "Open in another tool"}
          disabled={pending()}
          onChange={(event) => void open(event.currentTarget)}
          class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        >
          <option value="" disabled>
            Open in…
          </option>
          <For each={targets()}>{(tool) => <option value={tool.id}>{tool.name}</option>}</For>
        </select>
      </div>
      <Show when={failed()}>
        <span role="alert" class="sr-only">
          Could not open the tool. Try again.
        </span>
      </Show>
    </Show>
  );
}
