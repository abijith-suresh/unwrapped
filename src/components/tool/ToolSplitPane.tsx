import { type JSX, splitProps } from "solid-js";

import { cn } from "@/lib/cn";

export interface ToolSplitPaneProps extends JSX.HTMLAttributes<HTMLDivElement> {
  children?: JSX.Element;
}

export default function ToolSplitPane(props: ToolSplitPaneProps) {
  const [local, rest] = splitProps(props, ["children", "class"]);

  return (
    <div {...rest} class={cn("grid min-w-0 gap-4 lg:grid-cols-2", local.class)}>
      {local.children}
    </div>
  );
}
