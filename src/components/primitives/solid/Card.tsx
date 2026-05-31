import type { JSX } from "solid-js";
import { cn } from "@/lib/cn";

export interface CardProps {
  children?: JSX.Element;
  class?: string;
}

export default function Card(props: CardProps) {
  return (
    <div
      class={cn(
        "rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4",
        props.class
      )}
    >
      {props.children}
    </div>
  );
}
