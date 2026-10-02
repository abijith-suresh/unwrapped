import { type JSX, splitProps } from "solid-js";

import { cn } from "@/lib/cn";

export interface ToolContainerProps extends JSX.HTMLAttributes<HTMLDivElement> {
  children?: JSX.Element;
}

export default function ToolContainer(props: ToolContainerProps) {
  const [local, rest] = splitProps(props, ["children", "class"]);

  return (
    <div
      {...rest}
      class={cn(
        "mx-auto flex w-full min-w-0 max-w-[var(--tool-width,56rem)] flex-col gap-5 p-[var(--tool-padding,1rem)]",
        local.class
      )}
    >
      {local.children}
    </div>
  );
}
