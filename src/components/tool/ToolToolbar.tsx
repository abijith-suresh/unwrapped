import { type JSX, splitProps } from "solid-js";

import { cn } from "@/lib/cn";

export interface ToolToolbarProps extends JSX.HTMLAttributes<HTMLDivElement> {
  label: string;
  children?: JSX.Element;
}

export default function ToolToolbar(props: ToolToolbarProps) {
  const [local, rest] = splitProps(props, ["children", "class", "label"]);

  return (
    <div
      {...rest}
      role="toolbar"
      aria-label={local.label}
      class={cn(
        "flex min-w-0 flex-wrap items-center gap-2 rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--bg-secondary)] p-1.5",
        local.class
      )}
    >
      {local.children}
    </div>
  );
}
