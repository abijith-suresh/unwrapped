import { createEffect, type JSX, splitProps } from "solid-js";

import { cn } from "@/lib/cn";

export interface ToolCodeBlockProps extends JSX.HTMLAttributes<HTMLPreElement> {
  empty?: string;
  fill?: boolean;
  html?: string;
  children?: JSX.Element;
}

export default function ToolCodeBlock(props: ToolCodeBlockProps) {
  const [local, rest] = splitProps(props, [
    "children",
    "class",
    "empty",
    "fill",
    "html",
    "tabIndex",
  ]);
  let codeElement: HTMLPreElement | undefined;

  createEffect(() => {
    const html = local.html;
    if (codeElement && html) {
      codeElement.innerHTML = html;
    }
  });

  return (
    <pre
      {...rest}
      ref={(element) => {
        codeElement = element;
      }}
      tabindex={local.tabIndex ?? 0}
      class={cn(
        "m-0 min-w-0 overflow-auto rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg-primary)] p-4 text-sm leading-relaxed text-[var(--text-primary)] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]",
        local.fill ? "min-h-0 flex-1" : "min-h-[16rem] md:min-h-[22rem]",
        local.class
      )}
    >
      {local.html ? null : (local.children ?? local.empty ?? "No output yet.")}
    </pre>
  );
}
