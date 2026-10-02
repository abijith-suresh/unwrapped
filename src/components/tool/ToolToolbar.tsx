import { type JSX, Show, splitProps } from "solid-js";

import { cn } from "@/lib/cn";

export interface ToolToolbarProps extends JSX.FieldsetHTMLAttributes<HTMLFieldSetElement> {
  label: string;
  children?: JSX.Element;
  actions?: JSX.Element;
}

export default function ToolToolbar(props: ToolToolbarProps) {
  const [local, rest] = splitProps(props, ["actions", "children", "class", "label"]);

  return (
    <fieldset
      {...rest}
      class={cn(
        "m-0 flex min-w-0 flex-col gap-3 border-0 p-0 sm:flex-row sm:flex-wrap sm:items-end",
        local.class
      )}
    >
      <legend class="sr-only">{local.label}</legend>
      <div class="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
        {local.children}
      </div>
      <Show when={local.actions}>
        <div class="flex min-w-0 flex-wrap items-center gap-2">{local.actions}</div>
      </Show>
    </fieldset>
  );
}
