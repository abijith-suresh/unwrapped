import { Check, CircleAlert, Clipboard, LoaderCircle } from "lucide-solid";
import { createSignal, onCleanup } from "solid-js";

import ToolActionButton from "@/components/ToolActionButton";
import { copyToClipboard } from "@/lib/clipboard";
import { cn } from "@/lib/cn";

const COPY_FEEDBACK_DURATION_MS = 2000;

interface CopyButtonProps {
  text: string;
  label?: string;
  class?: string;
}

export default function CopyButton(props: CopyButtonProps) {
  const [status, setStatus] = createSignal<"idle" | "copying" | "copied" | "error">("idle");
  let copyTimer: ReturnType<typeof setTimeout> | undefined;
  onCleanup(() => clearTimeout(copyTimer));

  const actionLabel = () => props.label ?? "Copy";
  const targetLabel = () =>
    actionLabel()
      .replace(/^Copy\s*/i, "")
      .trim() || "content";
  const statusLabel = () => {
    switch (status()) {
      case "copying":
        return "Copying…";
      case "copied":
        return "Copied";
      case "error":
        return "Copy failed";
      default:
        return actionLabel();
    }
  };
  const announcement = () => {
    switch (status()) {
      case "copied":
        return `Copied ${targetLabel()} to the clipboard.`;
      case "error":
        return `Could not copy ${targetLabel()}. Try again.`;
      default:
        return "";
    }
  };

  function resetStatus() {
    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => {
      copyTimer = undefined;
      setStatus("idle");
    }, COPY_FEEDBACK_DURATION_MS);
  }

  async function handleCopy() {
    if (status() === "copying" || !props.text) {
      return;
    }

    clearTimeout(copyTimer);
    copyTimer = undefined;
    setStatus("copying");
    let success = false;
    try {
      success = await copyToClipboard(props.text);
    } catch {
      success = false;
    }
    setStatus(success ? "copied" : "error");
    resetStatus();
  }

  return (
    <>
      <ToolActionButton
        variant="secondary"
        onClick={() => void handleCopy()}
        disabled={status() === "copying" || !props.text}
        aria-label={actionLabel()}
        aria-busy={status() === "copying"}
        class={cn("min-w-[7rem]", props.class)}
        style={{
          color:
            status() === "copied"
              ? "var(--accent-success)"
              : status() === "error"
                ? "var(--accent-error)"
                : undefined,
          "border-color":
            status() === "copied"
              ? "var(--accent-success)"
              : status() === "error"
                ? "var(--accent-error)"
                : undefined,
        }}
      >
        {status() === "copying" ? (
          <LoaderCircle
            size={13}
            class="animate-spin motion-reduce:animate-none"
            aria-hidden="true"
          />
        ) : status() === "copied" ? (
          <Check size={13} aria-hidden="true" />
        ) : status() === "error" ? (
          <CircleAlert size={13} aria-hidden="true" />
        ) : (
          <Clipboard size={13} aria-hidden="true" />
        )}
        {statusLabel()}
      </ToolActionButton>
      <span class="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement()}
      </span>
    </>
  );
}
