import { createSignal, createUniqueId, type JSX, splitProps } from "solid-js";

import Label from "@/components/primitives/solid/Label";
import { cn } from "@/lib/cn";

export interface ToolCodeDiagnostic {
  start: number;
  length: number;
}

type NativeTextareaProps = Omit<
  JSX.TextareaHTMLAttributes<HTMLTextAreaElement>,
  | "aria-describedby"
  | "aria-invalid"
  | "class"
  | "id"
  | "onInput"
  | "placeholder"
  | "rows"
  | "value"
>;

export interface ToolCodeEditorProps extends NativeTextareaProps {
  label: string;
  value?: string;
  onInput?: (value: string) => void;
  placeholder?: string;
  rows?: number;
  class?: string;
  textareaClass?: string;
  labelClass?: string;
  diagnostic?: ToolCodeDiagnostic | null;
  error?: boolean;
  id?: string;
  describedBy?: string;
}

interface DiagnosticHighlightProps {
  value: string;
  diagnostic: ToolCodeDiagnostic;
}

const ERROR_MARKER_STYLE: JSX.CSSProperties = {
  "text-decoration-color": "var(--accent-error)",
  "text-decoration-line": "underline",
  "text-decoration-style": "wavy",
  "text-decoration-thickness": "2px",
  "text-underline-offset": "0.18em",
};

function DiagnosticHighlight(props: DiagnosticHighlightProps) {
  const start = Math.min(Math.max(props.diagnostic.start, 0), props.value.length);
  const requestedEnd = start + Math.max(props.diagnostic.length, 0);
  const end = Math.min(requestedEnd, props.value.length);
  const markerStart = end > start || start === 0 ? start : start - 1;
  const markerEnd = end > start ? end : Math.min(start + 1, props.value.length);

  return (
    <>
      {props.value.slice(0, markerStart)}
      {markerStart < markerEnd ? (
        <span data-tool-error-marker="true" style={ERROR_MARKER_STYLE}>
          {props.value.slice(markerStart, markerEnd)}
        </span>
      ) : null}
      {props.value.slice(markerEnd)}
    </>
  );
}

export default function ToolCodeEditor(props: ToolCodeEditorProps) {
  const [local, textareaProps] = splitProps(props, [
    "class",
    "describedBy",
    "diagnostic",
    "error",
    "id",
    "label",
    "labelClass",
    "onInput",
    "placeholder",
    "rows",
    "textareaClass",
    "value",
  ]);
  const [scrollTop, setScrollTop] = createSignal(0);
  const [scrollLeft, setScrollLeft] = createSignal(0);
  const controlId = local.id ?? createUniqueId();

  return (
    <div class={cn("flex min-h-0 flex-1 flex-col gap-1.5", local.class)}>
      <Label for={controlId} class={local.labelClass}>
        {local.label}
      </Label>

      <div
        class={cn(
          "relative min-h-0 flex-1 overflow-hidden rounded-[var(--radius-control)] border bg-[var(--bg-secondary)]",
          local.error ? "border-[var(--accent-error)]" : "border-[var(--border)]"
        )}
      >
        {local.diagnostic ? (
          <div aria-hidden="true" class="pointer-events-none absolute inset-0 z-0 overflow-hidden">
            <pre
              class="m-0 w-full whitespace-pre-wrap break-words p-4 font-mono text-sm leading-relaxed text-[var(--text-primary)]"
              style={{
                transform: `translate(${-scrollLeft()}px, ${-scrollTop()}px)`,
              }}
            >
              <DiagnosticHighlight value={local.value ?? ""} diagnostic={local.diagnostic} />
            </pre>
          </div>
        ) : null}

        <textarea
          {...textareaProps}
          id={controlId}
          value={local.value ?? ""}
          onInput={(event) => local.onInput?.((event.target as HTMLTextAreaElement).value)}
          onScroll={(event) => {
            const target = event.currentTarget;
            setScrollTop(target.scrollTop);
            setScrollLeft(target.scrollLeft);
          }}
          placeholder={local.placeholder}
          rows={local.rows ?? 4}
          aria-describedby={local.describedBy}
          aria-invalid={local.error || undefined}
          class={cn(
            "relative z-10 block h-full min-h-0 w-full resize-none overflow-auto rounded-[var(--radius-control)] border-0 bg-transparent p-4 font-mono text-sm leading-relaxed outline-none placeholder:text-[var(--text-muted)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-60",
            local.diagnostic
              ? "text-transparent caret-[var(--text-primary)]"
              : "text-[var(--text-primary)]",
            local.textareaClass
          )}
        />
      </div>
    </div>
  );
}
