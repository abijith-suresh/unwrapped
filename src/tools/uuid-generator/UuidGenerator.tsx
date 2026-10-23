import { createSignal, Show } from "solid-js";
import CopyButton from "@/components/CopyButton";
import Input from "@/components/primitives/solid/Input";
import ToolActionButton from "@/components/ToolActionButton";
import ToolDownloadButton from "@/components/ToolDownloadButton";
import ToolHandoffButton from "@/components/ToolHandoffButton";
import ToolContainer from "@/components/tool/ToolContainer";
import ToolGeneratorWorkspace from "@/components/tool/ToolGeneratorWorkspace";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateUuid(): string {
  return crypto.randomUUID();
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function UuidGenerator() {
  const [uuids, setUuids] = createSignal<string[]>([generateUuid()]);
  const [count, setCount] = createSignal(1);
  const [uppercase, setUppercase] = createSignal(false);

  function display(uuid: string): string {
    return uppercase() ? uuid.toUpperCase() : uuid;
  }

  function generate() {
    const n = Math.max(1, Math.min(count(), 100));
    setUuids(Array.from({ length: n }, generateUuid));
  }

  function reset() {
    setCount(1);
    setUppercase(false);
    setUuids([generateUuid()]);
  }

  const allUuids = () => uuids().map(display).join("\n");

  return (
    <ToolContainer>
      <ToolGeneratorWorkspace
        configuration={
          <>
            <Input
              label="Count"
              type="number"
              name="uuid-count"
              min={1}
              max={100}
              value={String(count())}
              onInput={(value) => setCount(Number(value) || 1)}
              controlClass="w-[var(--size-numeric-field)]"
            />

            <ToolActionButton active={uppercase()} onClick={() => setUppercase((v) => !v)}>
              Uppercase
            </ToolActionButton>

            <ToolDownloadButton value={allUuids()} fileName="uuids.txt" label="Download UUIDs" />
            <ToolHandoffButton value={allUuids()} />

            <Show when={uuids().length > 1}>
              <CopyButton text={allUuids()} label="Copy all" />
            </Show>

            <ToolActionButton onClick={reset} variant="ghost">
              Reset
            </ToolActionButton>
          </>
        }
        actions={
          <ToolActionButton onClick={generate} variant="primary">
            Generate
          </ToolActionButton>
        }
        fields={uuids().map((uuid, index) => ({
          label: `UUID ${index + 1}`,
          value: display(uuid),
          copyLabel: `Copy UUID ${index + 1}`,
        }))}
      />
    </ToolContainer>
  );
}
