import { createUniqueId } from "solid-js";

import Label from "@/components/primitives/solid/Label";
import { cn } from "@/lib/cn";

interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  options?: SelectOption[];
  class?: string;
  id?: string;
  name?: string;
  describedBy?: string;
  disabled?: boolean;
}

export default function Select(props: SelectProps) {
  const controlId = props.id ?? createUniqueId();

  return (
    <div class={cn("flex flex-col gap-1.5", props.class)}>
      {props.label ? <Label for={controlId}>{props.label}</Label> : null}
      <select
        id={controlId}
        name={props.name}
        value={props.value ?? ""}
        onChange={(e) => props.onChange?.((e.target as HTMLSelectElement).value)}
        disabled={props.disabled}
        aria-describedby={props.describedBy}
        class="w-full rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-2.5 font-mono text-sm text-[var(--text-primary)] outline-none transition-[background-color,border-color,box-shadow] duration-150 motion-reduce:transition-none focus:border-[var(--accent-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {props.options?.map((opt) => (
          <option value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
