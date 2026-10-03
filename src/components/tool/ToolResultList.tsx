import { For, Show } from "solid-js";
import CopyButton from "@/components/CopyButton";
import ToolPanel from "@/components/tool/ToolPanel";

export interface ToolResultField {
  label: string;
  value: string;
  copyLabel?: string;
  metric?: boolean;
  copy?: boolean;
}
interface Props {
  fields: readonly ToolResultField[];
  isExample?: boolean;
  layout?: "grid" | "rows";
}

export default function ToolResultList(props: Props) {
  return (
    <div
      class={
        props.layout === "rows"
          ? "flex min-w-0 flex-col gap-3"
          : "grid min-w-0 grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-3"
      }
    >
      <For each={props.fields}>
        {(field) => (
          <ToolPanel
            title={field.label}
            actions={
              <Show when={!props.isExample && field.value && !field.metric && field.copy !== false}>
                <CopyButton text={field.value} label={field.copyLabel ?? `Copy ${field.label}`} />
              </Show>
            }
          >
            <Show
              when={field.metric}
              fallback={
                <pre class="m-0 whitespace-pre-wrap break-all font-mono text-sm leading-relaxed text-[var(--text-primary)]">
                  {field.value || "—"}
                </pre>
              }
            >
              <strong class="text-[1.625rem] leading-tight text-[var(--text-primary)]">
                {field.value}
              </strong>
            </Show>
          </ToolPanel>
        )}
      </For>
    </div>
  );
}
