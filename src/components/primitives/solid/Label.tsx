import type { JSX } from "solid-js";
import { cn } from "@/lib/cn";

export interface LabelProps {
  children?: JSX.Element;
  for?: string;
  class?: string;
}

export default function Label(props: LabelProps) {
  return (
    <label
      for={props.for}
      class={cn(
        "text-xs font-semibold tracking-wider uppercase text-[var(--text-secondary)]",
        props.class
      )}
    >
      {props.children}
    </label>
  );
}
