import { createMemo, createSignal, createUniqueId, Show } from "solid-js";

import Card from "@/components/primitives/solid/Card";
import Label from "@/components/primitives/solid/Label";
import ToolContainer from "@/components/tool/ToolContainer";
import ToolInputPanel from "@/components/tool/ToolInputPanel";
import ToolInspectorWorkspace from "@/components/tool/ToolInspectorWorkspace";
import ToolResultList from "@/components/tool/ToolResultList";
import { EXAMPLE_JWT } from "@/lib/exampleData";
import { getJwtClaimsSummary, getJwtExpiryStatus, parseJwt, prettyJson } from "@/lib/jwt";

export default function JwtDecoder() {
  const errorId = createUniqueId();
  const [input, setInput] = createSignal("");
  const isExample = () => input() === "";

  const decoded = createMemo(() => {
    try {
      return { parsed: parseJwt(input() || EXAMPLE_JWT), error: null };
    } catch (error) {
      return {
        parsed: null,
        error: `Invalid JWT. ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  });
  const parsed = () => decoded().parsed;
  const error = () => decoded().error;

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
    <ToolContainer>
      <ToolInspectorWorkspace
        isExample={isExample()}
        error={error()}
        errorId={errorId}
        input={
          <ToolInputPanel
            compact
            label="JWT token"
            name="jwt-token"
            value={input()}
            onInput={setInput}
            placeholder={EXAMPLE_JWT}
            rows={5}
            error={!!error()}
            describedBy={error() ? errorId : undefined}
          />
        }
      >
        <Show when={parsed()}>
          {(result) => (
            <>
              <p class="m-0 text-sm text-[var(--text-secondary)]">
                {result().signature === ""
                  ? "Unsecured token. No signature or authentication."
                  : "Signature not verified. Claims and expiration do not establish authenticity."}
              </p>
              {/* Expiry badge */}
              <Show when={expiryStatus()}>
                {(status) => (
                  <div
                    class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium self-start"
                    classList={{
                      "border border-[var(--accent-error)] bg-[color-mix(in_srgb,var(--accent-error)_12%,transparent)] text-[var(--accent-error)]":
                        status().expired === true,
                      "border border-[var(--accent-success)] bg-[color-mix(in_srgb,var(--accent-success)_12%,transparent)] text-[var(--accent-success)]":
                        status().expired === false,
                      "border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)]":
                        status().expired === null,
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
                  <div class="p-4 grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-3">
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

              <ToolResultList
                layout="rows"
                isExample={isExample()}
                fields={[
                  { label: "Header", value: prettyJson(result().header), format: "json" },
                  { label: "Payload", value: prettyJson(result().payload), format: "json" },
                  { label: "Signature", value: result().signature },
                ]}
              />
            </>
          )}
        </Show>
      </ToolInspectorWorkspace>
    </ToolContainer>
  );
}
