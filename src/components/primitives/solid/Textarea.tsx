import { cn } from "@/lib/cn";
import Label from "@/components/primitives/solid/Label";

export interface TextareaProps {
  label?: string;
  value?: string;
  onInput?: (value: string) => void;
  placeholder?: string;
  rows?: number;
  class?: string;
  error?: boolean;
  autofocus?: boolean;
  spellcheck?: boolean;
  readonly?: boolean;
}

export default function Textarea(props: TextareaProps) {
  return (
    <div class={cn("flex flex-col gap-1.5", props.class)}>
      {props.label ? <Label>{props.label}</Label> : null}
      <textarea
        value={props.value ?? ""}
        onInput={(e) => props.onInput?.((e.target as HTMLTextAreaElement).value)}
        placeholder={props.placeholder}
        rows={props.rows ?? 4}
        autofocus={props.autofocus}
        spellcheck={props.spellcheck ?? true}
        readonly={props.readonly}
        class={cn(
          "w-full rounded-lg border bg-[var(--bg-secondary)] px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none font-mono resize-y transition-[border-color] duration-150 focus:border-[var(--accent-primary)]",
          props.error ? "border-[var(--accent-error)]" : "border-[var(--border)]"
        )}
      />
    </div>
  );
}
