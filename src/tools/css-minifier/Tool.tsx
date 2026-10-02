import { createMemo, createSignal } from "solid-js";
import ToolActionButton from "@/components/ToolActionButton";
import ToolStatusMessage from "@/components/ToolStatusMessage";
import ToolContainer from "@/components/tool/ToolContainer";
import ToolToolbar from "@/components/tool/ToolToolbar";
import ToolTransformWorkspace from "@/components/tool/ToolTransformWorkspace";
import { minifyCss } from "@/lib/cssMinifier";
import { EXAMPLE_CSS } from "@/lib/exampleData";

export default function Tool() {
  const [input, setInput] = createSignal("");
  const isExample = () => input() === "";

  const result = createMemo(() => minifyCss(input() || EXAMPLE_CSS));
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
        <ToolActionButton onClick={() => setInput("")}>Clear input</ToolActionButton>
      </ToolToolbar>

      <ToolTransformWorkspace
        inputLabel="Source"
        value={input()}
        onInput={setInput}
        placeholder={EXAMPLE_CSS}
        output={output()}
        isExample={isExample()}
        error={error()}
        copyLabel="Copy output"
      />
      <ToolStatusMessage tone="muted">
        Uses CSSO with rule restructuring disabled. Strings, URLs, calc expressions, and custom
        properties are parsed as CSS. Input is limited to 100,000 characters.
      </ToolStatusMessage>
    </ToolContainer>
  );
}
