import { For, type JSX, Show, splitProps } from "solid-js";

import { cn } from "@/lib/cn";
import type { CodeHighlightSegment } from "@/lib/codeHighlight";

export interface ToolCodeBlockProps extends JSX.HTMLAttributes<HTMLPreElement> {
  empty?: string;
  fill?: boolean;
  segments?: readonly CodeHighlightSegment[];
  children?: JSX.Element;
}

const SEGMENT_CLASSES: Record<CodeHighlightSegment["kind"], string> = {
  plain: "",
  "json-key": "font-semibold text-[var(--text-primary)]",
  "json-string": "text-[var(--accent-success)]",
  "json-number": "text-[var(--accent-primary)]",
  "json-boolean": "text-[var(--accent-warning)]",
  "json-null": "text-[var(--text-muted)]",
  match: "",
};

export default function ToolCodeBlock(props: ToolCodeBlockProps) {
  const [local, rest] = splitProps(props, [
    "children",
    "class",
    "empty",
    "fill",
    "segments",
    "tabIndex",
  ]);

  return (
    <pre
      {...rest}
      tabindex={local.tabIndex ?? 0}
      class={cn(
        "m-0 min-w-0 overflow-auto rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg-primary)] p-4 text-sm leading-relaxed text-[var(--text-primary)] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]",
        local.fill ? "min-h-0 flex-1" : "min-h-[16rem] md:min-h-[22rem]",
        local.class
      )}
    >
      <Show
        when={local.segments !== undefined}
        fallback={local.children ?? local.empty ?? "No output yet."}
      >
        <For each={local.segments ?? []}>
          {(segment) => (
            <Show
              when={segment.kind === "match"}
              fallback={<span class={SEGMENT_CLASSES[segment.kind]}>{segment.text}</span>}
            >
              <mark class="rounded-[2px] bg-[color-mix(in_srgb,var(--accent-primary)_30%,transparent)] text-inherit">
                {segment.text}
              </mark>
            </Show>
          )}
        </For>
      </Show>
    </pre>
  );
}
