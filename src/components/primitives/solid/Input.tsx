import { createUniqueId, type JSX, splitProps } from "solid-js";

import Label from "@/components/primitives/solid/Label";
import { cn } from "@/lib/cn";

type NativeInputProps = Omit<
  JSX.InputHTMLAttributes<HTMLInputElement>,
  | "aria-describedby"
  | "aria-invalid"
  | "autocomplete"
  | "class"
  | "disabled"
  | "id"
  | "name"
  | "onInput"
  | "placeholder"
  | "type"
  | "value"
>;

export interface InputProps extends NativeInputProps {
  label?: string;
  value?: string;
  onInput?: (value: string) => void;
  placeholder?: string;
  type?: string;
  class?: string;
  labelClass?: string;
  controlClass?: string;
  id?: string;
  name?: string;
  autocomplete?: string;
  describedBy?: string;
  disabled?: boolean;
  error?: boolean;
}

export default function Input(props: InputProps) {
  const [local, inputProps] = splitProps(props, [
    "autocomplete",
    "class",
    "controlClass",
    "describedBy",
    "disabled",
    "error",
    "id",
    "label",
    "labelClass",
    "name",
    "onInput",
    "placeholder",
    "type",
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
      <input
        {...inputProps}
        id={controlId}
        name={local.name}
        autocomplete={local.autocomplete}
        type={local.type ?? "text"}
        value={local.value ?? ""}
        onInput={(e) => local.onInput?.((e.target as HTMLInputElement).value)}
        placeholder={local.placeholder}
        disabled={local.disabled}
        aria-describedby={local.describedBy}
        aria-invalid={local.error || undefined}
        class={cn(
          "w-full rounded-[var(--radius-control)] border bg-[var(--bg-secondary)] px-4 py-2.5 font-mono text-sm text-[var(--text-primary)] outline-none transition-[background-color,border-color,box-shadow] duration-150 motion-reduce:transition-none focus:border-[var(--accent-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-60",
          local.error ? "border-[var(--accent-error)]" : "border-[var(--border)]",
          local.controlClass
        )}
      />
    </div>
  );
}
