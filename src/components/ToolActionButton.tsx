import { type JSX, splitProps } from "solid-js";

import { cn } from "@/lib/cn";

type ToolActionButtonVariant = "primary" | "secondary" | "ghost";

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
};

const ACTIVE_CLASSES =
  "border-[var(--accent-primary)] bg-[color-mix(in_srgb,var(--accent-primary)_12%,transparent)] text-[var(--accent-primary)]";

const BASE_CLASSES =
  "inline-flex min-h-9 items-center justify-center rounded-[var(--radius-control)] border px-3.5 py-2 text-[0.8125rem] font-semibold leading-none whitespace-nowrap cursor-pointer touch-manipulation transition-[background-color,border-color,color,box-shadow] duration-150 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50";

function getActiveClasses(variant: ToolActionButtonVariant, active: boolean | undefined): string {
  if (!active || variant === "primary") {
    return "";
  }

  return ACTIVE_CLASSES;
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
  const variant = local.variant ?? "secondary";
  const pressed = local.active ?? local["aria-pressed"];

  return (
    <button
      {...rest}
      type={local.type ?? "button"}
      aria-pressed={pressed}
      class={cn(
        BASE_CLASSES,
        VARIANT_CLASSES[variant],
        getActiveClasses(variant, local.active),
        local.class
      )}
      style={local.style}
    />
  );
}
