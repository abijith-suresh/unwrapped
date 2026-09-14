import { type JSX, splitProps } from "solid-js";

import { cn } from "@/lib/cn";

export interface ToolToolbarProps extends JSX.FieldsetHTMLAttributes<HTMLFieldSetElement> {
  label: string;
  children?: JSX.Element;
}

export default function ToolToolbar(props: ToolToolbarProps) {
  const [local, rest] = splitProps(props, ["children", "class", "label"]);

  return (
    <fieldset
      {...rest}
      class={cn(
        "m-0 flex min-w-0 flex-wrap items-center gap-2 rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--bg-secondary)] p-2 sm:p-2.5",
        local.class
      )}
    >
      <legend class="sr-only">{local.label}</legend>
      {local.children}
    </fieldset>
  );
}
