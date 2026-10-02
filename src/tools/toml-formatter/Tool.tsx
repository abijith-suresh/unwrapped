import { createMemo, createSignal } from "solid-js";
import ToolActionButton from "@/components/ToolActionButton";
import ToolStatusMessage from "@/components/ToolStatusMessage";
import ToolContainer from "@/components/tool/ToolContainer";
import ToolToolbar from "@/components/tool/ToolToolbar";
import ToolTransformWorkspace from "@/components/tool/ToolTransformWorkspace";
import { EXAMPLE_TOML } from "@/lib/exampleData";
import { formatToml } from "@/lib/tomlFormatter";

export default function Tool() {
  const [input, setInput] = createSignal("");
  const isExample = () => input() === "";

  const result = createMemo(() => formatToml(input() || EXAMPLE_TOML));
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
        placeholder={EXAMPLE_TOML}
        output={output()}
        isExample={isExample()}
        error={error()}
        copyLabel="Copy output"
      />
      <ToolStatusMessage tone="muted">
        Formats TOML 1.0. Numeric literals and timestamp precision are preserved. Comments and
        original whitespace are removed. Leap-second timestamps are rejected. Input limit: 100,000
        characters.
      </ToolStatusMessage>
    </ToolContainer>
  );
}
