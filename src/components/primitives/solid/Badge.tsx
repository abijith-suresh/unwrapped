import type { JSX } from "solid-js";
import { cn } from "@/lib/cn";

type BadgeTone = "muted" | "success" | "warning" | "error";

export interface BadgeProps {
  tone?: BadgeTone;
  children?: JSX.Element;
  class?: string;
}

const toneStyles: Record<BadgeTone, string> = {
  muted: "border-[var(--border)] text-[var(--text-muted)] bg-[var(--bg-tertiary)]",
  success:
    "border-[var(--accent-success)] text-[var(--accent-success)] bg-[var(--accent-success)]/10",
  warning:
    "border-[var(--accent-warning)] text-[var(--accent-warning)] bg-[var(--accent-warning)]/10",
  error: "border-[var(--accent-error)] text-[var(--accent-error)] bg-[var(--accent-error)]/10",
};

export default function Badge(props: BadgeProps) {
  const tone = props.tone ?? "muted";

  return (
    <span
      class={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold",
        toneStyles[tone],
        props.class
      )}
    >
      {props.children}
    </span>
  );
}
