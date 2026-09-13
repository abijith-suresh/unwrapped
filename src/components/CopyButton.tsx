import { Check, Clipboard } from "lucide-solid";
import { createSignal, onCleanup } from "solid-js";

import { copyToClipboard } from "@/lib/clipboard";

const COPY_FEEDBACK_DURATION_MS = 2000;

interface CopyButtonProps {
  text: string;
  label?: string;
}

export default function CopyButton(props: CopyButtonProps) {
  const [copied, setCopied] = createSignal(false);
  let copyTimer: ReturnType<typeof setTimeout> | undefined;
  onCleanup(() => clearTimeout(copyTimer));

  async function handleCopy() {
    const success = await copyToClipboard(props.text);
    if (success) {
      clearTimeout(copyTimer);
      setCopied(true);
      copyTimer = setTimeout(() => setCopied(false), COPY_FEEDBACK_DURATION_MS);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      class="inline-flex min-h-9 items-center gap-1.5 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg-secondary)] px-2.5 py-1 text-xs font-medium text-[var(--accent-primary)] transition-[background-color,border-color,color] duration-150 motion-reduce:transition-none hover:border-[var(--border-strong)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--accent-secondary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
      aria-label={copied() ? "Copied!" : (props.label ?? "Copy")}
    >
      {copied() ? (
        <>
          <Check size={12} aria-hidden="true" />
          Copied!
        </>
      ) : (
        <>
          <Clipboard size={12} aria-hidden="true" />
          {props.label ?? "Copy"}
        </>
      )}
      <span class="sr-only" aria-live="polite">
        {copied() ? "Copied" : ""}
      </span>
    </button>
  );
}
