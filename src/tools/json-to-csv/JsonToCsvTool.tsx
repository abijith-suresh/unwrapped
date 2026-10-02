import { createMemo, createSignal } from "solid-js";
import ToolContainer from "@/components/tool/ToolContainer";
import ToolTransformWorkspace from "@/components/tool/ToolTransformWorkspace";
import { EXAMPLE_JSON_ARRAY } from "@/lib/exampleData";
import { convertJsonToCsv } from "@/lib/jsonToCsv";

export default function JsonToCsvTool() {
  const [input, setInput] = createSignal("");
  const isExample = () => input() === "";
  const result = createMemo(() => convertJsonToCsv(input() || EXAMPLE_JSON_ARRAY));
  const output = createMemo(() => {
    const current = result();
    return current.ok ? current.output : "";
  });
  const error = createMemo(() => {
    const current = result();
    return current.ok ? "" : current.error;
  });

  return (
    <ToolContainer>
      <ToolTransformWorkspace
        inputLabel="JSON array input"
        value={input()}
        onInput={setInput}
        placeholder={EXAMPLE_JSON_ARRAY}
        output={output()}
        outputLabel="CSV output"
        isExample={isExample()}
        error={error()}
        copyLabel="Copy CSV"
      />
    </ToolContainer>
  );
}
