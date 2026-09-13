import { type JSX, splitProps } from "solid-js";

import { cn } from "@/lib/cn";

export type ToolContainerWidth = "narrow" | "standard" | "wide" | "full";

export interface ToolContainerProps extends JSX.HTMLAttributes<HTMLDivElement> {
  width?: ToolContainerWidth;
  children?: JSX.Element;
}

const WIDTH_CLASSES: Record<ToolContainerWidth, string> = {
  narrow: "max-w-[48rem]",
  standard: "max-w-[56rem]",
  wide: "max-w-[70rem]",
  full: "max-w-none",
};

export default function ToolContainer(props: ToolContainerProps) {
  const [local, rest] = splitProps(props, ["children", "class", "width"]);

  return (
    <div
      {...rest}
      class={cn(
        "mx-auto flex w-full min-w-0 flex-col gap-5 p-4 sm:p-6",
        WIDTH_CLASSES[local.width ?? "standard"],
        local.class
      )}
    >
      {local.children}
    </div>
  );
}
