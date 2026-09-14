import { createUniqueId } from "solid-js";

import Label from "@/components/primitives/solid/Label";
import { cn } from "@/lib/cn";

export interface InputProps {
  label?: string;
  value?: string;
  onInput?: (value: string) => void;
  placeholder?: string;
  type?: string;
  class?: string;
  id?: string;
  name?: string;
  autocomplete?: string;
  describedBy?: string;
  disabled?: boolean;
  error?: boolean;
}

export default function Input(props: InputProps) {
  const controlId = props.id ?? createUniqueId();

  return (
    <div class={cn("flex flex-col gap-1.5", props.class)}>
      {props.label ? <Label for={controlId}>{props.label}</Label> : null}
      <input
        id={controlId}
        name={props.name}
        autocomplete={props.autocomplete}
        type={props.type ?? "text"}
        value={props.value ?? ""}
        onInput={(e) => props.onInput?.((e.target as HTMLInputElement).value)}
        placeholder={props.placeholder}
        disabled={props.disabled}
        aria-describedby={props.describedBy}
        aria-invalid={props.error || undefined}
        class={cn(
          "w-full rounded-[var(--radius-control)] border bg-[var(--bg-secondary)] px-4 py-2.5 font-mono text-sm text-[var(--text-primary)] outline-none transition-[background-color,border-color,box-shadow] duration-150 motion-reduce:transition-none focus:border-[var(--accent-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-60",
          props.error ? "border-[var(--accent-error)]" : "border-[var(--border)]"
        )}
      />
    </div>
  );
}
