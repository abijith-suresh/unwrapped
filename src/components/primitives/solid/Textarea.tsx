import { cn } from "@/lib/cn";
import Label from "@/components/primitives/solid/Label";

export interface TextareaProps {
  label?: string;
  value?: string;
  onInput?: (value: string) => void;
  placeholder?: string;
  rows?: number;
  class?: string;
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
        class="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none font-mono resize-y focus:border-[var(--accent-primary)]"
      />
    </div>
  );
}
