import { type JSX, splitProps } from "solid-js";

import { cn } from "@/lib/cn";

type ToolToastTone = "error" | "success" | "warning";

export interface ToolToastProps extends JSX.HTMLAttributes<HTMLDivElement> {
  message: string;
  open: boolean;
  tone?: ToolToastTone;
}

const TONE_CLASSES: Record<ToolToastTone, string> = {
  error:
    "border-[var(--accent-error)] bg-[color-mix(in_srgb,var(--accent-error)_12%,var(--bg-secondary))] text-[var(--accent-error)]",
  success:
    "border-[var(--accent-success)] bg-[color-mix(in_srgb,var(--accent-success)_12%,var(--bg-secondary))] text-[var(--accent-success)]",
  warning:
    "border-[var(--accent-warning)] bg-[color-mix(in_srgb,var(--accent-warning)_12%,var(--bg-secondary))] text-[var(--accent-warning)]",
};

export default function ToolToast(props: ToolToastProps) {
  const [local, rest] = splitProps(props, ["class", "message", "open", "tone"]);
  const tone = local.tone ?? "error";

  return (
    <div
      {...rest}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-hidden={local.open ? undefined : "true"}
      class={cn(
        "pointer-events-none fixed inset-x-4 top-4 z-50 flex justify-center transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none md:inset-x-auto md:right-6 md:justify-end",
        local.open ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0",
        local.class
      )}
    >
      <div
        class={cn(
          "w-full max-w-md rounded-[var(--radius-panel)] border px-4 py-3 text-sm font-semibold shadow-[0_12px_32px_color-mix(in_srgb,var(--bg-primary)_70%,transparent)]",
          TONE_CLASSES[tone]
        )}
      >
        {local.message}
      </div>
    </div>
  );
}
