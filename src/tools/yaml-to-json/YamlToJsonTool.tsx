import { createMemo, createSignal } from "solid-js";
import ToolContainer from "@/components/tool/ToolContainer";
import ToolTransformWorkspace from "@/components/tool/ToolTransformWorkspace";
import { EXAMPLE_YAML } from "@/lib/exampleData";
import { convertYamlToJson } from "@/lib/yamlToJson";

export default function YamlToJsonTool() {
  const [input, setInput] = createSignal("");
  const isExample = () => input() === "";
  const result = createMemo(() => convertYamlToJson(input() || EXAMPLE_YAML));
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
        input={{
          label: "YAML document",
          value: input(),
          onInput: setInput,
          placeholder: EXAMPLE_YAML,
          name: "source",
        }}
        output={{
          download: { format: "json" },
          title: "Output",
          value: output(),
          isExample: isExample(),
          error: error(),
          copyLabel: "Copy JSON",
        }}
      />
    </ToolContainer>
  );
}
