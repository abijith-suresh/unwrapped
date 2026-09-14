import { type JSX, splitProps } from "solid-js";

import ToolActionButton from "@/components/ToolActionButton";
import { cn } from "@/lib/cn";

function handleRadioKeyDown(event: KeyboardEvent) {
  const group = event.currentTarget as HTMLDivElement;
  const direction =
    event.key === "ArrowRight" || event.key === "ArrowDown"
      ? 1
      : event.key === "ArrowLeft" || event.key === "ArrowUp"
        ? -1
        : null;
  const buttons = Array.from(
    group.querySelectorAll<HTMLButtonElement>('[role="radio"]:not(:disabled)')
  );
  const currentIndex = buttons.indexOf(group.ownerDocument.activeElement as HTMLButtonElement);

  if (currentIndex === -1 || (!direction && event.key !== "Home" && event.key !== "End")) {
    return;
  }

  event.preventDefault();
  const nextIndex =
    event.key === "Home"
      ? 0
      : event.key === "End"
        ? buttons.length - 1
        : (currentIndex + (direction ?? 0) + buttons.length) % buttons.length;
  const nextButton = buttons[nextIndex];

  nextButton?.focus();
  nextButton?.click();
}

export interface ToolSegmentedControlOption<Value extends string = string> {
  value: Value;
  label: string;
  disabled?: boolean;
}

export interface ToolSegmentedControlProps<Value extends string = string>
  extends Omit<JSX.FieldsetHTMLAttributes<HTMLFieldSetElement>, "children" | "onChange"> {
  label: string;
  value: Value;
  options: readonly ToolSegmentedControlOption<Value>[];
  onChange: (value: Value) => void;
}

export default function ToolSegmentedControl<Value extends string = string>(
  props: ToolSegmentedControlProps<Value>
) {
  const [local, rest] = splitProps(props, ["class", "label", "onChange", "options", "value"]);

  return (
    <fieldset
      {...rest}
      class={cn("m-0 flex min-w-0 flex-col items-stretch gap-1.5 border-0 p-0", local.class)}
    >
      <legend class="shrink-0 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
        {local.label}
      </legend>
      <div
        role="radiogroup"
        aria-label={local.label}
        aria-orientation="horizontal"
        onKeyDown={handleRadioKeyDown}
        class="flex h-[2.625rem] min-w-0 w-full items-stretch gap-0.5 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg-primary)] p-0.5 sm:w-auto"
      >
        {local.options.map((option) => (
          <ToolActionButton
            active={local.value === option.value}
            variant="segment"
            role="radio"
            disabled={option.disabled}
            onClick={() => local.onChange(option.value)}
            class="min-w-0 flex-1 sm:flex-none"
          >
            {option.label}
          </ToolActionButton>
        ))}
      </div>
    </fieldset>
  );
}
