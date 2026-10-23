import { createMemo, createSignal, For, Show } from "solid-js";
import Input from "@/components/primitives/solid/Input";
import ToolActionButton from "@/components/ToolActionButton";
import ToolStatusMessage from "@/components/ToolStatusMessage";
import ToolContainer from "@/components/tool/ToolContainer";
import ToolInspectorWorkspace from "@/components/tool/ToolInspectorWorkspace";
import ToolPanel from "@/components/tool/ToolPanel";
import { EXAMPLE_PASSWORD } from "@/lib/exampleData";
import { estimatePassword, type PasswordEstimate } from "@/lib/passwordStrength";

const labels = ["Very weak", "Weak", "Fair", "Strong", "Very strong"];

const SEGMENTS = [0, 1, 2, 3];

function strengthColor(score: number): string {
  if (score <= 1) return "var(--accent-error)";
  if (score === 2) return "var(--accent-warning)";
  return "var(--accent-success)";
}

export default function Tool() {
  const [password, setPassword] = createSignal("");
  const [visible, setVisible] = createSignal(false);
  const [result, setResult] = createSignal<PasswordEstimate | null>(null);
  const [error, setError] = createSignal("");
  const isExample = () => password() === "";
  const displayedResult = createMemo(() =>
    isExample() ? estimatePassword(EXAMPLE_PASSWORD) : result()
  );
  function evaluate(value: string) {
    try {
      setResult(estimatePassword(value));
      setError("");
    } catch (error) {
      setResult(null);
      setError(error instanceof Error ? error.message : "Cannot evaluate password.");
    }
  }
  return (
    <ToolContainer>
      <ToolInspectorWorkspace
        isExample={isExample()}
        error={error()}
        errorId="password-error"
        input={
          <ToolPanel
            title="Password to evaluate"
            aria-label="Password to evaluate input panel"
            actions={
              <>
                <ToolActionButton active={visible()} onClick={() => setVisible((value) => !value)}>
                  {visible() ? "Hide password" : "Show password"}
                </ToolActionButton>
                <ToolActionButton
                  onClick={() => {
                    setPassword("");
                    setResult(null);
                    setError("");
                    setVisible(false);
                  }}
                >
                  Clear
                </ToolActionButton>
              </>
            }
          >
            <Input
              label="Password to evaluate"
              labelClass="sr-only"
              type={visible() ? "text" : "password"}
              value={password()}
              placeholder={EXAMPLE_PASSWORD}
              autocomplete="off"
              spellcheck={false}
              autocapitalize="off"
              onInput={(value) => {
                setPassword(value);
                if (value) evaluate(value);
                else {
                  setResult(null);
                  setError("");
                }
              }}
              error={!!error()}
              describedBy={error() ? "password-error" : undefined}
            />
          </ToolPanel>
        }
      >
        <Show when={displayedResult()}>
          {(estimate) => (
            <ToolPanel title="Strength estimate">
              <div class="flex flex-col gap-3" aria-live="polite">
                <strong class="text-[var(--text-primary)]">
                  {labels[estimate().score]} · {estimate().score}/4
                </strong>
                {/* biome-ignore lint/a11y/useSemanticElements: a token-driven segmented bar keeps the meter role for screen readers without the native element. */}
                <div
                  role="meter"
                  aria-label="Estimated password strength"
                  aria-valuemin={0}
                  aria-valuemax={4}
                  aria-valuenow={estimate().score}
                  aria-valuetext={`${labels[estimate().score]} · ${estimate().score}/4`}
                  class="flex gap-1"
                >
                  <For each={SEGMENTS}>
                    {(index) => (
                      <div
                        class="h-2 flex-1 rounded-[var(--radius-sm)] transition-[background-color] duration-[var(--motion-fast)] ease-[var(--motion-ease-standard)] motion-reduce:transition-none"
                        style={{
                          "background-color":
                            index < estimate().score
                              ? strengthColor(estimate().score)
                              : "var(--bg-tertiary)",
                        }}
                      />
                    )}
                  </For>
                </div>
                <p class="m-0 text-sm text-[var(--text-secondary)]">
                  Estimated search effort: 10^{estimate().guessesLog10.toFixed(1)} guesses.
                </p>
                <Show when={estimate().warning}>
                  <ToolStatusMessage tone="warning">{estimate().warning}</ToolStatusMessage>
                </Show>
                <For each={estimate().suggestions}>
                  {(suggestion) => <ToolStatusMessage tone="muted">{suggestion}</ToolStatusMessage>}
                </For>
              </div>
            </ToolPanel>
          )}
        </Show>
      </ToolInspectorWorkspace>
    </ToolContainer>
  );
}
