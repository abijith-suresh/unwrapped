import { createMemo, createSignal } from "solid-js";
import ToolActionButton from "@/components/ToolActionButton";
import ToolStatusMessage from "@/components/ToolStatusMessage";
import ToolContainer from "@/components/tool/ToolContainer";
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
      <ToolToolbar label="Options">
        <ToolActionButton active={mode() === "encode"} onClick={() => setMode("encode")}>
          Encode
        </ToolActionButton>
        <ToolActionButton active={mode() === "decode"} onClick={() => setMode("decode")}>
          Decode
        </ToolActionButton>
        <ToolActionButton active={nonAscii()} onClick={() => setNonAscii((value) => !value)}>
          Encode non-ASCII
        </ToolActionButton>
        <ToolActionButton onClick={() => setInput("")}>Clear input</ToolActionButton>
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
      <ToolStatusMessage tone="muted">
        Decode requires a terminating semicolon. Output is displayed as text and is never rendered
        as HTML.
      </ToolStatusMessage>
    </ToolContainer>
  );
}
