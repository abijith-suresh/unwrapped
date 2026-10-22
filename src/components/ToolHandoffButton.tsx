import { ArrowRight, CircleAlert } from "lucide-solid";
import { createMemo, createSignal, onMount, Show } from "solid-js";
import ToolMenu from "@/components/tool/ToolMenu";
import type { TextFormat } from "@/lib/download";
import { ICON_MAP } from "@/lib/iconMap";
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
  const items = createMemo(() =>
    targets().map((tool) => {
      const Icon = ICON_MAP[tool.icon];
      return {
        id: tool.id,
        label: tool.name,
        icon: Icon ? (
          <Icon size={16} class="text-[var(--text-secondary)]" aria-hidden="true" />
        ) : undefined,
      };
    })
  );

  async function handoff(id: string) {
    setPending(true);
    setFailed(false);
    try {
      await openToolHandoff({
        sourceId: sourceId(),
        targetId: id,
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
      <ToolMenu
        label={props.label ?? "Open output in another tool"}
        title={failed() ? "Could not open the tool. Try again." : "Open in another tool"}
        disabled={pending()}
        items={items()}
        onSelect={(item) => void handoff(item.id)}
      >
        <Show when={!failed()} fallback={<CircleAlert size={16} aria-hidden="true" />}>
          <ArrowRight size={16} aria-hidden="true" />
        </Show>
        <span class={props.compact ? "hidden sm:inline" : undefined}>
          {failed() ? "Retry open…" : "Open in…"}
        </span>
      </ToolMenu>
      <Show when={failed()}>
        <span role="alert" class="sr-only">
          Could not open the tool. Try again.
        </span>
      </Show>
    </Show>
  );
}
