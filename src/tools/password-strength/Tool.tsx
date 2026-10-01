import { createSignal, For, Show } from "solid-js";
import Input from "@/components/primitives/solid/Input";
import ToolActionButton from "@/components/ToolActionButton";
import ToolStatusMessage from "@/components/ToolStatusMessage";
import ToolContainer from "@/components/tool/ToolContainer";
import ToolPanel from "@/components/tool/ToolPanel";
import { estimatePassword, type PasswordEstimate } from "@/lib/passwordStrength";

const labels = ["Very weak", "Weak", "Fair", "Strong", "Very strong"];
export default function Tool() {
  const [password, setPassword] = createSignal("");
  const [visible, setVisible] = createSignal(false);
  const [result, setResult] = createSignal<PasswordEstimate | null>(null);
  const [error, setError] = createSignal("");
  function evaluate() {
    try {
      setResult(estimatePassword(password()));
      setError("");
    } catch (error) {
      setResult(null);
      setError(error instanceof Error ? error.message : "Cannot evaluate password.");
    }
  }
  return (
    <ToolContainer width="standard">
      <ToolPanel
        title="Password"
        description="Check common words, repeated patterns, keyboard sequences, and predictable substitutions."
      >
        <Input
          label="Password to evaluate"
          type={visible() ? "text" : "password"}
          value={password()}
          autocomplete="off"
          spellcheck={false}
          autocapitalize="off"
          onInput={(value) => {
            setPassword(value);
            setResult(null);
            setError("");
          }}
          error={!!error()}
          describedBy={error() ? "password-error" : undefined}
        />
        <div class="flex flex-wrap gap-2 mt-3">
          <ToolActionButton variant="primary" onClick={evaluate} disabled={!password()}>
            Evaluate strength
          </ToolActionButton>
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
      <Show when={error()}>
        <ToolStatusMessage id="password-error" tone="error">
          {error()}
        </ToolStatusMessage>
      </Show>
      <Show when={result()}>
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
      <ToolStatusMessage tone="muted">
        Uses bundled zxcvbn-ts dictionaries in English. This is a guessability estimate, not a
        guarantee of security or a breach check. Passwords stay in memory and are never sent or
        saved. Limit: 256 characters.
      </ToolStatusMessage>
    </ToolContainer>
  );
}
