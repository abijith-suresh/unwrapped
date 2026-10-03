import { createMemo, createResource, createSignal } from "solid-js";

import Select from "@/components/primitives/solid/Select";
import ToolActionButton from "@/components/ToolActionButton";
import ToolContainer from "@/components/tool/ToolContainer";
import ToolGeneratorWorkspace from "@/components/tool/ToolGeneratorWorkspace";
import ToolInputPanel from "@/components/tool/ToolInputPanel";
import { EXAMPLE_SECRET, EXAMPLE_TEXT } from "@/lib/exampleData";
import { generateHmac, HMAC_ALGORITHMS, type HmacAlgorithm } from "@/lib/hmac";

export default function HmacGeneratorTool() {
  const [message, setMessage] = createSignal("");
  const [secret, setSecret] = createSignal("");
  const [algorithm, setAlgorithm] = createSignal<HmacAlgorithm>("SHA-256");
  const [output, setOutput] = createSignal("");
  const [error, setError] = createSignal("");
  const [pending, setPending] = createSignal(false);
  const isExample = () => message() === "" && secret() === "";
  const [example] = createResource(
    () => isExample() && algorithm(),
    (algorithm) => generateHmac({ message: EXAMPLE_TEXT, secret: EXAMPLE_SECRET, algorithm })
  );
  const displayedOutput = createMemo(() => {
    if (!isExample()) return output();
    const result = example();
    return result?.ok ? result.output : "";
  });
  let generation = 0;

  function invalidateOutput() {
    generation++;
    setPending(false);
    setOutput("");
    setError("");
  }

  async function handleGenerate() {
    if (isExample()) return;
    const run = ++generation;
    setPending(true);
    const result = await generateHmac({
      message: message(),
      secret: secret(),
      algorithm: algorithm(),
    });
    if (run !== generation) return;
    setPending(false);

    if (result.ok) {
      setOutput(result.output);
      setError("");
      return;
    }

    setOutput("");
    setError(result.error);
  }

  return (
    <ToolContainer>
      <div class="grid gap-4 grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))]">
        <ToolInputPanel
          compact
          label="Message"
          value={message()}
          onInput={(v) => {
            invalidateOutput();
            setMessage(v);
          }}
          placeholder={EXAMPLE_TEXT}
          rows={6}
        />
        <ToolInputPanel
          compact
          label="Secret"
          value={secret()}
          onInput={(v) => {
            invalidateOutput();
            setSecret(v);
          }}
          placeholder={EXAMPLE_SECRET}
          rows={6}
        />
      </div>

      <ToolGeneratorWorkspace
        configuration={
          <Select
            label="Algorithm"
            value={algorithm()}
            onChange={(v) => {
              invalidateOutput();
              setAlgorithm(v as HmacAlgorithm);
            }}
            options={HMAC_ALGORITHMS.map((a) => ({ value: a.id, label: a.label }))}
            controlClass="h-11"
          />
        }
        actions={
          <ToolActionButton
            onClick={() => void handleGenerate()}
            variant="primary"
            class="h-11"
            disabled={pending() || isExample()}
          >
            {pending() ? "Generating…" : "Generate HMAC"}
          </ToolActionButton>
        }
        error={error()}
        isExample={isExample()}
        fields={[{ label: "Hex output", value: displayedOutput(), copyLabel: "Copy HMAC" }]}
      />
    </ToolContainer>
  );
}
