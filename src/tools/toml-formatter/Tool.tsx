import { createMemo, createSignal } from "solid-js";
import ToolActionButton from "@/components/ToolActionButton";
import ToolContainer from "@/components/tool/ToolContainer";
import ToolToolbar from "@/components/tool/ToolToolbar";
import ToolTransformWorkspace from "@/components/tool/ToolTransformWorkspace";
import { useToolHandoff } from "@/components/toolHandoff";
import { EXAMPLE_TOML } from "@/lib/exampleData";
import { formatToml } from "@/lib/tomlFormatter";

export default function Tool() {
  const [input, setInput] = createSignal("");
  useToolHandoff("toml-formatter", (handoff) => setInput(handoff.value));
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
        input={{
          label: "Source",
          value: input(),
          onInput: setInput,
          placeholder: EXAMPLE_TOML,
          name: "source",
        }}
        output={{
          download: { format: "toml" },
          title: "Output",
          value: output(),
          isExample: isExample(),
          error: error(),
          copyLabel: "Copy output",
        }}
      />
    </ToolContainer>
  );
}
