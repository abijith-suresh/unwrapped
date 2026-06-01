import { createMemo, createSignal, Show } from "solid-js";

import CopyButton from "@/components/CopyButton";
import Card from "@/components/primitives/solid/Card";
import Label from "@/components/primitives/solid/Label";
import Textarea from "@/components/primitives/solid/Textarea";
import ToolStatusMessage from "@/components/ToolStatusMessage";
import { getJwtClaimsSummary, getJwtExpiryStatus, parseJwt, prettyJson } from "@/lib/jwt";

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface PanelProps {
  title: string;
  content: string;
}

function Panel(props: PanelProps) {
  return (
    <Card class="overflow-hidden p-0">
      {/* Panel header */}
      <div class="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border)]">
        <Label>{props.title}</Label>
        <CopyButton text={props.content} />
      </div>

      {/* Panel body */}
      <pre class="m-0 p-4 overflow-x-auto font-mono text-xs leading-relaxed text-[var(--text-primary)] whitespace-pre-wrap break-all">
        <code>{props.content}</code>
      </pre>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function JwtDecoder() {
  const [input, setInput] = createSignal("");

  const parsed = createMemo(() => {
    const raw = input().trim();
    if (!raw) return null;
    return parseJwt(raw);
  });

  const error = createMemo((): string | null => {
    const raw = input().trim();
    if (!raw) return null;
    if (parsed() === null) return "Invalid JWT — expected three base64url parts separated by dots.";
    return null;
  });

  const claimsSummary = createMemo(() => {
    const result = parsed();
    return result ? getJwtClaimsSummary(result) : [];
  });

  /** Expiry status derived from the payload's `exp` claim. */
  const expiryStatus = createMemo(() => {
    const result = parsed();
    if (!result) return null;

    return getJwtExpiryStatus(result.payload);
  });

  return (
    <div class="flex flex-col gap-5 p-6 mx-auto w-full max-w-[860px]">
      {/* ------------------------------------------------------------------ */}
      {/* Input area                                                          */}
      {/* ------------------------------------------------------------------ */}
      <div class="flex flex-col gap-2">
        <Textarea
          value={input()}
          onInput={setInput}
          placeholder="Paste a JWT token here..."
          rows={5}
          spellcheck={false}
        />
        {/* Hint — only when input is empty */}
        <Show when={!input().trim()}>
          <p class="text-xs text-[var(--text-muted)] m-0">
            Supports RS256, HS256, and all standard JWT algorithms
          </p>
        </Show>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Error banner                                                        */}
      {/* ------------------------------------------------------------------ */}
      <Show when={error()}>
        <ToolStatusMessage tone="error">{error()}</ToolStatusMessage>
      </Show>

      {/* ------------------------------------------------------------------ */}
      {/* Output panels (only when valid JWT)                                */}
      {/* ------------------------------------------------------------------ */}
      <Show when={parsed()}>
        {(result) => (
          <>
            {/* Expiry badge */}
            <Show when={expiryStatus()}>
              {(status) => (
                <div
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium self-start"
                  classList={{
                    "border border-[var(--accent-error)] bg-[color-mix(in_srgb,var(--accent-error)_12%,transparent)] text-[var(--accent-error)]":
                      status().expired,
                    "border border-[var(--accent-success)] bg-[color-mix(in_srgb,var(--accent-success)_12%,transparent)] text-[var(--accent-success)]":
                      !status().expired,
                  }}
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                  {status().label}
                </div>
              )}
            </Show>

            <Show when={claimsSummary().length > 0}>
              <Card class="overflow-hidden p-0">
                <div class="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border)]">
                  <Label>Claims summary</Label>
                </div>
                <div class="p-4 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
                  {claimsSummary().map((item) => (
                    <div class="flex flex-col gap-1 p-3 bg-[var(--bg-primary)] border border-[var(--border)] rounded">
                      <span class="text-[0.6875rem] font-bold tracking-wider uppercase text-[var(--text-muted)]">
                        {item.section} · {item.label}
                      </span>
                      <code class="text-[var(--text-primary)] text-xs font-mono break-words">
                        {item.displayValue}
                      </code>
                      <Show when={item.displayValue !== item.rawValue}>
                        <span class="text-[var(--text-secondary)] text-xs font-mono break-words">
                          raw: {item.rawValue}
                        </span>
                      </Show>
                    </div>
                  ))}
                </div>
              </Card>
            </Show>

            {/* Header panel */}
            <Panel title="Header" content={prettyJson(result().header)} />

            {/* Payload panel */}
            <Panel title="Payload" content={prettyJson(result().payload)} />

            {/* Signature panel */}
            <Panel title="Signature" content={result().signature} />
          </>
        )}
      </Show>
    </div>
  );
}
