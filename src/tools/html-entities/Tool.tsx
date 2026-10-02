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
  return (
    <ToolContainer>
      <ToolToolbar
        label="Options"
        actions={
          <>
            <ToolActionButton active={nonAscii()} onClick={() => setNonAscii((value) => !value)}>
              Encode non-ASCII
            </ToolActionButton>
            <ToolActionButton onClick={() => setInput("")}>Clear input</ToolActionButton>
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
      </ToolToolbar>

      <ToolTransformWorkspace
        inputLabel="Source"
        value={input()}
        onInput={setInput}
        placeholder={exampleInput()}
        output={output()}
        isExample={isExample()}
        error={error()}
        copyLabel="Copy output"
      />
    </ToolContainer>
  );
}
