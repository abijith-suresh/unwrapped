import { type JSX, Show, splitProps } from "solid-js";

import { cn } from "@/lib/cn";

export interface ToolInlineErrorProps extends JSX.HTMLAttributes<HTMLDivElement> {
  message: string;
  hint?: string;
  children?: JSX.Element;
}

export default function ToolInlineError(props: ToolInlineErrorProps) {
  const [local, rest] = splitProps(props, ["children", "class", "hint", "message"]);

  return (
    <div
      {...rest}
      role="alert"
      aria-live="polite"
      class={cn(
        "space-y-2 rounded-[var(--radius-control)] border border-[var(--accent-error)] bg-[color-mix(in_srgb,var(--accent-error)_8%,transparent)] px-3 py-2.5",
        local.class
      )}
    >
      <p class="m-0 text-sm font-medium leading-relaxed text-[var(--accent-error)]">
        {local.message}
      </p>
      <Show when={local.hint}>
        {(hint) => <p class="m-0 text-xs leading-relaxed text-[var(--text-secondary)]">{hint()}</p>}
      </Show>
      {local.children}
    </div>
  );
}
