import { createMemo, createSignal } from "solid-js";
import ToolContainer from "@/components/tool/ToolContainer";
import ToolTransformWorkspace from "@/components/tool/ToolTransformWorkspace";
import { EXAMPLE_JSON } from "@/lib/exampleData";
import { convertJsonToYaml } from "@/lib/jsonToYaml";

export default function JsonToYamlTool() {
  const [input, setInput] = createSignal("");
  const isExample = () => input() === "";
  const result = createMemo(() => convertJsonToYaml(input() || EXAMPLE_JSON));
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
        inputLabel="JSON document"
        value={input()}
        onInput={setInput}
        placeholder={EXAMPLE_JSON}
        output={output()}
        isExample={isExample()}
        error={error()}
        copyLabel="Copy YAML"
      />
    </ToolContainer>
  );
}
