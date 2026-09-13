import { type JSX, splitProps } from "solid-js";

import { cn } from "@/lib/cn";

export type ToolActionButtonVariant = "primary" | "secondary" | "ghost" | "toggle" | "segment";

interface ToolActionButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  variant?: ToolActionButtonVariant;
}

const VARIANT_CLASSES: Record<ToolActionButtonVariant, string> = {
  primary:
    "border-transparent bg-[var(--accent-primary)] text-[var(--bg-primary)] hover:bg-[var(--accent-secondary)]",
  secondary:
    "border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]",
  ghost:
    "border-transparent bg-transparent text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]",
  toggle:
    "border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]",
  segment:
    "border-transparent bg-transparent text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]",
};

const TOGGLE_ACTIVE_CLASSES =
  "border-[var(--accent-primary)] bg-[color-mix(in_srgb,var(--accent-primary)_12%,transparent)] text-[var(--accent-primary)]";

const SEGMENT_ACTIVE_CLASSES =
  "border-transparent bg-[var(--accent-primary)] text-[var(--bg-primary)] shadow-sm hover:bg-[var(--accent-secondary)]";

const BASE_CLASSES =
  "inline-flex min-h-9 items-center justify-center rounded-[var(--radius-control)] border px-3.5 py-2 text-[0.8125rem] font-semibold leading-none whitespace-nowrap cursor-pointer touch-manipulation transition-[background-color,border-color,color,box-shadow] duration-150 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50";

type PressedState = boolean | "true" | "false" | "mixed" | undefined;

function getButtonClasses(variant: ToolActionButtonVariant, pressed: PressedState): string {
  const isPressed = pressed === true || pressed === "true";

  if (isPressed && variant === "toggle") {
    return TOGGLE_ACTIVE_CLASSES;
  }

  if (isPressed && variant === "segment") {
    return SEGMENT_ACTIVE_CLASSES;
  }

  return VARIANT_CLASSES[variant];
}

export default function ToolActionButton(props: ToolActionButtonProps) {
  const [local, rest] = splitProps(props, [
    "active",
    "aria-pressed",
    "class",
    "style",
    "type",
    "variant",
  ]);

  return (
    <button
      {...rest}
      type={local.type ?? "button"}
      aria-pressed={local.active ?? local["aria-pressed"]}
      class={cn(
        BASE_CLASSES,
        getButtonClasses(local.variant ?? "secondary", local.active ?? local["aria-pressed"]),
        local.class
      )}
      style={local.style}
    />
  );
}
