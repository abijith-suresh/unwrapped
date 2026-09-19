import { createUniqueId, type JSX, splitProps } from "solid-js";

import Label from "@/components/primitives/solid/Label";
import { cn } from "@/lib/cn";

interface SelectOption {
  value: string;
  label: string;
}

type NativeSelectProps = Omit<
  JSX.SelectHTMLAttributes<HTMLSelectElement>,
  "aria-describedby" | "class" | "disabled" | "id" | "name" | "onChange" | "value"
>;

export interface SelectProps extends NativeSelectProps {
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  options?: SelectOption[];
  class?: string;
  labelClass?: string;
  controlClass?: string;
  id?: string;
  name?: string;
  autocomplete?: string;
  describedBy?: string;
  disabled?: boolean;
}

export default function Select(props: SelectProps) {
  const [local, selectProps] = splitProps(props, [
    "autocomplete",
    "class",
    "controlClass",
    "describedBy",
    "disabled",
    "id",
    "label",
    "labelClass",
    "name",
    "onChange",
    "options",
    "value",
  ]);
  const controlId = local.id ?? createUniqueId();

  return (
    <div class={cn("flex flex-col gap-1.5", local.class)}>
      {local.label ? (
        <Label for={controlId} class={local.labelClass}>
          {local.label}
        </Label>
      ) : null}
      <select
        {...selectProps}
        id={controlId}
        name={local.name}
        autocomplete={local.autocomplete}
        value={local.value ?? ""}
        onChange={(e) => local.onChange?.((e.target as HTMLSelectElement).value)}
        disabled={local.disabled}
        aria-describedby={local.describedBy}
        class={cn(
          "w-full rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-2.5 font-mono text-sm text-[var(--text-primary)] outline-none transition-[background-color,border-color,box-shadow] duration-150 motion-reduce:transition-none focus:border-[var(--accent-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-60",
          local.controlClass
        )}
      >
        {local.options?.map((opt) => (
          <option value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
