import { createMemo, createSignal } from "solid-js";
import ToolActionButton from "@/components/ToolActionButton";
import ToolContainer from "@/components/tool/ToolContainer";
import ToolSegmentedControl from "@/components/tool/ToolSegmentedControl";
import ToolToolbar from "@/components/tool/ToolToolbar";
import ToolTransformWorkspace from "@/components/tool/ToolTransformWorkspace";
import { EXAMPLE_HTML } from "@/lib/exampleData";
import { transformEntities } from "@/lib/htmlEntities";

export default function Tool() {
  const [input, setInput] = createSignal("");
  const [mode, setMode] = createSignal<"encode" | "decode">("encode");
  const [nonAscii, setNonAscii] = createSignal(false);

  const isExample = () => input() === "";
  const exampleInput = createMemo(() => {
    const encoded = transformEntities(EXAMPLE_HTML, "encode", nonAscii());
    return mode() === "decode" && encoded.ok ? encoded.output : EXAMPLE_HTML;
  });
  const result = createMemo(() => transformEntities(input() || exampleInput(), mode(), nonAscii()));
  const output = () => {
    const current = result();
    return current.ok ? current.output : "";
  };
  const error = () => {
    const current = result();
    return current.ok ? "" : current.error;
  };
  const canSwap = () => !isExample() && !!output();

  function swap() {
    if (!canSwap()) return;
    const current = output();
    setMode((m) => (m === "encode" ? "decode" : "encode"));
    setInput(current);
  }

  function clear() {
    setMode("encode");
    setInput("");
  }

  return (
    <ToolContainer>
      <ToolToolbar
        label="HTML entities options"
        actions={
          <>
            <ToolActionButton onClick={swap} title="Swap input/output" disabled={!canSwap()}>
              ⇅ Swap
            </ToolActionButton>
            <ToolActionButton onClick={clear} variant="ghost">
              Clear
            </ToolActionButton>
          </>
        }
      >
        <ToolSegmentedControl
          label="Operation"
          hideLabel
          value={mode()}
          onChange={setMode}
          options={[
            { value: "encode", label: "Encode" },
            { value: "decode", label: "Decode" },
          ]}
        />
        <ToolActionButton
          active={nonAscii()}
          variant="toggle"
          onClick={() => setNonAscii((v) => !v)}
        >
          Encode non-ASCII
        </ToolActionButton>
      </ToolToolbar>
      <ToolTransformWorkspace
        input={{
          compact: true,
          label: mode() === "encode" ? "Plain text" : "HTML entities",
          name: "source",
          value: input(),
          onInput: setInput,
          placeholder: exampleInput(),
        }}
        output={{
          download: { format: "text" },
          handoff: "text",
          compact: true,
          title: "Output",
          value: output(),
          isExample: isExample(),
          error: error() || undefined,
          copyLabel: "Copy",
        }}
      />
    </ToolContainer>
  );
}
