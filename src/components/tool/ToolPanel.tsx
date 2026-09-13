import { type JSX, Show, splitProps } from "solid-js";

import { cn } from "@/lib/cn";

type ToolPanelTone = "default" | "error";

export interface ToolPanelProps extends JSX.HTMLAttributes<HTMLElement> {
  title: string;
  description?: string;
  actions?: JSX.Element;
  tone?: ToolPanelTone;
  bodyClass?: string;
  children?: JSX.Element;
}

const TONE_CLASSES: Record<ToolPanelTone, string> = {
  default: "border-[var(--border)] bg-[var(--bg-secondary)]",
  error:
    "border-[var(--accent-error)] bg-[color-mix(in_srgb,var(--accent-error)_10%,var(--bg-secondary))]",
};

export default function ToolPanel(props: ToolPanelProps) {
  const [local, rest] = splitProps(props, [
    "actions",
    "bodyClass",
    "children",
    "class",
    "description",
    "title",
    "tone",
  ]);
  const tone = local.tone ?? "default";

  return (
    <section
      {...rest}
      aria-label={local.title}
      class={cn(
        "min-w-0 overflow-hidden rounded-[var(--radius-panel)] border",
        TONE_CLASSES[tone],
        local.class
      )}
    >
      <header class="flex min-w-0 shrink-0 flex-wrap items-start justify-between gap-4 border-b border-[var(--border)] px-4 py-3">
        <div class="min-w-0">
          <h2
            class={cn(
              "m-0 text-xs font-semibold uppercase tracking-[0.12em]",
              tone === "error" ? "text-[var(--accent-error)]" : "text-[var(--text-secondary)]"
            )}
          >
            {local.title}
          </h2>
          <Show when={local.description}>
            {(description) => (
              <p class="m-0 mt-1 text-xs leading-relaxed text-[var(--text-muted)]">
                {description()}
              </p>
            )}
          </Show>
        </div>

        <Show when={local.actions}>
          {(actions) => <div class="flex shrink-0 items-center gap-2">{actions()}</div>}
        </Show>
      </header>

      <div class={cn("min-h-0 min-w-0 p-3 sm:p-4", local.bodyClass)}>{local.children}</div>
    </section>
  );
}
