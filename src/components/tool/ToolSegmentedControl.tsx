import { type JSX, splitProps } from "solid-js";

import { cn } from "@/lib/cn";

export interface ToolSegmentedControlProps extends JSX.FieldsetHTMLAttributes<HTMLFieldSetElement> {
  label: string;
  children?: JSX.Element;
}

export default function ToolSegmentedControl(props: ToolSegmentedControlProps) {
  const [local, rest] = splitProps(props, ["children", "class", "label"]);

  return (
    <fieldset
      {...rest}
      class={cn(
        "m-0 flex min-w-0 flex-col items-stretch gap-1.5 border-0 p-0 sm:flex-row sm:items-center sm:gap-2",
        local.class
      )}
    >
      <legend class="shrink-0 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
        {local.label}
      </legend>
      <div
        role="radiogroup"
        aria-label={local.label}
        class="flex min-w-0 w-full flex-1 items-stretch gap-0.5 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg-primary)] p-0.5 sm:w-auto sm:flex-none"
      >
        {local.children}
      </div>
    </fieldset>
  );
}
