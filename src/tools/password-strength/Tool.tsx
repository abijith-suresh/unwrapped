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
          <ToolPanel title="Password">
            <Input
              label="Password to evaluate"
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
            <div class="flex flex-wrap gap-2 mt-3">
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
            </div>
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
                <meter
                  min={0}
                  max={4}
                  value={estimate().score}
                  aria-label="Estimated password strength"
                  class="w-full"
                />
                <p class="m-0 text-sm text-[var(--text-secondary)]">
                  Estimated search effort: 10^{estimate().guessesLog10.toFixed(1)} guesses.
                </p>
                <Show when={estimate().warning}>
                  <ToolStatusMessage tone="muted">{estimate().warning}</ToolStatusMessage>
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
