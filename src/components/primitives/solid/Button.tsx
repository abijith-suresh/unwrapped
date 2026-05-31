import type { JSX } from "solid-js";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  onClick?: JSX.EventHandlerUnion<HTMLButtonElement, MouseEvent>;
  type?: JSX.ButtonHTMLAttributes<HTMLButtonElement>["type"];
  children?: JSX.Element;
  class?: string;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--accent-primary)] text-[var(--bg-primary)] hover:brightness-110 disabled:opacity-50",
  secondary:
    "border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] disabled:opacity-50",
  ghost:
    "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] disabled:opacity-50",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-base",
};

export default function Button(props: ButtonProps) {
  const variant = props.variant ?? "primary";
  const size = props.size ?? "md";

  return (
    <button
      type={props.type ?? "button"}
      disabled={props.disabled}
      onClick={props.onClick}
      class={cn(
        "inline-flex items-center justify-center rounded-lg font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] cursor-pointer",
        variantStyles[variant],
        sizeStyles[size],
        props.class
      )}
    >
      {props.children}
    </button>
  );
}
