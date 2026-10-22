import { type JSX, Show, splitProps } from "solid-js";

import { cn } from "@/lib/cn";

type ToolBadgeTone = "muted" | "accent" | "success" | "warning" | "error";

interface ToolBadgeProps extends JSX.HTMLAttributes<HTMLSpanElement> {
  tone?: ToolBadgeTone;
  /** Show a small pulsing dot ahead of the label (e.g. "Comparing…"). */
  pulse?: boolean;
  children?: JSX.Element;
}

const TONE_CLASSES: Record<ToolBadgeTone, string> = {
  muted: "border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-muted)]",
  accent:
    "border-[var(--accent-primary)] bg-[color-mix(in_srgb,var(--accent-primary)_12%,var(--bg-secondary))] text-[var(--accent-primary)]",
  success:
    "border-[var(--accent-success)] bg-[color-mix(in_srgb,var(--accent-success)_10%,transparent)] text-[var(--accent-success)]",
  warning:
    "border-[color-mix(in_srgb,var(--accent-warning)_60%,transparent)] bg-[color-mix(in_srgb,var(--accent-warning)_10%,transparent)] text-[var(--accent-warning)]",
  error:
    "border-[var(--accent-error)] bg-[color-mix(in_srgb,var(--accent-error)_10%,transparent)] text-[var(--accent-error)]",
};

export default function ToolBadge(props: ToolBadgeProps) {
  const [local, rest] = splitProps(props, ["children", "class", "pulse", "tone"]);
  const tone = () => local.tone ?? "muted";

  return (
    <span
      {...rest}
      class={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[var(--fs-2xs)] font-semibold uppercase tracking-[0.1em] leading-none",
        TONE_CLASSES[tone()],
        local.class
      )}
    >
      <Show when={local.pulse}>
        <span
          aria-hidden="true"
          class={cn(
            "h-1.5 w-1.5 animate-pulse rounded-full",
            tone() === "muted" ? "bg-[var(--accent-primary)]" : "bg-current"
          )}
        />
      </Show>
      {local.children}
    </span>
  );
}
