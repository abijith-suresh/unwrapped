import { createSignal, Show } from "solid-js";
import Input from "@/components/primitives/solid/Input";
import ToolActionButton from "@/components/ToolActionButton";
import ToolContainer from "@/components/tool/ToolContainer";
import ToolGeneratorWorkspace from "@/components/tool/ToolGeneratorWorkspace";
import {
  DEFAULT_TOKEN_OPTIONS,
  generateToken,
  MAX_TOKEN_LENGTH,
  MIN_TOKEN_LENGTH,
  type TokenGeneratorOptions,
} from "@/lib/tokenGenerator";

function createInitialState() {
  const result = generateToken(DEFAULT_TOKEN_OPTIONS);
  return {
    token: result.ok ? result.token : "",
    error: result.ok ? "" : result.error,
  };
}

export default function TokenGenerator() {
  const initial = createInitialState();
  const [options, setOptions] = createSignal<TokenGeneratorOptions>(DEFAULT_TOKEN_OPTIONS);
  const [token, setToken] = createSignal(initial.token);
  const [error, setError] = createSignal(initial.error);
  const canGenerate = () =>
    options().uppercase || options().lowercase || options().digits || options().symbols;

  function regenerate(nextOptions: TokenGeneratorOptions = options()) {
    const result = generateToken(nextOptions);
    if (result.ok) {
      setToken(result.token);
      setError("");
      return;
    }

    setToken("");
    setError(result.error);
  }

  function updateOption<K extends keyof TokenGeneratorOptions>(
    key: K,
    value: TokenGeneratorOptions[K]
  ) {
    const next = { ...options(), [key]: value };
    setOptions(next);
    if (!canGenerateFrom(next)) return;
    regenerate(next);
  }

  function canGenerateFrom(next: TokenGeneratorOptions) {
    return Boolean(next.uppercase || next.lowercase || next.digits || next.symbols);
  }

  return (
    <ToolContainer>
      <ToolGeneratorWorkspace
        configuration={
          <>
            <Input
              label="Length"
              type="number"
              name="token-length"
              min={MIN_TOKEN_LENGTH}
              max={MAX_TOKEN_LENGTH}
              value={String(options().length)}
              onInput={(value) => updateOption("length", Number(value) || 0)}
              controlClass="w-[var(--size-numeric-field)]"
            />
            <div class="flex flex-col gap-1.5">
              <div class="flex flex-wrap gap-2">
                {(["uppercase", "lowercase", "digits", "symbols"] as const).map((key) => (
                  <ToolActionButton
                    active={options()[key]}
                    onClick={() => updateOption(key, !options()[key])}
                  >
                    {key[0].toUpperCase() + key.slice(1)}
                  </ToolActionButton>
                ))}
              </div>
              <Show when={!canGenerate()}>
                <p class="m-0 text-[var(--fs-label)] text-[var(--accent-error)]" aria-live="polite">
                  Select at least one character set.
                </p>
              </Show>
            </div>
          </>
        }
        actions={
          <Show when={canGenerate()}>
            <ToolActionButton onClick={() => regenerate()} variant="primary">
              Regenerate
            </ToolActionButton>
          </Show>
        }
        error={error()}
        fields={[{ label: "Generated token", value: token(), copyLabel: "Copy token" }]}
      />
    </ToolContainer>
  );
}
